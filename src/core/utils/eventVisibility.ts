import type { Event, User } from '../api/types';

const DRAFT_VIEWER_ROLES = new Set(['ADMIN', 'EVENT_COORDINATOR', 'COORDINATOR']);

export function canViewDraftEvents(user: User | null | undefined) {
  return user?.roles.some((role) => DRAFT_VIEWER_ROLES.has(role.name.toUpperCase())) ?? false;
}

export function filterVisibleEvents(events: Event[], user: User | null | undefined) {
  return canViewDraftEvents(user) ? events : events.filter((event) => event.status !== 'DRAFT');
}
