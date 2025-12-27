import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { firstValueFrom } from 'rxjs';
import { environment } from 'src/environment/environment';

@Injectable({
  providedIn: 'root',
})
export class BaseService {
  private baseUrl = environment.api_end_point || '';
  private apiBasePath = '/api/v1';

  constructor(
    private http: HttpClient,
    private toast: ToastrService
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

  async getData(url: string, params?: any): Promise<any> {
    try {
      let httpParams = new HttpParams();
      if (params) {
        Object.keys(params).forEach((key) => {
          if (params[key] !== null && params[key] !== undefined) {
            httpParams = httpParams.set(key, params[key].toString());
          }
        });
      }

      let response = await firstValueFrom(
        this.http.get<any>(this.buildUrl(url), {
          headers: this.getHeaders(),
          params: httpParams,
          observe: 'response',
        })
      );

      if (response?.status === 200 && response?.body) {
        const body = response.body;
        if (body.success === true || body.success === false) {
          if (body.success === false) {
            throw new Error(body.error || body.message || 'Có lỗi xảy ra');
          }
          return body;
        }
        return body;
      } else {
        throw new Error(response?.body?.message || response?.body?.error || 'Có lỗi xảy ra');
      }
    } catch (error: any) {
      let errorMessage = 'Kết nối không ổn định, vui lòng thử lại';
      if (error.error?.result?.message) {
        errorMessage = error.error.result.message;
      } else if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.error?.error) {
        errorMessage = error.error.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      this.toast.error(errorMessage, 'Thông báo');
      throw error;
    }
  }

  /**
   * POST request
   */
  async postData(url: string, data: any): Promise<any> {
    try {
      let response = await firstValueFrom(
        this.http.post<any>(this.buildUrl(url), data, {
          headers: this.getHeaders(),
          observe: 'response',
        })
      );

      if (response?.status === 200 || response?.status === 201) {
        if (response?.body) {
          const body = response.body;
          if (body.success === false) {
            throw new Error(body.error || body.message || 'Có lỗi xảy ra');
          }
          return body;
        }
        return {};
      } else {
        throw new Error(response?.body?.message || response?.body?.error || 'Có lỗi xảy ra');
      }
    } catch (error: any) {
      let errorMessage = 'Kết nối không ổn định, vui lòng thử lại';
      if (error.error?.result?.message) {
        errorMessage = error.error.result.message;
      } else if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.error?.error) {
        errorMessage = error.error.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      this.toast.error(errorMessage, 'Thông báo');
      throw error;
    }
  }

  /**
   * PUT request
   */
  async putData(url: string, data: any): Promise<any> {
    try {
      let response = await firstValueFrom(
        this.http.put<any>(this.buildUrl(url), data, {
          headers: this.getHeaders(),
          observe: 'response',
        })
      );

      if (response?.status === 200 || response?.status === 201) {
        if (response?.body) {
          const body = response.body;
          if (body.success === false) {
            throw new Error(body.error || body.message || 'Có lỗi xảy ra');
          }
          return body;
        }
        return {};
      } else {
        throw new Error(response?.body?.message || response?.body?.error || 'Có lỗi xảy ra');
      }
    } catch (error: any) {
      let errorMessage = 'Kết nối không ổn định, vui lòng thử lại';
      if (error.error?.result?.message) {
        errorMessage = error.error.result.message;
      } else if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.error?.error) {
        errorMessage = error.error.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      this.toast.error(errorMessage, 'Thông báo');
      throw error;
    }
  }

  /**
   * PATCH request
   */
  async patchData(url: string, data: any): Promise<any> {
    try {
      let response = await firstValueFrom(
        this.http.patch<any>(this.buildUrl(url), data, {
          headers: this.getHeaders(),
          observe: 'response',
        })
      );

      if (response?.status === 200 || response?.status === 201) {
        if (response?.body) {
          const body = response.body;
          if (body.success === false) {
            throw new Error(body.error || body.message || 'Có lỗi xảy ra');
          }
          return body;
        }
        return {};
      } else {
        throw new Error(response?.body?.message || response?.body?.error || 'Có lỗi xảy ra');
      }
    } catch (error: any) {
      let errorMessage = 'Kết nối không ổn định, vui lòng thử lại';
      if (error.error?.result?.message) {
        errorMessage = error.error.result.message;
      } else if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.error?.error) {
        errorMessage = error.error.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      this.toast.error(errorMessage, 'Thông báo');
      throw error;
    }
  }

  /**
   * DELETE request
   */
  async deleteData(url: string): Promise<any> {
    try {
      let response = await firstValueFrom(
        this.http.delete<any>(this.buildUrl(url), {
          headers: this.getHeaders(),
          observe: 'response',
        })
      );

      if (response?.status === 200 || response?.status === 204) {
        if (response.status === 204) {
          return {};
        }
        if (response?.body) {
          const body = response.body;
          if (body.success === false) {
            throw new Error(body.error || body.message || 'Có lỗi xảy ra');
          }
          return body;
        }
        return {};
      } else {
        throw new Error(response?.body?.message || response?.body?.error || 'Có lỗi xảy ra');
      }
    } catch (error: any) {
      let errorMessage = 'Kết nối không ổn định, vui lòng thử lại';
      if (error.error?.result?.message) {
        errorMessage = error.error.result.message;
      } else if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.error?.error) {
        errorMessage = error.error.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      this.toast.error(errorMessage, 'Thông báo');
      throw error;
    }
  }

  async postFormData(url: string, data: FormData): Promise<any> {
    try {
      const token = localStorage.getItem('token');
      const language = localStorage.getItem('language') || 'vi_VN';

      const headers = new HttpHeaders({
        'Accept-Language': language,
        ...(token && { Authorization: `Bearer ${token}` }),
      });

      let response = await firstValueFrom(
        this.http.post<any>(this.buildUrl(url), data, {
          headers,
          observe: 'response',
        })
      );

      if (response?.status === 200 || response?.status === 201) {
        if (response?.body) {
          const body = response.body;
          if (body.success === false) {
            throw new Error(body.error || body.message || 'Có lỗi xảy ra');
          }
          return body;
        }
        return {};
      } else {
        throw new Error(response?.body?.message || response?.body?.error || 'Có lỗi xảy ra');
      }
    } catch (error: any) {
      // Xử lý error message từ nhiều format khác nhau
      let errorMessage = 'Kết nối không ổn định, vui lòng thử lại';
      if (error.error?.result?.message) {
        errorMessage = error.error.result.message;
      } else if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.error?.error) {
        errorMessage = error.error.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      this.toast.error(errorMessage, 'Thông báo');
      throw error;
    }
  }

  async putFormData(url: string, data: FormData): Promise<any> {
    try {
      const token = localStorage.getItem('token');
      const language = localStorage.getItem('language') || 'vi_VN';

      const headers = new HttpHeaders({
        'Accept-Language': language,
        ...(token && { Authorization: `Bearer ${token}` }),
      });

      let response = await firstValueFrom(
        this.http.put<any>(this.buildUrl(url), data, {
          headers,
          observe: 'response',
        })
      );

      if (response?.status === 200 || response?.status === 201) {
        if (response?.body) {
          const body = response.body;
          if (body.success === false) {
            throw new Error(body.error || body.message || 'Có lỗi xảy ra');
          }
          return body;
        }
        return {};
      } else {
        throw new Error(response?.body?.message || response?.body?.error || 'Có lỗi xảy ra');
      }
    } catch (error: any) {
      // Xử lý error message từ nhiều format khác nhau
      let errorMessage = 'Kết nối không ổn định, vui lòng thử lại';
      if (error.error?.result?.message) {
        errorMessage = error.error.result.message;
      } else if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.error?.error) {
        errorMessage = error.error.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      this.toast.error(errorMessage, 'Thông báo');
      throw error;
    }
  }

  async getFile(url: string, params?: any): Promise<Blob> {
    try {
      let httpParams = new HttpParams();
      if (params) {
        Object.keys(params).forEach((key) => {
          if (params[key] !== null && params[key] !== undefined) {
            httpParams = httpParams.set(key, params[key].toString());
          }
        });
      }

      const token = localStorage.getItem('token');
      const language = localStorage.getItem('language') || 'vi_VN';

      const headers = new HttpHeaders({
        'Accept-Language': language,
        ...(token && { Authorization: `Bearer ${token}` }),
      });

      let response = await firstValueFrom(
        this.http.get(this.buildUrl(url), {
          headers,
          params: httpParams,
          responseType: 'blob',
          observe: 'response',
        })
      );

      if (response?.status === 200) {
        return response.body as Blob;
      } else {
        throw new Error('Không thể tải file');
      }
    } catch (error: any) {
      this.toast.error('Không thể tải file, vui lòng thử lại', 'Thông báo');
      throw error;
    }
  }
}

