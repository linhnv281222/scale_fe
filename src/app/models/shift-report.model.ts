export interface ShiftReport {
  id?: number;
  shiftId: number;
  shift?: any;
  scaleId: number;
  scale?: any;
  date: Date;
  flowRate?: number;
  totalAccumulated?: number;
  speed?: number;
  connectionStatus: 'CONNECTED' | 'DISCONNECTED';
  weight?: number;
  createdAt?: Date;
}
