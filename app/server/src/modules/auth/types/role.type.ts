export const Role = {
  VIEWER: 'viewer',
  UPLOADER: 'uploader',
  EDITOR: 'editor',
} as const;

export type Role = (typeof Role)[keyof typeof Role];


export type JwtPayload = {
  sub: string;
  email: string;
  groups: string[];
  role: Role;
  iat?: number;
  exp?: number;
};
