import type { Event, Participant, User } from '../api/types';

const DRAFT_VIEWER_ROLES = new Set(['ADMIN', 'EVENT_COORDINATOR', 'COORDINATOR']);

function canViewDraftEvents(user: User | null | undefined) {
  return user?.roles.some((role) => DRAFT_VIEWER_ROLES.has(role.name.toUpperCase())) ?? false;
}

function isParticipantOnly(user: User | null | undefined) {
  const roles = user?.roles.map((role) => role.name.toUpperCase()) || [];
  return roles.length > 0 && roles.every((role) => role === 'PARTICIPANT' || role === 'USER');
}

function isRegistrationOpen(event: Event) {
  const now = Date.now();
  if (event.status !== 'OPEN_REGISTRATION') return false;
  if (event.registrationStart && new Date(event.registrationStart).getTime() > now) return false;
  if (event.registrationEnd && new Date(event.registrationEnd).getTime() < now) return false;
  return true;
}

export async function filterVisibleEvents(
  events: Event[],
  user: User | null | undefined,
  getMyParticipant: (eventId: string) => Promise<{ data: Participant | null }>,
) {
  const nonDraftEvents = canViewDraftEvents(user) ? events : events.filter((event) => event.status !== 'DRAFT');
  if (!isParticipantOnly(user)) return nonDraftEvents;

  const participantRecords = await Promise.all(
    nonDraftEvents.map(async (event) => {
      try {
        const response = await getMyParticipant(event.id);
        return [event.id, response.data] as const;
      } catch {
        return [event.id, null] as const;
      }
    }),
  );
  const joinedEventIds = new Set(participantRecords.filter(([, participant]) => participant).map(([eventId]) => eventId));
  return nonDraftEvents.filter((event) => joinedEventIds.has(event.id) || isRegistrationOpen(event));
}
