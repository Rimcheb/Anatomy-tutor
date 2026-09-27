import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  AnatomyStructure,
  DrawingEvaluationResult,
  EvaluatedError,
  CorrectItem,
  HintResponse,
} from '../types/tutor';
import { convertBoxToPixels, drawSampleAnatomySketch } from '../utils/canvasHelpers';
import {
  Pen,
  Eraser,
  Undo2,
  Redo2,
  Trash2,
  Eye,
  EyeOff,
  Maximize2,
  Download,
  AlertCircle,
  HelpCircle,
  Sparkles,
} from 'lucide-react';

interface DrawingCanvasProps {
  structure: AnatomyStructure;
  evaluationResult: DrawingEvaluationResult | null;
  activeHint: HintResponse | null;
  selectedErrorId: number | null;
  onSelectError: (id: number | null) => void;
  onCanvasChange?: () => void;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  strokesHistoryRef: React.MutableRefObject<ImageData[]>;
  redoHistoryRef: React.MutableRefObject<ImageData[]>;
}

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  structure,
  evaluationResult,
  activeHint,
  selectedErrorId,
  onSelectError,
  onCanvasChange,
  canvasRef,
  strokesHistoryRef,
  redoHistoryRef,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentTool, setCurrentTool] = useState<'pen' | 'eraser'>('pen');
  const [currentColor, setCurrentColor] = useState<string>('#1E293B'); // Black/Charcoal, Red, Blue
  const [currentWidth, setCurrentWidth] = useState<number>(3.5);
  const [showOverlays, setShowOverlays] = useState<boolean>(true);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 800, height: 600 });
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  // Palettes: Charcoal, Arterial Red, Venous Blue
  const COLORS = [
    { label: 'Charcoal (Structures)', value: '#1E293B', ring: 'ring-slate-800' },
    { label: 'Arterial / Oxygenated (Red)', value: '#DC2626', ring: 'ring-red-600' },
    { label: 'Venous / Deoxygenated (Blue)', value: '#2563EB', ring: 'ring-blue-600' },
  ];

  const STROKE_WIDTHS = [
    { label: 'Fine', value: 2 },
    { label: 'Normal', value: 3.5 },
    { label: 'Bold', value: 6 },
  ];

  // Save current canvas snapshot to undo stack
  const saveSnapshot = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    try {
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
      strokesHistoryRef.current.push(data);
      if (strokesHistoryRef.current.length > 25) {
        strokesHistoryRef.current.shift();
      }
      redoHistoryRef.current = [];
      setCanUndo(true);
      setCanRedo(false);
      onCanvasChange?.();
    } catch (e) {
      console.error('Error saving snapshot:', e);
    }
  }, [canvasRef, strokesHistoryRef, redoHistoryRef, onCanvasChange]);

  // Undo
  const handleUndo = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || strokesHistoryRef.current.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Save current to redo stack
    const current = ctx.getImageData(0, 0, canvas.width, canvas.height);
    redoHistoryRef.current.push(current);

    // Pop previous
    const previous = strokesHistoryRef.current.pop();
    if (previous) {
      ctx.putImageData(previous, 0, 0);
    } else {
      // Clear to white
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    setCanUndo(strokesHistoryRef.current.length > 0);
    setCanRedo(true);
    onCanvasChange?.();
  }, [canvasRef, strokesHistoryRef, redoHistoryRef, onCanvasChange]);

  // Redo
  const handleRedo = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || redoHistoryRef.current.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const current = ctx.getImageData(0, 0, canvas.width, canvas.height);
    strokesHistoryRef.current.push(current);

    const next = redoHistoryRef.current.pop();
    if (next) {
      ctx.putImageData(next, 0, 0);
    }

    setCanUndo(true);
    setCanRedo(redoHistoryRef.current.length > 0);
    onCanvasChange?.();
  }, [canvasRef, strokesHistoryRef, redoHistoryRef, onCanvasChange]);

  // Clear Canvas
  const handleClear = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    saveSnapshot();
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    onCanvasChange?.();
  }, [canvasRef, saveSnapshot, onCanvasChange]);

  // Resize canvas according to container
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      const newWidth = Math.floor(rect.width);
      const newHeight = Math.floor(rect.height);

      if (newWidth <= 0 || newHeight <= 0) return;

      // Preserve existing image if resizing
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext('2d');
      if (tempCtx && canvas.width > 0 && canvas.height > 0) {
        tempCtx.drawImage(canvas, 0, 0);
      }

      canvas.width = newWidth;
      canvas.height = newHeight;
      setCanvasDimensions({ width: newWidth, height: newHeight });

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, newWidth, newHeight);
        if (tempCanvas.width > 0 && tempCanvas.height > 0) {
          ctx.drawImage(tempCanvas, 0, 0, newWidth, newHeight);
        }
      }
    };

    updateSize();
    const observer = new ResizeObserver(() => updateSize());
    observer.observe(container);
    return () => observer.disconnect();
  }, [canvasRef]);

  // Pointer event coordinate extractor
  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  // Drawing event handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);

    saveSnapshot();
    setIsDrawing(true);
    const coords = getCanvasCoords(e);
    lastPointRef.current = coords;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (currentTool === 'eraser') {
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = currentWidth * 4;
    } else {
      ctx.strokeStyle = currentColor;
      ctx.lineWidth = currentWidth;
    }

    ctx.beginPath();
    ctx.arc(coords.x, coords.y, ctx.lineWidth / 2, 0, 2 * Math.PI);
    ctx.fillStyle = ctx.strokeStyle;
    ctx.fill();
    ctx.restore();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCanvasCoords(e);
    const last = lastPointRef.current || coords;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (currentTool === 'eraser') {
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = currentWidth * 4;
    } else {
      ctx.strokeStyle = currentColor;
      ctx.lineWidth = currentWidth;
    }

    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
    ctx.restore();

    lastPointRef.current = coords;
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (canvas && e.pointerId) {
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch (err) {
        // ignore if already released
      }
    }
    setIsDrawing(false);
    lastPointRef.current = null;
    onCanvasChange?.();
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-100 overflow-hidden relative select-none">
      {/* Prompt Banner above canvas */}
      <div className="bg-white border-b border-slate-200 px-4 py-2.5 flex items-center justify-between shrink-0 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-teal-50 text-teal-700 border border-teal-200 shrink-0">
            <Sparkles className="w-4 h-4 text-teal-600" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-900 leading-snug">
              {structure.promptText}
            </p>
            <p className="text-[11px] text-slate-500">
              Sketch the anatomical relationships accurately. Label structures directly on the sketch.
            </p>
          </div>
        </div>

        {/* Overlays toggle if evaluation exists */}
        {(evaluationResult || activeHint) && (
          <button
            onClick={() => setShowOverlays(!showOverlays)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
              showOverlays
                ? 'bg-teal-50 text-teal-700 border-teal-300'
                : 'bg-slate-50 text-slate-600 border-slate-200'
            }`}
            title="Toggle tutor bounding boxes on canvas"
          >
            {showOverlays ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">
              {showOverlays ? 'Hide Tutor Markers' : 'Show Tutor Markers'}
            </span>
          </button>
        )}
      </div>

      {/* Canvas Workspace & Toolbar */}
      <div className="flex-1 flex flex-col p-3 md:p-4 overflow-hidden relative">
        {/* Floating Top Floating Tools Bar */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-2xl shadow-lg border border-slate-200/80 flex items-center gap-2 md:gap-3">
          {/* Tool mode: Pen vs Eraser */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
            <button
              onClick={() => setCurrentTool('pen')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                currentTool === 'pen'
                  ? 'bg-white text-teal-700 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Pen tool"
            >
              <Pen className="w-3.5 h-3.5" />
              <span>Pen</span>
            </button>
            <button
              onClick={() => setCurrentTool('eraser')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                currentTool === 'eraser'
                  ? 'bg-white text-teal-700 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Eraser tool"
            >
              <Eraser className="w-3.5 h-3.5" />
              <span>Eraser</span>
            </button>
          </div>

          <div className="h-4 w-px bg-slate-200" />

          {/* 3 Anatomical Colors */}
          <div className="flex items-center gap-1.5">
            {COLORS.map((c) => (
              <button
                key={c.value}
                onClick={() => {
                  setCurrentColor(c.value);
                  if (currentTool === 'eraser') setCurrentTool('pen');
                }}
                className={`w-5 h-5 rounded-full transition-transform border border-white shadow-xs ${
                  currentColor === c.value && currentTool === 'pen'
                    ? `scale-125 ring-2 ring-offset-1 ${c.ring}`
                    : 'hover:scale-110 opacity-80 hover:opacity-100'
                }`}
                style={{ backgroundColor: c.value }}
                title={c.label}
              />
            ))}
          </div>

          <div className="h-4 w-px bg-slate-200" />

          {/* Stroke Width Selector */}
          <div className="flex items-center gap-1">
            {STROKE_WIDTHS.map((w) => (
              <button
                key={w.value}
                onClick={() => setCurrentWidth(w.value)}
                className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold transition-all ${
                  currentWidth === w.value
                    ? 'bg-teal-50 text-teal-700 border border-teal-200'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
                title={`${w.label} stroke width`}
              >
                <div
                  className="rounded-full bg-current"
                  style={{ width: `${w.value * 1.5}px`, height: `${w.value * 1.5}px` }}
                />
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-slate-200" />

          {/* Undo / Redo */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={handleUndo}
              disabled={!canUndo}
              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              title="Undo"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleRedo}
              disabled={!canRedo}
              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              title="Redo"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-4 w-px bg-slate-200" />

          {/* Clear canvas */}
          <button
            onClick={handleClear}
            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
            title="Clear canvas"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Canvas Surface with Relative Overlays */}
        <div
          ref={containerRef}
          className="flex-1 w-full h-full bg-white rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden flex items-center justify-center cursor-crosshair touch-none"
        >
          <canvas
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="w-full h-full block bg-white"
            style={{ touchAction: 'none' }}
          />

          {/* Bounding Box Marker Layer */}
          {showOverlays && (
            <div className="absolute inset-0 pointer-events-none">
              {/* Correct structures (Green boxes) */}
              {evaluationResult?.correctItems?.map((item, idx) => {
                if (!item.box_2d) return null;
                const { top, left, width, height } = convertBoxToPixels(
                  item.box_2d,
                  canvasDimensions.width,
                  canvasDimensions.height
                );
                return (
                  <div
                    key={`correct-${item.id || idx}`}
                    className="absolute border-2 border-emerald-500 bg-emerald-500/10 rounded pointer-events-auto transition-all duration-200 hover:bg-emerald-500/20 group"
                    style={{ top: `${top}px`, left: `${left}px`, width: `${width}px`, height: `${height}px` }}
                  >
                    <span className="absolute -top-5 left-0 px-1.5 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-bold shadow-xs whitespace-nowrap">
                      ✓ {item.name}
                    </span>
                  </div>
                );
              })}

              {/* Errors (Red for major, Orange for minor) */}
              {evaluationResult?.errors?.map((err) => {
                if (!err.box_2d) return null;
                const { top, left, width, height } = convertBoxToPixels(
                  err.box_2d,
                  canvasDimensions.width,
                  canvasDimensions.height
                );
                const isSelected = selectedErrorId === err.id;
                const isMajor = err.severity === 'major';

                return (
                  <div
                    key={`err-${err.id}`}
                    onClick={() => onSelectError(err.id)}
                    className={`absolute rounded pointer-events-auto cursor-pointer transition-all duration-200 ${
                      isMajor
                        ? isSelected
                          ? 'border-3 border-rose-600 bg-rose-500/25 ring-4 ring-rose-400/40 z-20'
                          : 'border-2 border-rose-500 bg-rose-500/12 hover:bg-rose-500/20 z-10'
                        : isSelected
                        ? 'border-3 border-amber-500 bg-amber-500/25 ring-4 ring-amber-400/40 z-20'
                        : 'border-2 border-amber-500 bg-amber-500/12 hover:bg-amber-500/20 z-10'
                    }`}
                    style={{ top: `${top}px`, left: `${left}px`, width: `${width}px`, height: `${height}px` }}
                    title={`#${err.id}: ${err.label} (${err.severity})`}
                  >
                    {/* Badge number matching side panel */}
                    <div
                      className={`absolute -top-3.5 -left-3.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold text-white shadow-md border-2 border-white ${
                        isMajor ? 'bg-rose-600' : 'bg-amber-500'
                      }`}
                    >
                      {err.id}
                    </div>

                    {/* Popover label on hover/select */}
                    <div
                      className={`absolute bottom-full left-0 mb-1 px-2 py-0.5 rounded text-[11px] font-semibold whitespace-nowrap shadow-sm text-white ${
                        isMajor ? 'bg-rose-700' : 'bg-amber-700'
                      }`}
                    >
                      {err.label}
                    </div>
                  </div>
                );
              })}

              {/* Active Hint Focus Region (Teal pulsing box) */}
              {activeHint?.focusRegion && (
                (() => {
                  const { top, left, width, height } = convertBoxToPixels(
                    activeHint.focusRegion,
                    canvasDimensions.width,
                    canvasDimensions.height
                  );
                  return (
                    <div
                      className="absolute border-2 border-teal-500 bg-teal-500/15 rounded pointer-events-none animate-pulse z-30"
                      style={{ top: `${top}px`, left: `${left}px`, width: `${width}px`, height: `${height}px` }}
                    >
                      <span className="absolute -top-5 left-0 px-2 py-0.5 rounded bg-teal-600 text-white text-[10px] font-bold shadow-xs whitespace-nowrap">
                        🎯 Focus Here (Level {activeHint.level})
                      </span>
                    </div>
                  );
                })()
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
