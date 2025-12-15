export interface ConnectionStatus {
  id?: number;
  scaleId: number;
  scale?: any;
  isConnected: boolean;
  lastDataTime?: Date;
  status: 'ONLINE' | 'OFFLINE' | 'ERROR';
  errorMessage?: string;
  updatedAt?: Date;
}
