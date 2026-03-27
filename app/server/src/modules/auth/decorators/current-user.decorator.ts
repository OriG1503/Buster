import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from '../types/role.type';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayload => ctx.switchToHttp().getRequest()['user'],
);
