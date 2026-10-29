import { useState, useRef, useEffect, useCallback } from 'react';
import { checkBrowserTabAudioSupport, BrowserAudioSupport } from '../utils/browserDetect';

export type RecorderStatus = 'idle' | 'recording' | 'paused' | 'processing' | 'ready';
export type RecordingSource = 'microphone' | 'tab';

export interface AudioDevice {
  deviceId: string;
  label: string;
}

export interface AudioRecorderHook {
  status: RecorderStatus;
  recordingSource: RecordingSource;
  tabTitle: string | null;
  recordingTime: number;
  audioBuffer: AudioBuffer | null;
  recordedBlob: Blob | null;
  analyserNode: AnalyserNode | null;
  audioLevel: number; // 0 to 1
  audioDb: number; // -Infinity to 0
  error: string | null;
  browserCompat: BrowserAudioSupport;
  // Settings
  autoGain: boolean;
  noiseSuppression: boolean;
  manualGain: number; // 0.1 to 3.0 (default 1.0)
  selectedDeviceId: string;
  availableDevices: AudioDevice[];
  // Actions
  setRecordingSource: (source: RecordingSource) => void;
  startRecording: (sourceOverride?: RecordingSource) => Promise<boolean>;
  pauseRecording: () => void;
  resumeRecording: () => void;
  stopRecording: () => Promise<void>;
  resetRecording: () => void;
  loadAudioBuffer: (buffer: AudioBuffer, blob?: Blob, source?: RecordingSource) => void;
  setAutoGain: (enabled: boolean) => void;
  setNoiseSuppression: (enabled: boolean) => void;
  setManualGain: (gain: number) => void;
  setSelectedDeviceId: (deviceId: string) => void;
  clearError: () => void;
}

export function useAudioRecorder(): AudioRecorderHook {
  const [status, setStatus] = useState<RecorderStatus>('idle');
  const [recordingSource, setRecordingSourceState] = useState<RecordingSource>('microphone');
  const [tabTitle, setTabTitle] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState<number>(0);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Browser tab compatibility information (static evaluation)
  const [browserCompat] = useState<BrowserAudioSupport>(() =>
    checkBrowserTabAudioSupport()
  );

  // Audio settings
  const [autoGain, setAutoGainState] = useState<boolean>(true);
  const [noiseSuppression, setNoiseSuppressionState] = useState<boolean>(true);
  const [manualGain, setManualGainState] = useState<number>(1.0);
  const [selectedDeviceId, setSelectedDeviceIdState] = useState<string>('');
  const [availableDevices, setAvailableDevices] = useState<AudioDevice[]>([]);

  // Refs for current settings so callbacks stay stable
  const recordingSourceRef = useRef(recordingSource);
  recordingSourceRef.current = recordingSource;

  const selectedDeviceIdRef = useRef(selectedDeviceId);
  selectedDeviceIdRef.current = selectedDeviceId;

  const autoGainRef = useRef(autoGain);
  autoGainRef.current = autoGain;

  const noiseSuppressionRef = useRef(noiseSuppression);
  noiseSuppressionRef.current = noiseSuppression;

  const manualGainRef = useRef(manualGain);
  manualGainRef.current = manualGain;

  // Live metering
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [audioDb, setAudioDb] = useState<number>(-60);
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);

  // Internal Web Audio refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const destNodeRef = useRef<MediaStreamAudioDestinationNode | null>(null);

  // Timer ref
  const timerIntervalRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const accumulatedTimeRef = useRef<number>(0);

  // Animation frame ref for audio level metering
  const meterRafRef = useRef<number | null>(null);

  // Clean up timer
  const stopTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      window.clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, []);

  // Stop metering
  const stopMetering = useCallback(() => {
    if (meterRafRef.current) {
      cancelAnimationFrame(meterRafRef.current);
      meterRafRef.current = null;
    }
    setAudioLevel(0);
    setAudioDb(-60);
  }, []);

  // Start metering loop
  const startMetering = useCallback((analyser: AnalyserNode) => {
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    const updateMeter = () => {
      analyser.getByteTimeDomainData(dataArray);
      let sumSquares = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const norm = (dataArray[i] - 128) / 128;
        sumSquares += norm * norm;
      }
      const rms = Math.sqrt(sumSquares / dataArray.length);
      const level = Math.min(1, rms * 3.5); // Scaled for visible feedback
      const db = rms > 0.0001 ? Math.max(-60, 20 * Math.log10(rms)) : -60;

      setAudioLevel(level);
      setAudioDb(db);

      meterRafRef.current = requestAnimationFrame(updateMeter);
    };
    meterRafRef.current = requestAnimationFrame(updateMeter);
  }, []);

  // Stop tracks and release media
  const cleanupStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    stopMetering();
    stopTimer();
    setAnalyserNode(null);
  }, [stopMetering, stopTimer]);

  useEffect(() => {
    return () => {
      cleanupStream();
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, [cleanupStream]);

  // Enumerate input devices with stable callback
  const updateDevices = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) return;
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices
        .filter((d) => d.kind === 'audioinput')
        .map((d, index) => ({
          deviceId: d.deviceId,
          label: d.label || `Mikrofon ${index + 1}`,
        }));
      setAvailableDevices(audioInputs);
      if (audioInputs.length > 0 && !selectedDeviceIdRef.current) {
        setSelectedDeviceIdState(audioInputs[0].deviceId);
      }
    } catch {
      // Permission not yet granted, labels might be empty
    }
  }, []);

  useEffect(() => {
    updateDevices();
    navigator.mediaDevices?.addEventListener?.('devicechange', updateDevices);
    return () => {
      navigator.mediaDevices?.removeEventListener?.('devicechange', updateDevices);
    };
  }, [updateDevices]);

  // Change source
  const setRecordingSource = useCallback((source: RecordingSource) => {
    setStatus((currentStatus) => {
      if (currentStatus === 'recording' || currentStatus === 'paused') {
        return currentStatus;
      }
      setRecordingSourceState(source);
      setError(null);
      return currentStatus;
    });
  }, []);

  // Pause
  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      accumulatedTimeRef.current += (Date.now() - startTimeRef.current) / 1000;
      stopTimer();
      stopMetering();
      setStatus('paused');
    }
  }, [stopTimer, stopMetering]);

  // Stop
  const stopRecording = useCallback(async () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      stopTimer();
      stopMetering();
      mediaRecorderRef.current.stop();
    }
  }, [stopTimer, stopMetering]);

  // Resume
  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      startTimeRef.current = Date.now();
      if (analyserRef.current) {
        startMetering(analyserRef.current);
      }
      timerIntervalRef.current = window.setInterval(() => {
        const elapsed = (Date.now() - startTimeRef.current) / 1000 + accumulatedTimeRef.current;
        setRecordingTime(elapsed);
      }, 100);
      setStatus('recording');
    }
  }, [startMetering]);

  // Start recording
  const startRecording = useCallback(
    async (sourceOverride?: RecordingSource): Promise<boolean> => {
      setError(null);
      const effectiveSource = sourceOverride || recordingSourceRef.current;

      try {
        cleanupStream();

        // Setup AudioContext
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new AudioCtx();
        audioContextRef.current = ctx;
        if (ctx.state === 'suspended') {
          await ctx.resume();
        }

        let stream: MediaStream;

        if (effectiveSource === 'tab') {
          // Tab audio capture via getDisplayMedia
          if (!navigator.mediaDevices?.getDisplayMedia) {
            setError(
              'Din webbläsare stöder inte flikdelning. Byt till Google Chrome eller Microsoft Edge på dator.'
            );
            return false;
          }

          try {
            const displayStream = await navigator.mediaDevices.getDisplayMedia({
              video: {
                displaySurface: 'browser',
              },
              audio: {
                echoCancellation: false,
                noiseSuppression: false,
                autoGainControl: false,
              },
              systemAudio: 'include',
              surfaceSwitching: 'include',
              selfBrowserSurface: 'exclude',
              preferCurrentTab: false,
            } as MediaStreamConstraints);

            const audioTracks = displayStream.getAudioTracks();
            if (audioTracks.length === 0) {
              displayStream.getTracks().forEach((t) => t.stop());
              setError(
                'Inget flikljud valdes! Kom ihåg att bocka i kryssrutan "Dela ljud" (eller "Dela flikljud") i dialogrutan när du väljer flik.'
              );
              setStatus('idle');
              return false;
            }

            const trackLabel =
              audioTracks[0]?.label || displayStream.getVideoTracks()[0]?.label || '';
            setTabTitle(trackLabel || 'Webbläsarflik');

            displayStream.getVideoTracks().forEach((vt) => {
              vt.enabled = false;
            });

            displayStream.getTracks().forEach((track) => {
              track.onended = () => {
                if (
                  mediaRecorderRef.current &&
                  (mediaRecorderRef.current.state === 'recording' ||
                    mediaRecorderRef.current.state === 'paused')
                ) {
                  stopRecording();
                }
              };
            });

            stream = displayStream;
          } catch (displayErr: unknown) {
            const errObj = displayErr as { name?: string; message?: string };
            if (
              errObj.name === 'NotAllowedError' ||
              errObj.name === 'PermissionDeniedError' ||
              errObj.name === 'AbortError'
            ) {
              setError(
                'Val av flik avbröts. Tryck på "Välj flik" när du vill spela in från en flik.'
              );
            } else {
              setError(`Kunde inte välja flik: ${errObj.message || 'Okänt fel'}`);
            }
            cleanupStream();
            setStatus('idle');
            return false;
          }
        } else {
          // Standard microphone capture
          setTabTitle(null);
          const currentDevId = selectedDeviceIdRef.current;
          const constraints: MediaStreamConstraints = {
            audio: {
              deviceId: currentDevId ? { exact: currentDevId } : undefined,
              autoGainControl: autoGainRef.current,
              noiseSuppression: noiseSuppressionRef.current,
              echoCancellation: true,
              channelCount: 2,
            },
            video: false,
          };

          stream = await navigator.mediaDevices.getUserMedia(constraints);
          updateDevices();
        }

        streamRef.current = stream;

        // Web Audio routing
        const source = ctx.createMediaStreamSource(stream);
        sourceNodeRef.current = source;

        // Gain Node
        const gain = ctx.createGain();
        if (effectiveSource === 'tab') {
          gain.gain.value = 1.0;
        } else {
          gain.gain.value = autoGainRef.current ? 1.0 : manualGainRef.current;
        }
        gainNodeRef.current = gain;

        // Analyser Node for live visualizer
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0.8;
        analyserRef.current = analyser;
        setAnalyserNode(analyser);

        // Destination for recorder
        const dest = ctx.createMediaStreamDestination();
        destNodeRef.current = dest;

        source.connect(gain);
        gain.connect(analyser);
        gain.connect(dest);

        // Start metering
        startMetering(analyser);

        // Setup MediaRecorder
        const supportedTypes = [
          'audio/webm;codecs=opus',
          'audio/webm',
          'audio/ogg;codecs=opus',
          'audio/mp4',
          'audio/aac',
        ];
        let mimeType = '';
        for (const t of supportedTypes) {
          if (MediaRecorder.isTypeSupported(t)) {
            mimeType = t;
            break;
          }
        }

        const recorder = new MediaRecorder(dest.stream, mimeType ? { mimeType } : undefined);
        mediaRecorderRef.current = recorder;
        chunksRef.current = [];

        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            chunksRef.current.push(e.data);
          }
        };

        recorder.onstop = async () => {
          setStatus('processing');
          try {
            const finalBlob = new Blob(chunksRef.current, {
              type: recorder.mimeType || 'audio/webm',
            });
            setRecordedBlob(finalBlob);

            const arrayBuffer = await finalBlob.arrayBuffer();
            const decoded = await ctx.decodeAudioData(arrayBuffer);
            setAudioBuffer(decoded);
            setStatus('ready');
          } catch (err) {
            console.error('Audio decoding error:', err);
            setError('Kunde inte avkoda ljudinspelningen. Försök igen.');
            setStatus('idle');
          } finally {
            cleanupStream();
          }
        };

        recorder.start(100);

        accumulatedTimeRef.current = 0;
        startTimeRef.current = Date.now();
        setRecordingTime(0);

        timerIntervalRef.current = window.setInterval(() => {
          const elapsed = (Date.now() - startTimeRef.current) / 1000 + accumulatedTimeRef.current;
          setRecordingTime(elapsed);
        }, 100);

        setStatus('recording');
        return true;
      } catch (err: unknown) {
        console.error('Audio recording init error:', err);
        const e = err as { name?: string; message?: string };
        if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
          setError(
            effectiveSource === 'tab'
              ? 'Åtkomst nekades för att dela flik.'
              : 'Åtkomst till mikrofonen nekades. Vänligen ge tillåtelse till mikrofonen i din webbläsare för att spela in.'
          );
        } else if (e.name === 'NotFoundError' || e.name === 'DevicesNotFoundError') {
          setError('Ingen ljudenhet hittades. Kontrollera anslutningen.');
        } else {
          setError(`Kunde inte starta inspelningen: ${e.message || 'Okänt fel'}`);
        }
        cleanupStream();
        setStatus('idle');
        return false;
      }
    },
    [cleanupStream, startMetering, stopRecording, updateDevices]
  );

  // Reset
  const resetRecording = useCallback(() => {
    cleanupStream();
    setAudioBuffer(null);
    setRecordedBlob(null);
    setRecordingTime(0);
    accumulatedTimeRef.current = 0;
    setStatus('idle');
    setError(null);
  }, [cleanupStream]);

  // Dynamic updates to gain node when active
  const setAutoGain = useCallback((enabled: boolean) => {
    setAutoGainState(enabled);
    if (gainNodeRef.current && recordingSourceRef.current === 'microphone') {
      gainNodeRef.current.gain.value = enabled ? 1.0 : manualGainRef.current;
    }
  }, []);

  const setManualGain = useCallback((gain: number) => {
    setManualGainState(gain);
    if (!autoGainRef.current && gainNodeRef.current && recordingSourceRef.current === 'microphone') {
      gainNodeRef.current.gain.value = gain;
    }
  }, []);

  const setNoiseSuppression = useCallback((enabled: boolean) => {
    setNoiseSuppressionState(enabled);
  }, []);

  const setSelectedDeviceId = useCallback((deviceId: string) => {
    setSelectedDeviceIdState(deviceId);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const loadAudioBuffer = useCallback(
    (buffer: AudioBuffer, blob?: Blob, source?: RecordingSource) => {
      cleanupStream();
      setAudioBuffer(buffer);
      if (blob) setRecordedBlob(blob);
      if (source) setRecordingSourceState(source);
      setRecordingTime(buffer.duration);
      setStatus('ready');
      setError(null);
    },
    [cleanupStream]
  );

  return {
    status,
    recordingSource,
    tabTitle,
    recordingTime,
    audioBuffer,
    recordedBlob,
    analyserNode,
    audioLevel,
    audioDb,
    error,
    browserCompat,
    autoGain,
    noiseSuppression,
    manualGain,
    selectedDeviceId,
    availableDevices,
    setRecordingSource,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    resetRecording,
    loadAudioBuffer,
    setAutoGain,
    setNoiseSuppression,
    setManualGain,
    setSelectedDeviceId,
    clearError,
  };
}
