import { api } from '../../../core/api/client';
import type { UpdateProfileRequest, User } from '../../../core/api/types';

export const profileApi = {
  updateMe: (data: UpdateProfileRequest) => api.patch<User>('/users/me', data),
};
