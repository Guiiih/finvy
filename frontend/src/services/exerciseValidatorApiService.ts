import apiClient from './apiClient';

export const exerciseValidatorApiService = {
  async validateSolution(exercise: string, userSolution: string): Promise<string> {
    const response = await apiClient.post('/exercise-validator', { exercise, userSolution });
    return response.data.validationResult;
  },
};
