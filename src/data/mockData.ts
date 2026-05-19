export type SubmissionKey = 'demo' | 'report' | 'slides';
export type TimelineStatus = 'completed' | 'active' | 'pending';

export interface TeamMember {
  name: string; role: string; email: string; checkedIn: boolean; isMe: boolean;
}
export interface TimelineItem {
  date: string; title: string; status: TimelineStatus;
}
export interface RegistrationStep {
  label: string; detail: string; done: boolean;
}

export const myTeam = {
  name: 'Code Wizards',
  track: 'Web Development',
  board: 'Board A',
  repo: 'github.com/seal-2026/code-wizards',
  memberCount: 3,
};

export const teamMembers: TeamMember[] = [
  { name: 'Alice Chen', role: 'Team Leader', email: 'alice.chen@fpt.edu.vn', checkedIn: true, isMe: true },
  { name: 'David Nguyen', role: 'Member', email: 'david.n@fpt.edu.vn', checkedIn: true, isMe: false },
  { name: 'Mia Tran', role: 'Member', email: 'mia.tran@fpt.edu.vn', checkedIn: false, isMe: false },
];

export const registrationSteps: RegistrationStep[] = [
  { label: 'Account Registered', detail: 'Completed on May 1, 2026', done: true },
  { label: 'Team Joined', detail: 'Code Wizards', done: true },
  { label: 'Checked In', detail: 'May 15, 2026', done: true },
  { label: 'GitHub Access', detail: 'Access granted', done: true },
];

export const timeline: TimelineItem[] = [
  { date: 'May 1–10', title: 'Registration Period', status: 'completed' },
  { date: 'May 11–14', title: 'Team Formation', status: 'completed' },
  { date: 'May 15', title: 'Opening Ceremony & Check-in', status: 'completed' },
  { date: 'May 16–27', title: 'Coding Period', status: 'active' },
  { date: 'May 28', title: 'Final Submission', status: 'pending' },
  { date: 'May 29–30', title: 'Preliminary Judging', status: 'pending' },
  { date: 'May 31', title: 'Final Round & Awards', status: 'pending' },
];

export const uploadMeta: Record<SubmissionKey, { label: string; isUrl: boolean; placeholder: string }> = {
  demo: { label: 'Demo URL', isUrl: true, placeholder: 'https://your-demo.vercel.app' },
  report: { label: 'Project Report', isUrl: false, placeholder: 'report.pdf or paste a link' },
  slides: { label: 'Presentation Slides', isUrl: false, placeholder: 'slides.pptx or paste a link' },
};
