import { Location } from './location.model';
import { Protocol } from './protocol.model';
import { ScaleManufacturer } from './scale-manufacturer.model';

export enum ScaleType {
  INPUT = 'INPUT',
  OUTPUT = 'OUTPUT',
}

export enum ProtocolType {
  MODBUS_TCP = 'MODBUS_TCP',
  MODBUS_RTU = 'MODBUS_RTU',
  SABUS = 'SABUS',
}

export interface ModbusTcpConfig {
  ip: string;
  port: number;
}

export interface ModbusRtuConfig {
  port: string;
  baudRate: number;
  dataBits: number;
  stopBits: number;
  parity: string;
}

export interface SabusConfig {
  // Add Sabus specific config
  [key: string]: any;
}

export interface ScaleConnectionConfig {
  protocolType: ProtocolType;
  modbusTcp?: ModbusTcpConfig;
  modbusRtu?: ModbusRtuConfig;
  sabus?: SabusConfig;
}

export interface ScaleConfigDataChannel {
  name?: string;
  start_registers?: number;
  num_registers?: number;
  is_used: boolean;
  data_type?: string;
}

export interface ScaleConfig {
  protocol: string;
  scale_id?: number;
  poll_interval: number;
  conn_params: {
    ip?: string;
    port?: number;
  };
  data_1?: ScaleConfigDataChannel;
  data_2?: ScaleConfigDataChannel;
  data_3?: ScaleConfigDataChannel;
  data_4?: ScaleConfigDataChannel;
  data_5?: ScaleConfigDataChannel;
  updated_at?: string;
  updated_by?: string;
}

export interface Scale {
  id?: number;
  name: string;
  model?: string;
  location_id?: number;
  location_name?: string;
  is_active?: boolean;
  created_at?: string;
  created_by?: string;
  updated_at?: string;
  updated_by?: string;
  scale_config?: ScaleConfig;
  // Legacy fields for backward compatibility
  code?: string;
  scaleType?: ScaleType;
  locationId?: number;
  location?: Location;
  manufacturerId?: number;
  manufacturer?: ScaleManufacturer;
  protocolId?: number;
  protocol?: Protocol;
  connectionConfig?: ScaleConnectionConfig;
  readCycle?: number;
  status?: 'active' | 'paused' | 'inactive';
  createdAt?: Date;
  updatedAt?: Date;
}
