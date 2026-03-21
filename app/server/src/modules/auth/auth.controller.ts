import { Controller, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { LoginResponse } from './types/login-response.type';

@Controller('auth')
export class AuthController {
  public constructor(private readonly _authService: AuthService) {}

  @Get('me')
  @Public()
  public getMe(): LoginResponse {
    return this._authService.getMe();
  }
}
