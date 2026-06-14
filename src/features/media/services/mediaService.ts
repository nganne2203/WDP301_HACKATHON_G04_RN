import { mediaRepository } from '../repository/mediaRepository';
import { validateUploadFile } from '../models/mediaHelpers';
import type {
  EventGalleryFilter,
  MediaHistoryFilter,
  UploadMediaRequest,
} from '../../../core/api/types';

export const mediaService = {
  upload: (request: UploadMediaRequest) => {
    if (!request.eventId) throw new Error('Event is required.');
    if (!request.title?.trim()) throw new Error('Title is required.');
    const fileError = validateUploadFile(request.file);
    if (fileError) throw new Error(fileError);
    return mediaRepository.upload({
      ...request,
      title: request.title.trim(),
      description: request.description?.trim() || undefined,
      tags: request.tags?.trim() || undefined,
    });
  },
  getMyHistory: (filters?: MediaHistoryFilter) => mediaRepository.getMyHistory(filters),
  getEventGallery: (eventId: string, filters?: EventGalleryFilter) => mediaRepository.getEventGallery(eventId, filters),
  getViewUrl: (mediaId: string) => mediaRepository.getViewUrl(mediaId),
  deleteOwn: (mediaId: string) => mediaRepository.deleteOwn(mediaId),
};
