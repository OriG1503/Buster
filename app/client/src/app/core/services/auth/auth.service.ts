import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, tap } from 'rxjs';
import { JwtPayload } from '../../../shared/types/jwt-payload.type';
import { MeResponse } from '../../../shared/types/me-response.type';

const TOKEN_KEY = 'buster_access_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _http = inject(HttpClient);

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
    if (!token) {
      return null;
    }
    try {
      const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(atob(base64)) as JwtPayload;
    } catch {
      return null;
    }
  }

  public isTokenExpired(): boolean {
    const payload = this.getPayload();
    if (!payload?.exp) {
      return true;
    }
    return Date.now() / 1000 > payload.exp;
  }

  public isLoggedIn(): boolean {
    return !this.isTokenExpired();
  }
}
