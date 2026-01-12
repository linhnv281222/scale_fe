export interface OrganizationSettings {
  id?: number;
  companyName: string;
  companyNameEn?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  taxCode?: string;
  logoUrl?: string;
  logoBase64?: string;
  hasLogo?: boolean;
  watermarkText?: string;
  isActive?: boolean;
  isDefault?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

