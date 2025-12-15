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

export interface Scale {
  id?: number;
  name: string;
  code: string;
  scaleType: ScaleType;
  locationId?: number;
  location?: Location;
  manufacturerId?: number;
  manufacturer?: ScaleManufacturer;
  protocolId?: number;
  protocol?: Protocol;
  connectionConfig: ScaleConnectionConfig;
  readCycle?: number; // seconds
  status?: 'active' | 'paused' | 'inactive';
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
