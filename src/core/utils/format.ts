export function formatDateTime(value?: string | null) {
  if (!value) return 'Not scheduled';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Invalid date';
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatDateRange(start?: string | null, end?: string | null) {
  if (!start && !end) return 'Dates not announced';
  if (start && end) return `${formatDateTime(start)} - ${formatDateTime(end)}`;
  return formatDateTime(start || end);
}

export function initials(name?: string | null, email?: string | null) {
  const source = name?.trim() || email?.split('@')[0] || 'U';
  return source
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return 'Something went wrong';
}
