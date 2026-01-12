import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { environment } from 'src/environment/environment';
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

        // Set logo files from backend
        this.logoFilesFromBE = [];
        if (data.logoUrl || data.logoBase64) {
          const logoUrl = data.logoUrl
            ? `${environment.api_end_point}/${data.logoUrl}`
            : `data:image/png;base64,${data.logoBase64}`;

          this.logoFilesFromBE = [
            {
              id: data.id,
              fileName: 'logo.png',
              path: data.logoUrl || '',
              resourcePath: data.logoUrl || '',
              size: 0,
              createdAt: data.updatedAt || data.createdAt,
            },
          ];
        }

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

  onLogoFilesFromBEChanged(event: any): void {
    // Handle delete from backend if needed
    if (event.type === 'delete') {
      this.logoFilesFromBE = [];
    }
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

      if (this.hasExistingSettings) {
        // Update existing settings
        result = await this.organizationSettingsService.updateSettings(
          data,
          logoFile
        );
      } else {
        // Create new settings
        result = await this.organizationSettingsService.createSettings(
          data,
          logoFile
        );
      }

      if (result) {
        this.settings = result;
        this.hasExistingSettings = true;

        // Update logo files from backend
        this.logoFiles = [];
        this.logoFilesFromBE = [];
        if (result.logoUrl || result.logoBase64) {
          this.logoFilesFromBE = [
            {
              id: result.id,
              fileName: 'logo.png',
              path: result.logoUrl || '',
              resourcePath: result.logoUrl || '',
              size: 0,
              createdAt: result.updatedAt || result.createdAt,
            },
          ];
        }

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
}
