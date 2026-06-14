import { api, getPaginated } from '../../../core/api/client';
import type { Event, ListEventsQuery } from '../../../core/api/types';

export const eventsApi = {
  list: (query?: ListEventsQuery) => getPaginated<Event[]>('/events', query as Record<string, string | number | undefined> | undefined),
  getById: (id: string) => api.get<Event>(`/events/${id}`),
};
