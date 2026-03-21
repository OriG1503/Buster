import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { JwtPayload } from '../types/role.type';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  public constructor(
    private readonly _jwtService: JwtService,
    private readonly _reflector: Reflector,
  ) {}

  public canActivate(context: ExecutionContext): boolean {
    if (this._isPublic(context)) {
      return true;
    }

    const token = this._extractToken(context);
    if (!token) {
      throw new UnauthorizedException();
    }

    try {
      const payload = this._jwtService.verify<JwtPayload>(token);
      context.switchToHttp().getRequest()['user'] = payload;
      return true;
    } catch {
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
