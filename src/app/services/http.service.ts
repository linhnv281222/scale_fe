import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from 'src/environment/environment';
import { Config } from '../models';
import { MockDataService } from './mock-data.service';

@Injectable({
  providedIn: 'root',
})
export class HttpService {
  private baseUrl = environment.api_end_point || '';

  constructor(
    private http: HttpClient,
    private toastr: ToastrService,
    private mockDataService: MockDataService
  ) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept-Language': localStorage.getItem('language') || 'vi_VN',
      ...(token && { Authorization: `Bearer ${token}` }),
    });
  }

  get<T>(url: string, params?: any): Observable<T> {
    // Mock data cho locations
    if (url === 'api/locations') {
      const mockData = this.mockDataService.getMockLocations();
      // Trả về tất cả data để có thể build tree structure đúng
      // Component sẽ tự xử lý pagination nếu cần
      return of({
        data: mockData,
        total: mockData.length,
      } as T);
    }

    // Mock data cho protocols
    if (url === 'api/protocols') {
      const mockData = this.mockDataService.getMockProtocols();
      let filteredData = mockData;

      // Filter by name
      if (params?.name) {
        filteredData = filteredData.filter((p) =>
          p.name.toLowerCase().includes(params.name.toLowerCase())
        );
      }

      // Filter by code
      if (params?.code) {
        filteredData = filteredData.filter((p) =>
          p.code.toLowerCase().includes(params.code.toLowerCase())
        );
      }

      // Filter by status
      if (params?.status) {
        filteredData = filteredData.filter((p) => p.status === params.status);
      }

      // Pagination
      const page = params?.page || 1;
      const size = params?.size || 20;
      const start = (page - 1) * size;
      const end = start + size;
      const paginatedData = filteredData.slice(start, end);

      return of({
        data: paginatedData,
        total: filteredData.length,
      } as T);
    }

    // Mock data cho licenses
    if (url === 'api/licenses') {
      const mockData = this.mockDataService.getMockLicenses();
      let filteredData = mockData;

      // Filter by licenseKey
      if (params?.licenseKey) {
        filteredData = filteredData.filter((l) =>
          l.licenseKey.toLowerCase().includes(params.licenseKey.toLowerCase())
        );
      }

      // Filter by isActive
      if (params?.isActive !== undefined) {
        filteredData = filteredData.filter(
          (l) =>
            l.isActive ===
            (params.isActive === true || params.isActive === 'true')
        );
      }

      // Pagination
      const page = params?.page || 1;
      const size = params?.size || 10;
      const start = (page - 1) * size;
      const end = start + size;
      const paginatedData = filteredData.slice(start, end);

      return of({
        data: paginatedData,
        total: filteredData.length,
      } as T);
    }

    // Mock data cho scale-manufacturers
    if (url === 'api/scale-manufacturers') {
      const mockData = this.mockDataService.getMockScaleManufacturers();
      let filteredData = mockData;

      // Filter by name
      if (params?.name) {
        filteredData = filteredData.filter((m) =>
          m.name.toLowerCase().includes(params.name.toLowerCase())
        );
      }

      // Filter by code
      if (params?.code) {
        filteredData = filteredData.filter((m) =>
          m.code.toLowerCase().includes(params.code.toLowerCase())
        );
      }

      // Pagination
      const page = params?.page || 1;
      const size = params?.size || 20;
      const start = (page - 1) * size;
      const end = start + size;
      const paginatedData = filteredData.slice(start, end);

      return of({
        data: paginatedData,
        total: filteredData.length,
      } as T);
    }

    // Mock data cho scales
    if (url === 'api/scales') {
      const mockData = this.mockDataService.getMockScales();
      // Apply filters
      let filteredData = mockData;
      if (params) {
        if (params.name) {
          filteredData = filteredData.filter((s) =>
            s.name.toLowerCase().includes(params.name.toLowerCase())
          );
        }
        if (params.code) {
          filteredData = filteredData.filter((s) =>
            s.code.toLowerCase().includes(params.code.toLowerCase())
          );
        }
        if (params.type) {
          filteredData = filteredData.filter(
            (s) => s.scaleType === params.type
          );
        }
        if (params.status) {
          filteredData = filteredData.filter((s) => s.status === params.status);
        }
      }

      // Apply pagination
      const page = params?.page || 1;
      const size = params?.size || 20;
      const start = (page - 1) * size;
      const end = start + size;
      const paginatedData = filteredData.slice(start, end);

      return of({
        data: paginatedData,
        total: filteredData.length,
      } as T);
    }

    // Mock data cho scales count
    if (url === 'api/scales/count') {
      const mockData = this.mockDataService.getMockScales();
      return of({
        total: mockData.length,
      } as T);
    }

    // Mock data cho shifts
    if (url === 'api/shifts') {
      const mockData = this.mockDataService.getMockShifts();
      let filteredData = mockData;

      // Filter by name
      if (params?.name) {
        filteredData = filteredData.filter((s) =>
          s.name.toLowerCase().includes(params.name.toLowerCase())
        );
      }

      // Filter by status
      if (params?.status) {
        filteredData = filteredData.filter((s) => s.status === params.status);
      }

      // Pagination
      const page = params?.page || 1;
      const size = params?.size || 20;
      const start = (page - 1) * size;
      const end = start + size;
      const paginatedData = filteredData.slice(start, end);

      return of({
        data: paginatedData,
        total: filteredData.length,
      } as T);
    }

    // Mock data cho permissions
    if (url === 'api/permissions') {
      // Return empty array for now, will be populated from matrix
      return of([] as T);
    }

    // Mock data cho scale report
    if (url === 'api/reports/scale') {
      const mockData = this.mockDataService.getMockScaleReportData(params);
      return of(mockData as T);
    }

    // Mock data cho shift report
    if (url === 'api/reports/shift') {
      const mockData = this.mockDataService.getMockShiftReportData(params);
      return of(mockData as T);
    }

    // Mock data cho users
    if (url === 'api/users') {
      const mockData = this.mockDataService.getMockUsers();
      let filteredData = mockData;

      // Filter by username
      if (params?.username) {
        filteredData = filteredData.filter((u) =>
          u.username.toLowerCase().includes(params.username.toLowerCase())
        );
      }

      // Filter by fullName
      if (params?.fullName) {
        filteredData = filteredData.filter((u) =>
          u.fullName?.toLowerCase().includes(params.fullName.toLowerCase())
        );
      }

      // Filter by status
      if (params?.status) {
        filteredData = filteredData.filter((u) => u.status === params.status);
      }

      // Pagination
      const page = params?.page || 1;
      const size = params?.size || 20;
      const start = (page - 1) * size;
      const end = start + size;
      const paginatedData = filteredData.slice(start, end);

      return of({
        data: paginatedData,
        total: filteredData.length,
      } as T);
    }

    // Mock data cho templates
    if (url === 'api/templates') {
      const mockData = this.mockDataService.getMockTemplates();
      let filteredData = mockData;

      // Filter by type
      if (params?.type) {
        filteredData = filteredData.filter((t) => t.type === params.type);
      }

      // Filter by name
      if (params?.name) {
        filteredData = filteredData.filter((t) =>
          t.name.toLowerCase().includes(params.name.toLowerCase())
        );
      }

      // Pagination
      const page = params?.page || 1;
      const size = params?.size || 1000;
      const start = (page - 1) * size;
      const end = start + size;
      const paginatedData = filteredData.slice(start, end);

      return of({
        data: paginatedData,
        total: filteredData.length,
      } as T);
    }

    // Mock data cho connection status
    if (url === 'api/connection-status') {
      const mockData = this.mockDataService.getMockConnectionStatuses();
      let filteredData = mockData;

      // Filter by scaleName
      if (params?.scaleName) {
        filteredData = filteredData.filter((s) =>
          s.scale?.name?.toLowerCase().includes(params.scaleName.toLowerCase())
        );
      }

      // Filter by status
      if (params?.status) {
        filteredData = filteredData.filter((s) => s.status === params.status);
      }

      // Pagination
      const page = params?.page || 1;
      const size = params?.size || 20;
      const start = (page - 1) * size;
      const end = start + size;
      const paginatedData = filteredData.slice(start, end);

      return of({
        data: paginatedData,
        total: filteredData.length,
      } as T);
    }

    // Mock data cho scale-data (historical)
    if (url === 'api/scale-data') {
      const mockData = this.mockDataService.getMockScaleData(params);
      let filteredData = mockData;

      // Filter by scaleId
      if (params?.scaleId) {
        filteredData = filteredData.filter((d) => d.scaleId === params.scaleId);
      }

      // Filter by date range
      if (params?.dateFrom) {
        const dateFrom = new Date(params.dateFrom);
        filteredData = filteredData.filter((d) => d.timestamp >= dateFrom);
      }
      if (params?.dateTo) {
        const dateTo = new Date(params.dateTo);
        filteredData = filteredData.filter((d) => d.timestamp <= dateTo);
      }

      // Pagination
      const page = params?.page || 1;
      const size = params?.size || 20;
      const start = (page - 1) * size;
      const end = start + size;
      const paginatedData = filteredData.slice(start, end);

      return of({
        data: paginatedData,
        total: filteredData.length,
      } as T);
    }

    // Mock data cho scale-data/current (current data)
    if (url === 'api/scale-data/current') {
      const mockData = this.mockDataService.getMockCurrentScaleData();
      return of({
        data: mockData,
        total: mockData.length,
      } as T);
    }

    // Mock data cho configs
    if (url === 'api/configs') {
      const mockData = this.mockDataService.getMockConfigs();
      let filteredData = mockData;

      // Filter by key
      if (params?.key) {
        filteredData = filteredData.filter((c: Config) =>
          c.key.toLowerCase().includes(params.key.toLowerCase())
        );
      }

      // Filter by category
      if (params?.category) {
        filteredData = filteredData.filter((c: Config) => c.category === params.category);
      }

      // Filter by dataType
      if (params?.dataType) {
        filteredData = filteredData.filter((c: Config) => c.dataType === params.dataType);
      }

      // Filter by module
      if (params?.module) {
        filteredData = filteredData.filter((c: Config) => c.module === params.module);
      }

      // Pagination
      const page = params?.page || 1;
      const size = params?.size || 10;
      const start = (page - 1) * size;
      const end = start + size;
      const paginatedData = filteredData.slice(start, end);

      return of({
        data: paginatedData,
        total: filteredData.length,
      } as T);
    }

    // Mock data cho config defaultReadCycle
    if (url === 'api/configs/defaultReadCycle') {
      return of({
        key: 'defaultReadCycle',
        value: '60',
        dataType: 'NUMBER',
        description: 'Chu kỳ đọc dữ liệu mặc định (giây)',
      } as T);
    }

    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach((key) => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key].toString());
        }
      });
    }

    return this.http
      .get<T>(`${this.baseUrl}/${url}`, {
        headers: this.getHeaders(),
        params: httpParams,
      })
      .pipe(
        map((response: any) => {
          if (response.result && response.result.responseCode !== '00') {
            this.toastr.warning(
              response.message || 'Có lỗi xảy ra',
              'Thông báo'
            );
          }
          return response.data || response;
        }),
        catchError((error) => {
          this.handleError(error);
          return throwError(() => error);
        })
      );
  }

  post<T>(url: string, data: any): Observable<T> {
    // Mock POST for login
    if (url === 'api/auth/login') {
      const mockUsers = this.mockDataService.getMockUsers();
      const user = mockUsers.find(
        (u) => u.username === data.username && u.password === data.password
      );

      if (user) {
        const token = 'mock-jwt-token-' + Date.now();
        return of({
          token,
          user: {
            id: user.id,
            username: user.username,
            fullName: user.fullName,
            email: user.email,
          },
        } as T);
      } else {
        return throwError(() => ({
          error: { message: 'Invalid username or password' },
        }));
      }
    }

    // Mock POST for users
    if (url === 'api/users') {
      const mockData = this.mockDataService.getMockUsers();
      const newId = Math.max(...mockData.map((u) => u.id || 0)) + 1;
      const newUser = {
        ...data,
        id: newId,
        status: data.status || 'active',
        isActive: data.isActive !== undefined ? data.isActive : true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.toastr.success('Thêm tài khoản thành công', 'Thành công');
      return of(newUser as T);
    }

    // Mock POST for shifts
    if (url === 'api/shifts') {
      const mockData = this.mockDataService.getMockShifts();
      const newId = Math.max(...mockData.map((s) => s.id || 0)) + 1;
      const newShift = {
        ...data,
        id: newId,
        status: data.status || 'active',
        isActive: data.isActive !== undefined ? data.isActive : true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.toastr.success('Thêm ca thành công', 'Thành công');
      return of(newShift as T);
    }

    // Mock POST for protocols
    if (url === 'api/protocols') {
      const mockData = this.mockDataService.getMockProtocols();
      const newId = Math.max(...mockData.map((p) => p.id || 0)) + 1;
      const newProtocol = {
        ...data,
        id: newId,
        status: data.status || 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.toastr.success('Thêm giao thức thành công', 'Thành công');
      return of(newProtocol as T);
    }

    // Mock POST for scale-manufacturers
    if (url === 'api/scale-manufacturers') {
      const mockData = this.mockDataService.getMockScaleManufacturers();
      const newId = Math.max(...mockData.map((m) => m.id || 0)) + 1;
      const newManufacturer = {
        ...data,
        id: newId,
        status: data.status || 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.toastr.success('Thêm hãng cân thành công', 'Thành công');
      return of(newManufacturer as T);
    }

    // Mock POST for templates
    if (url === 'api/templates') {
      const mockData = this.mockDataService.getMockTemplates();
      const newId = Math.max(...mockData.map((t) => t.id || 0)) + 1;
      const newTemplate = {
        ...data,
        id: newId,
        isActive: data.isActive !== undefined ? data.isActive : true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.toastr.success('Thêm biểu mẫu thành công', 'Thành công');
      return of(newTemplate as T);
    }

    // Mock POST for scales
    if (url === 'api/scales') {
      const mockScales = this.mockDataService.getMockScales();
      const newScale = {
        ...data,
        id: Math.max(...mockScales.map((s) => s.id || 0)) + 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: data.status || 'active',
      };
      this.toastr.success('Thêm cân thành công', 'Thành công');
      return of(newScale as T);
    }

    // Mock POST for permissions
    if (url === 'api/permissions') {
      const newPermission = {
        ...data,
        id: Math.floor(Math.random() * 1000000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.toastr.success('Lưu phân quyền thành công', 'Thành công');
      return of(newPermission as T);
    }

    // Mock POST for configs
    if (url === 'api/configs') {
      const mockData = this.mockDataService.getMockConfigs();
      const newId = Math.max(...mockData.map((c: Config) => c.id || 0)) + 1;
      const newConfig = {
        ...data,
        id: newId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.toastr.success('Thêm cấu hình thành công', 'Thành công');
      return of(newConfig as T);
    }

    return this.http
      .post<T>(`${this.baseUrl}/${url}`, data, {
        headers: this.getHeaders(),
      })
      .pipe(
        map((response: any) => {
          if (response.result && response.result.responseCode !== '00') {
            this.toastr.warning(
              response.message || 'Có lỗi xảy ra',
              'Thông báo'
            );
          } else if (response.message) {
            this.toastr.success(response.message, 'Thành công');
          }
          return response.data || response;
        }),
        catchError((error) => {
          this.handleError(error);
          return throwError(() => error);
        })
      );
  }

  put<T>(url: string, data: any): Observable<T> {
    // Mock PUT for users
    if (url.startsWith('api/users/')) {
      const updatedUser = {
        ...data,
        updatedAt: new Date(),
      };
      this.toastr.success('Cập nhật tài khoản thành công', 'Thành công');
      return of(updatedUser as T);
    }

    // Mock PUT for shifts
    if (url.startsWith('api/shifts/')) {
      const updatedShift = {
        ...data,
        updatedAt: new Date(),
      };
      this.toastr.success('Cập nhật ca thành công', 'Thành công');
      return of(updatedShift as T);
    }

    // Mock PUT for protocols
    if (url.startsWith('api/protocols/')) {
      const updatedProtocol = {
        ...data,
        updatedAt: new Date(),
      };
      this.toastr.success('Cập nhật giao thức thành công', 'Thành công');
      return of(updatedProtocol as T);
    }

    // Mock PUT for templates
    if (url.startsWith('api/templates/')) {
      const updatedTemplate = {
        ...data,
        updatedAt: new Date(),
      };
      this.toastr.success('Cập nhật biểu mẫu thành công', 'Thành công');
      return of(updatedTemplate as T);
    }

    // Mock PUT for scale-manufacturers
    if (url.startsWith('api/scale-manufacturers/')) {
      const updatedManufacturer = {
        ...data,
        updatedAt: new Date(),
      };
      this.toastr.success('Cập nhật hãng cân thành công', 'Thành công');
      return of(updatedManufacturer as T);
    }

    // Mock PUT for scales
    if (url.startsWith('api/scales/')) {
      const updatedScale = {
        ...data,
        updatedAt: new Date(),
      };
      this.toastr.success('Cập nhật cân thành công', 'Thành công');
      return of(updatedScale as T);
    }

    // Mock PUT for configs
    if (url.startsWith('api/configs/')) {
      const updatedConfig = {
        ...data,
        updatedAt: new Date(),
      };
      this.toastr.success('Cập nhật cấu hình thành công', 'Thành công');
      return of(updatedConfig as T);
    }

    return this.http
      .put<T>(`${this.baseUrl}/${url}`, data, {
        headers: this.getHeaders(),
      })
      .pipe(
        map((response: any) => {
          if (response.result && response.result.responseCode !== '00') {
            this.toastr.warning(
              response.message || 'Có lỗi xảy ra',
              'Thông báo'
            );
          } else if (response.message) {
            this.toastr.success(response.message, 'Thành công');
          }
          return response.data || response;
        }),
        catchError((error) => {
          this.handleError(error);
          return throwError(() => error);
        })
      );
  }

  delete<T>(url: string): Observable<T> {
    // Mock DELETE for users
    if (url.startsWith('api/users/')) {
      this.toastr.success('Xóa tài khoản thành công', 'Thành công');
      return of({} as T);
    }

    // Mock DELETE for shifts
    if (url.startsWith('api/shifts/')) {
      this.toastr.success('Xóa ca thành công', 'Thành công');
      return of({} as T);
    }

    // Mock DELETE for protocols
    if (url.startsWith('api/protocols/')) {
      this.toastr.success('Xóa giao thức thành công', 'Thành công');
      return of({} as T);
    }

    // Mock DELETE for templates
    if (url.startsWith('api/templates/')) {
      this.toastr.success('Xóa biểu mẫu thành công', 'Thành công');
      return of({} as T);
    }

    // Mock DELETE for scale-manufacturers
    if (url.startsWith('api/scale-manufacturers/')) {
      this.toastr.success('Xóa hãng cân thành công', 'Thành công');
      return of({} as T);
    }

    // Mock DELETE for configs
    if (url.startsWith('api/configs/')) {
      this.toastr.success('Xóa cấu hình thành công', 'Thành công');
      return of({} as T);
    }

    return this.http
      .delete<T>(`${this.baseUrl}/${url}`, {
        headers: this.getHeaders(),
      })
      .pipe(
        map((response: any) => {
          if (response.result && response.result.responseCode !== '00') {
            this.toastr.warning(
              response.message || 'Có lỗi xảy ra',
              'Thông báo'
            );
          } else if (response.message) {
            this.toastr.success(response.message, 'Thành công');
          }
          return response.data || response;
        }),
        catchError((error) => {
          this.handleError(error);
          return throwError(() => error);
        })
      );
  }

  private handleError(error: any): void {
    if (error.error?.result?.message) {
      this.toastr.error(error.error.result.message, 'Lỗi');
    } else if (error.error?.message) {
      this.toastr.error(error.error.message, 'Lỗi');
    } else {
      this.toastr.error('Có lỗi xảy ra, vui lòng thử lại', 'Lỗi');
    }
  }
}
