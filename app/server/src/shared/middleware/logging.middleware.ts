import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  private readonly _logger = new Logger('HTTP');

  public use(req: Request, res: Response, next: NextFunction): void {
    const { method, originalUrl } = req;
    const start = Date.now();

    res.on('finish', () => {
      const { statusCode } = res;
      const duration = Date.now() - start;
      const log = `${method} ${originalUrl} → ${statusCode} (${duration}ms)`;

      if (statusCode >= 500) {
        this._logger.error(log);
      } else if (statusCode >= 400) {
        this._logger.warn(log);
      } else {
        this._logger.log(log);
      }
    });

    next();
  }
}
