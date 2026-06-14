import type { Event, Team, TeamInviteMember } from '../../../core/api/types';

export interface MemberInviteRow {
  id: string;
  fullName: string;
  email: string;
}

export function createMemberRow(): MemberInviteRow {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    fullName: '',
    email: '',
  };
}

export function isRegistrationOpen(event?: Event | null) {
  if (!event || event.status !== 'OPEN_REGISTRATION') return false;

  const now = new Date();
  if (event.registrationStart && now < new Date(event.registrationStart)) return false;
  if (event.registrationEnd && now > new Date(event.registrationEnd)) return false;

  return true;
}

export function normalizeMemberRows(rows: MemberInviteRow[], currentUserEmail?: string | null): TeamInviteMember[] {
  const seen = new Set<string>();
  const currentEmail = String(currentUserEmail || '').trim().toLowerCase();

  return rows
    .map((row) => ({
      fullName: row.fullName.trim(),
      email: row.email.trim().toLowerCase(),
    }))
    .filter((row) => {
      if (!row.email || seen.has(row.email) || row.email === currentEmail) return false;
      seen.add(row.email);
      return true;
    });
}

export function getTeamMemberCount(team: Team) {
  return team.members.length || team.participants.length;
}

export function canManageInvitations(team: Team, userId?: string, event?: Event | null) {
  return Boolean(
    userId &&
    team.leaderId === userId &&
    team.status !== 'REJECTED' &&
    (!event || isRegistrationOpen(event))
  );
}

export function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}
