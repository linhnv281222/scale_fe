import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';

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

  // Validation
  usernameError = '';
  passwordError = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    public themeService: ThemeService,
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

    // Load saved username if remember me was checked
    const savedUsername = localStorage.getItem('rememberedUsername');
    if (savedUsername) {
      this.username = savedUsername;
      this.rememberMe = true;
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
        this.loading = false;
        this.router.navigate(['/dashboard']);
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

