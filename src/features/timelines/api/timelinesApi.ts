import { api, getPaginated } from '../../../core/api/client';
import type { ListTimelinesQuery, TimelineActivity } from '../../../core/api/types';

export const timelinesApi = {
  list: (query?: ListTimelinesQuery) => getPaginated<TimelineActivity[]>('/timelines', query as Record<string, string | number | undefined> | undefined),
  getById: (id: string) => api.get<TimelineActivity>(`/timelines/${id}`),
};
