import { Role } from '../types/role.type';

export const GROUP_ROLE_MAP: Record<string, Role> = {
  buster_editor: Role.EDITOR,
  buster_uploader: Role.UPLOADER,
  buster_viewer: Role.VIEWER,
};

// Stub for the future external group-lookup call.
// Replace this with an HTTP call to the directory service when identity integration is ready.
export const MOCK_USER_GROUPS: string[] = ['buster_viewer', 'buster_uploader', 'buster_editor'];
