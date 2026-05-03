import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { LoggerService } from '../services/logger/logger.service';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  public constructor(private readonly _logger: LoggerService) {}

  public use(req: Request, res: Response, next: NextFunction): void {
    const { method, originalUrl } = req;
    const start = Date.now();
    //LOG
    this._logger.info(`HTTP request received — ${method} ${originalUrl}`, 'app-workflow');
    res.on('finish', () => this._logRequest(method, originalUrl, res.statusCode, Date.now() - start));
    next();
  }

  private _logRequest(method: string, url: string, statusCode: number, duration: number): void {
    const message = `HTTP response sent — ${method} ${url} → ${statusCode} (${duration}ms)`;
    if (statusCode >= 500) {
      //LOG
      this._logger.error(message, 'app-workflow');
    } else if (statusCode >= 400) {
      //LOG
      this._logger.warn(message, 'app-workflow');
    } else {
      //LOG
      this._logger.info(message, 'app-workflow');
    }
  }
}
