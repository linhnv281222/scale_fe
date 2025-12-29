import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../services/auth.service';
import { UserPermissionService } from '../../services/user-permission.service';
import { ThemeService } from '../../services/theme.service';
import { WebsiteSettingsService } from '../../services/website-settings.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  username = '';
  password = '';
  rememberMe = false;
  loading = false;
  showPassword = false;
  isDarkMode = false;
  systemName = 'Factory Data Manager';
  loginSystemName = 'Factory Data Manager';
  loginLogo = '';
  headerLogo = '';

  // Validation
  usernameError = '';
  passwordError = '';

  constructor(
    private authService: AuthService,
    private userPermissionService: UserPermissionService,
    private router: Router,
    private route: ActivatedRoute,
    public themeService: ThemeService,
    private toastr: ToastrService,
    private websiteSettingsService: WebsiteSettingsService
  ) {}

  async ngOnInit(): Promise<void> {
    // Check if already logged in
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }

    // Subscribe to theme changes
    this.themeService.theme$.subscribe(theme => {
      this.isDarkMode = theme === 'dark';
    });

    // Load saved username if remember me was checked
    const savedUsername = localStorage.getItem('rememberedUsername');
    if (savedUsername) {
      this.username = savedUsername;
      this.rememberMe = true;
    }

    // Load system settings
    await this.loadSystemSettings();
  }

  async loadSystemSettings(): Promise<void> {
    try {
      const settings = await this.websiteSettingsService.getSettings();
      this.systemName = settings.siteName || 'Factory Data Manager';
      this.loginSystemName = settings.loginSystemName || settings.siteName || 'Factory Data Manager';
      this.loginLogo = settings.loginLogo || 'assets/img/facenet-01-k-nen.png';
      this.headerLogo = settings.logo || 'assets/img/facenet-01-k-nen.png';
    } catch (error) {
      console.error('Error loading system settings:', error);
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

    let isValid = true;

    if (!this.username || this.username.trim() === '') {
      this.usernameError = 'Vui lòng nhập tên đăng nhập';
      isValid = false;
    }

    if (!this.password || this.password.trim() === '') {
      this.passwordError = 'Vui lòng nhập mật khẩu';
      isValid = false;
    }

    return isValid;
  }

  async onSubmit(): Promise<void> {
    if (!this.validate()) {
      return;
    }

    this.loading = true;

    // Save username if remember me is checked
    if (this.rememberMe) {
      localStorage.setItem('rememberedUsername', this.username);
    } else {
      localStorage.removeItem('rememberedUsername');
    }

    // Login
    try {
      const success = await this.authService.login(this.username, this.password);
      if (success) {
        // Load user info and permissions after successful login
        await this.authService.getMe();
        this.userPermissionService.loadPermissionsFromStorage();
        
        this.loading = false;
        // Get returnUrl from query params, default to dashboard
        let returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
        // If returnUrl is root path '/', redirect to dashboard to avoid loop
        if (returnUrl === '/' || returnUrl === '') {
          returnUrl = '/dashboard';
        }
        this.router.navigate([returnUrl]);
      } else {
        this.loading = false;
        this.toastr.error('Tên đăng nhập hoặc mật khẩu không đúng', 'Lỗi đăng nhập');
      }
    } catch (error) {
      this.loading = false;
      this.toastr.error('Tên đăng nhập hoặc mật khẩu không đúng', 'Lỗi đăng nhập');
    }
  }
}

