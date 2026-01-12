import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, filter, switchMap, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<string | null> =
    new BehaviorSubject<string | null>(null);

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastr: ToastrService
  ) {}

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        // Handle 401 Unauthorized errors
        if (error.status === 401) {
          return this.handle401Error(request, next);
        }

        // Handle 403 Forbidden errors
        if (error.status === 403) {
          this.toastr.error('Bạn không có quyền truy cập', 'Lỗi');
          return throwError(() => error);
        }

        return throwError(() => error);
      })
    );
  }

  private handle401Error(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    // Check if token exists and is expired
    const token = this.authService.getToken();
    const refreshToken = this.authService.getRefreshToken();

    if (!token || !refreshToken) {
      // No token or refresh token, redirect to login
      this.redirectToLogin();
      return throwError(() => new Error('No token available'));
    }

    // Check if token is expired (decode JWT if possible)
    if (this.isTokenExpired(token)) {
      // Token expired (30 days), don't refresh, redirect to login
      this.toastr.warning(
        'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại',
        'Thông báo'
      );
      this.authService.logout();
      return throwError(() => new Error('Token expired'));
    }

    // Token might be invalid but not expired, try to refresh
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      return new Observable<HttpEvent<any>>((subscriber) => {
        this.authService
          .refreshToken()
          .then((success) => {
            this.isRefreshing = false;
            if (success) {
              const newToken = this.authService.getToken();
              if (newToken) {
                this.refreshTokenSubject.next(newToken);
                const clonedRequest = request.clone({
                  setHeaders: {
                    Authorization: `Bearer ${newToken}`,
                  },
                });
                next.handle(clonedRequest).subscribe({
                  next: (event) => subscriber.next(event),
                  error: (err) => subscriber.error(err),
                  complete: () => subscriber.complete(),
                });
              } else {
                this.redirectToLogin();
                subscriber.error(new Error('Token refresh failed'));
              }
            } else {
              this.redirectToLogin();
              subscriber.error(new Error('Token refresh failed'));
            }
          })
          .catch((error) => {
            this.isRefreshing = false;
            this.redirectToLogin();
            subscriber.error(error);
          });
      });
    }

    // Already refreshing, wait for token and retry
    return this.refreshTokenSubject.pipe(
      filter((token): token is string => token !== null),
      take(1),
      switchMap((token) => {
        const clonedRequest = request.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`,
          },
        });
        return next.handle(clonedRequest);
      })
    );
  }

  private isTokenExpired(token: string): boolean {
    try {
      // Decode JWT token to check expiry
      const payload = JSON.parse(atob(token.split('.')[1]));

      // Check exp claim first
      if (payload.exp) {
        const expirationDate = new Date(payload.exp * 1000);
        const now = new Date();
        return expirationDate < now;
      }

      // If no exp claim, check token age (30 days from iat)
      if (payload.iat) {
        const issuedDate = new Date(payload.iat * 1000);
        const now = new Date();
        const daysSinceIssued =
          (now.getTime() - issuedDate.getTime()) / (1000 * 60 * 60 * 24);
        // Token expires after 30 days
        return daysSinceIssued >= 30;
      }

      // If no exp or iat, assume expired
      return true;
    } catch (error) {
      // If can't decode token, assume it's expired
      return true;
    }
  }

  private redirectToLogin(): void {
    this.authService.logout();
  }
}
