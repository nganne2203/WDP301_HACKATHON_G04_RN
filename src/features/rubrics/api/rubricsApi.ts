import { api, getPaginated } from '../../../core/api/client';
import type { ListRubricsQuery, Rubric } from '../../../core/api/types';

export const rubricsApi = {
  list: (query?: ListRubricsQuery) =>
    getPaginated<Rubric[]>('/rubrics', query as Record<string, string | number | undefined> | undefined),

  getById: (id: string) => api.get<Rubric>(`/rubrics/${id}`),
};
