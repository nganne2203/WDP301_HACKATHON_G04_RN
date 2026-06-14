import { api, getPaginated } from '../../../core/api/client';
import type { ListRankingsQuery, Ranking, SelectFinalistsRequest, SelectFinalistsResult } from '../../../core/api/types';

export const finalistsApi = {
  list: (query?: ListRankingsQuery) =>
    getPaginated<Ranking[]>('/finalists', query as Record<string, string | number | undefined> | undefined),

  select: (data: SelectFinalistsRequest) =>
    api.post<SelectFinalistsResult>('/finalists/select', data),
};
