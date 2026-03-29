import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  private readonly _logger = new Logger('HTTP');

  public use(req: Request, res: Response, next: NextFunction): void {
    const { method, originalUrl } = req;
    const start = Date.now();
    res.on('finish', () => this._logRequest(method, originalUrl, res.statusCode, Date.now() - start));
    next();
  }

  private _logRequest(method: string, url: string, statusCode: number, duration: number): void {
    const message = `${method} ${url} → ${statusCode} (${duration}ms)`;
    if (statusCode >= 500) {
      this._logger.error(message);
    } else if (statusCode >= 400) {
      this._logger.warn(message);
    } else {
      this._logger.log(message);
    }
  }
}
