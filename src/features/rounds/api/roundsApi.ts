import { api, getPaginated } from '../../../core/api/client';
import type { ListRoundsQuery, Round } from '../../../core/api/types';

export const roundsApi = {
  list: (query?: ListRoundsQuery) =>
    getPaginated<Round[]>('/rounds', query as Record<string, string | number | undefined> | undefined),

  getById: (id: string) => api.get<Round>(`/rounds/${id}`),
};
