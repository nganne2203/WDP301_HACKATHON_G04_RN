export interface Pagination {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
}

export interface ApiSuccessResponse<T> {
  success: true;
  message: string;
  data: T;
  pagination: Pagination | null;
}

export interface ApiErrorResponse {
  success: false;
  code: string;
  message: string;
  errors: string[];
  stack?: string;
}

export interface PaginatedData<T> {
  data: T;
  pagination: Pagination | null;
}

export interface Permission {
  id: string;
  code: string;
  description?: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions?: Permission[];
}

export type UserStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';

export interface User {
  id: string;
  email: string;
  authProvider: 'LOCAL' | 'GOOGLE';
  fullName: string;
  status: UserStatus;
  mustChangePassword: boolean;
  roles: Role[];
  permissions: string[];
  avatarUrl?: string | null;
  phone?: string | null;
  bio?: string | null;
  studentType?: 'FPT' | 'EXTERNAL' | null;
  studentId?: string | null;
  schoolName?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthData {
  user: User;
  tokens: TokenPair;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  studentType: 'FPT' | 'EXTERNAL';
  studentId: string;
  schoolName?: string;
}

export interface UpdateProfileRequest {
  fullName?: string;
  avatarUrl?: string | null;
  phone?: string | null;
  bio?: string | null;
}

export type EventStatus =
  | 'DRAFT'
  | 'OPEN_REGISTRATION'
  | 'ONGOING'
  | 'SCORING'
  | 'COMPLETED'
  | 'ARCHIVED';

export interface EventCreator {
  id: string;
  fullName?: string;
  email?: string;
}

export interface Event {
  id: string;
  title: string;
  description?: string | null;
  semester?: string | null;
  seriesName?: string | null;
  season?: string | null;
  year?: number | null;
  theme?: string | null;
  registrationStart?: string | null;
  registrationEnd?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  maxTeams?: number;
  minTeamMembers?: number;
  maxTeamMembers?: number;
  finalistSlotsPerTrack?: number;
  totalFinalistSlots?: number;
  status: EventStatus;
  createdBy?: EventCreator | null;
  createdAt: string;
  updatedAt: string;
}

export interface ListEventsQuery {
  page?: number;
  limit?: number;
  status?: EventStatus;
  semester?: string;
  season?: string;
  year?: number;
  search?: string;
}

export type TimelineEventType = 'WORKSHOP' | 'CHECK_IN' | 'ROUND' | 'RESULT_PUBLISHING' | 'CEREMONY' | 'OTHER';
export type TimelineStatus = 'SCHEDULED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';

export interface TimelineEventSummary {
  id: string;
  title: string;
  semester?: string | null;
  season?: string | null;
  year?: number | null;
  status?: EventStatus;
}

export interface TimelineEvent {
  id: string;
  eventId: string;
  event?: TimelineEventSummary | null;
  title: string;
  description?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  eventType: TimelineEventType;
  status: TimelineStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ListTimelinesQuery {
  page?: number;
  limit?: number;
  eventId?: string;
  eventType?: TimelineEventType;
  status?: TimelineStatus;
  search?: string;
}

export type WorkshopStatus = 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED';

export interface UserSummary {
  id: string;
  fullName?: string;
  email?: string;
}

export interface EventSummary {
  id: string;
  title?: string;
  seriesName?: string | null;
  season?: string | null;
  year?: number | null;
  status?: EventStatus;
}

export interface WorkshopSpeakerInfo {
  name?: string | null;
  title?: string | null;
  bio?: string | null;
  email?: string | null;
}

export interface WorkshopGoogleMeet {
  enabled: boolean;
  meetLink?: string;
  calendarEventId?: string;
  htmlLink?: string;
  organizerUserId?: string;
  organizerEmail?: string;
  createdAt?: string;
}

export interface Workshop {
  id: string;
  eventId: string;
  event?: EventSummary | null;
  timelineEventId?: string | null;
  title: string;
  description?: string | null;
  presenterId?: string | null;
  presenter?: UserSummary | null;
  speakerInfo?: WorkshopSpeakerInfo;
  meetLink?: string | null;
  googleMeet?: WorkshopGoogleMeet;
  startTime: string;
  endTime: string;
  questionnaire?: string[];
  status: WorkshopStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ListWorkshopsQuery {
  page?: number;
  limit?: number;
  eventId?: string;
  presenterId?: string;
  status?: WorkshopStatus;
  search?: string;
}

export type NotificationType = 'DEADLINE' | 'WORKSHOP' | 'RESULT' | 'FEEDBACK' | 'SYSTEM';
export type NotificationStatus = 'UNREAD' | 'READ';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message?: string | null;
  type: NotificationType;
  status: NotificationStatus;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ListNotificationsQuery {
  page?: number;
  limit?: number;
  type?: NotificationType;
  status?: NotificationStatus;
}

export type ParticipantStatus = 'INVITED' | 'REGISTERED' | 'ACTIVE' | 'WITHDRAWN';
export type CheckInStatus = 'NOT_CHECKED_IN' | 'CHECKED_IN';
export type GitHubAccessStatus = 'NOT_GRANTED' | 'GRANTED' | 'REVOKED';
export type EligibilityStatus = 'PENDING' | 'ELIGIBLE' | 'INELIGIBLE';
export type TeamRole = 'MEMBER' | 'LEADER';
export type AttendedActivity = 'WORKSHOP' | 'OPENING' | 'TEAM_MEETING' | 'CODING' | 'PRESENTATION' | 'CLOSING';

export interface ParticipantUserSummary {
  id: string;
  fullName?: string;
  email?: string;
  status?: UserStatus;
  studentId?: string | null;
  studentType?: 'FPT' | 'EXTERNAL' | null;
  schoolName?: string | null;
}

export interface ParticipantTeamSummary {
  id: string;
  name?: string;
  chapterName?: string | null;
  projectName?: string | null;
  status?: string;
  qualificationStatus?: string;
  trackId?: string | null;
}

export interface ParticipantEventSummary {
  id: string;
  title?: string;
  semester?: string | null;
  season?: string | null;
  year?: number | null;
  status?: EventStatus;
}

export interface Participant {
  id: string;
  event: ParticipantEventSummary | null;
  eventId: string;
  user: ParticipantUserSummary | null;
  userId: string;
  team: ParticipantTeamSummary | null;
  teamId: string | null;
  chapterName?: string | null;
  teamRole?: TeamRole;
  isGraduated?: boolean;
  consentMediaUse?: boolean;
  eligibilityStatus: EligibilityStatus;
  attendedActivities: AttendedActivity[];
  checkInStatus: CheckInStatus;
  githubAccessStatus: GitHubAccessStatus;
  status: ParticipantStatus;
  joinedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateParticipantRequest {
  eventId: string;
  userId?: string;
  teamId?: string | null;
  chapterName?: string | null;
  teamRole?: TeamRole;
  isGraduated?: boolean;
  consentMediaUse?: boolean;
  eligibilityStatus?: EligibilityStatus;
  attendedActivities?: AttendedActivity[];
  checkInStatus?: CheckInStatus;
  githubAccessStatus?: GitHubAccessStatus;
  status?: ParticipantStatus;
  joinedAt?: string;
}

export interface ListParticipantsQuery {
  page?: number;
  limit?: number;
  eventId?: string;
  userId?: string;
  teamId?: string;
  status?: ParticipantStatus;
  checkInStatus?: CheckInStatus;
  githubAccessStatus?: GitHubAccessStatus;
  chapterName?: string;
  search?: string;
}

export interface UpdateParticipantRequest {
  userId?: string;
  teamId?: string | null;
  chapterName?: string | null;
  teamRole?: TeamRole;
  isGraduated?: boolean;
  consentMediaUse?: boolean;
  eligibilityStatus?: EligibilityStatus;
  attendedActivities?: AttendedActivity[];
  checkInStatus?: CheckInStatus;
  githubAccessStatus?: GitHubAccessStatus;
  status?: ParticipantStatus;
  joinedAt?: string | null;
}

export type TeamStatus =
  | 'PENDING'
  | 'WAITING_FOR_MEMBERS'
  | 'WAITLISTED'
  | 'CONFIRMED'
  | 'REJECTED'
  | 'ACTIVE'
  | 'INACTIVE'
  | 'DISQUALIFIED';

export type TeamInvitationStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED' | 'CANCELLED';

export interface TeamUserSummary {
  id: string;
  email: string;
  fullName?: string;
  status?: UserStatus;
  mustChangePassword?: boolean;
}

export interface TeamEventSummary {
  id: string;
  title: string;
  status: EventStatus;
  registrationStart?: string | null;
  registrationEnd?: string | null;
  minTeamMembers?: number;
  maxTeamMembers?: number;
  maxTeams?: number;
}

export interface TeamTrackSummary {
  id: string;
  code?: string;
  name?: string;
  type?: string;
  maxTeams?: number;
  status?: string;
}

export interface TeamParticipant {
  id: string;
  eventId: string;
  teamId: string;
  user: TeamUserSummary | null;
  teamRole: TeamRole;
  status: string;
  joinedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface TeamInvitation {
  id: string;
  eventId: string;
  teamId: string;
  leaderId: string;
  invitedEmail: string;
  invitedUserId?: string;
  invitedUser?: TeamUserSummary | null;
  status: TeamInvitationStatus;
  expiresAt: string;
  acceptedAt?: string | null;
  declinedAt?: string | null;
  cancelledAt?: string | null;
  replacedByInvitationId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Team {
  id: string;
  event: TeamEventSummary | null;
  eventId: string;
  track?: TeamTrackSummary | null;
  trackId?: string | null;
  leader: TeamUserSummary | null;
  leaderId: string;
  members: TeamUserSummary[];
  name: string;
  chapterName?: string | null;
  projectName?: string | null;
  boardNumber?: number | null;
  placementSlot?: number | null;
  waitlistPosition?: number | null;
  trackAssignmentMethod?: string;
  trackAssignedAt?: string | null;
  status: TeamStatus;
  qualificationStatus?: string;
  confirmedAt?: string | null;
  rejectedAt?: string | null;
  rejectionReason?: string | null;
  participants: TeamParticipant[];
  invitations: TeamInvitation[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateTeamRequest {
  eventId: string;
  name: string;
  trackId?: string | null;
  chapterName?: string | null;
  projectName?: string | null;
  invitedEmails?: string[];
  invitedMembers?: TeamInviteMember[];
}

export interface TeamInviteMember {
  fullName: string;
  email: string;
}

export interface InviteMembersRequest {
  emails?: string[];
  members?: TeamInviteMember[];
}

export interface InviteMembersResult {
  total: number;
  invitations: TeamInvitation[];
}

export interface ReplaceInvitationRequest {
  email: string;
}

export interface InvitationDecisionResult {
  status: TeamInvitationStatus | TeamStatus;
  team: Team | null;
  invitation: TeamInvitation;
}

export interface ListTeamsQuery {
  eventId?: string;
  trackId?: string;
  status?: TeamStatus;
  page?: number;
  limit?: number;
}
