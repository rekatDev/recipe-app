import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthData } from './auth-data.model';
import { Subject } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { map } from 'rxjs/operators';

const BACKEND_URL = environment.apiUrl + '/user/';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private tokenTimer: any;
  private isAuth = false;
  private token: string;
  private refreshToken: string;
  private authStatusListener = new Subject<boolean>();
  private userId: string;

  constructor(public http: HttpClient, public router: Router) {}

  createUser(email: string, password: string) {
    const authData: AuthData = {
      email: email,
      password: password
    };
    this.http.post(BACKEND_URL + 'signup', authData).subscribe(
      response => {
        this.router.navigate(['/auth/login']);
      },
      error => {
        this.authStatusListener.next(false);
      }
    );
  }

  login(email: string, password: string) {
    const authData: AuthData = {
      email: email,
      password: password
    };
    this.http
      .post<{
        token: string;
        expiresIn: number;
        userId: string;
        refreshToken: string;
      }>(BACKEND_URL + 'login', authData)
      .subscribe(
        response => {
          const token = response.token;
          const refreshToken = response.refreshToken;
          this.token = token;
          this.refreshToken = refreshToken;
          this.userId = response.userId;

          if (token) {
            // const expiresDuration = response.expiresIn;
            // this.setAuthTimer(expiresDuration);
            this.isAuth = true;
            this.authStatusListener.next(true);
            const now = new Date();
            // const expirationDate = new Date(
            //   now.getTime() + expiresDuration * 1000
            // );
            this.saveAuthData(token, refreshToken, this.userId);
            this.router.navigate(['/']);
          }
        },
        error => {
          this.authStatusListener.next(false);
        }
      );
  }

  getToken() {
    return this.token;
  }

  getUserId() {
    return this.userId;
  }

  getAuthStatus() {
    return this.isAuth;
  }

  getAuthStatusListener() {
    return this.authStatusListener.asObservable();
  }

  private setAuthTimer(duration: number) {
    this.tokenTimer = setTimeout(() => {
      this.logout();
    }, duration * 1000);
  }

  logout() {
    let headers = new HttpHeaders().set('Content-Type', 'application/json');
    headers = headers.set('x-auth', 'Bearer ' + this.refreshToken);

    this.http
      .delete(BACKEND_URL + 'refreshtoken', { headers })
      .subscribe(res => {
        this.token = null;
        this.isAuth = false;
        this.authStatusListener.next(false);
        this.userId = null;
        this.router.navigate(['/']);
        this.clearAuthData();
      });
  }

  refreshTokens() {
    let headers = new HttpHeaders().set('Content-Type', 'application/json');
    headers = headers.set('x-auth', 'Bearer ' + this.refreshToken);
    console.log(this.refreshToken);
    return this.http
      .get<{ token: string }>(BACKEND_URL + 'refreshtoken', { headers })
      .pipe(
        map(res => {
          console.log(this.token);
          this.token = res.token;
          return res;
        })
      );
  }
  autoAuthUser() {
    const data = this.getAuthData();
    if (!data) {
      return;
    }
    // const now = new Date();
    // const expiresIn = data.expirationDate.getTime() - now.getTime();

    // if (expiresIn > 0) {
    this.token = data.token;
    this.refreshToken = data.refreshToken;
    this.isAuth = true;
    this.userId = data.userId;
    this.authStatusListener.next(true);
    // this.setAuthTimer(expiresIn / 1000);
    // }
  }

  private saveAuthData(token: string, refreshToken: string, userId: string) {
    localStorage.setItem('token', token);
    localStorage.setItem('refreshToken', refreshToken);
    // localStorage.setItem('expirationDate', expirationDate.toISOString());
    localStorage.setItem('userId', userId);
  }

  private clearAuthData() {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userId');
  }

  private getAuthData() {
    const token = localStorage.getItem('token');
    const refreshToken = localStorage.getItem('refreshToken');
    // const expirationDate = localStorage.getItem('expirationDate');
    const userId = localStorage.getItem('userId');

    if (!token && !refreshToken) {
      return;
    }

    return {
      token,
      refreshToken,
      // expirationDate: new Date(expirationDate),
      userId
    };
  }
}
