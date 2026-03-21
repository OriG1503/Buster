export const Role = {
  VIEWER: 'viewer',
  UPLOADER: 'uploader',
  EDITOR: 'editor',
} as const;

export type Role = (typeof Role)[keyof typeof Role];

export const ROLE_LEVEL: Record<Role, number> = {
  [Role.VIEWER]: 1,
  [Role.UPLOADER]: 2,
  [Role.EDITOR]: 3,
};

export type JwtPayload = {
  sub: string;
  email: string;
  groups: string[];
  role: Role;
  iat?: number;
  exp?: number;
};
