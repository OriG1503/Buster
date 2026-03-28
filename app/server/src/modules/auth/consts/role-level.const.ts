import { Role } from '../types/role.type';

/** Numeric rank for each role — used to compare whether a user meets a required minimum. */
export const ROLE_LEVEL: Record<Role, number> = {
  [Role.VIEWER]: 1,
  [Role.UPLOADER]: 2,
  [Role.EDITOR]: 3,
};
