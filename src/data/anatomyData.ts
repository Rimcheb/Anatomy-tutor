import rawRubrics from './anatomyRubrics.json';
import { AnatomyStructure } from '../types/tutor';

export const ANATOMY_STRUCTURES: AnatomyStructure[] = rawRubrics.structures as AnatomyStructure[];

export function getStructureById(id: string): AnatomyStructure | undefined {
  return ANATOMY_STRUCTURES.find((s) => s.id === id);
}

export function getDefaultStructure(): AnatomyStructure {
  return ANATOMY_STRUCTURES[0];
}
