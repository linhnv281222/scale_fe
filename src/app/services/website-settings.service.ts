import { Injectable } from '@angular/core';
import { WebsiteSettings } from '../models';

@Injectable({
  providedIn: 'root',
})
export class WebsiteSettingsService {
  private readonly STORAGE_KEY = 'website_settings';

  async getSettings(): Promise<WebsiteSettings> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading website settings from localStorage:', error);
    }

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

  async uploadLogo(file: File): Promise<{ fileName: string; file: File } | null> {
    const fileName = `logo.${file.name.split('.').pop()}`;
    return { fileName, file };
  }

  async uploadFavicon(file: File): Promise<{ fileName: string; file: File } | null> {
    const fileName = `favicon.${file.name.split('.').pop()}`;
    return { fileName, file };
  }

  async uploadLoginLogo(file: File): Promise<{ fileName: string; file: File } | null> {
    const fileName = `login-logo.${file.name.split('.').pop()}`;
    return { fileName, file };
  }
}
