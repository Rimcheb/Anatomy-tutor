import React from 'react';
import { AlertOctagon, RotateCcw, Compass, Check } from 'lucide-react';

interface UrgentInterventionBannerProps {
  isOpen: boolean;
  structureName: string;
  identifiedAs?: string;
  onClearAndRestart: () => void;
  onShowHowToStart: () => void;
  onDismiss: () => void;
}

export const UrgentInterventionBanner: React.FC<UrgentInterventionBannerProps> = ({
  isOpen,
  structureName,
  identifiedAs,
  onClearAndRestart,
  onShowHowToStart,
  onDismiss,
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 max-w-lg w-[92%] animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="bg-rose-50 border-2 border-rose-500 rounded-2xl shadow-xl p-4 sm:p-5 flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <AlertOctagon className="w-6 h-6 animate-bounce" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
                Live Coach Intervention
              </span>
            </div>
            <h3 className="text-base font-extrabold text-rose-950 mt-1">
              Hold on — this doesn't look like a heart.
            </h3>
            <p className="text-xs text-rose-800 mt-1 leading-relaxed">
              {identifiedAs
                ? `Our live anatomy tutor detected strokes resembling a ${identifiedAs} rather than ${structureName}.`
                : `Our live tutor noticed your current drawing is veering away from the requested ${structureName}.`}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-rose-200">
          <button
            onClick={onClearAndRestart}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-rose-700 bg-white border border-rose-300 hover:bg-rose-100/70 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear &amp; restart</span>
          </button>

          <button
            onClick={onShowHowToStart}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-xs transition-colors cursor-pointer"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Show me how to start</span>
          </button>

          <button
            onClick={onDismiss}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 transition-colors cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>I'm not done yet</span>
          </button>
        </div>
      </div>
    </div>
  );
};
