import { api, getPaginated } from '../../../core/api/client';
import type {
  AttendedActivity,
  CheckInStatus,
  CreateParticipantRequest,
  ListParticipantsQuery,
  Participant,
  UpdateParticipantRequest,
} from '../../../core/api/types';

export const participantsApi = {
  list: (query?: ListParticipantsQuery) =>
    getPaginated<Participant[]>('/participants', query as Record<string, string | number | undefined> | undefined),

  getById: (id: string) => api.get<Participant>(`/participants/${id}`),

  getMine: (competitionId: string) => api.get<Participant>('/participants/me', { params: { competitionId } }),

  register: (data: CreateParticipantRequest) => api.post<Participant>('/participants', data),

  update: (id: string, data: UpdateParticipantRequest) => api.patch<Participant>(`/participants/${id}`, data),

  updateCheckIn: (id: string, checkInStatus: CheckInStatus) =>
    api.patch<Participant>(`/participants/${id}/check-in`, { checkInStatus }),

  checkIn: (id: string) =>
    api.patch<Participant>(`/participants/${id}/check-in`, { checkInStatus: 'CHECKED_IN' }),

  scanCheckInQr: (token: string) =>
    api.post<Participant>('/participants/check-in/scan', { token }),

  updateAttendance: (id: string, attendedActivities: AttendedActivity[]) =>
    api.patch<Participant>(`/participants/${id}/attendance`, { attendedActivities }),
};
