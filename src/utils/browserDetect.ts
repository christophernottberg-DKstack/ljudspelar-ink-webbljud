export interface BrowserAudioSupport {
  isSupported: boolean;
  browserName: string;
  isDesktop: boolean;
  canCaptureTabAudio: boolean;
  message?: string;
}

/**
 * Checks if the current browser and platform support capturing browser tab audio.
 * In accordance with browser capabilities, capturing tab audio with sound requires
 * desktop Google Chrome or Microsoft Edge.
 */
export function checkBrowserTabAudioSupport(): BrowserAudioSupport {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      isSupported: false,
      browserName: 'Okänd',
      isDesktop: false,
      canCaptureTabAudio: false,
      message: 'Miljön stöder inte ljudinspelning.',
    };
  }

  const ua = navigator.userAgent;
  const isMobile =
    /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua) ||
    (navigator.maxTouchPoints && navigator.maxTouchPoints > 2 && /Macintosh/.test(ua));

  const isEdge = /Edg\//.test(ua);
  const isChrome = /Chrome\//.test(ua) && !/Edg\//.test(ua) && !/OPR\//.test(ua);
  const isFirefox = /Firefox\//.test(ua);
  const isSafari = /Safari\//.test(ua) && !/Chrome\//.test(ua) && !/Edg\//.test(ua);
  const isOpera = /OPR\//.test(ua) || /Opera\//.test(ua);

  let browserName = 'Webbläsare';
  if (isEdge) browserName = 'Microsoft Edge';
  else if (isChrome) browserName = 'Google Chrome';
  else if (isFirefox) browserName = 'Mozilla Firefox';
  else if (isSafari) browserName = 'Apple Safari';
  else if (isOpera) browserName = 'Opera';

  const hasGetDisplayMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia);

  if (isMobile) {
    return {
      isSupported: false,
      browserName,
      isDesktop: false,
      canCaptureTabAudio: false,
      message: 'Mobila webbläsare stöder inte inspelning av flikljud. Byt till Google Chrome eller Microsoft Edge på en dator.',
    };
  }

  if (isFirefox) {
    return {
      isSupported: false,
      browserName: 'Firefox',
      isDesktop: true,
      canCaptureTabAudio: false,
      message: 'Firefox stöder inte ljuddelning från specifika flikar. Använd Google Chrome eller Microsoft Edge på dator.',
    };
  }

  if (isSafari) {
    return {
      isSupported: false,
      browserName: 'Safari',
      isDesktop: true,
      canCaptureTabAudio: false,
      message: 'Safari stöder inte flikljuddelning i webbläsaren. Använd Google Chrome eller Microsoft Edge på dator.',
    };
  }

  if (!hasGetDisplayMedia) {
    return {
      isSupported: false,
      browserName,
      isDesktop: true,
      canCaptureTabAudio: false,
      message: 'Denna webbläsare saknar stöd för skärm- och flikdelning.',
    };
  }

  // Chrome or Edge on desktop
  const isRecommendedBrowser = isChrome || isEdge;
  return {
    isSupported: isRecommendedBrowser,
    browserName: isEdge ? 'Microsoft Edge' : isChrome ? 'Google Chrome' : browserName,
    isDesktop: true,
    canCaptureTabAudio: isRecommendedBrowser,
    message: isRecommendedBrowser
      ? 'Flikljud stöds fullt ut på din enhet.'
      : 'Inspelning av flikljud fungerar bäst i Google Chrome eller Microsoft Edge.',
  };
}
