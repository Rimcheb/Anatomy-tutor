import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  AnatomyStructure,
  DrawingEvaluationResult,
  HintResponse,
  AttemptRecord,
  ToolType,
} from './types/tutor';
import { ANATOMY_STRUCTURES, getDefaultStructure } from './data/anatomyData';
import { Header } from './components/Header';
import { DrawingToolbar } from './components/DrawingToolbar';
import { DrawingCanvas } from './components/DrawingCanvas';
import { SidePanel } from './components/SidePanel';
import { StructurePickerModal } from './components/StructurePickerModal';
import { RubricModal } from './components/RubricModal';
import { CompareModal } from './components/CompareModal';
import { ImageCreditsModal } from './components/ImageCreditsModal';
import {
  drawSampleHeartWithMistakes,
  drawSampleUnlabeledHeart,
  drawSampleCat,
} from './utils/canvasHelpers';

export default function App() {
  const [currentStructure, setCurrentStructure] = useState<AnatomyStructure>(getDefaultStructure());
  const [isStructurePickerOpen, setIsStructurePickerOpen] = useState(false);
  const [isRubricOpen, setIsRubricOpen] = useState(false);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [isImageCreditsOpen, setIsImageCreditsOpen] = useState(false);
  const [isOverlayActive, setIsOverlayActive] = useState(false);

  // Drawing Tools state
  const [currentTool, setCurrentTool] = useState<ToolType>('pen');
  const [currentColor, setCurrentColor] = useState<string>('#1E293B');
  const [currentWidth, setCurrentWidth] = useState<number>(3.5);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Canvas drawing state refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const strokesHistoryRef = useRef<ImageData[]>([]);
  const redoHistoryRef = useRef<ImageData[]>([]);

  // AI Evaluation & Hint state
  const [evaluationResult, setEvaluationResult] = useState<DrawingEvaluationResult | null>(null);
  const [activeHint, setActiveHint] = useState<HintResponse | null>(null);
  const [selectedErrorId, setSelectedErrorId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [hintLevelsUsed, setHintLevelsUsed] = useState<Set<number>>(new Set());
  const [stepCoachFeedback, setStepCoachFeedback] = useState<{ stepNumber: number; complete: boolean; feedback: string } | null>(null);
  const [currentCanvasDataUrl, setCurrentCanvasDataUrl] = useState<string | null>(null);

  // Live Coaching state
  const [isCoachWatching, setIsCoachWatching] = useState(false);
  const [liveNudgeMessage, setLiveNudgeMessage] = useState<string | null>(null);
  const [liveNudgeBox, setLiveNudgeBox] = useState<[number, number, number, number] | null>(null);
  const [isUrgentInterventionOpen, setIsUrgentInterventionOpen] = useState(false);
  const [urgentIdentifiedAs, setUrgentIdentifiedAs] = useState<string | undefined>(undefined);
  const consecutiveOffTrackRef = useRef<number>(0);
  const liveInspectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const activeDemoTypeRef = useRef<string | null>(null);

  // Tease mode toggle (ON by default)
  const [teaseMode, setTeaseMode] = useState(true);

  // Attempts tracking & score progress
  const [attempts, setAttempts] = useState<AttemptRecord[]>(() => {
    try {
      const stored = localStorage.getItem('anatomy_tutor_attempts');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [previousScore, setPreviousScore] = useState<number | null>(null);
  const [latestScore, setLatestScore] = useState<number | null>(null);

  // Sync attempts to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('anatomy_tutor_attempts', JSON.stringify(attempts));
    } catch (e) {
      console.error('Failed to save attempts to localStorage', e);
    }
  }, [attempts]);

  // Update previous score when current structure changes
  useEffect(() => {
    const structAttempts = attempts.filter((a) => a.structureId === currentStructure.id);
    if (structAttempts.length > 0) {
      const last = structAttempts[structAttempts.length - 1];
      setLatestScore(last.score);
      if (structAttempts.length > 1) {
        setPreviousScore(structAttempts[structAttempts.length - 2].score);
      } else {
        setPreviousScore(null);
      }
    } else {
      setLatestScore(null);
      setPreviousScore(null);
    }
    // Reset transient evaluation when switching structure
    setEvaluationResult(null);
    setActiveHint(null);
    setSelectedErrorId(null);
    setLiveNudgeMessage(null);
    setLiveNudgeBox(null);
    setIsUrgentInterventionOpen(false);
    consecutiveOffTrackRef.current = 0;
    activeDemoTypeRef.current = null;
  }, [currentStructure.id]);

  // Handle switching structure
  const handleSelectStructure = (structure: AnatomyStructure) => {
    setCurrentStructure(structure);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        strokesHistoryRef.current = [];
        redoHistoryRef.current = [];
        setCanUndo(false);
        setCanRedo(false);
      }
    }
  };

  const syncCanvasSnapshot = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      try {
        setCurrentCanvasDataUrl(canvas.toDataURL('image/png'));
        setCanUndo(strokesHistoryRef.current.length > 0);
        setCanRedo(redoHistoryRef.current.length > 0);
      } catch {}
    }
  }, []);

  // Periodic Live Inspection (Coach watching as student draws)
  const triggerLiveInspection = useCallback(async (overrideDemoType?: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const demoType = overrideDemoType || activeDemoTypeRef.current;
    setIsCoachWatching(true);

    try {
      const imageBase64 = canvas.toDataURL('image/png');
      const response = await fetch('/api/tutor/live-inspect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64,
          structureId: currentStructure.id,
          demoType,
        }),
      });

      if (response.ok) {
        const data = await response.json();

        if (data.status === 'urgent_intervention') {
          consecutiveOffTrackRef.current += 1;
          // Trigger urgent intervention if confident or after 2 consecutive checks
          if (consecutiveOffTrackRef.current >= 1 || data.confidence > 0.85) {
            setIsUrgentInterventionOpen(true);
            setUrgentIdentifiedAs(data.identified_as || 'unrelated drawing');
          }
        } else if (data.status === 'nudge') {
          consecutiveOffTrackRef.current = 0;
          setLiveNudgeMessage(data.message);
          setLiveNudgeBox(data.box_2d || null);
        } else {
          // on_track
          consecutiveOffTrackRef.current = 0;
          setLiveNudgeMessage(null);
          setLiveNudgeBox(null);
        }
      }
    } catch (err) {
      console.warn('Live inspect error:', err);
    } finally {
      setTimeout(() => setIsCoachWatching(false), 800);
    }
  }, [currentStructure.id]);

  // Debounced listener on canvas strokes to trigger live coaching
  const handleCanvasChange = useCallback(() => {
    syncCanvasSnapshot();

    // Reset timer on active strokes
    if (liveInspectTimerRef.current) {
      clearTimeout(liveInspectTimerRef.current);
    }

    // Inspect 3 seconds after student pauses drawing
    liveInspectTimerRef.current = setTimeout(() => {
      triggerLiveInspection();
    }, 3000);
  }, [syncCanvasSnapshot, triggerLiveInspection]);

  // Undo / Redo / Clear handlers
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
    syncCanvasSnapshot();
  }, [syncCanvasSnapshot]);

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
    syncCanvasSnapshot();
  }, [syncCanvasSnapshot]);

  const handleClear = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    try {
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
      strokesHistoryRef.current.push(data);
    } catch {}

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setIsUrgentInterventionOpen(false);
    setLiveNudgeMessage(null);
    setLiveNudgeBox(null);
    consecutiveOffTrackRef.current = 0;
    activeDemoTypeRef.current = null;
    syncCanvasSnapshot();
  }, [syncCanvasSnapshot]);

  // Keyboard shortcuts (Cmd/Ctrl + Z, Cmd/Ctrl + Y)
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

  // Load Demo Sketches (Reliable demonstration of flows)
  const handleLoadDemo = useCallback((type: 'heart-mistakes' | 'heart-unlabeled' | 'cat') => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    try {
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
      strokesHistoryRef.current.push(data);
    } catch {}

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    activeDemoTypeRef.current = type;
    setEvaluationResult(null);
    setActiveHint(null);
    setSelectedErrorId(null);
    setIsUrgentInterventionOpen(false);

    if (type === 'heart-mistakes') {
      drawSampleHeartWithMistakes(ctx, canvas.width, canvas.height);
      syncCanvasSnapshot();
      setTimeout(() => triggerLiveInspection('heart-mistakes'), 600);
    } else if (type === 'heart-unlabeled') {
      drawSampleUnlabeledHeart(ctx, canvas.width, canvas.height);
      syncCanvasSnapshot();
      setTimeout(() => triggerLiveInspection('heart-unlabeled'), 600);
    } else if (type === 'cat') {
      drawSampleCat(ctx, canvas.width, canvas.height);
      syncCanvasSnapshot();
      // Instantly triggers urgent intervention alert
      setTimeout(() => triggerLiveInspection('cat'), 500);
    }
  }, [syncCanvasSnapshot, triggerLiveInspection]);

  // Check if comparison with textbook is unlocked
  const canCompareWithTextbook = attempts.length > 0 || hintLevelsUsed.size >= 3;

  // Call Gemini to Check / Grade My Drawing
  const handleCheckDrawing = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsLoading(true);
    setLoadingMessage('Your tutor is grading your diagram against the rubric…');
    setActiveHint(null);

    try {
      const imageBase64 = canvas.toDataURL('image/png');
      setCurrentCanvasDataUrl(imageBase64);

      const response = await fetch('/api/tutor/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64,
          structureId: currentStructure.id,
          demoType: activeDemoTypeRef.current,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Server returned ${response.status}`);
      }

      const data: DrawingEvaluationResult = await response.json();

      setPreviousScore(latestScore);
      setLatestScore(data.overallScore);
      setEvaluationResult(data);

      const newAttempt: AttemptRecord = {
        id: `att_${Date.now()}`,
        structureId: currentStructure.id,
        timestamp: Date.now(),
        score: data.overallScore,
        errorsCount: data.errors?.length || 0,
        canvasDataUrl: imageBase64,
      };

      setAttempts((prev) => [...prev, newAttempt]);
    } catch (err: any) {
      console.error('Check drawing error:', err);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  // Call Gemini for Hint Ladder
  const handleRequestHint = async (level: 1 | 2 | 3) => {
    const canvas = canvasRef.current;
    const imageBase64 = canvas ? canvas.toDataURL('image/png') : undefined;
    if (canvas) setCurrentCanvasDataUrl(canvas.toDataURL('image/png'));

    setIsLoading(true);
    setLoadingMessage(`Consulting anatomical tutor for Level ${level} guidance…`);

    try {
      const response = await fetch('/api/tutor/hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64,
          structureId: currentStructure.id,
          hintLevel: level,
        }),
      });

      if (!response.ok) {
        throw new Error(`Hint request failed: ${response.statusText}`);
      }

      const data: HintResponse = await response.json();
      setActiveHint(data);

      setHintLevelsUsed((prev) => {
        const next = new Set(prev);
        next.add(level);
        return next;
      });
    } catch (err: any) {
      console.error('Hint error:', err);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  // Live Coach step check in Guide Me
  const handleCheckStep = async (stepNumber: number, stepInstruction: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsLoading(true);
    setLoadingMessage(`Evaluating Step ${stepNumber} on canvas…`);

    try {
      const imageBase64 = canvas.toDataURL('image/png');
      const response = await fetch('/api/tutor/step-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stepNumber,
          stepInstruction,
          imageBase64,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setStepCoachFeedback({
          stepNumber,
          complete: data.step_complete,
          feedback: data.feedback,
        });
      }
    } catch (err) {
      console.error('Step coach error:', err);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  // Try again button action
  const handleTryAgain = (clearCanvas: boolean) => {
    if (clearCanvas) {
      handleClear();
    }
    setEvaluationResult(null);
    setActiveHint(null);
    setSelectedErrorId(null);
    setLiveNudgeMessage(null);
    setLiveNudgeBox(null);
    setIsUrgentInterventionOpen(false);
    activeDemoTypeRef.current = null;
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-white text-slate-900 font-sans">
      {/* Top Header */}
      <Header
        currentStructure={currentStructure}
        onOpenStructurePicker={() => setIsStructurePickerOpen(true)}
        onOpenRubric={() => setIsRubricOpen(true)}
        onOpenImageCredits={() => setIsImageCreditsOpen(true)}
        onOpenCompare={() => {
          syncCanvasSnapshot();
          setIsCompareModalOpen(true);
        }}
        canCompareWithTextbook={canCompareWithTextbook}
        onLoadDemo={handleLoadDemo}
        attempts={attempts}
        latestScore={latestScore}
        previousScore={previousScore}
        teaseMode={teaseMode}
        onToggleTeaseMode={() => setTeaseMode(!teaseMode)}
      />

      {/* Main Workspace: Slim Left Toolbar + Central Canvas + Right Side Panel */}
      <div className="flex-1 flex flex-row overflow-hidden relative">
        {/* 1. Slim Left Drawing Toolbar */}
        <DrawingToolbar
          currentTool={currentTool}
          onSelectTool={setCurrentTool}
          currentColor={currentColor}
          onSelectColor={setCurrentColor}
          currentWidth={currentWidth}
          onSelectWidth={setCurrentWidth}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onClear={handleClear}
          isOverlayActive={isOverlayActive}
          onToggleOverlay={() => setIsOverlayActive(!isOverlayActive)}
        />

        {/* 2. Large Central Drawing Canvas */}
        <DrawingCanvas
          structure={currentStructure}
          evaluationResult={evaluationResult}
          activeHint={activeHint}
          liveNudgeBox={liveNudgeBox}
          selectedErrorId={selectedErrorId}
          onSelectError={setSelectedErrorId}
          onCanvasChange={handleCanvasChange}
          canvasRef={canvasRef}
          strokesHistoryRef={strokesHistoryRef}
          redoHistoryRef={redoHistoryRef}
          isOverlayActive={isOverlayActive}
          currentTool={currentTool}
          currentColor={currentColor}
          currentWidth={currentWidth}
          isUrgentInterventionOpen={isUrgentInterventionOpen}
          urgentIdentifiedAs={urgentIdentifiedAs}
          onClearAndRestart={handleClear}
          onShowHowToStart={() => {
            setIsUrgentInterventionOpen(false);
          }}
          onDismissUrgentIntervention={() => {
            setIsUrgentInterventionOpen(false);
          }}
          isCoachWatching={isCoachWatching}
        />

        {/* 3. Right Side Coach / Hints / Results Panel */}
        <SidePanel
          structure={currentStructure}
          evaluationResult={evaluationResult}
          activeHint={activeHint}
          liveNudgeMessage={liveNudgeMessage}
          onClearNudge={() => {
            setLiveNudgeMessage(null);
            setLiveNudgeBox(null);
          }}
          selectedErrorId={selectedErrorId}
          onSelectError={setSelectedErrorId}
          onCheckDrawing={handleCheckDrawing}
          onRequestHint={handleRequestHint}
          onTryAgain={handleTryAgain}
          isLoading={isLoading}
          loadingMessage={loadingMessage}
          attempts={attempts}
          previousScore={previousScore}
          onCheckStep={handleCheckStep}
          stepCoachFeedback={stepCoachFeedback}
          canCompareWithTextbook={canCompareWithTextbook}
          onOpenCompare={() => {
            syncCanvasSnapshot();
            setIsCompareModalOpen(true);
          }}
          hintLevelsUsedCount={hintLevelsUsed.size}
          teaseMode={teaseMode}
          isCoachWatching={isCoachWatching}
        />
      </div>

      {/* Structure Switcher Modal */}
      <StructurePickerModal
        isOpen={isStructurePickerOpen}
        onClose={() => setIsStructurePickerOpen(false)}
        currentStructureId={currentStructure.id}
        onSelectStructure={handleSelectStructure}
        attempts={attempts}
      />

      {/* Rubric Modal */}
      <RubricModal
        isOpen={isRubricOpen}
        onClose={() => setIsRubricOpen(false)}
        structure={currentStructure}
      />

      {/* Textbook Comparison Modal */}
      <CompareModal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        structure={currentStructure}
        studentCanvasDataUrl={currentCanvasDataUrl}
        isOverlayActive={isOverlayActive}
        onToggleOverlay={setIsOverlayActive}
      />

      {/* Open-Source References & Image Credits Modal */}
      <ImageCreditsModal
        isOpen={isImageCreditsOpen}
        onClose={() => setIsImageCreditsOpen(false)}
      />
    </div>
  );
}
