import React, { useState } from 'react';
import { AnatomyStructure, AttemptRecord } from '../types/tutor';
import {
  Activity,
  ChevronDown,
  FileText,
  Sparkles,
  TrendingUp,
  History,
  BookOpen,
  Split,
  Smile,
  Cat,
  Heart,
  CheckCircle2,
  Radio,
} from 'lucide-react';

interface HeaderProps {
  currentStructure: AnatomyStructure;
  onOpenStructurePicker: () => void;
  onOpenRubric: () => void;
  onOpenImageCredits: () => void;
  onOpenCompare: () => void;
  canCompareWithTextbook: boolean;
  attempts: AttemptRecord[];
  latestScore: number | null;
  previousScore: number | null;
  teaseMode: boolean;
  onToggleTeaseMode: () => void;
  isLiveCoachEnabled: boolean;
  onToggleLiveCoach: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentStructure,
  onOpenStructurePicker,
  onOpenRubric,
  onOpenImageCredits,
  onOpenCompare,
  canCompareWithTextbook,
  attempts,
  latestScore,
  previousScore,
  teaseMode,
  onToggleTeaseMode,
  isLiveCoachEnabled,
  onToggleLiveCoach,
}) => {

  const getDifficultyBadge = (diff: string) => {
    switch (diff) {
      case 'Beginner':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Intermediate':
        return 'bg-teal-50 text-teal-800 border-teal-200';
      case 'Advanced':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  const scoreDiff =
    latestScore !== null && previousScore !== null ? latestScore - previousScore : null;

  return (
    <header className="h-14 border-b border-slate-200 bg-white px-3 sm:px-5 flex items-center justify-between z-30 shrink-0 shadow-2xs">
      {/* Brand & Topic Selector */}
      <div className="flex items-center gap-2 sm:gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-xs">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-extrabold text-slate-900 tracking-tight text-xs sm:text-sm leading-tight">
              Anatomy Tutor
            </h1>
            <span className="text-[10px] text-teal-700 font-semibold block uppercase tracking-wide">
              Faculty Lab
            </span>
          </div>
        </div>

        <div className="hidden md:block h-5 w-px bg-slate-200" />

        {/* Structure Selector Button */}
        <button
          onClick={onOpenStructurePicker}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 hover:border-teal-500 bg-slate-50 hover:bg-teal-50/50 text-left transition-colors group cursor-pointer"
          title="Switch anatomy structure"
        >
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">Structure:</span>
            <span className="text-xs font-bold text-slate-900 group-hover:text-teal-800">
              {currentStructure.name}
            </span>
            <span
              className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${getDifficultyBadge(
                currentStructure.difficulty
              )}`}
            >
              {currentStructure.difficulty}
            </span>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-600 transition-transform" />
        </button>
      </div>

      {/* Progress & Quick Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Score comparison pill */}
        {latestScore !== null && (
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs">
            <TrendingUp className="w-3.5 h-3.5 text-teal-600" />
            <span className="text-slate-600">Score:</span>
            <span className="font-extrabold text-slate-900">{latestScore}/100</span>
            {scoreDiff !== null && (
              <span
                className={`text-[10px] font-bold px-1 py-0.2 rounded ${
                  scoreDiff >= 0
                    ? 'text-emerald-800 bg-emerald-100'
                    : 'text-slate-700 bg-slate-200'
                }`}
              >
                {scoreDiff >= 0 ? `+${scoreDiff}` : `${scoreDiff}`}
              </span>
            )}
          </div>
        )}
 
        {/* Live Coach Controls Toggle */}
        <button
          onClick={onToggleLiveCoach}
          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
            isLiveCoachEnabled
              ? 'bg-teal-50 text-teal-800 border-teal-300'
              : 'bg-white text-slate-500 border-slate-200'
          }`}
          title="Toggle periodic live coaching inspection while drawing"
        >
          <span className={`w-2 h-2 rounded-full ${isLiveCoachEnabled ? 'bg-teal-600 animate-pulse' : 'bg-slate-400'}`} />
          <span className="hidden md:inline">Live Coach: {isLiveCoachEnabled ? 'ON' : 'OFF'}</span>
        </button>

        {/* Tease Mode Toggle */}
        <button
          onClick={onToggleTeaseMode}
          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
            teaseMode
              ? 'bg-teal-50 text-teal-800 border-teal-300'
              : 'bg-white text-slate-500 border-slate-200'
          }`}
          title="Toggle playful tease mode vs neutral message when drawing is unrelated"
        >
          <Smile className={`w-3.5 h-3.5 ${teaseMode ? 'text-teal-600' : 'text-slate-400'}`} />
          <span className="hidden lg:inline">Tease: {teaseMode ? 'ON' : 'OFF'}</span>
        </button>

        {/* Faculty Rubric Button */}
        <button
          onClick={onOpenRubric}
          className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer shadow-2xs"
          title="View faculty grading rubric & landmarks"
        >
          <FileText className="w-3.5 h-3.5 text-slate-600" />
          <span className="hidden sm:inline">Rubric</span>
        </button>

        {/* Compare with Textbook */}
        <button
          onClick={onOpenCompare}
          disabled={!canCompareWithTextbook}
          className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
            canCompareWithTextbook
              ? 'bg-teal-600 text-white border-teal-600 hover:bg-teal-700 shadow-xs'
              : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
          }`}
          title={canCompareWithTextbook ? 'Compare with OpenStax textbook reference' : 'Unlock by using 3 hints or submitting once'}
        >
          <Split className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Compare</span>
        </button>

        {/* Image Credits */}
        <button
          onClick={onOpenImageCredits}
          className="flex items-center gap-1 px-2 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
          title="Open-source references and credits"
        >
          <BookOpen className="w-3.5 h-3.5 text-slate-500" />
        </button>
      </div>
    </header>
  );
};
