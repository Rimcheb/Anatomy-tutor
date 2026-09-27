import React, { useState } from 'react';
import { X, Layers, Split, ExternalLink } from 'lucide-react';
import { AnatomyStructure } from '../types/tutor';

interface CompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  structure: AnatomyStructure;
  studentCanvasDataUrl: string | null;
  isOverlayActive: boolean;
  onToggleOverlay: (active: boolean) => void;
}

export const CompareModal: React.FC<CompareModalProps> = ({
  isOpen,
  onClose,
  structure,
  studentCanvasDataUrl,
  isOverlayActive,
  onToggleOverlay,
}) => {
  const [viewMode, setViewMode] = useState<'side-by-side' | 'fused'>('side-by-side');
  const [fusedOpacity, setFusedOpacity] = useState<number>(40);

  if (!isOpen) return null;

  const reference = structure.reference;
  const referenceUrl = reference?.image_file
    ? `/references/${reference.image_file}`
    : '/references/heart_anterior.jpg';

  const attributionText = reference
    ? `${reference.figure_number}, ${reference.source_title}, ${reference.author}, ${reference.license}`
    : 'Figure 19.8, Anatomy and Physiology 2e, OpenStax, CC BY 4.0';

  const sourceUrl = reference?.source_url || 'https://openstax.org/books/anatomy-and-physiology-2e/pages/19-1-heart-anatomy';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[88vh] flex flex-col border border-slate-200 overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="compare-modal-title"
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-900 text-white rounded-lg">
              <Split className="w-4 h-4" />
            </div>
            <div>
              <h2 id="compare-modal-title" className="text-sm font-bold text-slate-900">
                Textbook Reference Comparison
              </h2>
              <p className="text-xs text-slate-500">
                {structure.name} • OpenStax Ground Truth
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-200/80 p-0.5 rounded text-xs font-medium">
              <button
                onClick={() => setViewMode('side-by-side')}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  viewMode === 'side-by-side'
                    ? 'bg-white text-blue-900 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Side by Side
              </button>
              <button
                onClick={() => setViewMode('fused')}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  viewMode === 'fused'
                    ? 'bg-white text-blue-900 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Superimposed
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-200 transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Controls Bar */}
        <div className="px-5 py-2.5 bg-slate-50/80 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Canvas Live Ghost:</span>
            <button
              onClick={() => onToggleOverlay(!isOverlayActive)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded font-medium border transition-colors cursor-pointer ${
                isOverlayActive
                  ? 'bg-blue-900 text-white border-blue-900'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{isOverlayActive ? '20% Overlay on Canvas: ON' : 'Turn On 20% Overlay on Canvas'}</span>
            </button>
          </div>

          {viewMode === 'fused' && (
            <div className="flex items-center gap-2">
              <span className="text-slate-600 font-medium">Ghost Opacity:</span>
              <input
                type="range"
                min="10"
                max="80"
                value={fusedOpacity}
                onChange={(e) => setFusedOpacity(Number(e.target.value))}
                className="w-28 accent-blue-900 cursor-pointer"
              />
              <span className="font-mono text-slate-700 text-xs w-7">{fusedOpacity}%</span>
            </div>
          )}
        </div>

        {/* Visual Panels */}
        <div className="flex-1 overflow-y-auto p-5 bg-slate-100/70">
          {viewMode === 'side-by-side' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
              {/* Student Drawing Panel */}
              <div className="flex flex-col bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs">
                <div className="px-3.5 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800">Your Drawing</span>
                  <span className="text-[11px] text-slate-500">Student memory recall</span>
                </div>
                <div className="relative flex-1 min-h-[300px] max-h-[420px] flex items-center justify-center p-3 bg-white">
                  {studentCanvasDataUrl ? (
                    <img
                      src={studentCanvasDataUrl}
                      alt="Student hand drawing"
                      className="max-h-[400px] w-auto max-w-full object-contain"
                    />
                  ) : (
                    <div className="text-center text-slate-400 p-6 text-xs">
                      No active drawing strokes yet.
                    </div>
                  )}
                </div>
                <div className="px-3.5 py-1.5 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500">
                  Orientation: patient's left is on the viewer's right.
                </div>
              </div>

              {/* Textbook Reference Panel */}
              <div className="flex flex-col bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs">
                <div className="px-3.5 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800">Textbook Reference Standard</span>
                  <span className="text-[11px] font-medium text-blue-900 bg-blue-50 px-1.5 py-0.2 rounded">
                    OpenStax CC BY 4.0
                  </span>
                </div>
                <div className="relative flex-1 min-h-[300px] max-h-[420px] flex items-center justify-center p-3 bg-white overflow-hidden">
                  <img
                    src={referenceUrl}
                    alt={structure.name}
                    className="max-h-[400px] w-auto max-w-full object-contain"
                  />
                </div>
                {/* Attribution under reference */}
                <div className="px-3.5 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
                  <span className="font-medium truncate mr-2" title={attributionText}>
                    {attributionText}
                  </span>
                  <a
                    href={sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-900 hover:text-blue-800 flex items-center gap-1 font-semibold shrink-0"
                  >
                    <span>openstax.org</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          ) : (
            /* Superimposed View */
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs max-w-xl mx-auto flex flex-col">
              <div className="px-3.5 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800">
                  Superimposed Trace (Drawing + Reference)
                </span>
                <span className="text-slate-500 text-[11px]">
                  Opacity: {fusedOpacity}%
                </span>
              </div>
              <div className="relative w-full h-[400px] bg-white flex items-center justify-center p-3 overflow-hidden">
                {studentCanvasDataUrl && (
                  <img
                    src={studentCanvasDataUrl}
                    alt="Student hand drawing"
                    className="absolute inset-0 w-full h-full object-contain p-3 z-10 pointer-events-none"
                  />
                )}
                <img
                  src={referenceUrl}
                  alt={structure.name}
                  style={{ opacity: fusedOpacity / 100 }}
                  className="absolute inset-0 w-full h-full object-contain p-3 z-20 pointer-events-none"
                />
              </div>
              <div className="px-3.5 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
                <span className="font-medium truncate mr-2">
                  {attributionText}
                </span>
                <a
                  href={sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-900 hover:text-blue-800 flex items-center gap-1 font-semibold shrink-0"
                >
                  <span>openstax.org</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-white border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Source: <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="text-blue-900 hover:underline">openstax.org/books/anatomy-and-physiology-2e/pages/19-1-heart-anatomy</a>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
