import { api, getPaginated } from '../../../core/api/client';
import type {
  CreateSubmissionRequest,
  ListSubmissionsQuery,
  Submission,
  SubmissionStatus,
  UpdateSubmissionRequest,
} from '../../../core/api/types';

export const submissionsApi = {
  list: (query?: ListSubmissionsQuery) =>
    getPaginated<Submission[]>('/submissions', query as Record<string, string | number | undefined> | undefined),

  getById: (id: string) => api.get<Submission>(`/submissions/${id}`),

  create: (data: CreateSubmissionRequest) => api.post<Submission>('/submissions', data),

  update: (id: string, data: UpdateSubmissionRequest) => api.patch<Submission>(`/submissions/${id}`, data),

  submit: (id: string) => api.post<Submission>(`/submissions/${id}/submit`),

  updateStatus: (id: string, status: SubmissionStatus) =>
    api.patch<Submission>(`/submissions/${id}/status`, { status }),
};
