import { mediaApi } from '../api/mediaApi';
import type {
  CompetitionGalleryFilter,
  MediaHistoryFilter,
  UploadMediaRequest,
} from '../../../core/api/types';

export const mediaRepository = {
  upload: (request: UploadMediaRequest) => mediaApi.upload(request),
  getMyHistory: (filters?: MediaHistoryFilter) => mediaApi.getMyHistory(filters),
  getCompetitionGallery: (competitionId: string, filters?: CompetitionGalleryFilter) => mediaApi.getCompetitionGallery(competitionId, filters),
  getViewUrl: (mediaId: string) => mediaApi.getViewUrl(mediaId),
  deleteOwn: (mediaId: string) => mediaApi.delete(mediaId),
};
