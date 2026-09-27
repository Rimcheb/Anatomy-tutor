import React from 'react';
import { AnatomyStructure, AttemptRecord } from '../types/tutor';
import {
  Stethoscope,
  ChevronDown,
  FileText,
  Sparkles,
  TrendingUp,
  History,
  Pencil
} from 'lucide-react';

interface HeaderProps {
  currentStructure: AnatomyStructure;
  onOpenStructurePicker: () => void;
  onOpenRubric: () => void;
  onLoadDemoSketch: () => void;
  attempts: AttemptRecord[];
  latestScore: number | null;
  previousScore: number | null;
}

export const Header: React.FC<HeaderProps> = ({
  currentStructure,
  onOpenStructurePicker,
  onOpenRubric,
  onLoadDemoSketch,
  attempts,
  latestScore,
  previousScore,
}) => {
  const getDifficultyBadge = (diff: string) => {
    switch (diff) {
      case 'Beginner':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Intermediate':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Advanced':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-teal-50 text-teal-700 border-teal-200';
    }
  };

  const scoreDiff =
    latestScore !== null && previousScore !== null ? latestScore - previousScore : null;

  return (
    <header className="h-16 border-b border-slate-200 bg-white px-4 md:px-6 flex items-center justify-between z-20 shrink-0">
      {/* Brand & Structure Title */}
      <div className="flex items-center gap-3 md:gap-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-sm shadow-teal-700/20">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-semibold text-slate-900 tracking-tight text-base leading-tight">
              Anatomy Tutor
            </h1>
            <span className="text-[11px] font-medium text-teal-700 block tracking-wide uppercase">
              Medical Sketch Lab
            </span>
          </div>
        </div>

        <div className="hidden sm:block h-6 w-px bg-slate-200" />

        {/* Structure Selector Dropdown Button */}
        <button
          onClick={onOpenStructurePicker}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-teal-500 bg-slate-50/70 hover:bg-teal-50/40 text-left transition-all group"
          title="Switch anatomy structure"
        >
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Topic:</span>
              <span className="text-sm font-semibold text-slate-800 group-hover:text-teal-700">
                {currentStructure.name}
              </span>
              <span
                className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${getDifficultyBadge(
                  currentStructure.difficulty
                )}`}
              >
                {currentStructure.difficulty}
              </span>
            </div>
          </div>
          <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-teal-600 transition-transform" />
        </button>
      </div>

      {/* Progress & Quick Actions */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Score comparison pill */}
        {latestScore !== null && (
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
            <TrendingUp className="w-3.5 h-3.5 text-teal-600" />
            <span className="text-slate-600">Current Score:</span>
            <span className="font-bold text-slate-900">{latestScore}/100</span>
            {previousScore !== null && scoreDiff !== null && (
              <span
                className={`font-semibold ml-1 px-1.5 py-0.5 rounded text-[11px] ${
                  scoreDiff >= 0 ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'
                }`}
              >
                {scoreDiff >= 0 ? `+${scoreDiff}` : scoreDiff} pts
              </span>
            )}
          </div>
        )}

        {/* Rubric button */}
        <button
          onClick={onOpenRubric}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:text-teal-700 hover:bg-teal-50/60 border border-slate-200 transition-colors"
          title="View required anatomical parts, labels & spatial criteria"
        >
          <FileText className="w-3.5 h-3.5 text-teal-600" />
          <span className="hidden sm:inline">Rubric & Criteria</span>
        </button>

        {/* Demo sketch helper button */}
        <button
          onClick={onLoadDemoSketch}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:text-teal-700 hover:bg-teal-50/60 border border-slate-200 transition-colors"
          title="Load a sample hand-sketch for rapid evaluation demo"
        >
          <Pencil className="w-3.5 h-3.5 text-teal-600" />
          <span className="hidden sm:inline">Load Sample Sketch</span>
        </button>
      </div>
    </header>
  );
};
