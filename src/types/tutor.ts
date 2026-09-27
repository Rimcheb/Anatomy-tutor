export type DifficultyLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export interface DrawingStep {
  stepNumber: number;
  title: string;
  instruction: string;
  landmarks: string;
  proportionsTip: string;
  keyParts: string[];
}

export interface AnatomyStructure {
  id: string;
  name: string;
  difficulty: DifficultyLevel;
  category: string;
  promptText: string;
  clinicalContext: string;
  requiredParts: string[];
  requiredLabels: string[];
  spatialRelationships: string[];
  commonStudentMistakes: string[];
  drawingPlan: DrawingStep[];
}

export type SeverityType = 'major' | 'minor' | 'correct';

export interface EvaluatedError {
  id: number;
  label: string;
  severity: 'major' | 'minor';
  explanation: string;
  fix: string;
  box_2d?: [number, number, number, number]; // [ymin, xmin, ymax, xmax] normalized 0-1000
}

export interface CorrectItem {
  id: string;
  name: string;
  description: string;
  box_2d?: [number, number, number, number];
}

export interface MissingStructure {
  name: string;
  importance: string;
  recommendation: string;
}

export interface LabelMistake {
  text: string;
  critique: string;
  correctLabel: string;
  box_2d?: [number, number, number, number];
}

export interface DrawingEvaluationResult {
  structureId: string;
  overallScore: number; // 0 - 100
  summary: string;
  strengths: string[];
  correctItems: CorrectItem[];
  errors: EvaluatedError[];
  missingStructures: MissingStructure[];
  labelMistakes: LabelMistake[];
  evaluatedAt: string;
}

export interface HintResponse {
  level: 1 | 2 | 3;
  type: 'socratic' | 'regional' | 'fix';
  title: string;
  message: string;
  focusRegion?: [number, number, number, number];
  targetedStructure?: string;
}

export interface AttemptRecord {
  id: string;
  structureId: string;
  timestamp: number;
  score: number;
  errorsCount: number;
  canvasDataUrl: string;
}
