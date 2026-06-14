import { api } from '../../../core/api/client';
import type { AuthData, LoginRequest, RegisterRequest, User } from '../../../core/api/types';

export const authApi = {
  login: (data: LoginRequest) => api.post<AuthData>('/auth/login', data, { auth: false }),
  register: (data: RegisterRequest) => api.post<User>('/auth/register', data, { auth: false }),
  getMe: () => api.get<User>('/auth/me'),
  logout: () => api.post<null>('/auth/logout'),
};
