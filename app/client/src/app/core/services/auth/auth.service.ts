import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, tap } from 'rxjs';

import { Role, ROLE_LEVEL } from '../../../shared/consts/role.consts';
import { JwtPayload } from './types/jwt-payload.type';
import { MeResponse } from './types/me-response.type';
import { TOKEN_KEY, BUSTER_GROUP_ROLE } from './auth.consts';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _http = inject(HttpClient);

  /**
   * Calls GET /api/auth/me — the server issues a signed JWT containing { sub, email, groups, role }
   * derived from the configured mock groups (or real directory groups in production).
   * Stores the returned token in localStorage.
   */
  public fetchMe(): Observable<void> {
    return this._http.get<MeResponse>('/api/auth/me').pipe(
      tap((res) => localStorage.setItem(TOKEN_KEY, res.accessToken)),
      map(() => undefined),
    );
  }

  public logout(): void {
    localStorage.removeItem(TOKEN_KEY);
  }

  public getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  public getPayload(): JwtPayload | null {
    const token = this.getToken();
    if (!token) { return null; }
    try {
      const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(atob(base64)) as JwtPayload;
    } catch {
      return null;
    }
  }

  public isTokenExpired(): boolean {
    const payload = this.getPayload();
    if (!payload?.exp) { return true; }
    return Date.now() / 1000 > payload.exp;
  }

  public isLoggedIn(): boolean {
    return !this.isTokenExpired();
  }

  /** Returns true if the token contains at least one recognised buster group. */
  public hasBusterAccess(): boolean {
    return this.isLoggedIn() && (this.getPayload()?.groups ?? []).some((g) => g in BUSTER_GROUP_ROLE);
  }

  /** Derives the highest role from the buster groups present in the token. */
  public getRole(): Role {
    const groups = this.getPayload()?.groups ?? [];
    return groups.reduce<Role>((highest, group) => {
      const groupRole = BUSTER_GROUP_ROLE[group];
      if (groupRole && ROLE_LEVEL[groupRole] > ROLE_LEVEL[highest]) { return groupRole; }
      return highest;
    }, Role.VIEWER);
  }
}
