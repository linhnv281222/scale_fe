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
    siteName: '',
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
        this.translate.instant('websiteSettings.imageFileRequired')
      );
      return false;
    }
    this.logoFile = actualFile;
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.logoPreview = e.target.result;
    };
    reader.readAsDataURL(actualFile);
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
        this.translate.instant('websiteSettings.imageFileRequired')
      );
      return false;
    }
    this.faviconFile = actualFile;
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.faviconPreview = e.target.result;
    };
    reader.readAsDataURL(actualFile);
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
        this.translate.instant('websiteSettings.imageFileRequired')
      );
      return false;
    }
    this.loginLogoFile = actualFile;
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.loginLogoPreview = e.target.result;
    };
    reader.readAsDataURL(actualFile);
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
        this.translate.instant('websiteSettings.siteNameRequired')
      );
      return;
    }

    this.saving = true;
    try {
      if (this.logoFile) {
        const logoUrl = await this.websiteSettingsService.uploadLogo(
          this.logoFile
        );
        if (logoUrl) {
          this.settings.logo = logoUrl;
        }
      } else if (this.logoPreview && this.logoPreview.startsWith('data:')) {
        this.settings.logo = this.logoPreview;
      }

      if (this.faviconFile) {
        const faviconUrl = await this.websiteSettingsService.uploadFavicon(
          this.faviconFile
        );
        if (faviconUrl) {
          this.settings.favicon = faviconUrl;
        }
      } else if (
        this.faviconPreview &&
        this.faviconPreview.startsWith('data:')
      ) {
        this.settings.favicon = this.faviconPreview;
      }

      if (this.loginLogoFile) {
        const loginLogoUrl = await this.websiteSettingsService.uploadLogo(
          this.loginLogoFile
        );
        if (loginLogoUrl) {
          this.settings.loginLogo = loginLogoUrl;
        }
      } else if (
        this.loginLogoPreview &&
        this.loginLogoPreview.startsWith('data:')
      ) {
        this.settings.loginLogo = this.loginLogoPreview;
      }

      const success = await this.websiteSettingsService.saveSettings(
        this.settings
      );
      if (success) {
        this.titleService.setTitle(this.settings.siteName);
        this.updateFavicon();
        this.toastr.success(
          this.translate.instant('websiteSettings.saveSuccess')
        );
        this.logoFile = null;
        this.faviconFile = null;
        this.loginLogoFile = null;
      } else {
        this.toastr.error(this.translate.instant('websiteSettings.saveError'));
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      this.toastr.error(this.translate.instant('websiteSettings.saveError'));
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
