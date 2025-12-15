export enum ConfigDataType {
  STRING = 'STRING',
  TEXTAREA = 'TEXTAREA',
  NUMBER = 'NUMBER',
  INTEGER = 'INTEGER',
  DECIMAL = 'DECIMAL',
  BOOLEAN = 'BOOLEAN',
  DATETIME = 'DATETIME',
  DATE = 'DATE',
  TIME = 'TIME',
  SELECT = 'SELECT',
  MULTISELECT = 'MULTISELECT',
}

export enum ConfigCategory {
  FIELD_METADATA = 'FIELD_METADATA', // Cấu hình metadata trường dữ liệu
  SYSTEM_CONFIG = 'SYSTEM_CONFIG', // Cấu hình hệ thống
}

export interface Config {
  id?: number;
  key: string;
  value: string;
  dataType: ConfigDataType;
  description?: string;
  category?: ConfigCategory; // Loại cấu hình
  module?: string; // Module/Chức năng (ví dụ: 'users', 'scales', 'locations')
  fieldKey?: string; // Tên key gốc của trường (ví dụ: 'userName')
  displayName?: string; // Tên hiển thị (ví dụ: 'Tên đăng nhập')
  required?: boolean; // Trường bắt buộc
  width?: string; // Độ rộng cột (ví dụ: '150px', '200px')
  isSystemConfig?: boolean; // Có phải cấu hình hệ thống không
  createdAt?: Date;
  updatedAt?: Date;
}
