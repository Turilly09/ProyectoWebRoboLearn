
import { PracticeData } from '../types/practices';
import { p1 } from './practices/p1';

export const PRACTICE_REGISTRY: Record<string, PracticeData> = {
  p1,
};

export const getPracticeById = (id: string): PracticeData | undefined => {
  return PRACTICE_REGISTRY[id];
};
