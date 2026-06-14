import { api, getPaginated } from '../../../core/api/client';
import type { ListWorkshopsQuery, Workshop, WorkshopQuestion } from '../../../core/api/types';

interface ListWorkshopQuestionsQuery {
  page?: number;
  limit?: number;
}

export const workshopsApi = {
  list: (query?: ListWorkshopsQuery) => getPaginated<Workshop[]>('/workshops', query as Record<string, string | number | undefined> | undefined),
  getById: (id: string) => api.get<Workshop>(`/workshops/${id}`),
  listQuestions: (id: string, query?: ListWorkshopQuestionsQuery) =>
    getPaginated<WorkshopQuestion[]>(`/workshops/${id}/questions`, query as Record<string, string | number | undefined> | undefined),
  createQuestion: (id: string, data: { content: string }) => api.post<WorkshopQuestion>(`/workshops/${id}/questions`, data),
  voteQuestion: (questionId: string) => api.post<WorkshopQuestion>(`/workshops/questions/${questionId}/vote`),
};
