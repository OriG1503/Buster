import { LogContext } from './log-context.type';
import { LogUser } from './log-user.type';

export type EcsLogPayload = {
  project: string;
  component: string;
  environment: string;
  message: string;
  user: LogUser;
  logContext: LogContext;
};
