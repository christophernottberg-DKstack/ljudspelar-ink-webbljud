import React from 'react';
import { Mic, History, Settings, HelpCircle } from 'lucide-react';

export type ActiveTab = 'recorder' | 'history' | 'tools';

interface HeaderProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  historyCount: number;
  onOpenHelp: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  historyCount,
  onOpenHelp,
}) => {
  return (
    <header className="w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Brand title */}
        <div
          onClick={() => onSelectTab('recorder')}
          className="flex items-center gap-3 cursor-pointer whitespace-nowrap shrink-0 group select-none"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-600 to-rose-400 text-white flex items-center justify-center shadow-md shadow-rose-950/50 group-hover:scale-105 transition-transform">
            <Mic className="w-5 h-5" />
          </div>
          <span className="text-base font-bold tracking-tight text-white group-hover:text-rose-200 transition-colors">
            Enkel Ljudinspelare
          </span>
        </div>

        {/* Zone 2: Main Navigation Tabs (Inspelare & Historik) */}
        <nav className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl">
          <button
            onClick={() => onSelectTab('recorder')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'recorder'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Inspelare</span>
          </button>

          <button
            onClick={() => onSelectTab('history')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'history'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Historik</span>
            {historyCount > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  activeTab === 'history'
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-800 text-slate-300'
                }`}
              >
                {historyCount}
              </span>
            )}
          </button>
        </nav>

        {/* Zone 3: Far-right icons (Hjälp & Verktyg och inställningar) */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={onOpenHelp}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-colors"
            title="Tangentbordsgenvägar & Hjälp"
            aria-label="Tangentbordsgenvägar & Hjälp"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          <button
            onClick={() => onSelectTab(activeTab === 'tools' ? 'recorder' : 'tools')}
            className={`p-2 rounded-lg border transition-colors ${
              activeTab === 'tools'
                ? 'bg-rose-600 text-white shadow-sm border-rose-500'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border-transparent hover:border-slate-800'
            }`}
            title="Verktyg och inställningar"
            aria-label="Verktyg och inställningar"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
