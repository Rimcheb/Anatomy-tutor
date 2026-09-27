import React from 'react';
import { X, ExternalLink, BookOpen, Award, CheckCircle2 } from 'lucide-react';
import { ReferenceItem } from '../types/tutor';
import { REFERENCES_LIST } from '../data/anatomyData';

interface ImageCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ImageCreditsModal: React.FC<ImageCreditsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-xl shadow-xl max-w-xl w-full max-h-[85vh] flex flex-col border border-slate-200 overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="credits-title"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-900 text-white rounded-lg">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 id="credits-title" className="text-sm font-bold text-slate-900">
                Anatomical References &amp; Image Credits
              </h2>
              <p className="text-xs text-slate-500">
                Peer-reviewed educational figures (CC BY 4.0 &amp; Public Domain)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-200 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs text-slate-600 leading-relaxed">
            <span className="font-semibold text-slate-800">Ground-Truth Reference Protocol:</span>{' '}
            All anatomical figures used by Anatomy Tutor are sourced from open-licensed peer-reviewed textbooks, specifically OpenStax Anatomy &amp; Physiology 2e under Creative Commons Attribution 4.0 International (CC BY 4.0).
          </div>

          <div className="divide-y divide-slate-100">
            {REFERENCES_LIST.map((ref: ReferenceItem, idx: number) => (
              <div key={idx} className="py-3 first:pt-1 last:pb-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-bold text-slate-900">{ref.structure}</h3>
                      <span className="px-1.5 py-0.2 text-[10px] font-semibold bg-blue-50 text-blue-900 border border-blue-200 rounded">
                        {ref.license}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      <span className="font-medium text-slate-800">{ref.figure_number}</span>, {ref.source_title} ({ref.author})
                    </p>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5 truncate max-w-sm">
                      {ref.source_url}
                    </p>
                  </div>

                  <a
                    href={ref.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-blue-900 bg-white hover:bg-blue-50 border border-slate-200 rounded transition-colors shrink-0"
                  >
                    <span>View</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>

          {/* Primary Source Citation */}
          <div className="p-3 bg-blue-50/60 border border-blue-200/80 rounded text-xs text-slate-700 space-y-1">
            <span className="font-bold text-blue-900 block">Active Structure Ground-Truth:</span>
            <p>
              Heart – anterior view: <strong>Figure 19.8 (External Anatomy of the Heart)</strong>, Anatomy and Physiology 2e, OpenStax.
            </p>
            <a
              href="https://openstax.org/books/anatomy-and-physiology-2e/pages/19-1-heart-anatomy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-900 font-semibold underline text-[11px] block mt-1"
            >
              openstax.org/books/anatomy-and-physiology-2e/pages/19-1-heart-anatomy
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
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
