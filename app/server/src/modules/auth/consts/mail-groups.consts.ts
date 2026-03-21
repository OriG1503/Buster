import { Role } from '../types/role.type';

export const GROUP_ROLE_MAP: Record<string, Role> = {
  'buster-editors': Role.EDITOR,
  'buster-uploaders': Role.UPLOADER,
  'buster-viewers': Role.VIEWER,
};

// Stub for the future external group-lookup call.
// Replace this with an HTTP call to the directory service when identity integration is ready.
export const MOCK_USER_GROUPS: string[] = ['buster-viewers', 'buster-uploaders', 'buster-editors'];
