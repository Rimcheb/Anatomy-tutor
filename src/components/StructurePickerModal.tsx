import React from 'react';
import { AnatomyStructure, AttemptRecord } from '../types/tutor';
import { ANATOMY_STRUCTURES } from '../data/anatomyData';
import { X, CheckCircle2, ArrowRight, Award, Activity, Brain, Layers } from 'lucide-react';

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
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Intermediate':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Advanced':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-teal-50 text-teal-700 border-teal-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Cardiovascular':
        return <Activity className="w-4 h-4 text-rose-600" />;
      case 'Renal Physiology':
        return <Layers className="w-4 h-4 text-amber-600" />;
      case 'Neuroanatomy':
      case 'Neurobiology':
        return <Brain className="w-4 h-4 text-indigo-600" />;
      default:
        return <Activity className="w-4 h-4 text-teal-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Select Anatomy Challenge</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Practice drawing high-yield anatomical structures from memory and receive board-level feedback.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List of structures */}
        <div className="p-6 overflow-y-auto space-y-3.5">
          {ANATOMY_STRUCTURES.map((structure) => {
            const isSelected = structure.id === currentStructureId;
            const bestScore = getBestScore(structure.id);

            return (
              <div
                key={structure.id}
                onClick={() => {
                  onSelectStructure(structure);
                  onClose();
                }}
                className={`group relative p-4 rounded-xl border text-left cursor-pointer transition-all ${
                  isSelected
                    ? 'border-teal-500 bg-teal-50/30 shadow-sm ring-1 ring-teal-500'
                    : 'border-slate-200 hover:border-teal-300 hover:bg-slate-50/70 hover:shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="p-1.5 rounded-md bg-white border border-slate-200 shadow-2xs">
                        {getCategoryIcon(structure.category)}
                      </span>
                      <h3 className="text-base font-semibold text-slate-900 group-hover:text-teal-700 transition-colors">
                        {structure.name}
                      </h3>
                      <span
                        className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${getDifficultyBadge(
                          structure.difficulty
                        )}`}
                      >
                        {structure.difficulty}
                      </span>
                      {isSelected && (
                        <span className="text-[11px] font-semibold text-teal-700 bg-teal-100/60 px-2 py-0.5 rounded">
                          Current Topic
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 mb-2 leading-relaxed font-sans">
                      {structure.promptText}
                    </p>

                    <div className="flex items-center gap-4 text-[11px] text-slate-500">
                      <span>
                        <strong className="text-slate-700 font-semibold">{structure.requiredParts.length}</strong> required parts
                      </span>
                      <span>•</span>
                      <span>
                        <strong className="text-slate-700 font-semibold">{structure.requiredLabels.length}</strong> labels
                      </span>
                      <span>•</span>
                      <span className="text-slate-500 italic truncate max-w-xs">
                        {structure.clinicalContext}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end justify-between self-stretch shrink-0">
                    {bestScore !== null ? (
                      <div className="flex items-center gap-1 text-xs font-semibold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200">
                        <Award className="w-3.5 h-3.5" />
                        <span>Best: {bestScore}%</span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400">Not drawn yet</span>
                    )}

                    <div className="flex items-center gap-1 text-xs font-medium text-teal-600 group-hover:translate-x-0.5 transition-transform mt-3">
                      <span>{isSelected ? 'Continue' : 'Select'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 text-xs text-slate-500 flex justify-between items-center">
          <span>Targeted for Nursing, Pre-Med, PT, and PA students.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
