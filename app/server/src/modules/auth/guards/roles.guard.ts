import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRED_ROLE_KEY } from '../decorators/require-role.decorator';
import { JwtPayload, Role } from '../types/role.type';
import { ROLE_LEVEL } from '../consts/role-level.const';

@Injectable()
export class RolesGuard implements CanActivate {
  public constructor(private readonly _reflector: Reflector) {}

  public canActivate(context: ExecutionContext): boolean {
    const requiredRole = this._reflector.getAllAndOverride<Role>(REQUIRED_ROLE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRole) {
      return true;
    }

    const user: JwtPayload = context.switchToHttp().getRequest()['user'];
    if (ROLE_LEVEL[user.role] >= ROLE_LEVEL[requiredRole]) {
      return true;
    }

    throw new ForbiddenException();
  }
}
