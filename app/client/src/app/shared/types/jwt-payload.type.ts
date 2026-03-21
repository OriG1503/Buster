import { Role } from '../consts/role.consts';

export type JwtPayload = {
  sub: string;
  email: string;
  groups: string[];
  role: Role;
  exp?: number;
  iat?: number;
};
