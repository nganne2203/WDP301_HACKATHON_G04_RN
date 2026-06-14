import { api, getPaginated } from '../../../core/api/client';
import type { JudgingBoard, ListJudgingBoardsQuery } from '../../../core/api/types';

export const judgingBoardsApi = {
  list: (query?: ListJudgingBoardsQuery) =>
    getPaginated<JudgingBoard[]>('/judging-boards', query as Record<string, string | number | undefined> | undefined),

  getById: (id: string) => api.get<JudgingBoard>(`/judging-boards/${id}`),
};
