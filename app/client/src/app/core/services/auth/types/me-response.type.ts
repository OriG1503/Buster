import { Role } from '../../../../shared/consts/role.consts';

export type MeResponse = {
  accessToken: string;
  role: Role;
  email: string;
};
