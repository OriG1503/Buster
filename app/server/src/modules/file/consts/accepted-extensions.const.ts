export const ACCEPTED_EXTENSIONS = ['.csv', '.xlsx', '.xls'] as const;

/** UTF-8 BOM byte sequence — present at the start of UTF-8 encoded files with BOM. */
export const UTF8_BOM = Buffer.from([0xef, 0xbb, 0xbf]);
