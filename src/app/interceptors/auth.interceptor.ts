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
import { BehaviorSubject, Observable, from, throwError } from 'rxjs';
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
        // Handle 401 Unauthorized and 403 Forbidden (backend returns 403 on expired/invalid token)
        if (error.status === 401 || error.status === 403) {
          // Bỏ qua xử lý cho các API auth để tránh đệ quy / lặp vô hạn
          if (
            request.url.includes('auth/login') ||
            request.url.includes('auth/refresh') ||
            request.url.includes('auth/logout')
          ) {
            return throwError(() => error);
          }
          return this.handleAuthError(request, next);
        }

        return throwError(() => error);
      })
    );
  }

  private handleAuthError(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    const refreshToken = this.authService.getRefreshToken();

    // Không có refresh token hoặc refresh token đã hết hạn -> logout ra màn login
    if (!refreshToken || this.authService.isTokenExpired(refreshToken)) {
      this.redirectToLogin('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại');
      return throwError(() => new Error('No valid refresh token available'));
    }

    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      return from(this.authService.refreshToken()).pipe(
        switchMap((success: boolean) => {
          this.isRefreshing = false;
          if (success) {
            const newToken = this.authService.getToken();
            if (newToken) {
              this.refreshTokenSubject.next(newToken);
              return next.handle(this.addTokenHeader(request, newToken));
            }
          }
          this.refreshTokenSubject.next(null);
          this.redirectToLogin('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại');
          return throwError(() => new Error('Token refresh failed'));
        }),
        catchError((err) => {
          this.isRefreshing = false;
          this.refreshTokenSubject.next(null);
          this.redirectToLogin('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại');
          return throwError(() => err);
        })
      );
    }

    // Đang có một request khác thực hiện refresh token -> xếp hàng chờ token mới
    return this.refreshTokenSubject.pipe(
      filter((token): token is string => token !== null),
      take(1),
      switchMap((token) => {
        return next.handle(this.addTokenHeader(request, token));
      })
    );
  }

  private addTokenHeader(
    request: HttpRequest<any>,
    token: string
  ): HttpRequest<any> {
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  private redirectToLogin(message?: string): void {
    this.authService.clearAuthData();
    if (message) {
      this.toastr.warning(message, 'Thông báo');
    }
    this.router.navigate(['/login']);
  }
}
