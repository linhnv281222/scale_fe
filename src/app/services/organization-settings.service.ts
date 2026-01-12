import { Injectable } from '@angular/core';
import { OrganizationSettings } from '../models/organization-settings.model';
import { BaseService } from './base.service';

@Injectable({
  providedIn: 'root',
})
export class OrganizationSettingsService {
  constructor(private baseService: BaseService) {}

  async getSettings(): Promise<OrganizationSettings | null> {
    try {
      const res = await this.baseService.getData('api/organization-settings');
      if (res && res.success === true && res.data) {
        return res.data;
      } else if (res && res.id) {
        // Direct response
        return res;
      }
      return null;
    } catch (error) {
      console.error('Error loading organization settings:', error);
      return null;
    }
  }

  async createSettings(
    data: {
      companyName: string;
      companyNameEn?: string;
      address?: string;
      phone?: string;
      email?: string;
      website?: string;
      taxCode?: string;
      watermarkText?: string;
    },
    logoFile?: File
  ): Promise<OrganizationSettings | null> {
    try {
      const formData = new FormData();
      
      // Append text fields
      formData.append('companyName', data.companyName);
      if (data.companyNameEn) {
        formData.append('companyNameEn', data.companyNameEn);
      }
      if (data.address) {
        formData.append('address', data.address);
      }
      if (data.phone) {
        formData.append('phone', data.phone);
      }
      if (data.email) {
        formData.append('email', data.email);
      }
      if (data.website) {
        formData.append('website', data.website);
      }
      if (data.taxCode) {
        formData.append('taxCode', data.taxCode);
      }
      if (data.watermarkText) {
        formData.append('watermarkText', data.watermarkText);
      }

      // Append logo file if provided
      if (logoFile) {
        formData.append('logo', logoFile);
      }

      const res = await this.baseService.postFormData(
        'api/organization-settings',
        formData
      );
      if (res && res.success === true && res.data) {
        return res.data;
      } else if (res && res.id) {
        return res;
      }
      return null;
    } catch (error) {
      console.error('Error creating organization settings:', error);
      throw error;
    }
  }

  async updateSettings(
    data: {
      companyName: string;
      companyNameEn?: string;
      address?: string;
      phone?: string;
      email?: string;
      website?: string;
      taxCode?: string;
      watermarkText?: string;
    },
    logoFile?: File
  ): Promise<OrganizationSettings | null> {
    try {
      const formData = new FormData();
      
      // Append text fields
      formData.append('companyName', data.companyName);
      if (data.companyNameEn) {
        formData.append('companyNameEn', data.companyNameEn);
      }
      if (data.address) {
        formData.append('address', data.address);
      }
      if (data.phone) {
        formData.append('phone', data.phone);
      }
      if (data.email) {
        formData.append('email', data.email);
      }
      if (data.website) {
        formData.append('website', data.website);
      }
      if (data.taxCode) {
        formData.append('taxCode', data.taxCode);
      }
      if (data.watermarkText) {
        formData.append('watermarkText', data.watermarkText);
      }

      // Append logo file if provided
      if (logoFile) {
        formData.append('logo', logoFile);
      }

      const res = await this.baseService.putFormData(
        'api/organization-settings',
        formData
      );
      if (res && res.success === true && res.data) {
        return res.data;
      } else if (res && res.id) {
        return res;
      }
      return null;
    } catch (error) {
      console.error('Error updating organization settings:', error);
      throw error;
    }
  }
}

