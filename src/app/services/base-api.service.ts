import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from 'src/environment/environment';

@Injectable({
  providedIn: 'root',
})
export class BaseApiService {
  private baseUrl = environment.api_end_point || '';
  private apiBasePath = '/api/v1';

  constructor(
    private http: HttpClient,
    private toastr: ToastrService
  ) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    const language = localStorage.getItem('language') || 'vi_VN';

    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept-Language': language,
      ...(token && { Authorization: `Bearer ${token}` }),
    });
  }

  private buildUrl(url: string): string {
    if (url.startsWith('/api/v1') || url.startsWith('api/v1')) {
      return `${this.baseUrl}${url.startsWith('/') ? url : '/' + url}`;
    }
    return `${this.baseUrl}${this.apiBasePath}/${url}`;
  }

  private handleError(error: any): Observable<never> {
    if (error.error?.result?.message) {
      this.toastr.error(error.error.result.message, 'Lỗi');
    } else if (error.error?.message) {
      this.toastr.error(error.error.message, 'Lỗi');
    } else {
      this.toastr.error('Có lỗi xảy ra, vui lòng thử lại', 'Lỗi');
    }
    return throwError(() => error);
  }

  private handleResponse<T>(response: any): T {
    if (response.success === false) {
      this.toastr.error(response.error || response.message || 'Có lỗi xảy ra', 'Lỗi');
      return response.data !== undefined ? response.data : response;
    }

    if (response.result && response.result.responseCode !== '00') {
      this.toastr.warning(
        response.message || response.result?.message || 'Có lỗi xảy ra',
        'Thông báo'
      );
      return response.data || response;
    }

    return response.data !== undefined ? response.data : response;
  }

  get<T>(url: string, params?: any): Observable<T> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach((key) => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key].toString());
        }
      });
    }

    return this.http
      .get<T>(this.buildUrl(url), {
        headers: this.getHeaders(),
        params: httpParams,
      })
      .pipe(
        map((response: any) => this.handleResponse<T>(response)),
        catchError((error) => this.handleError(error))
      );
  }

  post<T>(url: string, data: any): Observable<T> {
    return this.http
      .post<T>(this.buildUrl(url), data, {
        headers: this.getHeaders(),
      })
      .pipe(
        map((response: any) => {
          if (response.success === false) {
            this.toastr.error(response.error || response.message || 'Có lỗi xảy ra', 'Lỗi');
          } else if (response.message) {
            this.toastr.success(response.message, 'Thành công');
          }
          if (response.result && response.result.responseCode !== '00') {
            this.toastr.warning(
              response.message || response.result?.message || 'Có lỗi xảy ra',
              'Thông báo'
            );
          }
          return response.data !== undefined ? response.data : response;
        }),
        catchError((error) => this.handleError(error))
      );
  }

  put<T>(url: string, data: any): Observable<T> {
    return this.http
      .put<T>(this.buildUrl(url), data, {
        headers: this.getHeaders(),
      })
      .pipe(
        map((response: any) => {
          if (response.success === false) {
            this.toastr.error(response.error || response.message || 'Có lỗi xảy ra', 'Lỗi');
          } else if (response.message) {
            this.toastr.success(response.message, 'Thành công');
          }
          if (response.result && response.result.responseCode !== '00') {
            this.toastr.warning(
              response.message || response.result?.message || 'Có lỗi xảy ra',
              'Thông báo'
            );
          }
          return response.data !== undefined ? response.data : response;
        }),
        catchError((error) => this.handleError(error))
      );
  }

  patch<T>(url: string, data: any): Observable<T> {
    return this.http
      .patch<T>(this.buildUrl(url), data, {
        headers: this.getHeaders(),
      })
      .pipe(
        map((response: any) => {
          if (response.success === false) {
            this.toastr.error(response.error || response.message || 'Có lỗi xảy ra', 'Lỗi');
          } else if (response.message) {
            this.toastr.success(response.message, 'Thành công');
          }
          if (response.result && response.result.responseCode !== '00') {
            this.toastr.warning(
              response.message || response.result?.message || 'Có lỗi xảy ra',
              'Thông báo'
            );
          }
          return response.data !== undefined ? response.data : response;
        }),
        catchError((error) => this.handleError(error))
      );
  }

  delete<T>(url: string): Observable<T> {
    return this.http
      .delete<T>(this.buildUrl(url), {
        headers: this.getHeaders(),
      })
      .pipe(
        map((response: any) => {
          if (response.success === false) {
            this.toastr.error(response.error || response.message || 'Có lỗi xảy ra', 'Lỗi');
          } else if (response.message) {
            this.toastr.success(response.message, 'Thành công');
          }
          if (response.result && response.result.responseCode !== '00') {
            this.toastr.warning(
              response.message || response.result?.message || 'Có lỗi xảy ra',
              'Thông báo'
            );
          }
          return response.data !== undefined ? response.data : response;
        }),
        catchError((error) => this.handleError(error))
      );
  }

  postFormData<T>(url: string, data: FormData): Observable<T> {
    const token = localStorage.getItem('token');
    const language = localStorage.getItem('language') || 'vi_VN';

    const headers = new HttpHeaders({
      'Accept-Language': language,
      ...(token && { Authorization: `Bearer ${token}` }),
    });

    return this.http
      .post<T>(this.buildUrl(url), data, { headers })
      .pipe(
        map((response: any) => {
          if (response.success === false) {
            this.toastr.error(response.error || response.message || 'Có lỗi xảy ra', 'Lỗi');
          } else if (response.message) {
            this.toastr.success(response.message, 'Thành công');
          }
          if (response.result && response.result.responseCode !== '00') {
            this.toastr.warning(
              response.message || response.result?.message || 'Có lỗi xảy ra',
              'Thông báo'
            );
          }
          return response.data !== undefined ? response.data : response;
        }),
        catchError((error) => this.handleError(error))
      );
  }

  putFormData<T>(url: string, data: FormData): Observable<T> {
    const token = localStorage.getItem('token');
    const language = localStorage.getItem('language') || 'vi_VN';

    const headers = new HttpHeaders({
      'Accept-Language': language,
      ...(token && { Authorization: `Bearer ${token}` }),
    });

    return this.http
      .put<T>(this.buildUrl(url), data, { headers })
      .pipe(
        map((response: any) => {
          if (response.success === false) {
            this.toastr.error(response.error || response.message || 'Có lỗi xảy ra', 'Lỗi');
          } else if (response.message) {
            this.toastr.success(response.message, 'Thành công');
          }
          if (response.result && response.result.responseCode !== '00') {
            this.toastr.warning(
              response.message || response.result?.message || 'Có lỗi xảy ra',
              'Thông báo'
            );
          }
          return response.data !== undefined ? response.data : response;
        }),
        catchError((error) => this.handleError(error))
      );
  }

  getFile(url: string): Observable<Blob> {
    const token = localStorage.getItem('token');
    const language = localStorage.getItem('language') || 'vi_VN';

    const headers = new HttpHeaders({
      'Accept-Language': language,
      ...(token && { Authorization: `Bearer ${token}` }),
    });

    return this.http.get(this.buildUrl(url), {
      headers,
      responseType: 'blob',
    });
  }
}

