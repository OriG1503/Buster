import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { LoggerService } from '../services/logger/logger.service';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  public constructor(private readonly _logger: LoggerService) {}

  public catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = exception instanceof HttpException ? exception.getResponse() : 'Internal server error';

    const detail =
      exception instanceof Error ? `${exception.message} | stack: ${exception.stack ?? ''}` : String(exception);
    //LOG
    this._logger.error(
      `Unhandled exception — [${request.method}] ${request.url} → ${status}: ${detail}`,
      'app-workflow',
    );

    response.status(status).json({
      statusCode: status,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
