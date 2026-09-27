import React from 'react';
import { AnatomyStructure, AttemptRecord } from '../types/tutor';
import { ANATOMY_STRUCTURES } from '../data/anatomyData';
import { X, CheckCircle2, ArrowRight, Award, Activity, Brain, Layers, Clock } from 'lucide-react';

interface StructurePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStructureId: string;
  onSelectStructure: (structure: AnatomyStructure) => void;
  attempts: AttemptRecord[];
}

export const StructurePickerModal: React.FC<StructurePickerModalProps> = ({
  isOpen,
  onClose,
  currentStructureId,
  onSelectStructure,
  attempts,
}) => {
  if (!isOpen) return null;

  const getBestScore = (id: string) => {
    const structAttempts = attempts.filter((a) => a.structureId === id);
    if (!structAttempts.length) return null;
    return Math.max(...structAttempts.map((a) => a.score));
  };

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-xl max-w-2xl w-full shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="picker-title"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h2 id="picker-title" className="text-base font-bold text-slate-900">
              Select Anatomy Structure
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Practice drawing high-yield anatomical structures from memory with AI tutor guidance.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-200 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List of structures */}
        <div className="p-5 overflow-y-auto space-y-3">
          {ANATOMY_STRUCTURES.map((structure) => {
            const isSelected = structure.id === currentStructureId;
            const isComingSoon = structure.comingSoon;
            const bestScore = getBestScore(structure.id);

            return (
              <div
                key={structure.id}
                onClick={() => {
                  if (isComingSoon) return;
                  onSelectStructure(structure);
                  onClose();
                }}
                className={`p-4 rounded-lg border text-left transition-all ${
                  isComingSoon
                    ? 'opacity-60 bg-slate-50 border-slate-200 cursor-not-allowed'
                    : isSelected
                    ? 'border-blue-900 bg-blue-50/40 shadow-xs ring-1 ring-blue-900 cursor-pointer'
                    : 'border-slate-200 hover:border-blue-900 hover:bg-slate-50 cursor-pointer'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="text-sm font-bold text-slate-900">
                        {structure.name}
                      </h3>
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.2 rounded border ${getDifficultyBadge(
                          structure.difficulty
                        )}`}
                      >
                        {structure.difficulty}
                      </span>
                      {isComingSoon && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700 border border-slate-300 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>Coming soon</span>
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {structure.promptText}
                    </p>

                    <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-500">
                      <span>Category: {structure.category}</span>
                      {structure.reference && (
                        <span>
                          Source: {structure.reference.figure_number}, {structure.reference.source_title}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions / Best Score */}
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    {bestScore !== null && !isComingSoon && (
                      <span className="text-xs font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        Best: {bestScore}/100
                      </span>
                    )}

                    {!isComingSoon && (
                      <span
                        className={`text-xs font-semibold flex items-center gap-1 ${
                          isSelected ? 'text-blue-900' : 'text-slate-400 group-hover:text-blue-900'
                        }`}
                      >
                        {isSelected ? 'Active' : 'Select'}
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
          <span>Currently reviewing: Heart – anterior view (OpenStax Figure 19.8)</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
