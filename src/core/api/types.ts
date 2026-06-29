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
  githubUsername?: string | null;
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
  githubUsername: string;
  studentType: 'FPT' | 'EXTERNAL';
  studentId: string;
  schoolName?: string;
}

export interface UpdateProfileRequest {
  fullName?: string;
  avatarUrl?: string | null;
  phone?: string | null;
  bio?: string | null;
  githubUsername?: string | null;
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
  githubUsername?: string | null;
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

export interface WorkshopQuestionVote {
  voter: UserSummary | null;
  votedAt: string;
}

export interface WorkshopQuestion {
  id: string;
  workshopId: string;
  author: UserSummary | null;
  content: string;
  voteCount: number;
  votes?: WorkshopQuestionVote[];
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

export type MediaType = 'IMAGE' | 'VIDEO' | 'DOCUMENT';
export type MediaStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface MediaUserSummary {
  id: string;
  email?: string;
  fullName?: string;
}

export interface MediaEventSummary {
  id: string;
  title?: string;
  status?: EventStatus;
}

export interface MediaTeamSummary {
  id: string;
  name?: string;
  status?: TeamStatus;
}

export interface MediaItem {
  id: string;
  eventId: string;
  event?: MediaEventSummary | null;
  uploadedBy?: MediaUserSummary | null;
  uploadedById?: string;
  teamId?: string | null;
  team?: MediaTeamSummary | null;
  title?: string | null;
  description?: string | null;
  mediaType: MediaType;
  storageProvider?: string;
  bucketName?: string;
  storagePath?: string;
  fileUrl?: string;
  originalFileName: string;
  mimeType: string;
  fileSize: number;
  fileExtension: string;
  tags: string[];
  status: MediaStatus;
  reviewedBy?: MediaUserSummary | null;
  reviewedById?: string | null;
  reviewedAt?: string | null;
  rejectReason?: string | null;
  uploadedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface MediaHistoryFilter {
  eventId?: string;
  mediaType?: MediaType;
  status?: MediaStatus;
  search?: string;
  tags?: string;
  fromDate?: string;
  toDate?: string;
  week?: number;
  month?: number;
  year?: number;
  page?: number;
  limit?: number;
}

export interface EventGalleryFilter {
  mediaType?: MediaType;
  search?: string;
  tags?: string;
  page?: number;
  limit?: number;
}

export interface EventGalleryResponse {
  images: MediaItem[];
  videos: MediaItem[];
  documents: MediaItem[];
  statistics: {
    totalUploads: number;
    totalImages: number;
    totalVideos: number;
    totalDocuments: number;
  };
}

export interface SignedUrlResponse {
  signedUrl: string;
  expiresIn: number;
}

export interface MediaUploadFile {
  uri: string;
  name: string;
  mimeType: string;
  size?: number;
}

export interface UploadMediaRequest {
  eventId: string;
  teamId?: string | null;
  title?: string | null;
  description?: string | null;
  tags?: string;
  file: MediaUploadFile;
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
  githubUsername?: string | null;
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
  githubUsername?: string | null;
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

export type ChatParticipantRole = 'member' | 'mentor';
export type ChatMessageType = 'text' | 'image' | 'file';

export interface ChatTeamSummary {
  id: string;
  eventId: string;
  name: string;
  projectName?: string | null;
  status?: string;
}

export interface ChatSender {
  id: string;
  email?: string;
  fullName?: string;
  avatarUrl?: string | null;
}

export interface ChatMessage {
  id: string;
  chatRoomId: string;
  teamId: string;
  senderId: string;
  sender?: ChatSender | null;
  senderRole: ChatParticipantRole;
  message: string;
  messageType: ChatMessageType;
  clientMessageId?: string | null;
  isSeen: boolean;
  createdAt: string;
  updatedAt?: string;
  status?: 'sending' | 'sent' | 'failed';
}

export interface ChatRoom {
  id: string;
  teamId: string;
  roomKey: string;
  team?: ChatTeamSummary | null;
  participantRole?: ChatParticipantRole | null;
  unreadCount: number;
  lastMessage?: ChatMessage | null;
  createdAt: string;
  updatedAt: string;
}

export interface SendChatMessageRequest {
  teamId?: string;
  chatRoomId?: string;
  message: string;
  messageType?: ChatMessageType;
  clientMessageId?: string;
}

export interface ChatUnreadCount {
  total: number;
  rooms: Array<{ chatRoomId: string; teamId: string; unreadCount: number }>;
}

export interface ListTeamsQuery {
  eventId?: string;
  trackId?: string;
  status?: TeamStatus;
  page?: number;
  limit?: number;
}

export type RoundType = 'PRELIMINARY' | 'FINAL';
export type RoundStatus = 'DRAFT' | 'OPEN' | 'CLOSED' | 'SCORING' | 'COMPLETED';

export interface RoundTeamSummary {
  id: string;
  name?: string;
  chapterName?: string | null;
  projectName?: string | null;
  status?: string;
  trackId?: string | null;
  boardNumber?: number | null;
  placementSlot?: number | null;
}

export interface Round {
  id: string;
  eventId: string;
  event: { id: string; title?: string; status?: EventStatus | string } | null;
  trackId: string | null;
  track: { id: string; code?: string; name?: string } | null;
  rubricId: string | null;
  rubric: { id: string; title?: string; totalScore?: number | null } | null;
  name: string;
  roundType: RoundType;
  status: RoundStatus;
  startTime: string | null;
  endTime: string | null;
  submissionDeadline: string | null;
  publishTime: string | null;
  maxPromotedTeams: number | null;
  assignedTeams?: RoundTeamSummary[];
  assignedTeamIds: string[];
  promotedTeams?: RoundTeamSummary[];
  promotedTeamIds: string[];
  assignedJudges: UserSummary[];
  assignedJudgeIds?: string[];
  promotionRule?: string | null;
  tieBreakRule?: string | null;
  tieBreakDurationMinutes?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ListRoundsQuery {
  page?: number;
  limit?: number;
  eventId?: string;
  trackId?: string;
  status?: RoundStatus;
}

export type SubmissionStatus = 'DRAFT' | 'SUBMITTED' | 'ACCEPTED' | 'REJECTED';

export interface Submission {
  id: string;
  eventId: string;
  event: { id: string; title?: string } | null;
  roundId: string;
  round: { id: string; name?: string; roundType?: RoundType; status?: RoundStatus } | null;
  teamId: string;
  team: { id: string; name?: string; projectName?: string | null } | null;
  repositoryId?: string | null;
  repository?: {
    id: string;
    repositoryFullName?: string;
    repositoryUrl?: string;
    status?: string;
  } | null;
  demoUrl: string | null;
  reportUrl: string | null;
  presentationUrl: string | null;
  status: SubmissionStatus;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSubmissionRequest {
  eventId: string;
  roundId: string;
  teamId: string;
  repositoryId?: string | null;
  demoUrl?: string | null;
  reportUrl?: string | null;
  presentationUrl?: string | null;
  status?: SubmissionStatus;
}

export interface UpdateSubmissionRequest {
  repositoryId?: string | null;
  demoUrl?: string | null;
  reportUrl?: string | null;
  presentationUrl?: string | null;
}

export interface ListSubmissionsQuery {
  page?: number;
  limit?: number;
  eventId?: string;
  roundId?: string;
  teamId?: string;
  repositoryId?: string;
  status?: SubmissionStatus;
}

export type RepositoryStatus = 'PENDING' | 'ACTIVE' | 'ARCHIVED' | 'DISCONNECTED';
export type RepositoryAccessState = 'UNKNOWN' | 'PENDING' | 'GRANTED' | 'REVOKED';
export type RepositoryWebhookStatus = 'NOT_CONFIGURED' | 'PENDING' | 'REGISTERED' | 'FAILED';

export interface RepositoryEventSummary {
  id: string;
  title?: string;
  semester?: string | null;
  season?: string | null;
  year?: number | null;
  status?: EventStatus | string;
}

export interface RepositoryTeamSummary {
  id: string;
  name?: string;
  projectName?: string | null;
  chapterName?: string | null;
  status?: string;
  boardNumber?: number | null;
  placementSlot?: number | null;
}

export interface RepositoryRoundSummary {
  id: string;
  name?: string;
  roundType?: RoundType;
  status?: RoundStatus;
}

export interface Repository {
  id: string;
  event: RepositoryEventSummary | null;
  eventId: string;
  team: RepositoryTeamSummary | null;
  teamId: string;
  round: RepositoryRoundSummary | null;
  roundId: string | null;
  githubOwner: string;
  githubRepo: string;
  repositoryFullName: string;
  repositoryUrl: string;
  repositoryLocalPath: string | null;
  defaultBranch: string;
  latestCommitSha: string | null;
  lastProcessedCommitSha: string | null;
  status: RepositoryStatus;
  accessState: RepositoryAccessState;
  accessGrantedAt: string | null;
  accessRevokedAt: string | null;
  webhookRegisteredAt: string | null;
  webhookStatus: RepositoryWebhookStatus;
  lastWebhookRegistrationError: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ListRepositoriesQuery {
  page?: number;
  limit?: number;
  eventId?: string;
  teamId?: string;
  roundId?: string;
  status?: RepositoryStatus;
  accessState?: RepositoryAccessState;
  search?: string;
}

export interface RepositoryCommit {
  id: string;
  repositoryId: string;
  commitSha: string;
  branch: string | null;
  provider?: string | null;
  repositoryFullName?: string | null;
  authorName?: string | null;
  authorEmail?: string | null;
  authorUsername?: string | null;
  timestamp?: string | null;
  message?: string | null;
  commitUrl?: string | null;
  linesAdded: number;
  linesRemoved: number;
  filesChanged: number;
}

export interface RepositoryCommitDiffFile {
  filePath: string;
  previousFilePath?: string | null;
  fileName?: string | null;
  language?: string | null;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
  cleanPatch?: string;
  patchSummary?: string;
  excludedReason?: string | null;
  isExcluded: boolean;
  isBinary: boolean;
  isGenerated: boolean;
  isMinified: boolean;
  isBuildArtifact: boolean;
  isLockFile: boolean;
  isTruncated: boolean;
  cleanPatchSize: number;
  hunkCount: number;
  addedLineCount: number;
  removedLineCount: number;
}

export interface RepositoryCommitDiff {
  id: string;
  repositoryId: string;
  commitId: string | null;
  baseCommitSha: string | null;
  headCommitSha: string | null;
  provider?: string | null;
  status: string;
  totalFiles: number;
  includedFiles: number;
  excludedFiles: number;
  totalCleanPatchSize: number;
  cleanDiffSummary?: string | null;
  fetchedAt?: string | null;
  patchSummary?: string;
  files: RepositoryCommitDiffFile[];
}

export interface RepositoryStaticAnalysisResult {
  id: string;
  repositoryId: string;
  commitSha: string;
  source?: string | null;
  status: string;
  errorCount: number;
  warningCount: number;
  findings: Record<string, unknown>[];
  rawOutput?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RepositoryImpactDecision {
  id: string;
  repositoryId: string;
  commitSha: string;
  impactScore: number;
  impactLevel: string;
  decision: string;
  reasons: string[];
  needsHumanReview: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RepositoryAiReview {
  id: string;
  repositoryId: string;
  eventId: string | null;
  teamId: string | null;
  roundId: string | null;
  commitId: string | null;
  commitDiffId: string | null;
  impactDecisionId: string | null;
  reviewKind: string;
  status: string;
  summary: string;
  overallSummary: string;
  needsHumanReview: boolean;
  isScoreBased: boolean;
  isFinalDecision: boolean;
  commitSha: string | null;
  provider: string | null;
  modelName: string | null;
  promptVersion: string | null;
  requestedAt: string | null;
  completedAt: string | null;
  normalizedOutput: Record<string, unknown> | null;
}

export type TechnicalFindingSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type TechnicalFindingType =
  | 'ARCHITECTURE'
  | 'SECURITY'
  | 'RELIABILITY'
  | 'PERFORMANCE'
  | 'TESTING'
  | 'AI_USAGE'
  | 'RAG'
  | 'AGENT'
  | 'DEPENDENCY'
  | 'MAINTAINABILITY';

export interface TechnicalFinding {
  id: string;
  aiReviewId: string;
  type?: TechnicalFindingType;
  severity: TechnicalFindingSeverity;
  title: string;
  evidence: string[];
  comment?: string | null;
  recommendedAction?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AiReviewCriterion {
  id: string;
  aiReviewId: string;
  criterionId?: string | null;
  name?: string;
  criterionName?: string;
  feedback?: string | null;
  qualitativeLevel?: string;
  comment?: string | null;
  evidence?: string[];
  risks?: string[];
  strengths?: string[];
  weaknesses?: string[];
  suggestions?: string[];
}

export interface SuggestedTestCase {
  id: string;
  aiReviewId: string;
  title: string;
  purpose?: string | null;
  expectedObservation?: string | null;
}

export interface SuggestedJudgeQuestion {
  id: string;
  aiReviewId: string;
  question: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  relatedCriterionId?: string | null;
}

export interface AiReviewDetail extends RepositoryAiReview {
  reviewCriteria: AiReviewCriterion[];
  technicalFindings: TechnicalFinding[];
  suggestedTestCases: SuggestedTestCase[];
  suggestedJudgeQuestions: SuggestedJudgeQuestion[];
}

export type JudgingBoardStatus = 'DRAFT' | 'ASSIGNED' | 'SCORING' | 'COMPLETED';

export interface JudgingBoardTeam {
  id: string;
  name: string;
  projectName: string | null;
  status: string;
}

export interface JudgingBoard {
  id: string;
  eventId: string;
  event: { id: string; title?: string } | null;
  roundId: string;
  round: { id: string; name?: string; roundType?: RoundType; status?: RoundStatus } | null;
  trackId: string | null;
  track: { id: string; code?: string; name?: string } | null;
  name: string;
  boardNumber: number;
  status: JudgingBoardStatus;
  maxTeams: number;
  teams: JudgingBoardTeam[];
  judges: UserSummary[];
  teamIds: string[];
  judgeIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ListJudgingBoardsQuery {
  page?: number;
  limit?: number;
  eventId?: string;
  roundId?: string;
  trackId?: string;
  status?: JudgingBoardStatus;
  search?: string;
}

export type RubricStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';

export interface Criterion {
  id: string;
  rubricId: string;
  name: string;
  description: string | null;
  maxScore: number;
  weight: number;
  order?: number;
  judgeOnly?: boolean;
  aiSupportForAudit?: boolean;
  aiInstruction?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Rubric {
  id: string;
  eventId: string;
  roundId?: string | null;
  event: { id: string; title?: string; status?: string } | null;
  round?: { id: string; name?: string; roundType?: RoundType; status?: RoundStatus } | null;
  title: string;
  description: string | null;
  totalScore: number | null;
  version?: number;
  status?: RubricStatus;
  criteria: Criterion[];
  createdAt: string;
  updatedAt: string;
}

export interface ListRubricsQuery {
  page?: number;
  limit?: number;
  eventId?: string;
  roundId?: string;
  status?: RubricStatus;
}

export type ScoreSheetStatus = 'DRAFT' | 'SUBMITTED' | 'LOCKED';

export interface ScoreEntry {
  id?: string;
  criterionId: string;
  criterion: { id: string; name: string; maxScore: number; weight: number; order?: number } | null;
  judgeId?: string;
  scoreValue: number;
  comment: string | null;
  isOverridden: boolean;
  overrideReason: string | null;
}

export interface ScoreSheet {
  id: string;
  eventId: string;
  roundId: string;
  round: { id: string; name?: string; roundType?: RoundType } | null;
  boardId: string | null;
  board: { id: string; name?: string; boardNumber?: number } | null;
  teamId: string;
  team: { id: string; name?: string; projectName?: string | null; chapterName?: string | null } | null;
  submissionId: string;
  submission?: { id: string; demoUrl: string | null; reportUrl: string | null; presentationUrl: string | null } | null;
  judgeId: string;
  judge: UserSummary | null;
  rubricId: string | null;
  rubric?: { id: string; title?: string; totalScore?: number | null } | null;
  totalScore: number;
  weightedScore: number;
  finalScore: number;
  generalComment: string | null;
  status: ScoreSheetStatus;
  submittedAt: string | null;
  lockedAt?: string | null;
  scores: ScoreEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface SubmitScoreSheetRequest {
  scoreSheetId?: string;
  eventId: string;
  roundId: string;
  boardId: string;
  teamId: string;
  submissionId: string;
  rubricId?: string | null;
  generalComment?: string | null;
  submit?: boolean;
  scores: { criterionId: string; scoreValue: number; comment?: string | null }[];
}

export interface ListScoreSheetsQuery {
  page?: number;
  limit?: number;
  eventId?: string;
  roundId?: string;
  teamId?: string;
  judgeId?: string;
  status?: ScoreSheetStatus;
}

export type RankingType = 'TEAM' | 'CHAPTER' | 'INDIVIDUAL';
export type TieBreakMethod = 'NONE' | 'PENALTY_EVALUATION' | 'MINI_TEST';

export interface RankingTeamSummary {
  id: string;
  name?: string;
  chapterName?: string | null;
  projectName?: string | null;
  boardNumber?: number | null;
  trackId?: string | null;
  status?: string;
}

export interface Ranking {
  id: string;
  eventId: string;
  event: { id: string; title?: string; status?: string } | null;
  rankingType: RankingType;
  roundId: string | null;
  round: { id: string; name?: string; roundType?: RoundType; status?: RoundStatus } | null;
  trackId: string | null;
  track: { id: string; code?: string; name?: string } | null;
  teamId: string | null;
  team: RankingTeamSummary | null;
  score: number;
  pointDelta: number;
  tieBreakMethod: TieBreakMethod;
  tieBreakScore: number;
  penaltyScore: number;
  miniTestScore: number;
  rank: number;
  calculationSource: string;
  calculationSummary: Record<string, unknown> | null;
  calculatedAt: string | null;
  isSelectedForFinal: boolean;
  selectionReason?: string | null;
  note?: string | null;
  publishedAt: string | null;
  publishedBy: UserSummary | null;
  createdAt: string;
  updatedAt: string;
}

export interface ListRankingsQuery {
  page?: number;
  limit?: number;
  eventId?: string;
  roundId?: string;
  trackId?: string;
  teamId?: string;
  rankingType?: RankingType;
}

export interface GenerateRankingsRequest {
  eventId: string;
  roundId: string;
  rankingType?: RankingType;
}

export interface GenerateRankingsResult {
  generated: number;
  rankings: Ranking[];
}

export interface SelectFinalistsRequest {
  eventId: string;
  roundId: string;
}

export interface SelectFinalistsResult {
  selected: number;
  rankings: Ranking[];
}

export type RepositoryAccessAction = 'NONE' | 'FREEZE' | 'REVOKE';

export interface PublishResultsRequest {
  eventId: string;
  roundId: string;
  repositoryAccessAction?: RepositoryAccessAction;
}

export interface PublishResultsResult {
  published: number;
  repositoryAccessAction: RepositoryAccessAction;
  notified?: number;
}
