export interface Permission {
  id?: number;
  name?: string;
  code: string;
  resource?: string;
  action?: string;
  description?: string;
  createdAt?: string;
  createdBy?: string;
}
