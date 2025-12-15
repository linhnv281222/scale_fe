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
