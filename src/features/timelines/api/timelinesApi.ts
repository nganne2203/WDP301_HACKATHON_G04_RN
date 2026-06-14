import { api, getPaginated } from '../../../core/api/client';
import type { ListTimelinesQuery, TimelineEvent } from '../../../core/api/types';

export const timelinesApi = {
  list: (query?: ListTimelinesQuery) => getPaginated<TimelineEvent[]>('/timelines', query as Record<string, string | number | undefined> | undefined),
  getById: (id: string) => api.get<TimelineEvent>(`/timelines/${id}`),
};
