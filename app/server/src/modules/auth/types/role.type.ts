export const Role = {
  VIEWER: 'viewer',
  UPLOADER: 'uploader',
  EDITOR: 'editor',
} as const;

export type Role = (typeof Role)[keyof typeof Role];
