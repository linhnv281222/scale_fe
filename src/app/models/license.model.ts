export interface License {
  id?: number;
  licenseKey: string;
  maxScales: number;
  isActive?: boolean;
  expiresAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
