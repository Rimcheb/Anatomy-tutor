import React from 'react';
import {
  Pen,
  Eraser,
  Minus,
  ArrowUpRight,
  Square,
  Circle,
  Spline,
  Type,
  Undo2,
  Redo2,
  Trash2,
  Layers,
} from 'lucide-react';
import { ToolType } from '../types/tutor';

interface DrawingToolbarProps {
  currentTool: ToolType;
  onSelectTool: (tool: ToolType) => void;
  currentColor: string;
  onSelectColor: (color: string) => void;
  currentWidth: number;
  onSelectWidth: (width: number) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  isOverlayActive: boolean;
  onToggleOverlay: () => void;
}

export const DrawingToolbar: React.FC<DrawingToolbarProps> = ({
  currentTool,
  onSelectTool,
  currentColor,
  onSelectColor,
  currentWidth,
  onSelectWidth,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onClear,
  isOverlayActive,
  onToggleOverlay,
}) => {
  // Anatomy palette: Charcoal/Outline, Arterial Red, Venous Blue, Sulcus/Lipid Amber, Nerve/Conduction Violet
  const PALETTE = [
    { label: 'Charcoal (Contour)', value: '#1E293B', ring: 'ring-slate-800' },
    { label: 'Oxygenated / Arterial', value: '#DC2626', ring: 'ring-rose-600' },
    { label: 'Deoxygenated / Venous', value: '#2563EB', ring: 'ring-blue-600' },
    { label: 'Sulcus / Lipid', value: '#D97706', ring: 'ring-amber-500' },
    { label: 'Conduction / Nerve', value: '#7C3AED', ring: 'ring-purple-600' },
  ];

  const STROKE_WIDTHS = [
    { label: 'Fine', value: 2 },
    { label: 'Medium', value: 3.5 },
    { label: 'Bold', value: 6 },
  ];

  const TOOLS: { id: ToolType; label: string; icon: React.ReactNode }[] = [
    { id: 'pen', label: 'Pen (Freehand)', icon: <Pen className="w-4 h-4" /> },
    { id: 'line', label: 'Straight Line / Ruler', icon: <Minus className="w-4 h-4" /> },
    { id: 'arrow', label: 'Leader Line / Arrow', icon: <ArrowUpRight className="w-4 h-4" /> },
    { id: 'curve', label: 'Curved Line', icon: <Spline className="w-4 h-4" /> },
    { id: 'rectangle', label: 'Rectangle', icon: <Square className="w-4 h-4" /> },
    { id: 'circle', label: 'Circle / Ellipse', icon: <Circle className="w-4 h-4" /> },
    { id: 'text', label: 'Anatomy Label (Text)', icon: <Type className="w-4 h-4" /> },
    { id: 'eraser', label: 'Eraser', icon: <Eraser className="w-4 h-4" /> },
  ];

  return (
    <aside
      className="w-14 sm:w-16 bg-white border-r border-slate-200/80 flex flex-col items-center py-3 px-1.5 shrink-0 select-none z-10 shadow-xs"
      aria-label="Drawing Tools"
    >
      {/* Primary Tools List */}
      <div className="flex flex-col items-center gap-1 w-full pb-3 border-b border-slate-200">
        {TOOLS.map((tool) => {
          const isActive = currentTool === tool.id;
          return (
            <button
              key={tool.id}
              onClick={() => onSelectTool(tool.id)}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer relative group ${
                isActive
                  ? 'bg-teal-600 text-white shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
              title={tool.label}
              aria-label={tool.label}
            >
              {tool.icon}
              {/* Tooltip */}
              <span className="pointer-events-none absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-[11px] font-medium rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-md">
                {tool.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Anatomy Color Swatches */}
      <div className="flex flex-col items-center gap-1.5 py-3 border-b border-slate-200 w-full">
        {PALETTE.map((c) => (
          <button
            key={c.value}
            onClick={() => onSelectColor(c.value)}
            className={`w-6 h-6 rounded-full transition-transform cursor-pointer relative group border border-white shadow-2xs ${
              currentColor === c.value
                ? 'ring-2 ring-teal-600 scale-110 z-10'
                : 'hover:scale-110'
            }`}
            style={{ backgroundColor: c.value }}
            title={c.label}
            aria-label={c.label}
          >
            <span className="pointer-events-none absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-[11px] font-medium rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-md">
              {c.label}
            </span>
          </button>
        ))}
      </div>

      {/* Stroke Widths */}
      <div className="flex flex-col items-center gap-1 py-3 border-b border-slate-200 w-full">
        {STROKE_WIDTHS.map((sw) => (
          <button
            key={sw.value}
            onClick={() => onSelectWidth(sw.value)}
            className={`w-8 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold transition-colors cursor-pointer ${
              currentWidth === sw.value
                ? 'bg-teal-50 text-teal-800 border border-teal-200'
                : 'text-slate-500 hover:bg-slate-100'
            }`}
            title={`${sw.label} width (${sw.value}px)`}
          >
            <span
              className="rounded-full bg-current block"
              style={{ width: sw.value * 1.5, height: sw.value * 1.5 }}
            />
          </button>
        ))}
      </div>

      {/* 20% Reference Overlay Toggle */}
      <div className="py-2.5 w-full flex justify-center border-b border-slate-200">
        <button
          onClick={onToggleOverlay}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer relative group ${
            isOverlayActive
              ? 'bg-teal-100 text-teal-800 border border-teal-300'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title="Toggle 20% Opacity Reference Overlay"
          aria-label="Toggle reference overlay"
        >
          <Layers className="w-4 h-4" />
          <span className="pointer-events-none absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-[11px] font-medium rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-md">
            {isOverlayActive ? '20% Overlay: Active' : '20% Overlay on Canvas'}
          </span>
        </button>
      </div>

      {/* Undo / Redo & Clear */}
      <div className="mt-auto flex flex-col items-center gap-1 pt-2 w-full">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
          title="Redo (Ctrl+Y)"
        >
          <Redo2 className="w-4 h-4" />
        </button>
        <button
          onClick={onClear}
          className="w-9 h-9 rounded-lg flex items-center justify-center text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer mt-1"
          title="Clear Entire Canvas"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
