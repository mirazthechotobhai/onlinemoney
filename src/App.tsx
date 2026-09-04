import React, { useState, useEffect } from 'react';
import { MainDisplay } from './components/MainDisplay';
import { RemoteControl } from './components/RemoteControl';
import { Tv, Smartphone, X } from 'lucide-react';

export default function App() {
  const [viewMode, setViewMode] = useState<'main' | 'remote'>('main');
  const [isSplitPreview, setIsSplitPreview] = useState<boolean>(false);

  useEffect(() => {
    const checkViewFromUrl = () => {
      if (typeof window === 'undefined') return;
      const params = new URLSearchParams(window.location.search);
      const view = params.get('view') || params.get('mode');
      const hash = window.location.hash;

      if (view === 'remote' || hash === '#remote') {
        setViewMode('remote');
      } else {
        setViewMode('main');
      }
    };

    checkViewFromUrl();
    window.addEventListener('popstate', checkViewFromUrl);
    window.addEventListener('hashchange', checkViewFromUrl);

    return () => {
      window.removeEventListener('popstate', checkViewFromUrl);
      window.removeEventListener('hashchange', checkViewFromUrl);
    };
  }, []);

  // Standalone Remote Tab View
  if (viewMode === 'remote') {
    return (
      <div className="relative min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
        <div className="w-full bg-zinc-900 border-b border-zinc-800 px-6 py-2.5 flex items-center justify-between text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-blue-400" />
            <span className="font-semibold text-zinc-200">Remote Interface (Active Tab)</span>
          </div>
          <button
            onClick={() => {
              const url = new URL(window.location.href);
              url.searchParams.delete('view');
              url.searchParams.delete('mode');
              url.hash = '';
              window.location.href = url.toString();
            }}
            className="text-xs hover:text-white underline flex items-center gap-1 cursor-pointer font-mono"
          >
            ← Switch to Main Screen
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center p-3 sm:p-6 bg-zinc-950">
          <RemoteControl />
        </div>
      </div>
    );
  }

  // Main Screen View (with optional side-dock split test)
  return (
    <div className="relative min-h-screen bg-black text-white flex flex-col font-sans overflow-hidden">
      <div className="flex-1 flex w-full">
        {/* Main Display Screen */}
        <div className={`flex-1 transition-all duration-300 ${isSplitPreview ? 'lg:mr-[350px]' : ''}`}>
          <MainDisplay
            isSplitView={isSplitPreview}
            onToggleSplitView={() => setIsSplitPreview((prev) => !prev)}
          />
        </div>

        {/* Side-by-side dockable Remote Drawer */}
        {isSplitPreview && (
          <aside
            id="split-remote-dock"
            className="fixed right-0 top-0 bottom-0 w-full sm:w-[350px] bg-zinc-900 border-l border-zinc-800 shadow-2xl z-40 flex flex-col overflow-y-auto"
          >
            <div className="sticky top-0 z-20 bg-zinc-900/95 backdrop-blur-md px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-semibold text-zinc-200 font-mono">Docked Remote</span>
              </div>
              <button
                onClick={() => setIsSplitPreview(false)}
                className="p-1 rounded-md text-zinc-400 hover:text-white cursor-pointer"
                title="Close Side Dock"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-2 flex-1 flex flex-col items-center justify-start bg-zinc-950">
              <RemoteControl isEmbedded />
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
