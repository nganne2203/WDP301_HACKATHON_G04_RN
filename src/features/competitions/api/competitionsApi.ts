import { api, getPaginated } from '../../../core/api/client';
import type { Competition, ListCompetitionsQuery } from '../../../core/api/types';

export const competitionsApi = {
  list: (query?: ListCompetitionsQuery) => getPaginated<Competition[]>('/competitions', query as Record<string, string | number | undefined> | undefined),
  getById: (id: string) => api.get<Competition>(`/competitions/${id}`),
};
