import { api } from '../../../core/api/client';
import type { AiReviewDetail } from '../../../core/api/types';

export const aiReviewsApi = {
  getById: (id: string) => api.get<AiReviewDetail>(`/ai-reviews/${id}`),
};
