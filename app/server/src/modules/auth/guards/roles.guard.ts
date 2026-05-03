import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { LoggerService } from '../../../shared/services/logger/logger.service';
import { REQUIRED_ROLE_KEY } from '../decorators/require-role.decorator';
import { JwtPayload } from '../types/jwt-payload.type';
import { Role } from '../types/role.type';
import { ROLE_LEVEL } from '../consts/role-level.const';

@Injectable()
export class RolesGuard implements CanActivate {
  public constructor(
    private readonly _reflector: Reflector,
    private readonly _logger: LoggerService,
  ) {}

  public canActivate(context: ExecutionContext): boolean {
    const requiredRole = this._reflector.getAllAndOverride<Role>(REQUIRED_ROLE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const handler = context.getHandler().name;

    if (!requiredRole) {
      this._logger.debug(`RolesGuard skipped — no role required on handler "${handler}"`, 'app-workflow');
      return true;
    }

    const user: JwtPayload = context.switchToHttp().getRequest()['user'];
    if (user && ROLE_LEVEL[user.role] >= ROLE_LEVEL[requiredRole]) {
      this._logger.debug(
        `RolesGuard accepted — user "${user.email}" role "${user.role}" passes required "${requiredRole}" on handler "${handler}"`,
        'app-workflow',
      );
      return true;
    }

    this._logger.warn(
      `RolesGuard rejected — user "${user?.email ?? 'unknown'}" role "${user?.role ?? 'none'}" below required "${requiredRole}" on handler "${handler}"`,
      'app-workflow',
    );
    throw new ForbiddenException();
  }
}
