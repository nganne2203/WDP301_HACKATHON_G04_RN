import { api, getPaginated } from '../../../core/api/client';
import type { ListNotificationsQuery, Notification } from '../../../core/api/types';

export const notificationsApi = {
  list: (query?: ListNotificationsQuery) => getPaginated<Notification[]>('/notifications', query as Record<string, string | number | undefined> | undefined),
  markAsRead: (id: string) => api.patch<Notification>(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch<{ acknowledged: boolean; modifiedCount: number }>('/notifications/read-all'),
  registerPushToken: (token: string, platform: 'android' | 'ios') => api.post<{
    registered: boolean;
    platform: 'android' | 'ios';
    updatedAt: string;
  }>('/notifications/push-token', { token, platform }),
  unregisterPushToken: () => api.delete<{ unregistered: boolean }>('/notifications/push-token'),
};
