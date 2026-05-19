export const Colors = {
  primary: '#2563EB',
  primaryDark: '#1D4ED8',
  primaryLight: '#EFF6FF',
  background: '#F9FAFB',
  surface: '#FFFFFF',
  border: '#E5E7EB',
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  green: '#22C55E',
  greenLight: '#DCFCE7',
  greenDark: '#166534',
  greenBorder: '#BBF7D0',
  yellow: '#EAB308',
  red: '#DC2626',
  redLight: '#FEF2F2',
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  blue50: '#EFF6FF',
  blue100: '#DBEAFE',
  blue700: '#1D4ED8',
} as const;

export const Radius = {
  sm: 6, md: 8, lg: 12, xl: 16, full: 9999,
} as const;

export const Shadow = {
  sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  md: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  lg: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 20, elevation: 8 },
} as const;
