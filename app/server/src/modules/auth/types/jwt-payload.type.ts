import { Role } from './role.type';

export type JwtPayload = {
  sub: string;
  email: string;
  groups: string[];
  role: Role;
  iat?: number;
  exp?: number;
};
