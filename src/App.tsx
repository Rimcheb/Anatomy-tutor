import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  AnatomyStructure,
  DrawingEvaluationResult,
  HintResponse,
  AttemptRecord,
} from './types/tutor';
import { ANATOMY_STRUCTURES, getDefaultStructure } from './data/anatomyData';
import { Header } from './components/Header';
import { DrawingCanvas } from './components/DrawingCanvas';
import { SidePanel } from './components/SidePanel';
import { StructurePickerModal } from './components/StructurePickerModal';
import { RubricModal } from './components/RubricModal';
import { CompareModal } from './components/CompareModal';
import { ImageCreditsModal } from './components/ImageCreditsModal';
import { drawSampleAnatomySketch } from './utils/canvasHelpers';

export default function App() {
  const [currentStructure, setCurrentStructure] = useState<AnatomyStructure>(getDefaultStructure());
  const [isStructurePickerOpen, setIsStructurePickerOpen] = useState(false);
  const [isRubricOpen, setIsRubricOpen] = useState(false);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [isImageCreditsOpen, setIsImageCreditsOpen] = useState(false);
  const [isOverlayActive, setIsOverlayActive] = useState(false);

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
    setHintLevelsUsed(new Set());
    setStepCoachFeedback(null);
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
      }
    }
  };

  const syncCanvasSnapshot = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      try {
        setCurrentCanvasDataUrl(canvas.toDataURL('image/png'));
      } catch {
        // ignore
      }
    }
  }, []);

  // Load a sample hand sketch for testing or demo purposes
  const handleLoadDemoSketch = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    try {
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
      strokesHistoryRef.current.push(data);
    } catch (e) {}

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawSampleAnatomySketch(ctx, canvas.width, canvas.height, currentStructure.id);
    syncCanvasSnapshot();
  }, [currentStructure.id, syncCanvasSnapshot]);

  // Check if comparison with textbook is unlocked (after using 3 hint levels or submitting 1 drawing)
  const canCompareWithTextbook = attempts.length > 0 || hintLevelsUsed.size >= 3;

  // Call Gemini to Check My Drawing
  const handleCheckDrawing = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsLoading(true);
    setLoadingMessage('Your tutor is looking at your drawing…');
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
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Server returned ${response.status}`);
      }

      const data: DrawingEvaluationResult = await response.json();

      // Update scores & progress
      setPreviousScore(latestScore);
      setLatestScore(data.overallScore);
      setEvaluationResult(data);

      // Record attempt
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

  // Live Coach step check
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

  // "Try again" button action
  const handleTryAgain = (clearCanvas: boolean) => {
    if (clearCanvas) {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          strokesHistoryRef.current = [];
          redoHistoryRef.current = [];
        }
      }
    }
    setEvaluationResult(null);
    setActiveHint(null);
    setSelectedErrorId(null);
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-white text-slate-900 font-sans">
      {/* Top Header */}
      <Header
        currentStructure={currentStructure}
        onOpenStructurePicker={() => setIsStructurePickerOpen(true)}
        onOpenRubric={() => setIsRubricOpen(true)}
        onOpenImageCredits={() => setIsImageCreditsOpen(true)}
        onLoadDemoSketch={handleLoadDemoSketch}
        attempts={attempts}
        latestScore={latestScore}
        previousScore={previousScore}
      />

      {/* Main Workspace (Canvas + Side Panel) */}
      <div className="flex-1 flex flex-row overflow-hidden relative">
        {/* Drawing Screen with Canvas, 20% Overlay, and Bounding Box Overlays */}
        <DrawingCanvas
          structure={currentStructure}
          evaluationResult={evaluationResult}
          activeHint={activeHint}
          selectedErrorId={selectedErrorId}
          onSelectError={setSelectedErrorId}
          onCanvasChange={syncCanvasSnapshot}
          canvasRef={canvasRef}
          strokesHistoryRef={strokesHistoryRef}
          redoHistoryRef={redoHistoryRef}
          isOverlayActive={isOverlayActive}
          onToggleOverlay={setIsOverlayActive}
          canCompareWithTextbook={canCompareWithTextbook}
          onOpenCompare={() => {
            syncCanvasSnapshot();
            setIsCompareModalOpen(true);
          }}
        />

        {/* Side Panel (Guide Me, Hint Ladder, Correction & Scoring) */}
        <SidePanel
          structure={currentStructure}
          evaluationResult={evaluationResult}
          activeHint={activeHint}
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
