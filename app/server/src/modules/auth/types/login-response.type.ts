import { Role } from './role.type';

export type LoginResponse = {
  accessToken: string;
  role: Role;
  email: string;
};
