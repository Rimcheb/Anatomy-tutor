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
  Loader2,
  Activity,
  Info,
  Split,
  Lock,
  CheckSquare
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
  // Step live coach
  onCheckStep?: (stepNumber: number, instruction: string) => void;
  stepCoachFeedback?: { stepNumber: number; complete: boolean; feedback: string } | null;
  // Textbook comparison
  canCompareWithTextbook: boolean;
  onOpenCompare: () => void;
  hintLevelsUsedCount: number;
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
  onCheckStep,
  stepCoachFeedback,
  canCompareWithTextbook,
  onOpenCompare,
  hintLevelsUsedCount,
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
  const currentScore = evaluationResult?.overallScore ?? evaluationResult?.score ?? null;
  const scoreDiff =
    currentScore !== null && previousScore !== null ? currentScore - previousScore : null;

  return (
    <div className="w-80 lg:w-96 h-full bg-white border-l border-slate-200 flex flex-col shrink-0 overflow-hidden">
      {/* 3 Main AI Mode Buttons */}
      <div className="p-3 border-b border-slate-200 bg-slate-50 shrink-0">
        <div className="grid grid-cols-3 gap-1 p-1 bg-slate-200/80 rounded-lg">
          {/* Guide Me Button */}
          <button
            onClick={() => setActiveTab('guide')}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'guide'
                ? 'bg-white text-blue-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Compass className="w-4 h-4 mb-0.5 text-blue-900" />
            <span>Guide Me</span>
          </button>

          {/* Hint Ladder Button */}
          <button
            onClick={() => setActiveTab('hint')}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'hint'
                ? 'bg-white text-blue-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Lightbulb className="w-4 h-4 mb-0.5 text-blue-900" />
            <span>Hint Ladder</span>
          </button>

          {/* Check My Drawing Button */}
          <button
            onClick={() => {
              setActiveTab('feedback');
              if (!evaluationResult) {
                onCheckDrawing();
              }
            }}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'feedback'
                ? 'bg-white text-blue-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-4 h-4 mb-0.5 text-blue-900" />
            <span>Check Drawing</span>
          </button>
        </div>
      </div>

      {/* Loading Overlay */}
      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-white">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center mb-3">
            <Activity className="w-6 h-6 text-blue-900 animate-pulse" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">
            {loadingMessage || 'Your tutor is looking at your drawing…'}
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-xs">
            Comparing against faculty rubric, relative proportions, and OpenStax reference landmarks.
          </p>
          <div className="mt-4 flex items-center gap-2 text-xs font-medium text-blue-900">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Analyzing anatomy...</span>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {/* ================= TAB 1: GUIDE ME ================= */}
          {activeTab === 'guide' && (
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Drawing Plan</h3>
                  <p className="text-xs text-slate-500">
                    Step-by-step whiteboard landmarks ({steps.length} steps)
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  Step {currentStepIndex + 1} of {steps.length}
                </span>
              </div>

              {/* Progress Bar of Steps */}
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-blue-900 h-full transition-all duration-300"
                  style={{
                    width: `${((currentStepIndex + 1) / Math.max(steps.length, 1)) * 100}%`,
                  }}
                />
              </div>

              {/* Active Step Card */}
              {currentStep && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <span className="w-6 h-6 rounded-md bg-blue-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                      {currentStep.stepNumber}
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        {currentStep.title}
                      </h4>
                      <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                        {currentStep.instruction}
                      </p>
                    </div>
                  </div>

                  {/* Landmark & Proportion tip */}
                  <div className="p-2.5 bg-white rounded border border-slate-200 space-y-1.5 text-xs">
                    <div>
                      <span className="font-semibold text-slate-900">Landmarks: </span>
                      <span className="text-slate-600">{currentStep.landmarks}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-900">Proportions: </span>
                      <span className="text-slate-600">{currentStep.proportionsTip}</span>
                    </div>
                  </div>

                  {/* Key parts */}
                  <div className="flex flex-wrap gap-1 pt-1">
                    {currentStep.keyParts?.map((part, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-white text-slate-700 border border-slate-200 rounded text-[11px] font-medium"
                      >
                        {part}
                      </span>
                    ))}
                  </div>

                  {/* Live Coach Check Step Feedback if available */}
                  {stepCoachFeedback && stepCoachFeedback.stepNumber === currentStep.stepNumber && (
                    <div className="p-2.5 bg-blue-50 border border-blue-200 rounded text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-blue-900">
                        <CheckSquare className="w-3.5 h-3.5" />
                        <span>Step Coach Feedback:</span>
                      </div>
                      <p className="text-slate-700">{stepCoachFeedback.feedback}</p>
                    </div>
                  )}

                  {/* Step Action Buttons */}
                  <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-200">
                    <button
                      onClick={() => setCurrentStepIndex((prev) => Math.max(prev - 1, 0))}
                      disabled={currentStepIndex === 0}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Previous</span>
                    </button>

                    {onCheckStep && (
                      <button
                        onClick={() => onCheckStep(currentStep.stepNumber, currentStep.instruction)}
                        className="px-2.5 py-1 text-[11px] font-semibold text-blue-900 bg-white border border-blue-300 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                        title="Evaluate just this step"
                      >
                        Check this step
                      </button>
                    )}

                    <button
                      onClick={() =>
                        setCurrentStepIndex((prev) => Math.min(prev + 1, steps.length - 1))
                      }
                      disabled={currentStepIndex === steps.length - 1}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 disabled:opacity-30 disabled:pointer-events-none rounded transition-colors cursor-pointer"
                    >
                      <span>Next step</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Ready to grade button */}
              <div className="pt-2">
                <button
                  onClick={() => {
                    setActiveTab('feedback');
                    onCheckDrawing();
                  }}
                  className="w-full py-2 px-3 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-md transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Finished? Check My Drawing</span>
                </button>
              </div>
            </div>
          )}

          {/* ================= TAB 2: HINT LADDER ================= */}
          {activeTab === 'hint' && (
            <div className="p-4 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">3-Level Socratic Hint Ladder</h3>
                <p className="text-xs text-slate-500">
                  Promotes cognitive recall without spoiling the answer
                </p>
              </div>

              {/* Level Selector Buttons */}
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => {
                      setSelectedHintLevel(lvl as 1 | 2 | 3);
                      onRequestHint(lvl as 1 | 2 | 3);
                    }}
                    className={`p-2.5 rounded-lg border text-left flex flex-col transition-all cursor-pointer ${
                      selectedHintLevel === lvl
                        ? 'border-blue-900 bg-blue-50/70 text-blue-900 ring-1 ring-blue-900'
                        : 'border-slate-200 bg-slate-50/60 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      Level {lvl}
                    </span>
                    <span className="text-xs font-bold text-slate-900 mt-0.5">
                      {lvl === 1 ? 'Socratic' : lvl === 2 ? 'Regional' : 'Specific Fix'}
                    </span>
                  </button>
                ))}
              </div>

              {/* Hint Content Card */}
              {activeHint ? (
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-900 uppercase tracking-wide">
                      {activeHint.title || `Level ${activeHint.level} Hint`}
                    </span>
                    <span className="text-[11px] font-medium text-slate-500">
                      Under 40 words
                    </span>
                  </div>

                  <p className="text-xs text-slate-800 leading-relaxed font-medium">
                    "{activeHint.hint || activeHint.message}"
                  </p>

                  {activeHint.concept && (
                    <div className="text-[11px] text-slate-600 pt-2 border-t border-slate-200">
                      <span className="font-semibold text-slate-800">Concept: </span>
                      {activeHint.concept}
                    </div>
                  )}

                  {activeHint.level === 2 && activeHint.box_2d && (
                    <div className="text-[11px] text-blue-900 bg-blue-50 p-2 rounded border border-blue-200">
                      Regional boundary highlighted on canvas.
                    </div>
                  )}

                  {/* Progressive Hint Escalation Button */}
                  {selectedHintLevel < 3 && (
                    <button
                      onClick={() => {
                        const nextLevel = (selectedHintLevel + 1) as 2 | 3;
                        setSelectedHintLevel(nextLevel);
                        onRequestHint(nextLevel);
                      }}
                      className="w-full mt-2 py-1.5 px-3 rounded text-xs font-semibold text-blue-900 bg-white border border-blue-300 hover:bg-blue-50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>Need more help? Go to Level {selectedHintLevel + 1}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="p-6 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200 space-y-2">
                  <HelpCircle className="w-6 h-6 text-slate-400 mx-auto" />
                  <p className="text-xs font-medium text-slate-600">
                    Click a level above to receive a Socratic hint tailored to your drawing.
                  </p>
                </div>
              )}

              {/* Compare with Textbook status */}
              <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800">Textbook Comparison:</span>
                  {canCompareWithTextbook ? (
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Unlocked
                    </span>
                  ) : (
                    <span className="text-slate-500 flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5" /> {hintLevelsUsedCount}/3 hints used
                    </span>
                  )}
                </div>
                {canCompareWithTextbook ? (
                  <button
                    onClick={onOpenCompare}
                    className="w-full py-1.5 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Split className="w-3.5 h-3.5" />
                    <span>Open Textbook Comparison</span>
                  </button>
                ) : (
                  <p className="text-[11px] text-slate-500">
                    Using all 3 hint levels or submitting your first drawing will unlock the OpenStax reference comparison.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ================= TAB 3: CHECK DRAWING & FEEDBACK ================= */}
          {activeTab === 'feedback' && (
            <div className="p-4 space-y-4">
              {!evaluationResult ? (
                <div className="space-y-4 text-center py-6">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center mx-auto text-blue-900">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Check Your Drawing
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                      Sends your memory sketch to Gemini alongside the OpenStax reference to grade against the faculty rubric.
                    </p>
                  </div>
                  <button
                    onClick={onCheckDrawing}
                    className="w-full py-2.5 px-4 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-md shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Evaluate My Diagram Now</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Notice Banner if Fallback / Credit */}
                  {evaluationResult.notice && (
                    <div className="p-2.5 bg-blue-50 border border-blue-200 rounded text-xs text-slate-700 flex items-start gap-2">
                      <Info className="w-4 h-4 text-blue-900 shrink-0 mt-0.5" />
                      <div>{evaluationResult.notice}</div>
                    </div>
                  )}

                  {/* Score & Progress Card */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                        Rubric Score
                      </span>
                      {scoreDiff !== null && (
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded ${
                            scoreDiff >= 0
                              ? 'bg-blue-100 text-blue-900'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {scoreDiff >= 0 ? `+${scoreDiff} vs prev` : `${scoreDiff} vs prev`}
                        </span>
                      )}
                    </div>

                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold text-slate-900">
                        {currentScore}
                      </span>
                      <span className="text-sm font-semibold text-slate-400">/ 100</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          (currentScore ?? 0) >= 80
                            ? 'bg-emerald-600'
                            : (currentScore ?? 0) >= 60
                            ? 'bg-blue-900'
                            : 'bg-amber-600'
                        }`}
                        style={{ width: `${currentScore ?? 0}%` }}
                      />
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                      {evaluationResult.summary}
                    </p>

                    {/* Next Focus */}
                    {evaluationResult.next_focus && (
                      <div className="text-xs text-blue-900 bg-white p-2 rounded border border-blue-200 font-medium">
                        <span className="font-bold">Next Focus: </span>
                        {evaluationResult.next_focus}
                      </div>
                    )}
                  </div>

                  {/* Try Again & Compare Actions */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => onTryAgain(false)}
                      className="py-2 px-2.5 text-xs font-bold text-slate-800 bg-white border border-slate-300 hover:bg-slate-50 rounded transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      title="Refine existing drawing while preserving your previous attempt score"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
                      <span>Refine Sketch</span>
                    </button>

                    <button
                      onClick={onOpenCompare}
                      className="py-2 px-2.5 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      title="Open side-by-side OpenStax reference comparison"
                    >
                      <Split className="w-3.5 h-3.5" />
                      <span>Compare Book</span>
                    </button>
                  </div>

                  {/* Errors List */}
                  {evaluationResult.errors && evaluationResult.errors.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                          Clinical Corrections ({evaluationResult.errors.length})
                        </h4>
                        <span className="text-[11px] text-slate-500">
                          Click to highlight on canvas
                        </span>
                      </div>

                      <div className="space-y-2">
                        {evaluationResult.errors.map((err: EvaluatedError) => {
                          const isSelected = selectedErrorId === err.id;
                          const isMajor = err.severity === 'major';

                          return (
                            <div
                              key={err.id}
                              onClick={() => onSelectError(isSelected ? null : err.id)}
                              className={`p-3 rounded-lg border text-xs transition-all cursor-pointer ${
                                isSelected
                                  ? 'border-blue-900 bg-blue-50/50 shadow-xs ring-1 ring-blue-900'
                                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex items-start gap-2">
                                <span
                                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 ${
                                    isMajor ? 'bg-rose-600' : 'bg-amber-600'
                                  }`}
                                >
                                  {err.id}
                                </span>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="font-bold text-slate-900">
                                      {err.what_is_wrong || err.explanation}
                                    </span>
                                    <span
                                      className={`text-[10px] uppercase font-bold px-1.5 py-0.2 rounded shrink-0 ${
                                        isMajor
                                          ? 'bg-rose-100 text-rose-800'
                                          : 'bg-amber-100 text-amber-800'
                                      }`}
                                    >
                                      {err.severity}
                                    </span>
                                  </div>

                                  {err.why_it_matters && (
                                    <p className="text-slate-600 mt-1">
                                      <span className="font-semibold text-slate-700">Why it matters: </span>
                                      {err.why_it_matters}
                                    </p>
                                  )}

                                  <div className="mt-1.5 pt-1.5 border-t border-slate-100 text-blue-900 font-medium">
                                    <span className="font-semibold">Fix: </span>
                                    {err.how_to_fix || err.fix}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Correct Structures */}
                  {evaluationResult.correctItems && evaluationResult.correctItems.length > 0 && (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Accurate Landmarks</span>
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {evaluationResult.correctItems.map((c, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-white text-emerald-800 border border-emerald-200 rounded text-[11px] font-medium"
                          >
                            ✓ {c.item || c.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Re-check drawing button */}
                  <div className="pt-2">
                    <button
                      onClick={onCheckDrawing}
                      className="w-full py-2 px-3 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Re-Evaluate Drawing</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
