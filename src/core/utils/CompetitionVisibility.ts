import type { Competition, Participant, User } from '../api/types';

const DRAFT_VIEWER_ROLES = new Set(['ADMIN', 'COMPETITION_COORDINATOR', 'COORDINATOR']);

function canViewDraftCompetitions(user: User | null | undefined) {
  return user?.roles.some((role) => DRAFT_VIEWER_ROLES.has(role.name.toUpperCase())) ?? false;
}

function isParticipantOnly(user: User | null | undefined) {
  const roles = user?.roles.map((role) => role.name.toUpperCase()) || [];
  return roles.length > 0 && roles.every((role) => role === 'PARTICIPANT' || role === 'USER');
}

function isRegistrationOpen(competition: Competition) {
  const now = Date.now();
  if (competition.status !== 'OPEN_REGISTRATION') return false;
  if (competition.registrationStart && new Date(competition.registrationStart).getTime() > now) return false;
  if (competition.registrationEnd && new Date(competition.registrationEnd).getTime() < now) return false;
  return true;
}

export async function filterVisibleCompetitions(
  competitions: Competition[],
  user: User | null | undefined,
  getMyParticipant: (competitionId: string) => Promise<{ data: Participant | null }>,
) {
  const nonDraftCompetitions = canViewDraftCompetitions(user) ? competitions : competitions.filter((competition) => competition.status !== 'DRAFT');
  if (!isParticipantOnly(user)) return nonDraftCompetitions;

  const participantRecords = await Promise.all(
    nonDraftCompetitions.map(async (competition) => {
      try {
        const response = await getMyParticipant(competition.id);
        return [competition.id, response.data] as const;
      } catch {
        return [competition.id, null] as const;
      }
    }),
  );
  const joinedCompetitionIds = new Set(participantRecords.filter(([, participant]) => participant).map(([competitionId]) => competitionId));
  return nonDraftCompetitions.filter((competition) => joinedCompetitionIds.has(competition.id) || isRegistrationOpen(competition));
}
