import apiClient from './apiClient';
import type { ProposedEntry } from './confirmJournalEntryApiService';

export interface ProposedExerciseSolution {
  message: string;
  proposedEntries: ProposedEntry[];
}

export const solveExercise = async (exercise: string): Promise<ProposedExerciseSolution> => {
  const response = await apiClient.post('/exercise-solver', { exercise });
  return response.data;
};
