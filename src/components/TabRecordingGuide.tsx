import React from 'react';
import {
  Globe,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Scale,
  Sparkles,
  MousePointerClick,
  Info,
} from 'lucide-react';
import { BrowserAudioSupport } from '../utils/browserDetect';

interface TabRecordingGuideProps {
  browserCompat: BrowserAudioSupport;
  onSelectTabClick: () => void;
  isRecordingOrActive: boolean;
}

export const TabRecordingGuide: React.FC<TabRecordingGuideProps> = ({
  browserCompat,
  onSelectTabClick,
  isRecordingOrActive,
}) => {
  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Browser compatibility check notice */}
      {!browserCompat.canCaptureTabAudio ? (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 flex items-start gap-3 text-xs leading-relaxed">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-amber-100">
              Webbläsarstöd för flikljud: {browserCompat.browserName}
            </span>
            <p className="text-amber-300/90">
              Tekniken kräver <strong>Google Chrome</strong> eller <strong>Microsoft Edge</strong> på dator. Firefox, Safari och mobila webbläsare stöds inte av webbläsartillverkarna för flikljud.
            </p>
            <p className="text-amber-400/80 text-[11px] mt-1">
              {browserCompat.message || 'Du kan fortfarande använda mikrofoninspelaren i valfri webbläsare.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong>{browserCompat.browserName}</strong> på dator identifierad – flikljud stöds fullt ut!
            </span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 font-mono text-emerald-300">
            Klar för inspelning
          </span>
        </div>
      )}

      {/* Visual Step-by-Step Box with Mockup */}
      <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col gap-4 text-xs">
        <div className="flex items-center gap-2 text-rose-400 font-semibold text-xs tracking-wide uppercase">
          <MousePointerClick className="w-4 h-4" />
          <span>Så här spelar du in ljud från en flik:</span>
        </div>

        {/* 3 Step Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center font-bold text-[10px]">
                1
              </span>
              <span className="font-semibold text-slate-200">Klicka på &quot;Välj flik&quot;</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Starta genom att trycka på knappen <strong>Välj flik</strong> nedan.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center font-bold text-[10px]">
                2
              </span>
              <span className="font-semibold text-slate-200">Välj din flik</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              I webbläsarens popup, välj fliken (t.ex. en video, podd eller föreläsning).
            </p>
          </div>

          <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-500/30 flex flex-col gap-1.5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-12 h-12 bg-rose-500/10 rounded-full blur-xl pointer-events-none" />
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center font-bold text-[10px]">
                3
              </span>
              <span className="font-semibold text-rose-200">Bocka i &quot;Dela ljud&quot;</span>
            </div>
            <p className="text-rose-200/90 text-[11px] leading-relaxed">
              <strong>Viktigt:</strong> Kryssa i rutan <em>&quot;Dela flikljud&quot;</em> längst ner i dialogrutan!
            </p>
          </div>
        </div>

        {/* Visual Mockup of Browser Prompt */}
        <div className="p-3.5 rounded-lg bg-slate-900/90 border border-slate-800 flex flex-col gap-2.5">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-rose-400" />
              <span>Exempel på webbläsarens dialogruta:</span>
            </span>
            <span className="font-mono text-[10px] text-slate-500">Chrome / Edge flikdelning</span>
          </div>

          <div className="p-3 rounded bg-slate-950 border border-slate-800/90 flex flex-col gap-2">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800/60 text-[11px]">
              <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-semibold border border-rose-500/30">
                Chrome-flik / Edge-flik
              </span>
              <span className="text-slate-500">Fönster</span>
              <span className="text-slate-500">Hela skärmen</span>
            </div>

            <div className="py-2 px-3 rounded bg-slate-900/60 flex items-center justify-between text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-slate-400" />
                <span>Välj önskad flik i listan...</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono">Markerad flik</span>
            </div>

            {/* Checkbox highlight */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs text-rose-300 font-semibold bg-rose-500/10 px-2.5 py-1.5 rounded-md border border-rose-500/40 animate-pulse">
                <input
                  type="checkbox"
                  checked
                  readOnly
                  className="w-4 h-4 accent-rose-500 rounded"
                />
                <span>☑ Dela flikljud / Dela ljud</span>
              </label>
              <span className="text-[10px] text-rose-400 hidden sm:inline">
                ← Glöm inte att denna måste vara ikryssad!
              </span>
            </div>
          </div>
        </div>

        {/* Legal, copyright & GDPR guarantees */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Copyright notice */}
          <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800 flex items-start gap-2.5">
            <Scale className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-0.5 text-[11px] text-slate-400 leading-relaxed">
              <span className="font-semibold text-slate-200">Upphovsrätt</span>
              <span>
                Tänk på upphovsrätten när du spelar in – verktyget är avsett för eget studiematerial och undervisningsändamål.
              </span>
            </div>
          </div>

          {/* Privacy & GDPR */}
          <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-0.5 text-[11px] text-slate-400 leading-relaxed">
              <span className="font-semibold text-slate-200">100% GDPR-säkert & lokalt</span>
              <span>
                All inspelning sker lokalt på din dator – ingen information lämnar din enhet.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
