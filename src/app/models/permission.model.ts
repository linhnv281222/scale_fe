export interface Permission {
  id?: number;
  userId: number;
  functionCode: string;
  canView?: boolean;
  canAdd?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
