import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthData } from './auth-data.model';
import { Subject } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

const BACKEND_URL = environment.apiUrl + '/user/';

@Injectable({ providedIn: 'root'})
export class AuthService {

  private tokenTimer: any;
  private isAuth = false;
  private token: string;
  private authStatusListener = new Subject<boolean>();
  private userId: string;

  constructor(public http: HttpClient, public router: Router) {
  }

  createUser(email: string, password: string) {
    const authData: AuthData = {
      email: email,
      password: password
    };
    this.http.post(BACKEND_URL + 'signup', authData)
    .subscribe(response => {
      this.router.navigate(['/auth/login']);
    },
    error => {
      this.authStatusListener.next(false);
    });

  }

  login(email: string, password: string) {
    const authData: AuthData = {
      email: email,
      password: password
    };
    this.http.post<{token: string, expiresIn: number, userId: string}>(BACKEND_URL + 'login', authData)
    .subscribe(response => {
      const token = response.token;
      this.token = token;
      this.userId = response.userId;

      if (token) {
        const expiresDuration = response.expiresIn;
        this.setAuthTimer(expiresDuration);
        this.isAuth = true;
        this.authStatusListener.next(true);
        const now = new Date();
        const expirationDate = new Date(now.getTime() + expiresDuration * 1000);
        this.saveAuthData(token, expirationDate, this.userId);
        this.router.navigate(['/']);
      }
    },
    error => {
      this.authStatusListener.next(false);
    });
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
    this.token = null;
    this.isAuth = false;
    this.authStatusListener.next(false);
    this.userId = null;
    this.router.navigate(['/']);
    this.clearAuthData();
    clearTimeout(this.tokenTimer);
  }
  autoAuthUser() {
    const data = this.getAuthData();
    if (!data) {
      return;
    }
    const now = new Date();
    const expiresIn = data.expirationDate.getTime() - now.getTime();

    if (expiresIn > 0 ) {
      this.token = data.token;
      this.isAuth = true;
      this.userId = data.userId;
      this.authStatusListener.next(true);
      this.setAuthTimer(expiresIn / 1000);
    }

  }

  private saveAuthData(token: string, expirationDate: Date, userId: string) {
    localStorage.setItem('token', token);
    localStorage.setItem('expirationDate', expirationDate.toISOString());
    localStorage.setItem('userId', userId);
  }

  private clearAuthData() {
    localStorage.removeItem('token');
    localStorage.removeItem('expirationDate');
    localStorage.removeItem('userId');
  }

  private getAuthData() {
    const token = localStorage.getItem('token');
    const expirationDate = localStorage.getItem('expirationDate');
    const userId = localStorage.getItem('userId');

    if (!token && !expirationDate) {
      return;
    }

    return {
      token: token,
      expirationDate: new Date(expirationDate),
      userId: userId
    };
  }

}
