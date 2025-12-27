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
      siteName: '',
      logo: '',
      favicon: '',
      loginLogo: '',
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

  async uploadLogo(file: File): Promise<string | null> {
    return this.fileToBase64(file);
  }

  async uploadFavicon(file: File): Promise<string | null> {
    return this.fileToBase64(file);
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  }
}
