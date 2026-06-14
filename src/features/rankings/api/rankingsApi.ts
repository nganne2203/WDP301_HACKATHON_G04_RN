import { api, getPaginated } from '../../../core/api/client';
import type { GenerateRankingsRequest, GenerateRankingsResult, ListRankingsQuery, Ranking } from '../../../core/api/types';

export const rankingsApi = {
  list: (query?: ListRankingsQuery) =>
    getPaginated<Ranking[]>('/rankings', query as Record<string, string | number | undefined> | undefined),

  generate: (data: GenerateRankingsRequest) =>
    api.post<GenerateRankingsResult>('/rankings/generate', data),
};
