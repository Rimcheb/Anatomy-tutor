import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  AnatomyStructure,
  DrawingEvaluationResult,
  HintResponse,
} from '../types/tutor';
import { convertBoxToPixels } from '../utils/canvasHelpers';
import {
  Pen,
  Eraser,
  Undo2,
  Redo2,
  Trash2,
  Eye,
  EyeOff,
  Layers,
  Split,
  Lock
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
  // Reference comparison and overlay props
  isOverlayActive: boolean;
  onToggleOverlay: (active: boolean) => void;
  canCompareWithTextbook: boolean;
  onOpenCompare: () => void;
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
  isOverlayActive,
  onToggleOverlay,
  canCompareWithTextbook,
  onOpenCompare,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentTool, setCurrentTool] = useState<'pen' | 'eraser'>('pen');
  const [currentColor, setCurrentColor] = useState<string>('#1E293B'); // Black/Charcoal, Red, Blue
  const [currentWidth, setCurrentWidth] = useState<number>(3);
  const [showOverlays, setShowOverlays] = useState<boolean>(true);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 800, height: 600 });
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  // Palettes: Charcoal, Arterial Red, Venous Blue
  const COLORS = [
    { label: 'Charcoal', value: '#1E293B' },
    { label: 'Arterial (Red)', value: '#DC2626' },
    { label: 'Venous (Blue)', value: '#2563EB' },
  ];

  const STROKE_WIDTHS = [
    { label: 'Fine', value: 2 },
    { label: 'Normal', value: 3 },
    { label: 'Bold', value: 5 },
  ];

  const reference = structure.reference;
  const referenceUrl = reference?.image_file
    ? `/references/${reference.image_file}`
    : '/references/heart_anterior.jpg';

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

    const currentImg = ctx.getImageData(0, 0, canvas.width, canvas.height);
    redoHistoryRef.current.push(currentImg);

    const prev = strokesHistoryRef.current.pop();
    if (prev) {
      ctx.putImageData(prev, 0, 0);
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

    const currentImg = ctx.getImageData(0, 0, canvas.width, canvas.height);
    strokesHistoryRef.current.push(currentImg);

    const next = redoHistoryRef.current.pop();
    if (next) {
      ctx.putImageData(next, 0, 0);
    }
    setCanUndo(true);
    setCanRedo(redoHistoryRef.current.length > 0);
    onCanvasChange?.();
  }, [canvasRef, strokesHistoryRef, redoHistoryRef, onCanvasChange]);

  // Clear canvas
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

  // Keyboard shortcuts (Ctrl+Z / Ctrl+Y)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  // Initialize and resize canvas with HiDPI support
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      const width = Math.floor(rect.width);
      const height = Math.floor(rect.height);

      if (width <= 0 || height <= 0) return;

      const ctx = canvas.getContext('2d');
      let backup: ImageData | null = null;
      if (ctx && canvas.width > 0 && canvas.height > 0) {
        try {
          backup = ctx.getImageData(0, 0, canvas.width, canvas.height);
        } catch {
          // ignore
        }
      }

      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      setCanvasDimensions({ width, height });

      if (ctx) {
        ctx.scale(dpr, dpr);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);

        if (backup) {
          ctx.putImageData(backup, 0, 0);
        }
      }
    };

    updateSize();
    const observer = new ResizeObserver(() => updateSize());
    observer.observe(container);

    return () => observer.disconnect();
  }, [canvasRef]);

  // Canvas drawing handlers (mouse, stylus, touch)
  const getCoordinates = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    saveSnapshot();
    setIsDrawing(true);
    const coords = getCoordinates(e);
    lastPointRef.current = coords;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = currentTool === 'eraser' ? currentWidth * 5 : currentWidth;
    ctx.strokeStyle = currentTool === 'eraser' ? '#FFFFFF' : currentColor;

    ctx.moveTo(coords.x, coords.y);
    ctx.lineTo(coords.x + 0.1, coords.y + 0.1);
    ctx.stroke();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !lastPointRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCoordinates(e);

    ctx.beginPath();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = currentTool === 'eraser' ? currentWidth * 5 : currentWidth;
    ctx.strokeStyle = currentTool === 'eraser' ? '#FFFFFF' : currentColor;

    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();

    lastPointRef.current = coords;
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    setIsDrawing(false);
    lastPointRef.current = null;
    onCanvasChange?.();
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 p-3 sm:p-4 overflow-hidden">
      {/* Prompt Banner */}
      <div className="mb-3 px-4 py-3 bg-white border border-slate-200 rounded-lg shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0">
        <div>
          <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wider block">
            Drawing Assignment
          </span>
          <p className="text-xs sm:text-sm font-semibold text-slate-800 leading-snug">
            {structure.promptText}
          </p>
        </div>

        {/* Compare with Textbook action if unlocked */}
        <div className="flex items-center gap-2 shrink-0">
          {canCompareWithTextbook ? (
            <button
              onClick={onOpenCompare}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-md transition-colors shadow-xs cursor-pointer"
            >
              <Split className="w-3.5 h-3.5" />
              <span>Compare with Textbook</span>
            </button>
          ) : (
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium text-slate-400 bg-slate-100 rounded-md border border-slate-200 select-none"
              title="Unlock comparison by using 3 hints or submitting your first drawing"
            >
              <Lock className="w-3 h-3 text-slate-400" />
              <span>Compare (Locked)</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Drawing Card */}
      <div className="flex-1 flex flex-col bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        {/* Minimalist Drawing Toolbar */}
        <div className="px-3 py-2 border-b border-slate-200 bg-slate-50/80 flex flex-wrap items-center justify-between gap-2 shrink-0">
          {/* Tool selectors */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentTool('pen')}
              className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer ${
                currentTool === 'pen'
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-200/80'
              }`}
              title="Pen tool"
            >
              <Pen className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Pen</span>
            </button>

            <button
              onClick={() => setCurrentTool('eraser')}
              className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer ${
                currentTool === 'eraser'
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-200/80'
              }`}
              title="Eraser tool"
            >
              <Eraser className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Eraser</span>
            </button>
          </div>

          <div className="h-4 w-px bg-slate-200" />

          {/* Color Palettes (Charcoal, Red, Blue) */}
          <div className="flex items-center gap-1.5">
            {COLORS.map((col) => (
              <button
                key={col.value}
                onClick={() => {
                  setCurrentColor(col.value);
                  setCurrentTool('pen');
                }}
                className={`w-6 h-6 rounded-md flex items-center justify-center transition-transform cursor-pointer border ${
                  currentColor === col.value && currentTool === 'pen'
                    ? 'border-blue-900 ring-2 ring-blue-900/30 scale-105'
                    : 'border-slate-300 hover:scale-105'
                }`}
                style={{ backgroundColor: col.value }}
                title={col.label}
              />
            ))}
          </div>

          <div className="h-4 w-px bg-slate-200" />

          {/* Stroke Width Selector */}
          <div className="flex items-center gap-1">
            {STROKE_WIDTHS.map((sw) => (
              <button
                key={sw.value}
                onClick={() => setCurrentWidth(sw.value)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                  currentWidth === sw.value
                    ? 'bg-slate-200 text-slate-900 font-bold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
                title={`${sw.label} stroke width`}
              >
                {sw.label}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-slate-200" />

          {/* Reference Overlay (20% Opacity) Toggle */}
          <button
            onClick={() => onToggleOverlay(!isOverlayActive)}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border transition-colors cursor-pointer ${
              isOverlayActive
                ? 'bg-blue-900 text-white border-blue-900 shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
            title="Toggle 20% opacity reference overlay on canvas"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">20% Overlay</span>
          </button>

          {/* Toggle Error Boxes */}
          {evaluationResult && (
            <button
              onClick={() => setShowOverlays(!showOverlays)}
              className={`p-1.5 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
                showOverlays
                  ? 'bg-white text-blue-900 border-slate-300'
                  : 'bg-slate-100 text-slate-400 border-slate-200'
              }`}
              title={showOverlays ? 'Hide AI bounding boxes' : 'Show AI bounding boxes'}
            >
              {showOverlays ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            </button>
          )}

          <div className="h-4 w-px bg-slate-200" />

          {/* Undo / Redo */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={handleUndo}
              disabled={!canUndo}
              className="p-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleRedo}
              disabled={!canRedo}
              className="p-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
              title="Redo (Ctrl+Y)"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-4 w-px bg-slate-200" />

          {/* Clear canvas */}
          <button
            onClick={handleClear}
            className="p-1.5 rounded-md text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            title="Clear canvas"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Canvas Surface with Ghost Overlay & Bounding Boxes */}
        <div
          ref={containerRef}
          className="flex-1 w-full h-full bg-white relative overflow-hidden flex items-center justify-center cursor-crosshair touch-none select-none"
        >
          {/* Reference Image Ghost Overlay (20% Opacity) */}
          {isOverlayActive && (
            <img
              src={referenceUrl}
              alt="Reference overlay"
              className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none p-4 z-10 transition-opacity"
              style={{ opacity: 0.20 }}
            />
          )}

          <canvas
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="w-full h-full block bg-white z-0"
            style={{ touchAction: 'none' }}
          />

          {/* Bounding Box Marker Layer */}
          {showOverlays && (
            <div className="absolute inset-0 pointer-events-none z-20">
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
                    className="absolute border-2 border-emerald-600 bg-emerald-500/10 rounded pointer-events-auto transition-all duration-200 hover:bg-emerald-500/20"
                    style={{ top: `${top}px`, left: `${left}px`, width: `${width}px`, height: `${height}px` }}
                  >
                    <span className="absolute -top-5 left-0 px-1.5 py-0.5 rounded bg-emerald-700 text-white text-[10px] font-bold shadow-xs whitespace-nowrap">
                      ✓ {item.item || item.name}
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
                          ? 'border-2 border-rose-600 bg-rose-500/25 ring-3 ring-rose-400/40 z-30'
                          : 'border-2 border-rose-500 bg-rose-500/15 hover:bg-rose-500/25 z-20'
                        : isSelected
                        ? 'border-2 border-amber-600 bg-amber-500/25 ring-3 ring-amber-400/40 z-30'
                        : 'border-2 border-amber-500 bg-amber-500/15 hover:bg-amber-500/25 z-20'
                    }`}
                    style={{ top: `${top}px`, left: `${left}px`, width: `${width}px`, height: `${height}px` }}
                  >
                    {/* Badge number matching side panel */}
                    <div
                      className={`absolute -top-3 -left-3 w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold text-white shadow-xs border border-white ${
                        isMajor ? 'bg-rose-600' : 'bg-amber-600'
                      }`}
                    >
                      {err.id}
                    </div>

                    {/* Short label */}
                    <div
                      className={`absolute bottom-full left-0 mb-1 px-1.5 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap text-white ${
                        isMajor ? 'bg-rose-700' : 'bg-amber-700'
                      }`}
                    >
                      #{err.id} {err.what_is_wrong?.slice(0, 30) || err.label || 'Error'}
                    </div>
                  </div>
                );
              })}

              {/* Active Hint Focus Region (Dark blue pulsing box) */}
              {activeHint?.box_2d && (
                (() => {
                  const { top, left, width, height } = convertBoxToPixels(
                    activeHint.box_2d,
                    canvasDimensions.width,
                    canvasDimensions.height
                  );
                  return (
                    <div
                      className="absolute border-2 border-blue-600 bg-blue-600/15 rounded pointer-events-none animate-pulse z-30"
                      style={{ top: `${top}px`, left: `${left}px`, width: `${width}px`, height: `${height}px` }}
                    >
                      <span className="absolute -top-5 left-0 px-2 py-0.5 rounded bg-blue-900 text-white text-[10px] font-bold shadow-xs whitespace-nowrap">
                        Focus Region (Hint Level {activeHint.level})
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
