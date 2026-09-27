import React from 'react';
import { AnatomyStructure } from '../types/tutor';
import { X, CheckCircle, AlertTriangle, Compass, Tag } from 'lucide-react';

interface RubricModalProps {
  isOpen: boolean;
  onClose: () => void;
  structure: AnatomyStructure;
}

export const RubricModal: React.FC<RubricModalProps> = ({
  isOpen,
  onClose,
  structure,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-teal-50/40">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-teal-700">
                Evaluation Rubric
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-medium text-slate-600">{structure.category}</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-0.5">{structure.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {/* Prompt */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
              Assignment Directive
            </h4>
            <p className="text-slate-800 font-medium">{structure.promptText}</p>
          </div>

          {/* Spatial Relationships & Landmarks */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Compass className="w-4 h-4 text-teal-600" />
              <h4 className="font-bold text-slate-900 text-sm">
                Critical Spatial Relationships & Landmarks
              </h4>
            </div>
            <ul className="space-y-1.5 pl-6 list-disc text-slate-700 text-xs leading-relaxed">
              {structure.spatialRelationships.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>

          {/* Required Parts */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <h4 className="font-bold text-slate-900 text-sm">
                Required Components ({structure.requiredParts.length})
              </h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {structure.requiredParts.map((part, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-800"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  <span>{part}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Required Labels */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Tag className="w-4 h-4 text-teal-600" />
              <h4 className="font-bold text-slate-900 text-sm">
                Mandatory Labels ({structure.requiredLabels.length})
              </h4>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {structure.requiredLabels.map((label, idx) => (
                <span
                  key={idx}
                  className="text-xs px-2.5 py-1 bg-teal-50 text-teal-800 border border-teal-200 rounded-md font-medium"
                >
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* Common Mistakes */}
          <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/80">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <h4 className="font-bold text-amber-900 text-sm">
                Common Student Pitfalls to Avoid
              </h4>
            </div>
            <ul className="space-y-1.5 pl-5 list-disc text-amber-900/90 text-xs leading-relaxed">
              {structure.commonStudentMistakes.map((mistake, idx) => (
                <li key={idx}>{mistake}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            Got it, Back to Canvas
          </button>
        </div>
      </div>
    </div>
  );
};
