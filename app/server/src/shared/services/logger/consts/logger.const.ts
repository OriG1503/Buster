import { LogUser } from '../types/log-user.type';

export const LOGGER_PROJECT = 'buster';
export const LOGGER_COMPONENT = 'server';

export const LOGGER_DEFAULT_USER: LogUser = {
  email: 'system@buster.local',
  name: 'system',
  role: 'system',
};
