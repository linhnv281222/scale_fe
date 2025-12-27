import { Injectable } from '@angular/core';
import { Template } from '../models';
import { BaseService } from './base.service';

@Injectable({
  providedIn: 'root',
})
export class TemplateService {
  constructor(private baseService: BaseService) {}

  // TODO: API 'templates' chưa có trong api-docs.json - tạm thời comment lại
  // async getTemplates(params?: any): Promise<{ data: Template[]; total: number }> {
  //   const res = await this.baseService.getData('templates', params);
  //   if (res && res.success === true && res.data) {
  //     const data = res.data || [];
  //     return { data, total: data.length };
  //   }
  //   return { data: [], total: 0 };
  // }

  // async getTemplateById(id: number): Promise<Template | null> {
  //   const res = await this.baseService.getData(`templates/${id}`);
  //   if (res && res.success === true && res.data) {
  //     return res.data || null;
  //   }
  //   return null;
  // }

  // async createTemplate(data: FormData): Promise<Template | null> {
  //   const res = await this.baseService.postFormData('templates', data);
  //   if (res && res.success === true && res.data) {
  //     return res.data || null;
  //   }
  //   return null;
  // }

  // async updateTemplate(id: number, data: FormData): Promise<Template | null> {
  //   const res = await this.baseService.putFormData(`templates/${id}`, data);
  //   if (res && res.success === true && res.data) {
  //     return res.data || null;
  //   }
  //   return null;
  // }

  // async deleteTemplate(id: number): Promise<boolean> {
  //   try {
  //     await this.baseService.deleteData(`templates/${id}`);
  //     return true;
  //   } catch (error) {
  //     return false;
  //   }
  // }

  // Temporary mock implementation
  async getTemplates(
    params?: any
  ): Promise<{ data: Template[]; total: number }> {
    return { data: [], total: 0 };
  }

  async getTemplateById(id: number): Promise<Template | null> {
    return null;
  }

  async createTemplate(data: FormData): Promise<Template | null> {
    return null;
  }

  async updateTemplate(id: number, data: FormData): Promise<Template | null> {
    return null;
  }

  async deleteTemplate(id: number): Promise<boolean> {
    return false;
  }
}
