import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { OrganizationSettings } from '../../models/organization-settings.model';
import { OrganizationSettingsService } from '../../services/organization-settings.service';

@Component({
  selector: 'app-website-settings',
  templateUrl: './website-settings.component.html',
  styleUrls: ['./website-settings.component.css'],
})
export class WebsiteSettingsComponent implements OnInit {
  settings: OrganizationSettings = {
    companyName: '',
    companyNameEn: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    taxCode: '',
    watermarkText: '',
  };

  loading = false;
  saving = false;
  logoFiles: File[] = [];
  logoFilesFromBE: any[] = [];
  faviconFiles: File[] = [];
  faviconFilesFromBE: any[] = [];
  hasExistingSettings = false;

  constructor(
    private organizationSettingsService: OrganizationSettingsService,
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
      const data = await this.organizationSettingsService.getSettings();
      if (data) {
        this.settings = data;
        this.hasExistingSettings = !!data.id;

        // Set logo files from backend - CHỈ dùng logoBase64 cho preview/download
        this.logoFilesFromBE = [];
        if (data.logoBase64) {
          const logoPreviewUrl = `data:image/png;base64,${data.logoBase64}`;

          this.logoFilesFromBE = [
            {
              id: data.id,
              fileName: 'logo.png',
              // Không sử dụng logoUrl ở FE để tránh gọi API /files/...
              path: '',
              resourcePath: logoPreviewUrl,
              size: 0,
              createdAt: data.updatedAt || data.createdAt,
            },
          ];
        }

        // Set favicon files from backend - CHỈ dùng faviconBase64 cho preview/download
        this.faviconFilesFromBE = [];
        if (data.faviconBase64) {
          const faviconPreviewUrl = `data:image/png;base64,${data.faviconBase64}`;

          this.faviconFilesFromBE = [
            {
              id: data.id,
              fileName: 'favicon.ico',
              path: '',
              resourcePath: faviconPreviewUrl,
              size: 0,
              createdAt: data.updatedAt || data.createdAt,
            },
          ];
        }

        // Update favicon in HTML head
        this.updateFavicon(data.faviconBase64);

        // Set page title
        if (this.settings.companyName) {
          this.titleService.setTitle(this.settings.companyName);
        }
      }
    } catch (error: any) {
      console.error('Error loading settings:', error);
      const errorMessage =
        error?.error?.message || error?.message || 'Không thể tải cấu hình';
      this.toastr.error(errorMessage, 'Lỗi');
    } finally {
      this.loading = false;
    }
  }

  onLogoFilesChanged(files: File[]): void {
    this.logoFiles = files;
  }

  onLogoFilesFromBEChanged(filesFromBE: any[]): void {
    // upload-file.component luôn emit mảng filesFromBE mới
    this.logoFilesFromBE = filesFromBE || [];
  }

  onFaviconFilesChanged(files: File[]): void {
    this.faviconFiles = files;
  }

  onFaviconFilesFromBEChanged(filesFromBE: any[]): void {
    // upload-file.component luôn emit mảng filesFromBE mới
    this.faviconFilesFromBE = filesFromBE || [];
  }

  async saveSettings(): Promise<void> {
    if (!this.settings.companyName || this.settings.companyName.trim() === '') {
      this.toastr.error(
        this.translate.instant('systemConfig.systemNameRequired')
      );
      return;
    }

    this.saving = true;
    try {
      const data = {
        companyName: this.settings.companyName.trim(),
        companyNameEn: this.settings.companyNameEn?.trim() || '',
        address: this.settings.address?.trim() || '',
        phone: this.settings.phone?.trim() || '',
        email: this.settings.email?.trim() || '',
        website: this.settings.website?.trim() || '',
        taxCode: this.settings.taxCode?.trim() || '',
        watermarkText: this.settings.watermarkText?.trim() || '',
      };

      let result: OrganizationSettings | null = null;

      // Get logo file from uploaded files
      const logoFile =
        this.logoFiles && this.logoFiles.length > 0
          ? this.logoFiles[0]
          : undefined;

      // Get favicon file from uploaded files
      const faviconFile =
        this.faviconFiles && this.faviconFiles.length > 0
          ? this.faviconFiles[0]
          : undefined;

      if (this.hasExistingSettings) {
        // Update existing settings
        result = await this.organizationSettingsService.updateSettings(
          data,
          logoFile,
          undefined,
          faviconFile
        );
      } else {
        // Create new settings
        result = await this.organizationSettingsService.createSettings(
          data,
          logoFile,
          faviconFile
        );
      }

      if (result) {
        this.settings = result;
        this.hasExistingSettings = true;

        // Update logo files from backend (chỉ dùng base64 cho preview/download)
        this.logoFiles = [];
        this.logoFilesFromBE = [];
        if (result.logoBase64) {
          const logoPreviewUrl = `data:image/png;base64,${result.logoBase64}`;
          this.logoFilesFromBE = [
            {
              id: result.id,
              fileName: 'logo.png',
              path: '',
              resourcePath: logoPreviewUrl,
              size: 0,
              createdAt: result.updatedAt || result.createdAt,
            },
          ];
        }

        // Update favicon files from backend (chỉ dùng base64 cho preview/download)
        this.faviconFiles = [];
        this.faviconFilesFromBE = [];
        if (result.faviconBase64) {
          const faviconPreviewUrl = `data:image/png;base64,${result.faviconBase64}`;
          this.faviconFilesFromBE = [
            {
              id: result.id,
              fileName: 'favicon.ico',
              path: '',
              resourcePath: faviconPreviewUrl,
              size: 0,
              createdAt: result.updatedAt || result.createdAt,
            },
          ];
        }

        // Update favicon in HTML head
        this.updateFavicon(result.faviconBase64);

        // Update page title
        if (this.settings.companyName) {
          this.titleService.setTitle(this.settings.companyName);
        }

        this.toastr.success(this.translate.instant('systemConfig.saveSuccess'));
      } else {
        this.toastr.error(this.translate.instant('systemConfig.saveError'));
      }
    } catch (error: any) {
      console.error('Error saving settings:', error);
      const errorMessage =
        error?.error?.message || error?.message || 'Không thể lưu cấu hình';
      this.toastr.error(errorMessage, 'Lỗi');
    } finally {
      this.saving = false;
    }
  }

  private updateFavicon(faviconBase64?: string): void {
    // Remove existing favicon links
    const existingFavicons = document.querySelectorAll(
      'link[rel="icon"], link[rel="shortcut icon"]'
    );
    existingFavicons.forEach((link) => link.remove());

    if (faviconBase64) {
      // Create new favicon link
      const faviconLink = document.createElement('link');
      faviconLink.rel = 'shortcut icon';
      faviconLink.type = 'image/png';
      faviconLink.href = `data:image/png;base64,${faviconBase64}`;
      document.head.appendChild(faviconLink);
    } else {
      // Fallback to default favicon
      const defaultFavicon = document.createElement('link');
      defaultFavicon.rel = 'shortcut icon';
      defaultFavicon.type = 'icon';
      defaultFavicon.href = 'favicon.ico';
      document.head.appendChild(defaultFavicon);
    }
  }
}
