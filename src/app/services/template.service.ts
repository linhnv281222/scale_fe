import { Injectable } from '@angular/core';
import { ReportTemplateImport, ReportTemplateDetail, Template } from '../models';
import { BaseService } from './base.service';

@Injectable({
  providedIn: 'root',
})
export class TemplateService {
  constructor(private baseService: BaseService) {}

  // New API: Import template
  async importTemplate(data: FormData): Promise<ReportTemplateImport | null> {
    const res = await this.baseService.postFormData('report-templates/import', data);
    if (res && res.success === true && res.data) {
      return res.data || null;
    }
    return null;
  }

  // New API: Get list of template imports
  async getTemplateImports(templateType?: string): Promise<ReportTemplateImport[]> {
    const params: any = {};
    if (templateType) {
      params.templateType = templateType;
    }
    const res = await this.baseService.getData('report-templates/imports/list', params);
    if (res && res.success === true && res.data) {
      return res.data || [];
    }
    return [];
  }

  // New API: Get template import detail by id
  async getTemplateImportById(importId: number): Promise<ReportTemplateDetail | null> {
    const res = await this.baseService.getData(`report-templates/imports/${importId}`);
    if (res && res.success === true && res.data) {
      return res.data || null;
    }
    return null;
  }

  // New API: Download template
  async downloadTemplate(importId: number): Promise<Blob> {
    return await this.baseService.getFile(`report-templates/imports/${importId}/download`);
  }

  // New API: Archive (inactive) template
  async archiveTemplate(importId: number): Promise<ReportTemplateImport | null> {
    const res = await this.baseService.postData(`report-templates/imports/${importId}/archive`, {});
    if (res && res.success === true && res.data) {
      return res.data || null;
    }
    return null;
  }

  // Legacy methods (keep for backward compatibility)
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
