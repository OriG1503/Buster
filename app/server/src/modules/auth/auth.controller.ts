import { Controller, Get } from '@nestjs/common';
import { LoggerService } from '../../shared/services/logger/logger.service';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { LoginResponse } from './types/login-response.type';

@Controller('auth')
export class AuthController {
  public constructor(
    private readonly _authService: AuthService,
    private readonly _logger: LoggerService,
  ) {}

  @Get('me')
  @Public()
  public getMe(): LoginResponse {
    this._logger.info('AuthController.getMe — GET /api/auth/me', 'app-workflow');
    return this._authService.getMe();
  }
}
