import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { GROUP_ROLE_MAP, MOCK_USER_GROUPS } from './consts/mail-groups.consts';
import { LoginResponse } from './types/login-response.type';
import { JwtPayload, Role, ROLE_LEVEL } from './types/role.type';

@Injectable()
export class AuthService {
  public constructor(
    private readonly _jwtService: JwtService,
    private readonly _configService: ConfigService,
  ) {}

  public getMe(): LoginResponse {
    const role = this._resolveRole();
    const email = 'mock@local';
    const groups = this._getGroupsForRole(role);
    const payload: JwtPayload = { sub: email, email, groups, role };
    const accessToken = this._jwtService.sign(payload);
    return { accessToken, role, email };
  }

  // TODO: Replace _getMockGroups with a call to the external directory service.
  // When identity integration is added, accept the user identifier as a parameter here.
  private _resolveRole(): Role {
    const devRole = this._configService.get<string>('DEV_ROLE');
    if (devRole && Object.values(Role).includes(devRole as Role)) {
      return devRole as Role;
    }
    return this._deriveRole(this._getMockGroups());
  }

  private _getMockGroups(): string[] {
    return MOCK_USER_GROUPS;
  }

  private _deriveRole(groups: string[]): Role {
    return groups.reduce<Role>((highest, group) => {
      const groupRole = GROUP_ROLE_MAP[group];
      if (groupRole && ROLE_LEVEL[groupRole] > ROLE_LEVEL[highest]) {
        return groupRole;
      }
      return highest;
    }, Role.VIEWER);
  }

  private _getGroupsForRole(role: Role): string[] {
    return Object.entries(GROUP_ROLE_MAP)
      .filter(([, r]) => ROLE_LEVEL[r] <= ROLE_LEVEL[role])
      .map(([group]) => group);
  }
}
