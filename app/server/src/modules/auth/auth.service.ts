import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { GROUP_ROLE_MAP, MOCK_USER_GROUPS } from './consts/mail-groups.consts';
import { LoginResponse } from './types/login-response.type';
import { JwtPayload, Role, ROLE_LEVEL } from './types/role.type';

@Injectable()
export class AuthService {
  public constructor(private readonly _jwtService: JwtService) {}

  public getMe(): LoginResponse {
    // TODO: Replace MOCK_USER_GROUPS with a real group-lookup call to the directory service.
    const groups = MOCK_USER_GROUPS;
    const role = this._deriveRole(groups);
    const email = 'mock@local';
    const payload: JwtPayload = { sub: email, email, groups, role };
    const accessToken = this._jwtService.sign(payload);
    return { accessToken, role, email };
  }

  private _deriveRole(groups: string[]): Role {
    return groups.reduce<Role>((highest, group) => {
      const groupRole = GROUP_ROLE_MAP[group];
      if (groupRole && ROLE_LEVEL[groupRole] > ROLE_LEVEL[highest]) { return groupRole; }
      return highest;
    }, Role.VIEWER);
  }
}
