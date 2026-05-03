import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { LoggerService } from '../../../shared/services/logger/logger.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { JwtPayload } from '../types/jwt-payload.type';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  public constructor(
    private readonly _jwtService: JwtService,
    private readonly _reflector: Reflector,
    private readonly _logger: LoggerService,
  ) {}

  public canActivate(context: ExecutionContext): boolean {
    const handler = context.getHandler().name;
    if (this._isPublic(context)) {
      //LOG
      this._logger.debug(`JwtAuthGuard skipped — public route handler "${handler}"`, 'app-workflow');
      return true;
    }

    const token = this._extractToken(context);
    if (!token) {
      //LOG
      this._logger.warn(`JwtAuthGuard rejected — no Bearer token on handler "${handler}"`, 'app-workflow');
      throw new UnauthorizedException();
    }

    try {
      const payload = this._jwtService.verify<JwtPayload>(token);
      context.switchToHttp().getRequest()['user'] = payload;
      //LOG
      this._logger.debug(
        `JwtAuthGuard accepted — user "${payload.email}" role "${payload.role}" on handler "${handler}"`,
        'app-workflow',
      );
      return true;
    } catch {
      //LOG
      this._logger.warn(`JwtAuthGuard rejected — invalid/expired token on handler "${handler}"`, 'app-workflow');
      throw new UnauthorizedException();
    }
  }

  private _isPublic(context: ExecutionContext): boolean {
    return (
      this._reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()]) ?? false
    );
  }

  private _extractToken(context: ExecutionContext): string | null {
    const authHeader: string | undefined = context.switchToHttp().getRequest().headers['authorization'];
    if (!authHeader?.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.slice(7);
  }
}
