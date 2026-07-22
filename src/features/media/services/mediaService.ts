import { mediaRepository } from '../repository/mediaRepository';
import { validateUploadFile } from '../models/mediaHelpers';
import type {
  CompetitionGalleryFilter,
  MediaHistoryFilter,
  UploadMediaRequest,
} from '../../../core/api/types';

export const mediaService = {
  upload: (request: UploadMediaRequest) => {
    if (!request.competitionId) throw new Error('Competition is required.');
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
  getCompetitionGallery: (competitionId: string, filters?: CompetitionGalleryFilter) => mediaRepository.getCompetitionGallery(competitionId, filters),
  getViewUrl: (mediaId: string) => mediaRepository.getViewUrl(mediaId),
  deleteOwn: (mediaId: string) => mediaRepository.deleteOwn(mediaId),
};
