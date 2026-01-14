import { Injectable } from '@angular/core';
import { WebsiteSettings } from '../models';
import { OrganizationSettingsService } from './organization-settings.service';

@Injectable({
  providedIn: 'root',
})
export class WebsiteSettingsService {
  private readonly STORAGE_KEY = 'website_settings';

  constructor(
    private organizationSettingsService: OrganizationSettingsService
  ) {}

  async getSettings(): Promise<WebsiteSettings> {
    // Ưu tiên: cố gắng lấy từ API cấu hình tổ chức
    try {
      const orgSettings = await this.organizationSettingsService.getSettings();
      if (orgSettings) {
        const logoFromBase64 = orgSettings.logoBase64
          ? `data:image/png;base64,${orgSettings.logoBase64}`
          : undefined;

        const settingsFromApi: WebsiteSettings = {
          id: orgSettings.id,
          siteName: orgSettings.companyName || 'Factory Data Manager',
          loginSystemName:
            orgSettings.companyNameEn ||
            orgSettings.companyName ||
            'Factory Data Manager',
          logo: logoFromBase64 || 'assets/img/facenet-01-k-nen.png',
          loginLogo: logoFromBase64 || 'assets/img/facenet-01-k-nen.png',
          favicon: '',
          copyright: '',
          description: '',
          primaryColor: '#2563eb',
          secondaryColor: '#64748b',
        };

        // Lưu cache vào localStorage để lần sau load nhanh hơn
        try {
          localStorage.setItem(
            this.STORAGE_KEY,
            JSON.stringify(settingsFromApi)
          );
        } catch {
          // ignore cache errors
        }

        return settingsFromApi;
      }
    } catch (error) {
      console.error('Error loading website settings from API:', error);
    }

    // Fallback: lấy từ localStorage
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading website settings from localStorage:', error);
    }

    // Fallback cuối cùng: giá trị mặc định
    return {
      siteName: 'Factory Data Manager',
      loginSystemName: 'Factory Data Manager',
      logo: 'assets/img/facenet-01-k-nen.png',
      favicon: '',
      loginLogo: 'assets/img/facenet-01-k-nen.png',
      copyright: '',
      description: '',
      primaryColor: '#2563eb',
      secondaryColor: '#64748b',
    };
  }

  async saveSettings(settings: WebsiteSettings): Promise<boolean> {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(settings));
      return true;
    } catch (error) {
      console.error('Error saving website settings to localStorage:', error);
      return false;
    }
  }

  /**
   * Download file to user's computer
   * User needs to manually copy the file to src/assets/img/
   */
  downloadFile(file: File, fileName: string): void {
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  async uploadLogo(
    file: File
  ): Promise<{ fileName: string; file: File } | null> {
    const fileName = `logo.${file.name.split('.').pop()}`;
    return { fileName, file };
  }

  async uploadFavicon(
    file: File
  ): Promise<{ fileName: string; file: File } | null> {
    const fileName = `favicon.${file.name.split('.').pop()}`;
    return { fileName, file };
  }

  async uploadLoginLogo(
    file: File
  ): Promise<{ fileName: string; file: File } | null> {
    const fileName = `login-logo.${file.name.split('.').pop()}`;
    return { fileName, file };
  }
}
