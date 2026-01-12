export enum TemplateType {
  SCALE_REPORT = 'SCALE_REPORT',
  SHIFT_REPORT = 'SHIFT_REPORT',
}

export interface Template {
  id?: number;
  name: string;
  type: TemplateType;
  content?: string;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// New API models for report templates
export interface ReportTemplateImport {
  id?: number;
  templateId?: number;
  templateCode: string;
  originalFilename?: string;
  resourcePath?: string;
  fileSizeBytes?: number;
  fileHash?: string;
  importStatus?: 'ACTIVE' | 'ARCHIVED';
  importDate?: string;
  importNotes?: string;
  isActive?: boolean;
  templateType?: string; // "Báo cáo cân" hoặc "Báo cáo ca"
  createdBy?: string;
  createdAt?: string;
  // Display properties (pre-calculated to avoid function calls in template)
  templateTypeLabel?: string;
  fileSizeFormatted?: string;
}

export interface ReportTemplateDetail {
  importId?: number;
  template?: {
    id?: number;
    code?: string;
    name?: string;
    description?: string;
    titleTemplate?: string;
    isActive?: boolean;
    isDefault?: boolean;
    wordTemplateFilename?: string;
    hasWordTemplateFile?: boolean;
  };
  originalFilename?: string;
  resourcePath?: string;
  fileSizeBytes?: number;
  fileHash?: string;
  importStatus?: string;
  importDate?: string;
  importNotes?: string;
}