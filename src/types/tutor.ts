export type DifficultyLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export interface ReferenceItem {
  structure: string;
  image_file: string;
  source_title: string;
  figure_number: string;
  author: string;
  license: string;
  source_url: string;
}

export interface GuidanceStep {
  n: number;
  instruction: string;
  landmark: string;
  memory_cue: string;
  done: boolean;
}

export interface LiveCoachResponse {
  step_complete: boolean;
  feedback: string;
  box_2d?: [number, number, number, number] | null;
}

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
  comingSoon?: boolean;
  requiredParts: string[];
  requiredLabels: string[];
  spatialRelationships: string[];
  commonStudentMistakes: string[];
  drawingPlan: DrawingStep[];
  reference?: ReferenceItem;
}

export type SeverityType = 'major' | 'minor' | 'correct';

export interface EvaluatedError {
  id: number;
  label?: string;
  type?: 'incorrect' | 'missing' | 'mislabeled' | 'proportion' | 'orientation';
  severity: 'major' | 'minor';
  what_is_wrong?: string;
  why_it_matters?: string;
  how_to_fix?: string;
  explanation: string;
  fix: string;
  box_2d?: [number, number, number, number]; // [ymin, xmin, ymax, xmax] normalized 0-1000
}

export interface CorrectItem {
  id?: string;
  name?: string;
  item?: string;
  description?: string;
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
  score?: number;
  summary: string;
  strengths?: string[];
  correctItems: CorrectItem[];
  errors: EvaluatedError[];
  missingStructures: MissingStructure[];
  labelMistakes: LabelMistake[];
  next_focus?: string;
  evaluatedAt: string;
  notice?: string;
  usingFallback?: boolean;
}

export interface HintResponse {
  level: 1 | 2 | 3;
  type: 'socratic' | 'regional' | 'fix';
  title: string;
  message: string;
  hint?: string;
  concept?: string;
  focusRegion?: [number, number, number, number] | null;
  box_2d?: [number, number, number, number] | null;
  targetedStructure?: string;
  notice?: string;
  usingFallback?: boolean;
}

export interface AttemptRecord {
  id: string;
  structureId: string;
  timestamp: number;
  score: number;
  errorsCount: number;
  canvasDataUrl: string;
}
