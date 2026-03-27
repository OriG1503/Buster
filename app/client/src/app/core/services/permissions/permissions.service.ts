import { inject, Injectable } from '@angular/core';
import { ROLE_LEVEL, Role } from '../../../shared/consts/role.consts';
import { AuthService } from '../auth/auth.service';

@Injectable({ providedIn: 'root' })
export class PermissionsService {
  private readonly _authService = inject(AuthService);

  public canUpload(): boolean {
    return this._getRoleLevel() >= ROLE_LEVEL[Role.UPLOADER];
  }

  public canEdit(): boolean {
    return this._getRoleLevel() >= ROLE_LEVEL[Role.EDITOR];
  }

  private _getRoleLevel(): number {
    if (!this._authService.hasBusterAccess()) { return 0; }
    return ROLE_LEVEL[this._authService.getRole()];
  }
}
