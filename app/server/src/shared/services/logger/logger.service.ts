import { Injectable } from '@nestjs/common';
import * as winston from 'winston';
import { LOGGER_COMPONENT, LOGGER_DEFAULT_USER, LOGGER_PROJECT } from './consts/logger.const';
import { EcsLogPayload } from './types/ecs-log-payload.type';
import { LogContext } from './types/log-context.type';
import { LogUser } from './types/log-user.type';

type WinstonLevel = 'info' | 'warn' | 'error' | 'debug' | 'verbose';

@Injectable()
export class LoggerService {
  private readonly _winston: winston.Logger;
  private readonly _project: string = LOGGER_PROJECT;
  private readonly _component: string = LOGGER_COMPONENT;
  private readonly _environment: string = process.env.NODE_ENV ?? 'development';
  private readonly _user: LogUser = LOGGER_DEFAULT_USER;

  public constructor() {
    this._winston = winston.createLogger({
      level: 'verbose',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      ),
      transports: [new winston.transports.Console()],
    });
  }

  public log(message: string, logContext: LogContext): void {
    this._write('info', message, logContext);
  }

  public info(message: string, logContext: LogContext): void {
    this._write('info', message, logContext);
  }

  public warn(message: string, logContext: LogContext): void {
    this._write('warn', message, logContext);
  }

  public error(message: string, logContext: LogContext): void {
    this._write('error', message, logContext);
  }

  public debug(message: string, logContext: LogContext): void {
    this._write('debug', message, logContext);
  }

  public verbose(message: string, logContext: LogContext): void {
    this._write('verbose', message, logContext);
  }

  private _write(level: WinstonLevel, message: string, logContext: LogContext): void {
    const payload: EcsLogPayload = {
      project: this._project,
      component: this._component,
      environment: this._environment,
      message,
      user: this._user,
      logContext,
    };
    this._winston.log(level, payload);
  }
}
