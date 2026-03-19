export const nullIfEmpty = (value: string | null | undefined): string | null =>
  value === '' || value === null || value === undefined ? null : value;

export const parseBool = (value: string | null | undefined): boolean | null => {
  if (value === 'True') { return true; }
  if (value === 'False') { return false; }
  return null;
};
