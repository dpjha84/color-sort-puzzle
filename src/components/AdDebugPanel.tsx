import React, { useEffect, useState } from 'react';
import { adMobManager } from '../utils/admob';

/** Hidden diagnostics: tap the "Goal" text in the header 7 times to open. Helps report ad issues. */
export const AdDebugPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [lines, setLines] = useState<string[]>(adMobManager.getLog());
  useEffect(() => adMobManager.subscribeLog(() => setLines(adMobManager.getLog())), []);
  const testing = import.meta.env.VITE_ADMOB_TESTING !== 'false';

  return (
    <div className="fixed inset-x-2 top-10 bottom-16 z-[70] rounded-2xl bg-slate-950 border border-white/20 p-3 flex flex-col text-white">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-bold">
          Ad log · v1.0.2 · {testing ? 'TEST ads' : 'LIVE ads'} · {adMobManager.isNative() ? 'native' : 'web'}
        </div>
        <div className="flex gap-2">
          <button
            className="text-[11px] px-2 py-1 rounded bg-white/10"
            onClick={() => navigator.clipboard?.writeText(lines.join('\n')).catch(() => {})}
          >
            Copy
          </button>
          <button className="text-[11px] px-2 py-1 rounded bg-white/10" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto font-mono text-[10px] leading-4 text-emerald-200 whitespace-pre-wrap">
        {lines.length ? lines.join('\n') : 'No ad events yet.'}
      </div>
    </div>
  );
};
