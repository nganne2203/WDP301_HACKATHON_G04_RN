import type { MediaItem, MediaStatus, MediaType, MediaUploadFile } from '../../../core/api/types';

export const MEDIA_TYPES: MediaType[] = ['IMAGE', 'VIDEO', 'DOCUMENT'];
export const MEDIA_STATUSES: MediaStatus[] = ['PENDING', 'APPROVED', 'REJECTED'];

export const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'mp4', 'mov', 'webm', 'pdf', 'doc', 'docx', 'ppt', 'pptx'];

export const MAX_SIZE_BY_TYPE: Record<MediaType, number> = {
  IMAGE: 10 * 1024 * 1024,
  VIDEO: 200 * 1024 * 1024,
  DOCUMENT: 50 * 1024 * 1024,
};

export function formatFileSize(bytes?: number | null) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

export function detectMediaType(file: Pick<MediaUploadFile, 'mimeType' | 'name'>): MediaType | null {
  const mime = file.mimeType.toLowerCase();
  if (mime.startsWith('image/')) return 'IMAGE';
  if (mime.startsWith('video/')) return 'VIDEO';

  const extension = getExtension(file.name);
  if (extension && ['pdf', 'doc', 'docx', 'ppt', 'pptx'].includes(extension)) return 'DOCUMENT';
  return null;
}

export function getExtension(name: string) {
  return name.split('.').pop()?.toLowerCase() || '';
}

export function validateUploadFile(file: MediaUploadFile | null) {
  if (!file) return null;

  const extension = getExtension(file.name);
  if (!extension || !ALLOWED_EXTENSIONS.includes(extension)) {
    return 'This file type is not allowed.';
  }

  const mediaType = detectMediaType(file);
  if (!mediaType) return 'The file MIME type is not supported.';

  if (file.size && file.size > MAX_SIZE_BY_TYPE[mediaType]) {
    return `${mediaType.toLowerCase()} files must be ${formatFileSize(MAX_SIZE_BY_TYPE[mediaType])} or smaller.`;
  }

  return null;
}

export function canDeleteMedia(media: MediaItem, userId?: string) {
  return media.status === 'PENDING' && (!media.uploadedById || media.uploadedById === userId);
}

export function getMediaTitle(media: MediaItem) {
  return media.title?.trim() || media.originalFileName;
}

export function flattenGallery(groups: { images: MediaItem[]; videos: MediaItem[]; documents: MediaItem[] }) {
  return [...groups.images, ...groups.videos, ...groups.documents];
}
