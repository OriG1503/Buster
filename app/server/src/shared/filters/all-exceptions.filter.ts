import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly _logger = new Logger('Exception');

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
    const message = typeof body === 'string' ? body : (body as Record<string, unknown>)['message'] ?? exception.message;
    this._logger.warn(`${method} ${url} → ${status}: ${message}`);
    res.status(status).json(body);
  }

  private _handleUnexpectedException(exception: unknown, res: Response, method: string, url: string): void {
    const stack = exception instanceof Error ? exception.stack : String(exception);
    this._logger.error(`${method} ${url} → 500: Unhandled exception`, stack);
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ statusCode: 500, message: 'Internal server error' });
  }
}
