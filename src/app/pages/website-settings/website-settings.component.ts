import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';
import { NzUploadFile } from 'ng-zorro-antd/upload';
import { ToastrService } from 'ngx-toastr';
import { WebsiteSettings } from '../../models';
import { WebsiteSettingsService } from '../../services/website-settings.service';

@Component({
  selector: 'app-website-settings',
  templateUrl: './website-settings.component.html',
  styleUrls: ['./website-settings.component.css'],
})
export class WebsiteSettingsComponent implements OnInit {
  settings: WebsiteSettings = {
    siteName: 'Factory Data Manager',
    loginSystemName: 'Factory Data Manager',
    logo: '',
    favicon: '',
    loginLogo: '',
    copyright: '',
    description: '',
    primaryColor: '#2563eb',
    secondaryColor: '#64748b',
  };

  loading = false;
  saving = false;
  logoPreview: string | null = null;
  faviconPreview: string | null = null;
  loginLogoPreview: string | null = null;

  logoFile: File | null = null;
  faviconFile: File | null = null;
  loginLogoFile: File | null = null;

  constructor(
    private websiteSettingsService: WebsiteSettingsService,
    private titleService: Title,
    private translate: TranslateService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadSettings();
  }

  async loadSettings(): Promise<void> {
    this.loading = true;
    try {
      this.settings = await this.websiteSettingsService.getSettings();
      this.logoPreview = this.settings.logo || null;
      this.faviconPreview = this.settings.favicon || null;
      this.loginLogoPreview = this.settings.loginLogo || null;

      if (this.settings.siteName) {
        this.titleService.setTitle(this.settings.siteName);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      this.loading = false;
    }
  }

  beforeUploadLogo = (file: NzUploadFile): boolean => {
    const actualFile = file.originFileObj || (file as any);
    if (
      !actualFile ||
      !actualFile.type ||
      !actualFile.type.startsWith('image/')
    ) {
      this.toastr.error(
        this.translate.instant('systemConfig.imageFileRequired')
      );
      return false;
    }
    // Kiểm tra kích thước file (10MB = 10 * 1024 * 1024 bytes)
    const maxSize = 10 * 1024 * 1024;
    if (actualFile.size > maxSize) {
      this.toastr.error(
        this.translate.instant('systemConfig.fileSizeExceeded')
      );
      return false;
    }
    this.logoFile = actualFile;
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.logoPreview = e.target.result;
    };
    reader.readAsDataURL(actualFile);

    // Tự động download file khi upload
    const fileName = `logo.${actualFile.name.split('.').pop()}`;
    this.websiteSettingsService.downloadFile(actualFile, fileName);
    this.settings.logoFileName = fileName;
    this.settings.logo = `assets/img/${fileName}`;
    this.toastr.success(
      `File ${fileName} đã được tải về. Vui lòng copy vào thư mục src/assets/img/`
    );

    return false;
  };

  beforeUploadFavicon = (file: NzUploadFile): boolean => {
    const actualFile = file.originFileObj || (file as any);
    if (
      !actualFile ||
      !actualFile.type ||
      !actualFile.type.startsWith('image/')
    ) {
      this.toastr.error(
        this.translate.instant('systemConfig.imageFileRequired')
      );
      return false;
    }
    // Kiểm tra kích thước file (10MB = 10 * 1024 * 1024 bytes)
    const maxSize = 10 * 1024 * 1024;
    if (actualFile.size > maxSize) {
      this.toastr.error(
        this.translate.instant('systemConfig.fileSizeExceeded')
      );
      return false;
    }
    this.faviconFile = actualFile;
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.faviconPreview = e.target.result;
    };
    reader.readAsDataURL(actualFile);

    // Tự động download file khi upload
    const fileName = `favicon.${actualFile.name.split('.').pop()}`;
    this.websiteSettingsService.downloadFile(actualFile, fileName);
    this.settings.faviconFileName = fileName;
    this.settings.favicon = `assets/img/${fileName}`;
    this.toastr.success(
      `File ${fileName} đã được tải về. Vui lòng copy vào thư mục src/assets/img/`
    );

    return false;
  };

  beforeUploadLoginLogo = (file: NzUploadFile): boolean => {
    const actualFile = file.originFileObj || (file as any);
    if (
      !actualFile ||
      !actualFile.type ||
      !actualFile.type.startsWith('image/')
    ) {
      this.toastr.error(
        this.translate.instant('systemConfig.imageFileRequired')
      );
      return false;
    }
    // Kiểm tra kích thước file (10MB = 10 * 1024 * 1024 bytes)
    const maxSize = 10 * 1024 * 1024;
    if (actualFile.size > maxSize) {
      this.toastr.error(
        this.translate.instant('systemConfig.fileSizeExceeded')
      );
      return false;
    }
    this.loginLogoFile = actualFile;
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.loginLogoPreview = e.target.result;
    };
    reader.readAsDataURL(actualFile);

    // Tự động download file khi upload
    const fileName = `login-logo.${actualFile.name.split('.').pop()}`;
    this.websiteSettingsService.downloadFile(actualFile, fileName);
    this.settings.loginLogoFileName = fileName;
    this.settings.loginLogo = `assets/img/${fileName}`;
    this.toastr.success(
      `File ${fileName} đã được tải về. Vui lòng copy vào thư mục src/assets/img/`
    );

    return false;
  };

  removeLogo(): void {
    this.logoFile = null;
    this.logoPreview = null;
    this.settings.logo = '';
  }

  removeFavicon(): void {
    this.faviconFile = null;
    this.faviconPreview = null;
    this.settings.favicon = '';
  }

  removeLoginLogo(): void {
    this.loginLogoFile = null;
    this.loginLogoPreview = null;
    this.settings.loginLogo = '';
  }

  async saveSettings(): Promise<void> {
    if (!this.settings.siteName) {
      this.toastr.error(
        this.translate.instant('systemConfig.systemNameRequired')
      );
      return;
    }

    this.saving = true;
    try {
      // Files đã được download khi upload, chỉ cần lưu settings
      const success = await this.websiteSettingsService.saveSettings(
        this.settings
      );
      if (success) {
        this.titleService.setTitle(this.settings.siteName);
        this.updateFavicon();
        this.toastr.success(
          this.translate.instant('systemConfig.saveSuccess')
        );
        this.logoFile = null;
        this.faviconFile = null;
        this.loginLogoFile = null;
      } else {
        this.toastr.error(this.translate.instant('systemConfig.saveError'));
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      this.toastr.error(this.translate.instant('systemConfig.saveError'));
    } finally {
      this.saving = false;
    }
  }

  private updateFavicon(): void {
    if (this.settings.favicon) {
      let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'shortcut icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.href = this.settings.favicon;
    }
  }
}
