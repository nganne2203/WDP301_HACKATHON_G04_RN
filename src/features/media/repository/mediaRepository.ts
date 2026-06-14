import { mediaApi } from '../api/mediaApi';
import type {
  EventGalleryFilter,
  MediaHistoryFilter,
  UploadMediaRequest,
} from '../../../core/api/types';

export const mediaRepository = {
  upload: (request: UploadMediaRequest) => mediaApi.upload(request),
  getMyHistory: (filters?: MediaHistoryFilter) => mediaApi.getMyHistory(filters),
  getEventGallery: (eventId: string, filters?: EventGalleryFilter) => mediaApi.getEventGallery(eventId, filters),
  getViewUrl: (mediaId: string) => mediaApi.getViewUrl(mediaId),
  deleteOwn: (mediaId: string) => mediaApi.delete(mediaId),
};
