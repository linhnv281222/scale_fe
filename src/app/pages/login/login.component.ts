import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { HttpService } from '../../services/http.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  username = '';
  password = '';
  licenseKey = '';
  rememberMe = false;
  loading = false;
  showPassword = false;
  isDarkMode = false;

  // Validation
  usernameError = '';
  passwordError = '';
  licenseKeyError = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    public themeService: ThemeService,
    private http: HttpService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    // Check if already logged in
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }

    // Subscribe to theme changes
    this.themeService.theme$.subscribe(theme => {
      this.isDarkMode = theme === 'dark';
    });

    // Load saved username and license if remember me was checked
    const savedUsername = localStorage.getItem('rememberedUsername');
    const savedLicense = localStorage.getItem('rememberedLicense');
    if (savedUsername) {
      this.username = savedUsername;
      this.rememberMe = true;
    }
    if (savedLicense) {
      this.licenseKey = savedLicense;
    }
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  validate(): boolean {
    this.usernameError = '';
    this.passwordError = '';
    this.licenseKeyError = '';

    let isValid = true;

    if (!this.username || this.username.trim() === '') {
      this.usernameError = 'Vui lòng nhập tên đăng nhập';
      isValid = false;
    }

    if (!this.password || this.password.trim() === '') {
      this.passwordError = 'Vui lòng nhập mật khẩu';
      isValid = false;
    }

    if (!this.licenseKey || this.licenseKey.trim() === '') {
      this.licenseKeyError = 'Vui lòng nhập license key';
      isValid = false;
    }

    return isValid;
  }

  onSubmit(): void {
    if (!this.validate()) {
      return;
    }

    this.loading = true;

    // First, verify license
    this.http.get<any>('api/licenses', { licenseKey: this.licenseKey }).subscribe({
      next: (licenseData: any) => {
        const licenses = Array.isArray(licenseData) ? licenseData : (licenseData?.data || []);
        const license = licenses.find((l: any) => l.licenseKey === this.licenseKey && l.isActive);

        if (!license) {
          this.toastr.error('License không hợp lệ hoặc đã hết hạn', 'Lỗi');
          this.loading = false;
          return;
        }

        // Check if license is expired
        if (license.expiresAt && new Date(license.expiresAt) < new Date()) {
          this.toastr.error('License đã hết hạn', 'Lỗi');
          this.loading = false;
          return;
        }

        // Save license info to localStorage
        localStorage.setItem('currentLicense', JSON.stringify(license));
        localStorage.setItem('maxScales', license.maxScales.toString());

        // Save username and license if remember me is checked
        if (this.rememberMe) {
          localStorage.setItem('rememberedUsername', this.username);
          localStorage.setItem('rememberedLicense', this.licenseKey);
        } else {
          localStorage.removeItem('rememberedUsername');
          localStorage.removeItem('rememberedLicense');
        }

        // Then login
        this.authService.login(this.username, this.password).subscribe({
          next: () => {
            this.loading = false;
            this.router.navigate(['/dashboard']);
          },
          error: (error) => {
            this.loading = false;
            this.toastr.error('Tên đăng nhập hoặc mật khẩu không đúng', 'Lỗi đăng nhập');
          }
        });
      },
      error: () => {
        this.loading = false;
        this.toastr.error('Không thể kiểm tra license', 'Lỗi');
      }
    });
  }
}

