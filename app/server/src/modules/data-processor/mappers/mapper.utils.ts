export const nullIfEmpty = (value: string | null | undefined): string | null =>
  value === '' || value === null || value === undefined ? null : value;

export const parseBool = (value: string | null | undefined): boolean | null => {
  if (value === 'True') { return true; }
  if (value === 'False') { return false; }
  return null;
};

/**
 * Parses a user-provided date string into an ISO-8601 string.
 * Primary format: DD/MM/YYYY HH:mm:ss (e.g. "25/10/2006 21:32:45") or DD/MM/YYYY.
 * Falls back to native Date parsing for ISO, RFC, and other standard formats.
 * Returns null for empty, missing, or unparseable values.
 */
export const parseSourceTime = (value: string | null | undefined): string | null => {
  if (!value?.trim()) { return null; }
  const trimmed = value.trim();
  const ddmmMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{1,2}):(\d{1,2}))?$/);
  if (ddmmMatch) {
    const [, day, month, year, hours = '0', minutes = '0', seconds = '0'] = ddmmMatch;
    const date = new Date(Number(year), Number(month) - 1, Number(day), Number(hours), Number(minutes), Number(seconds));
    if (!isNaN(date.getTime())) { return date.toISOString(); }
  }
  const fallback = new Date(trimmed);
  return isNaN(fallback.getTime()) ? null : fallback.toISOString();
};
