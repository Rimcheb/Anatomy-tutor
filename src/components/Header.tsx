import React from 'react';
import { AnatomyStructure, AttemptRecord } from '../types/tutor';
import {
  Activity,
  ChevronDown,
  FileText,
  Sparkles,
  TrendingUp,
  History,
  BookOpen
} from 'lucide-react';

interface HeaderProps {
  currentStructure: AnatomyStructure;
  onOpenStructurePicker: () => void;
  onOpenRubric: () => void;
  onOpenImageCredits: () => void;
  onLoadDemoSketch: () => void;
  attempts: AttemptRecord[];
  latestScore: number | null;
  previousScore: number | null;
}

export const Header: React.FC<HeaderProps> = ({
  currentStructure,
  onOpenStructurePicker,
  onOpenRubric,
  onOpenImageCredits,
  onLoadDemoSketch,
  attempts,
  latestScore,
  previousScore,
}) => {
  const getDifficultyBadge = (diff: string) => {
    switch (diff) {
      case 'Beginner':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      case 'Intermediate':
        return 'bg-blue-50 text-blue-900 border-blue-200';
      case 'Advanced':
        return 'bg-indigo-50 text-indigo-900 border-indigo-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  const scoreDiff =
    latestScore !== null && previousScore !== null ? latestScore - previousScore : null;

  return (
    <header className="h-14 border-b border-slate-200 bg-white px-4 md:px-6 flex items-center justify-between z-20 shrink-0">
      {/* Brand & Topic Selector */}
      <div className="flex items-center gap-3 md:gap-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-900 flex items-center justify-center text-white">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-semibold text-slate-900 tracking-tight text-sm leading-tight">
              Anatomy Tutor
            </h1>
            <span className="text-[10px] text-slate-500 font-medium block">
              Health-Science Recall
            </span>
          </div>
        </div>

        <div className="hidden sm:block h-5 w-px bg-slate-200" />

        {/* Structure Selector Dropdown Button */}
        <button
          onClick={onOpenStructurePicker}
          className="flex items-center gap-2 px-3 py-1 rounded-md border border-slate-200 hover:border-blue-900 bg-slate-50 hover:bg-slate-100 text-left transition-colors group cursor-pointer"
          title="Switch anatomy structure"
        >
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Topic:</span>
            <span className="text-xs font-semibold text-slate-900 group-hover:text-blue-900">
              {currentStructure.name}
            </span>
            <span
              className={`text-[10px] font-medium px-1.5 py-0.2 rounded border ${getDifficultyBadge(
                currentStructure.difficulty
              )}`}
            >
              {currentStructure.difficulty}
            </span>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-900 transition-transform" />
        </button>
      </div>

      {/* Progress & Quick Actions */}
      <div className="flex items-center gap-2">
        {/* Score comparison pill */}
        {latestScore !== null && (
          <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-xs">
            <TrendingUp className="w-3.5 h-3.5 text-blue-900" />
            <span className="text-slate-600">Score:</span>
            <span className="font-bold text-slate-900">{latestScore}/100</span>
            {scoreDiff !== null && (
              <span
                className={`text-[11px] font-bold px-1.5 py-0.2 rounded ${
                  scoreDiff >= 0
                    ? 'text-blue-900 bg-blue-100'
                    : 'text-slate-700 bg-slate-200'
                }`}
              >
                {scoreDiff >= 0 ? `+${scoreDiff}` : `${scoreDiff}`}
              </span>
            )}
          </div>
        )}

        {/* Attempts count */}
        {attempts.length > 0 && (
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-xs text-slate-600">
            <History className="w-3.5 h-3.5 text-slate-500" />
            <span>
              {attempts.length} {attempts.length === 1 ? 'attempt' : 'attempts'}
            </span>
          </div>
        )}

        {/* Demo sketch helper button */}
        <button
          onClick={onLoadDemoSketch}
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 rounded-md transition-colors cursor-pointer"
          title="Load sample heart sketch to test AI evaluation"
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-900" />
          <span>Load Sample Sketch</span>
        </button>

        {/* Faculty Rubric Button */}
        <button
          onClick={onOpenRubric}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 rounded-md transition-colors cursor-pointer"
          title="View faculty grading rubric & landmarks"
        >
          <FileText className="w-3.5 h-3.5 text-slate-600" />
          <span>Faculty Rubric</span>
        </button>

        {/* Image Credits Button */}
        <button
          onClick={onOpenImageCredits}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 rounded-md transition-colors cursor-pointer"
          title="Open-source citations & figure licenses"
        >
          <BookOpen className="w-3.5 h-3.5 text-slate-600" />
          <span className="hidden sm:inline">Image Credits</span>
        </button>
      </div>
    </header>
  );
};
