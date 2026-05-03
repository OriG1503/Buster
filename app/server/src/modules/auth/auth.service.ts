import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoggerService } from '../../shared/services/logger/logger.service';
import { GROUP_ROLE_MAP, MOCK_USER_GROUPS } from './consts/mail-groups.consts';
import { LoginResponse } from './types/login-response.type';
import { JwtPayload } from './types/jwt-payload.type';
import { Role } from './types/role.type';
import { ROLE_LEVEL } from './consts/role-level.const';

@Injectable()
export class AuthService {
  public constructor(
    private readonly _jwtService: JwtService,
    private readonly _logger: LoggerService,
  ) {}

  public getMe(): LoginResponse {
    //LOG
    this._logger.info('AuthService.getMe called — building mock JWT payload', 'app-workflow');
    // TODO: Replace MOCK_USER_GROUPS with a real group-lookup call to the directory service.
    const groups = MOCK_USER_GROUPS;
    const role = this._deriveRole(groups);
    const email = 'mock@local';
    const payload: JwtPayload = { sub: email, email, groups, role };
    //LOG
    this._logger.debug(
      `AuthService.getMe — JWT payload assembled for "${email}" with role "${role}" and groups [${groups.join(', ')}]`,
      'app-workflow',
    );
    const accessToken = this._jwtService.sign(payload);
    //LOG
    this._logger.info(`AuthService.getMe — JWT signed and returned for user "${email}"`, 'app-workflow');
    return { accessToken, role, email };
  }

  private _deriveRole(groups: string[]): Role {
    const role = groups.reduce<Role>((highest, group) => {
      const groupRole = GROUP_ROLE_MAP[group];
      if (groupRole && ROLE_LEVEL[groupRole] > ROLE_LEVEL[highest]) {
        return groupRole;
      }
      return highest;
    }, Role.VIEWER);
    //LOG
    this._logger.debug(
      `AuthService._deriveRole — derived role "${role}" from groups [${groups.join(', ')}]`,
      'app-workflow',
    );
    return role;
  }
}
