export interface WebsiteSettings {
  id?: number;
  siteName: string;
  loginSystemName?: string; // Tên hệ thống ở logo đăng nhập
  logo?: string;
  favicon?: string;
  loginLogo?: string;
  copyright?: string;
  description?: string;
  primaryColor?: string;
  secondaryColor?: string;
  logoFileName?: string; // Tên file logo đã upload
  faviconFileName?: string; // Tên file favicon đã upload
  loginLogoFileName?: string; // Tên file login logo đã upload
}

