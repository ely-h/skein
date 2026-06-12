import {
  addDays as dfAddDays,
  differenceInCalendarDays,
  format,
  isValid,
  parseISO,
  clamp as dfClamp,
} from 'date-fns';

export function parseDate(dateStr: string): Date {
  return parseISO(dateStr);
}

export function formatDate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function addDays(dateStr: string, days: number): string {
  return formatDate(dfAddDays(parseISO(dateStr), days));
}

export function diffInDays(startStr: string, endStr: string): number {
  return differenceInCalendarDays(parseISO(endStr), parseISO(startStr));
}

// Vérifie qu'une chaîne est une date YYYY-MM-DD valide et calendairement correcte.
export function isValidDateString(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  return isValid(parseISO(dateStr));
}

export function today(): string {
  return formatDate(new Date());
}

export function clampDate(dateStr: string, minStr: string, maxStr: string): string {
  const clamped = dfClamp(parseISO(dateStr), {
    start: parseISO(minStr),
    end: parseISO(maxStr),
  });
  return formatDate(clamped);
}
