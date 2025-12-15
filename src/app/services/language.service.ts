import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private currentLang = 'vi_VN';

  constructor(private translate: TranslateService) {
    const savedLang = localStorage.getItem('language') || 'vi_VN';
    this.setLanguage(savedLang);
  }

  setLanguage(lang: string): void {
    this.currentLang = lang;
    localStorage.setItem('language', lang);
    this.translate.use(lang === 'vi_VN' ? 'vi' : 'en');
  }

  getCurrentLanguage(): string {
    return this.currentLang;
  }

  toggleLanguage(): void {
    const newLang = this.currentLang === 'vi_VN' ? 'en_US' : 'vi_VN';
    this.setLanguage(newLang);
  }
}

