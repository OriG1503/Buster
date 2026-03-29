import { Role } from '../../../shared/consts/role.consts';

export const TOKEN_KEY = 'buster_access_token';

export const BUSTER_GROUP_ROLE: Record<string, Role> = {
  buster_editor: Role.EDITOR,
  buster_uploader: Role.UPLOADER,
  buster_viewer: Role.VIEWER,
};
