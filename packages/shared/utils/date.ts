import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns';

export function formatDate(date: string | Date, pattern = 'MMM d, yyyy'): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return '';
  return format(d, pattern);
}

export function formatDateTime(date: string | Date): string {
  return formatDate(date, 'MMM d, yyyy h:mm a');
}

export function formatRelative(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return '';
  return formatDistanceToNow(d, { addSuffix: true });
}

export function toISODate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function isOverdue(dueDate: string | Date): boolean {
  const d = typeof dueDate === 'string' ? parseISO(dueDate) : dueDate;
  return d < new Date();
}
