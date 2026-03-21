import { SetMetadata } from '@nestjs/common';
import { Role } from '../types/role.type';

export const REQUIRED_ROLE_KEY = 'requiredRole';
export const RequireRole = (role: Role): MethodDecorator & ClassDecorator => SetMetadata(REQUIRED_ROLE_KEY, role);
