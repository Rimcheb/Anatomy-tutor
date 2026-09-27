import React, { useState } from 'react';
import {
  AnatomyStructure,
  DrawingEvaluationResult,
  DrawingStep,
  HintResponse,
  EvaluatedError,
  AttemptRecord,
} from '../types/tutor';
import {
  Sparkles,
  Lightbulb,
  Compass,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  Award,
  Layers,
  HelpCircle,
  TrendingUp,
  Tag,
  Loader2,
  Stethoscope,
} from 'lucide-react';

interface SidePanelProps {
  structure: AnatomyStructure;
  evaluationResult: DrawingEvaluationResult | null;
  activeHint: HintResponse | null;
  selectedErrorId: number | null;
  onSelectError: (id: number | null) => void;
  onCheckDrawing: () => void;
  onRequestHint: (level: 1 | 2 | 3) => void;
  onTryAgain: (clearCanvas: boolean) => void;
  isLoading: boolean;
  loadingMessage: string;
  attempts: AttemptRecord[];
  previousScore: number | null;
}

export const SidePanel: React.FC<SidePanelProps> = ({
  structure,
  evaluationResult,
  activeHint,
  selectedErrorId,
  onSelectError,
  onCheckDrawing,
  onRequestHint,
  onTryAgain,
  isLoading,
  loadingMessage,
  attempts,
  previousScore,
}) => {
  const [activeTab, setActiveTab] = useState<'feedback' | 'guide' | 'hint'>(
    evaluationResult ? 'feedback' : 'guide'
  );

  // Guide me step tracking
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const steps: DrawingStep[] = structure.drawingPlan || [];
  const currentStep = steps[currentStepIndex] || steps[0];

  // Hint ladder level selected (1, 2, or 3)
  const [selectedHintLevel, setSelectedHintLevel] = useState<1 | 2 | 3>(1);

  // Score comparison calculation
  const currentScore = evaluationResult?.overallScore ?? null;
  const scoreDiff =
    currentScore !== null && previousScore !== null ? currentScore - previousScore : null;

  return (
    <div className="w-80 lg:w-96 h-full bg-white border-l border-slate-200 flex flex-col shrink-0 overflow-hidden shadow-sm">
      {/* 3 Main AI Mode Buttons */}
      <div className="p-3.5 border-b border-slate-200 bg-slate-50/70 shrink-0">
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-200/70 rounded-xl">
          {/* Guide Me Button */}
          <button
            onClick={() => setActiveTab('guide')}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'guide'
                ? 'bg-white text-teal-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Compass className="w-4 h-4 mb-0.5 text-teal-600" />
            <span>Guide Me</span>
          </button>

          {/* Hint Ladder Button */}
          <button
            onClick={() => setActiveTab('hint')}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'hint'
                ? 'bg-white text-teal-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Lightbulb className="w-4 h-4 mb-0.5 text-amber-500" />
            <span>Hint Ladder</span>
          </button>

          {/* Feedback / Evaluation Tab */}
          <button
            onClick={() => setActiveTab('feedback')}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'feedback'
                ? 'bg-white text-teal-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-4 h-4 mb-0.5 text-teal-600" />
            <span>Correction</span>
          </button>
        </div>

        {/* Primary AI CTA Button: Check My Drawing */}
        <div className="mt-3">
          <button
            onClick={() => {
              setActiveTab('feedback');
              onCheckDrawing();
            }}
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm shadow-teal-700/20 transition-all disabled:opacity-75 disabled:pointer-events-none group"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Evaluating sketch...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-teal-200 group-hover:scale-110 transition-transform" />
                <span>Check My Drawing</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Loading State Overlay */}
        {isLoading && (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-teal-50 border-2 border-teal-200 flex items-center justify-center text-teal-600 animate-pulse">
                <Stethoscope className="w-8 h-8" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              </div>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                {loadingMessage || 'Your tutor is looking at your drawing…'}
              </h3>
              <p className="text-xs text-slate-500 max-w-xs mt-1">
                Comparing topology, orientation, landmarks, and anatomical labels against the gold-standard rubric.
              </p>
            </div>
          </div>
        )}

        {/* TAB 1: GUIDE ME (Step-by-Step Drawing Plan) */}
        {!isLoading && activeTab === 'guide' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Step header */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700">
                  Step {currentStepIndex + 1} of {steps.length}
                </span>
                <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                  {currentStep.title}
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 text-[10px] font-bold border border-teal-200">
                Landmark Plan
              </span>
            </div>

            {/* Step Instruction Card */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-3">
              <div>
                <h4 className="font-semibold text-slate-700 mb-1 text-[11px] uppercase tracking-wide">
                  What to draw:
                </h4>
                <p className="text-slate-800 leading-relaxed font-medium">
                  {currentStep.instruction}
                </p>
              </div>

              {/* Landmarks */}
              <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-slate-700">
                <span className="font-bold text-teal-800 block mb-0.5 text-[11px]">
                  Key Landmarks:
                </span>
                <p className="text-[11px] leading-relaxed text-slate-600">
                  {currentStep.landmarks}
                </p>
              </div>

              {/* Proportions Tip */}
              <div className="p-2.5 rounded-lg bg-teal-50/60 border border-teal-100 text-slate-700">
                <span className="font-bold text-teal-800 block mb-0.5 text-[11px]">
                  Proportions & Placement:
                </span>
                <p className="text-[11px] leading-relaxed text-slate-600">
                  {currentStep.proportionsTip}
                </p>
              </div>

              {/* Target Parts in this step */}
              {currentStep.keyParts && currentStep.keyParts.length > 0 && (
                <div>
                  <span className="font-bold text-slate-700 block mb-1 text-[11px]">
                    Focus Structures:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {currentStep.keyParts.map((kp, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded bg-white border border-slate-200 text-[10px] font-medium text-slate-700"
                      >
                        {kp}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Step Navigation Controls */}
            <div className="flex items-center justify-between gap-2 pt-2">
              <button
                onClick={() => setCurrentStepIndex(Math.max(0, currentStepIndex - 1))}
                disabled={currentStepIndex === 0}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 disabled:opacity-40 disabled:pointer-events-none transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Prev Step</span>
              </button>

              {/* Step indicator dots */}
              <div className="flex items-center gap-1">
                {steps.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentStepIndex(idx)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      idx === currentStepIndex
                        ? 'w-5 bg-teal-600'
                        : 'bg-slate-300 hover:bg-slate-400'
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={() => setCurrentStepIndex(Math.min(steps.length - 1, currentStepIndex + 1))}
                disabled={currentStepIndex === steps.length - 1}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-40 disabled:pointer-events-none transition-colors"
              >
                <span>Next Step</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: HINT LADDER (3 Levels: Socratic -> Regional -> Direct Fix) */}
        {!isLoading && activeTab === 'hint' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600">
                Guided Recall
              </span>
              <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                3-Level Hint Ladder
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Start at Level 1 to test memory recall. Higher levels reveal more information.
              </p>
            </div>

            {/* Level Selector Cards */}
            <div className="space-y-2">
              {[
                {
                  level: 1 as const,
                  title: 'Level 1: Socratic Nudge',
                  desc: 'A reflective question to prompt your self-correction. Never reveals the answer.',
                  badge: 'Minimal Help',
                },
                {
                  level: 2 as const,
                  title: 'Level 2: Regional Pointer',
                  desc: 'Highlights the specific canvas region or quadrant needing attention.',
                  badge: 'Moderate Help',
                },
                {
                  level: 3 as const,
                  title: 'Level 3: Specific Fix',
                  desc: 'States the concrete anatomical correction and redrawing instructions.',
                  badge: 'Full Solution',
                },
              ].map((h) => (
                <button
                  key={h.level}
                  onClick={() => {
                    setSelectedHintLevel(h.level);
                    onRequestHint(h.level);
                  }}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    selectedHintLevel === h.level
                      ? 'border-teal-500 bg-teal-50/40 ring-1 ring-teal-500'
                      : 'border-slate-200 hover:border-teal-300 hover:bg-slate-50/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-xs text-slate-900">{h.title}</span>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      {h.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">{h.desc}</p>
                </button>
              ))}
            </div>

            {/* Active Hint Display */}
            {activeHint && (
              <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200/90 text-xs space-y-2 animate-in fade-in">
                <div className="flex items-center gap-1.5 text-amber-800 font-bold text-xs">
                  <Lightbulb className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{activeHint.title}</span>
                </div>
                <p className="text-amber-950 font-medium text-xs leading-relaxed">
                  {activeHint.message}
                </p>
                {activeHint.focusRegion && (
                  <p className="text-[11px] text-amber-800 font-semibold pt-1">
                    🎯 Canvas marker placed over target region.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: CHECK MY DRAWING / CORRECTION RESULTS */}
        {!isLoading && activeTab === 'feedback' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {evaluationResult ? (
              <>
                {/* Score & Progress Card */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Accuracy Score
                      </span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-2xl font-black text-slate-900">
                          {evaluationResult.overallScore}
                        </span>
                        <span className="text-sm font-semibold text-slate-400">/100</span>
                      </div>
                    </div>

                    {/* Previous attempt comparison */}
                    {previousScore !== null && scoreDiff !== null ? (
                      <div className="text-right">
                        <span className="text-[10px] font-medium text-slate-500 block">
                          Prev: {previousScore}%
                        </span>
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-0.5 mt-0.5 ${
                            scoreDiff >= 0
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          <TrendingUp className="w-3 h-3" />
                          {scoreDiff >= 0 ? `+${scoreDiff}` : scoreDiff}%
                        </span>
                      </div>
                    ) : (
                      <div className="px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800 border border-teal-200 text-[11px] font-semibold">
                        First Attempt
                      </div>
                    )}
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        evaluationResult.overallScore >= 80
                          ? 'bg-emerald-500'
                          : evaluationResult.overallScore >= 50
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                      style={{ width: `${Math.max(5, evaluationResult.overallScore)}%` }}
                    />
                  </div>

                  {/* Summary critique */}
                  <p className="text-xs text-slate-700 leading-relaxed font-sans pt-1 border-t border-slate-200/80">
                    {evaluationResult.summary}
                  </p>
                </div>

                {/* Errors List (Numbered matching colored canvas boxes) */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                      <span>Errors & Corrections ({evaluationResult.errors?.length || 0})</span>
                    </h4>
                    <span className="text-[10px] text-slate-500">
                      Numbered boxes on canvas
                    </span>
                  </div>

                  {evaluationResult.errors && evaluationResult.errors.length > 0 ? (
                    <div className="space-y-2">
                      {evaluationResult.errors.map((err) => {
                        const isMajor = err.severity === 'major';
                        const isSelected = selectedErrorId === err.id;

                        return (
                          <div
                            key={err.id}
                            onClick={() => onSelectError(isSelected ? null : err.id)}
                            className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                              isSelected
                                ? isMajor
                                  ? 'border-rose-500 bg-rose-50/60 ring-2 ring-rose-400'
                                  : 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-400'
                                : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/60'
                            }`}
                          >
                            <div className="flex items-start gap-2.5">
                              {/* Error number matching canvas box */}
                              <div
                                className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-extrabold text-white shrink-0 mt-0.5 shadow-2xs ${
                                  isMajor ? 'bg-rose-600' : 'bg-amber-500'
                                }`}
                              >
                                {err.id}
                              </div>

                              <div className="flex-1">
                                <div className="flex items-center justify-between gap-1 mb-1">
                                  <span className="text-xs font-bold text-slate-900">
                                    {err.label}
                                  </span>
                                  <span
                                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
                                      isMajor
                                        ? 'bg-rose-100 text-rose-800'
                                        : 'bg-amber-100 text-amber-800'
                                    }`}
                                  >
                                    {err.severity}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-600 leading-snug mb-1.5">
                                  {err.explanation}
                                </p>
                                <div className="p-1.5 rounded bg-slate-50 border border-slate-200 text-[11px] text-teal-900 font-medium">
                                  <strong className="text-teal-700 font-semibold">Fix: </strong>
                                  {err.fix}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Outstanding! No major or minor anatomical errors detected.</span>
                    </div>
                  )}
                </div>

                {/* What's Correct (Green Items) */}
                {evaluationResult.correctItems && evaluationResult.correctItems.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Accurate Structures ({evaluationResult.correctItems.length})</span>
                    </h4>
                    <div className="space-y-1.5">
                      {evaluationResult.correctItems.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-2 rounded-lg bg-emerald-50/60 border border-emerald-200/80 text-xs"
                        >
                          <span className="font-bold text-emerald-900 block">{item.name}</span>
                          <span className="text-[11px] text-emerald-800">{item.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Missing Structures */}
                {evaluationResult.missingStructures && evaluationResult.missingStructures.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-slate-600" />
                      <span>Missing Components ({evaluationResult.missingStructures.length})</span>
                    </h4>
                    <div className="space-y-1.5">
                      {evaluationResult.missingStructures.map((m, idx) => (
                        <div
                          key={idx}
                          className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                        >
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="font-semibold text-slate-800">{m.name}</span>
                            <span className="text-[10px] text-slate-500">{m.importance}</span>
                          </div>
                          <p className="text-[11px] text-slate-600">{m.recommendation}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Label Mistakes */}
                {evaluationResult.labelMistakes && evaluationResult.labelMistakes.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-amber-600" />
                      <span>Label Feedback ({evaluationResult.labelMistakes.length})</span>
                    </h4>
                    <div className="space-y-1.5">
                      {evaluationResult.labelMistakes.map((lm, idx) => (
                        <div
                          key={idx}
                          className="p-2 rounded-lg bg-amber-50/50 border border-amber-200/70 text-xs"
                        >
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="font-semibold text-slate-900">"{lm.text}"</span>
                            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
                              → {lm.correctLabel}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600">{lm.critique}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* "Try Again" Button with Score Retention */}
                <div className="pt-2 border-t border-slate-200 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onTryAgain(false)}
                      className="flex-1 py-2 px-3 rounded-xl border border-teal-600 text-teal-700 hover:bg-teal-50 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                      title="Keep current sketch to correct errors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Fix Mistakes</span>
                    </button>
                    <button
                      onClick={() => onTryAgain(true)}
                      className="flex-1 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                      title="Clear canvas for a fresh recall attempt"
                    >
                      <span>Fresh Redraw</span>
                    </button>
                  </div>
                  <span className="text-[10px] text-center text-slate-400">
                    Your previous score ({evaluationResult.overallScore}%) will be saved to show improvement.
                  </span>
                </div>
              </>
            ) : (
              <div className="py-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 text-teal-600 flex items-center justify-center mx-auto">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">No Evaluation Yet</h4>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
                    Draw your anatomy diagram on the canvas, then click{' '}
                    <strong className="text-teal-700">Check My Drawing</strong> to receive detailed corrections.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
