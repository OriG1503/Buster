export const Role = {
  VIEWER: 'viewer',
  UPLOADER: 'uploader',
  EDITOR: 'editor',
} as const;

export type Role = (typeof Role)[keyof typeof Role];

export const ROLE_LEVEL: Record<Role, number> = {
  viewer: 1,
  uploader: 2,
  editor: 3,
};
