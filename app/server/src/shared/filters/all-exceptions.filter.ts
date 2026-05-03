import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { LoggerService } from '../services/logger/logger.service';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  public constructor(private readonly _logger: LoggerService) {}

  public catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const { method, url } = ctx.getRequest<Request>();

    if (exception instanceof HttpException) {
      this._handleHttpException(exception, res, method, url);
    } else {
      this._handleUnexpectedException(exception, res, method, url);
    }
  }

  private _handleHttpException(exception: HttpException, res: Response, method: string, url: string): void {
    const status = exception.getStatus();
    const body = exception.getResponse();
    const message =
      typeof body === 'string' ? body : ((body as Record<string, unknown>)['message'] ?? exception.message);
    //LOG
    this._logger.warn(`HTTP exception — ${method} ${url} → ${status}: ${String(message)}`, 'app-workflow');
    res.status(status).json(body);
  }

  private _handleUnexpectedException(exception: unknown, res: Response, method: string, url: string): void {
    const stack =
      exception instanceof Error ? `${exception.message} | stack: ${exception.stack ?? ''}` : String(exception);
    //LOG
    this._logger.error(`Unhandled exception — ${method} ${url} → 500: ${stack}`, 'app-workflow');
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ statusCode: 500, message: 'Internal server error' });
  }
}
