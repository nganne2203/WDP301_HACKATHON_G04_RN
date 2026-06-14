import { api, getPaginated } from '../../../core/api/client';
import type { ListWorkshopsQuery, Workshop } from '../../../core/api/types';

export const workshopsApi = {
  list: (query?: ListWorkshopsQuery) => getPaginated<Workshop[]>('/workshops', query as Record<string, string | number | undefined> | undefined),
  getById: (id: string) => api.get<Workshop>(`/workshops/${id}`),
};
