import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  AnatomyStructure,
  DrawingEvaluationResult,
  HintResponse,
  ToolType,
  Point,
} from '../types/tutor';
import { convertBoxToPixels, drawShape } from '../utils/canvasHelpers';
import { Eye, EyeOff, Sparkles, AlertCircle } from 'lucide-react';
import { UrgentInterventionBanner } from './UrgentInterventionBanner';

interface DrawingCanvasProps {
  structure: AnatomyStructure;
  evaluationResult: DrawingEvaluationResult | null;
  activeHint: HintResponse | null;
  liveNudgeBox: [number, number, number, number] | null;
  selectedErrorId: number | null;
  onSelectError: (id: number | null) => void;
  onCanvasChange?: () => void;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  strokesHistoryRef: React.MutableRefObject<ImageData[]>;
  redoHistoryRef: React.MutableRefObject<ImageData[]>;
  isOverlayActive: boolean;
  // Current active tool states
  currentTool: ToolType;
  currentColor: string;
  currentWidth: number;
  // Urgent Intervention
  isUrgentInterventionOpen: boolean;
  urgentIdentifiedAs?: string;
  onClearAndRestart: () => void;
  onShowHowToStart: () => void;
  onDismissUrgentIntervention: () => void;
  // Coach is watching indicator
  isCoachWatching: boolean;
}

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  structure,
  evaluationResult,
  activeHint,
  liveNudgeBox,
  selectedErrorId,
  onSelectError,
  onCanvasChange,
  canvasRef,
  strokesHistoryRef,
  redoHistoryRef,
  isOverlayActive,
  currentTool,
  currentColor,
  currentWidth,
  isUrgentInterventionOpen,
  urgentIdentifiedAs,
  onClearAndRestart,
  onShowHowToStart,
  onDismissUrgentIntervention,
  isCoachWatching,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [showOverlays, setShowOverlays] = useState<boolean>(true);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 800, height: 600 });
  const startPointRef = useRef<Point | null>(null);
  const lastPointRef = useRef<Point | null>(null);

  // Inline text input state
  const [textInputPos, setTextInputPos] = useState<Point | null>(null);
  const [textInputValue, setTextInputValue] = useState('');
  const textInputRef = useRef<HTMLInputElement>(null);

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
      if (strokesHistoryRef.current.length > 30) {
        strokesHistoryRef.current.shift();
      }
      redoHistoryRef.current = [];
      onCanvasChange?.();
    } catch (e) {
      console.error('Error saving snapshot:', e);
    }
  }, [canvasRef, strokesHistoryRef, redoHistoryRef, onCanvasChange]);

  // Initialize and resize canvas with HiDPI support
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    const previewCanvas = previewCanvasRef.current;
    if (!container || !canvas || !previewCanvas) return;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      const width = Math.floor(rect.width);
      const height = Math.floor(rect.height);

      if (width <= 0 || height <= 0) return;

      const dpr = window.devicePixelRatio || 1;
      const ctx = canvas.getContext('2d');
      let backup: ImageData | null = null;
      if (ctx && canvas.width > 0 && canvas.height > 0) {
        try {
          backup = ctx.getImageData(0, 0, canvas.width, canvas.height);
        } catch {}
      }

      // Main drawing canvas
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      // Drag preview overlay canvas
      previewCanvas.width = width * dpr;
      previewCanvas.height = height * dpr;
      previewCanvas.style.width = `${width}px`;
      previewCanvas.style.height = `${height}px`;

      setCanvasDimensions({ width, height });

      if (ctx) {
        ctx.scale(dpr, dpr);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);

        if (backup) {
          ctx.putImageData(backup, 0, 0);
        }
      }

      const pCtx = previewCanvas.getContext('2d');
      if (pCtx) {
        pCtx.scale(dpr, dpr);
      }
    };

    updateSize();
    const observer = new ResizeObserver(() => updateSize());
    observer.observe(container);

    return () => observer.disconnect();
  }, [canvasRef]);

  // Pointer coordinate calculation relative to canvas surface
  const getCoordinates = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      pressure: e.pressure,
    };
  };

  // Commit text to canvas
  const handleCommitText = () => {
    if (!textInputPos || !textInputValue.trim()) {
      setTextInputPos(null);
      setTextInputValue('');
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    saveSnapshot();
    ctx.save();
    ctx.fillStyle = currentColor;
    ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
    ctx.fillText(textInputValue.trim(), textInputPos.x, textInputPos.y);
    ctx.restore();

    setTextInputPos(null);
    setTextInputValue('');
    onCanvasChange?.();
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    // If text input is open, commit on click
    if (textInputPos) {
      handleCommitText();
    }

    const coords = getCoordinates(e);

    // If Text tool is selected, place text input cursor
    if (currentTool === 'text') {
      setTextInputPos(coords);
      setTimeout(() => textInputRef.current?.focus(), 50);
      return;
    }

    e.currentTarget.setPointerCapture(e.pointerId);
    saveSnapshot();
    setIsDrawing(true);
    startPointRef.current = coords;
    lastPointRef.current = coords;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (currentTool === 'pen' || currentTool === 'eraser') {
      ctx.beginPath();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = currentTool === 'eraser' ? currentWidth * 5 : currentWidth;
      ctx.strokeStyle = currentTool === 'eraser' ? '#FFFFFF' : currentColor;

      ctx.moveTo(coords.x, coords.y);
      ctx.lineTo(coords.x + 0.1, coords.y + 0.1);
      ctx.stroke();
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPointRef.current) return;
    const currentPoint = getCoordinates(e);

    const canvas = canvasRef.current;
    const previewCanvas = previewCanvasRef.current;
    if (!canvas || !previewCanvas) return;

    const ctx = canvas.getContext('2d');
    const pCtx = previewCanvas.getContext('2d');
    if (!ctx || !pCtx) return;

    if (currentTool === 'pen' || currentTool === 'eraser') {
      // Freehand drawing directly commits continuous strokes
      ctx.beginPath();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = currentTool === 'eraser' ? currentWidth * 5 : currentWidth;
      ctx.strokeStyle = currentTool === 'eraser' ? '#FFFFFF' : currentColor;

      if (lastPointRef.current) {
        ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
      }
      ctx.lineTo(currentPoint.x, currentPoint.y);
      ctx.stroke();

      lastPointRef.current = currentPoint;
    } else {
      // Shape dragging live preview: clear preview canvas and draw tentative shape
      pCtx.clearRect(0, 0, canvasDimensions.width, canvasDimensions.height);
      drawShape(
        pCtx,
        currentTool as 'line' | 'arrow' | 'rectangle' | 'circle' | 'curve',
        startPointRef.current,
        currentPoint,
        currentColor,
        currentWidth
      );
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}

    const endPoint = getCoordinates(e);
    const canvas = canvasRef.current;
    const previewCanvas = previewCanvasRef.current;

    if (canvas && previewCanvas && startPointRef.current) {
      const ctx = canvas.getContext('2d');
      const pCtx = previewCanvas.getContext('2d');

      // Clear the live preview overlay
      if (pCtx) {
        pCtx.clearRect(0, 0, canvasDimensions.width, canvasDimensions.height);
      }

      // Commit final shape to main canvas
      if (
        ctx &&
        (currentTool === 'line' ||
          currentTool === 'arrow' ||
          currentTool === 'rectangle' ||
          currentTool === 'circle' ||
          currentTool === 'curve')
      ) {
        drawShape(
          ctx,
          currentTool,
          startPointRef.current,
          endPoint,
          currentColor,
          currentWidth
        );
      }
    }

    setIsDrawing(false);
    startPointRef.current = null;
    lastPointRef.current = null;
    onCanvasChange?.();
  };

  return (
    <div
      ref={containerRef}
      className="flex-1 w-full h-full bg-slate-100/70 relative overflow-hidden flex items-center justify-center cursor-crosshair touch-none select-none"
    >
      {/* Urgent Intervention Red Alert Overlay */}
      <UrgentInterventionBanner
        isOpen={isUrgentInterventionOpen}
        structureName={structure.name}
        identifiedAs={urgentIdentifiedAs}
        onClearAndRestart={onClearAndRestart}
        onShowHowToStart={onShowHowToStart}
        onDismiss={onDismissUrgentIntervention}
      />

      {/* Floating "Coach is watching…" Indicator */}
      <div
        className={`absolute top-3 left-4 z-30 transition-all duration-300 pointer-events-none flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold shadow-xs ${
          isCoachWatching
            ? 'bg-teal-700 text-white opacity-100 scale-100'
            : 'bg-white/80 text-slate-500 opacity-60 scale-95 border border-slate-200'
        }`}
      >
        <span className={`w-2 h-2 rounded-full ${isCoachWatching ? 'bg-teal-300 animate-ping' : 'bg-slate-400'}`} />
        <span>{isCoachWatching ? 'Coach is watching…' : 'Live Tutor Ready'}</span>
      </div>

      {/* Floating Toggle for Bounding Box Overlay */}
      {evaluationResult && (
        <button
          onClick={() => setShowOverlays(!showOverlays)}
          className="absolute top-3 right-4 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/95 text-slate-700 border border-slate-200 shadow-xs hover:bg-slate-50 transition-colors cursor-pointer"
        >
          {showOverlays ? <Eye className="w-3.5 h-3.5 text-teal-600" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
          <span>{showOverlays ? 'Hide AI boxes' : 'Show AI boxes'}</span>
        </button>
      )}

      {/* 20% Opacity Reference Overlay */}
      {isOverlayActive && (
        <img
          src={referenceUrl}
          alt="Reference overlay standard"
          className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none p-6 z-10 transition-opacity"
          style={{ opacity: 0.20 }}
        />
      )}

      {/* Main Persistent Drawing Canvas */}
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="w-full h-full block bg-white z-0"
        style={{ touchAction: 'none' }}
      />

      {/* Dragging Preview Shape Overlay Canvas */}
      <canvas
        ref={previewCanvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-10 block"
      />

      {/* Inline Text Input for Anatomy Label Tool */}
      {textInputPos && (
        <div
          className="absolute z-40 bg-white shadow-xl rounded-lg p-1.5 border border-teal-500 flex items-center gap-1.5"
          style={{ top: `${textInputPos.y - 15}px`, left: `${textInputPos.x}px` }}
        >
          <input
            ref={textInputRef}
            type="text"
            value={textInputValue}
            onChange={(e) => setTextInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCommitText();
              if (e.key === 'Escape') setTextInputPos(null);
            }}
            placeholder="Type label (e.g. Left Ventricle)..."
            className="px-2 py-1 text-xs border border-slate-200 rounded font-semibold text-slate-800 outline-none focus:ring-1 focus:ring-teal-600 w-48"
          />
          <button
            onClick={handleCommitText}
            className="px-2.5 py-1 bg-teal-600 text-white rounded text-xs font-bold hover:bg-teal-700 cursor-pointer"
          >
            Add
          </button>
        </div>
      )}

      {/* Bounding Box Annotations Layer */}
      {showOverlays && (
        <div className="absolute inset-0 pointer-events-none z-20">
          {/* Live Nudge Box (Gentle amber pulsing marker during drawing) */}
          {liveNudgeBox && (
            (() => {
              const { top, left, width, height } = convertBoxToPixels(
                liveNudgeBox,
                canvasDimensions.width,
                canvasDimensions.height
              );
              return (
                <div
                  className="absolute border-2 border-dashed border-amber-500 bg-amber-500/10 rounded pointer-events-none animate-pulse"
                  style={{ top: `${top}px`, left: `${left}px`, width: `${width}px`, height: `${height}px` }}
                >
                  <span className="absolute -top-5 left-0 px-2 py-0.5 rounded bg-amber-600 text-white text-[10px] font-bold shadow-xs whitespace-nowrap">
                    💡 Check Proportions
                  </span>
                </div>
              );
            })()
          )}

          {/* Correct structures (Emerald boxes) */}
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
                className="absolute border-2 border-emerald-500 bg-emerald-500/10 rounded pointer-events-auto transition-all duration-200 hover:bg-emerald-500/20"
                style={{ top: `${top}px`, left: `${left}px`, width: `${width}px`, height: `${height}px` }}
              >
                <span className="absolute -top-5 left-0 px-1.5 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-bold shadow-xs whitespace-nowrap">
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
                      ? 'border-2 border-rose-600 bg-rose-500/25 ring-4 ring-rose-400/40 z-30'
                      : 'border-2 border-rose-500 bg-rose-500/15 hover:bg-rose-500/25 z-20'
                    : isSelected
                    ? 'border-2 border-amber-600 bg-amber-500/25 ring-4 ring-amber-400/40 z-30'
                    : 'border-2 border-amber-500 bg-amber-500/15 hover:bg-amber-500/25 z-20'
                }`}
                style={{ top: `${top}px`, left: `${left}px`, width: `${width}px`, height: `${height}px` }}
              >
                <div
                  className={`absolute -top-3 -left-3 w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold text-white shadow-xs border border-white ${
                    isMajor ? 'bg-rose-600' : 'bg-amber-600'
                  }`}
                >
                  {err.id}
                </div>

                <div
                  className={`absolute bottom-full left-0 mb-1 px-1.5 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap text-white ${
                    isMajor ? 'bg-rose-700' : 'bg-amber-700'
                  }`}
                >
                  #{err.id} {err.what_is_wrong?.slice(0, 32) || err.label || 'Correction'}
                </div>
              </div>
            );
          })}

          {/* Active Hint Focus Region */}
          {activeHint?.box_2d && (
            (() => {
              const { top, left, width, height } = convertBoxToPixels(
                activeHint.box_2d,
                canvasDimensions.width,
                canvasDimensions.height
              );
              return (
                <div
                  className="absolute border-2 border-teal-500 bg-teal-500/15 rounded pointer-events-none animate-pulse z-30"
                  style={{ top: `${top}px`, left: `${left}px`, width: `${width}px`, height: `${height}px` }}
                >
                  <span className="absolute -top-5 left-0 px-2 py-0.5 rounded bg-teal-700 text-white text-[10px] font-bold shadow-xs whitespace-nowrap">
                    Focus Region (Level {activeHint.level})
                  </span>
                </div>
              );
            })()
          )}
        </div>
      )}
    </div>
  );
};
