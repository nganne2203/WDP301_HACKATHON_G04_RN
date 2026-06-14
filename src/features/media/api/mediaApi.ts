import { api, API_BASE_URL, ApiError } from '../../../core/api/client';
import { getAccessToken } from '../../../core/storage/tokenStorage';
import type {
  ApiErrorResponse,
  ApiSuccessResponse,
  EventGalleryFilter,
  EventGalleryResponse,
  MediaHistoryFilter,
  MediaItem,
  SignedUrlResponse,
  UploadMediaRequest,
} from '../../../core/api/types';

function toParams<T extends object>(value?: T) {
  return value as Record<string, string | number | undefined> | undefined;
}

async function parseUploadError(response: Response) {
  const fallback: ApiErrorResponse = {
    success: false,
    code: 'UPLOAD_FAILED',
    message: `Upload failed with status ${response.status}`,
    errors: [],
  };

  try {
    return (await response.json()) as ApiErrorResponse;
  } catch {
    return fallback;
  }
}

export const mediaApi = {
  upload: async (request: UploadMediaRequest) => {
    const formData = new FormData();
    formData.append('eventId', request.eventId);
    if (request.teamId) formData.append('teamId', request.teamId);
    if (request.title?.trim()) formData.append('title', request.title.trim());
    if (request.description?.trim()) formData.append('description', request.description.trim());
    if (request.tags?.trim()) formData.append('tags', request.tags.trim());
    formData.append('file', {
      uri: request.file.uri,
      name: request.file.name,
      type: request.file.mimeType,
    } as unknown as Blob);

    const token = await getAccessToken();
    const response = await fetch(`${API_BASE_URL}/media/upload`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: formData,
    });

    if (!response.ok) {
      throw new ApiError(await parseUploadError(response), response.status);
    }

    return (await response.json()) as ApiSuccessResponse<MediaItem>;
  },

  getMyHistory: (filters?: MediaHistoryFilter) =>
    api.get<MediaItem[]>('/media/my-history', { params: toParams(filters) }),

  getEventGallery: (eventId: string, filters?: EventGalleryFilter) =>
    api.get<EventGalleryResponse>(`/events/${eventId}/gallery`, { params: toParams(filters) }),

  getViewUrl: (mediaId: string) =>
    api.get<SignedUrlResponse>(`/media/${mediaId}/view-url`),

  delete: (mediaId: string) =>
    api.delete<null>(`/media/${mediaId}`),
};
