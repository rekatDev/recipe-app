import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpErrorResponse
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { catchError, mergeMap } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable()
export class AuthRefreshInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler) {
    const firstReq = this.cloneAndAddHeaders(req);

    return next.handle(firstReq).pipe(
      catchError(err => {
        if (err instanceof HttpErrorResponse) {
          if (err.status === 401 || err.status === 403) {
            if (firstReq.url === environment.apiUrl + '/user/refreshtoken') {
              console.log('test');
              this.authService.logout();
              // auth.setToken('');
              // auth.setRefreshToken('');
              // this.router.navigate(['/login']);
            } else {
              console.log('testing');
              return this.authService.refreshTokens().pipe(
                mergeMap(() => {
                  console.log(req);
                  const secondReq = this.cloneAndAddHeaders(req);
                  return next.handle(secondReq);
                })
              );
            }
          }
          return throwError(err.message || 'Server error');
        }
      })
    );
  }
  cloneAndAddHeaders(req) {
    const authToken = this.authService.getToken();
    const authRequest = req.clone({
      headers: req.headers.set('Authorization', 'Bearer ' + authToken)
    });
    console.log(authToken);
    console.log(req);
    return authRequest;
  }
}
