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
  SIEMENS_S7 = 'SIEMENS_S7',
  SABUS = 'SABUS',
  SBUS = 'SBUS',
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
  is_used: boolean;
  decimal_places?: number;

  // MODBUS_TCP & MODBUS_RTU
  function_code?: number;
  start_registers?: number;
  start_register?: number; // legacy compatibility
  num_registers?: number;
  data_type?: string;
  byte_order?: string;
  word_order?: string;

  // SIEMENS_S7
  tag_address?: string;

  // SABUS & SBUS
  command?: string;

  // SBUS
  payload?: string;
  mode?: string;
  response_type?: string;

  // Legacy fields
  unit?: string;
  [key: string]: any;
}

export interface ScaleConfigConnParams {
  // Common / MODBUS_TCP / SIEMENS_S7
  ip?: string;
  port?: number;
  unit_id?: number;
  response_timeout_ms?: number;

  // Serial: MODBUS_RTU / SABUS / SBUS
  com_port?: string;
  baud_rate?: number;
  data_bits?: number;
  stop_bits?: number;
  parity?: string;

  // SIEMENS_S7
  rack?: number;
  slot?: number;
  controller_type?: string;
  connect_timeout_ms?: number;
  read_timeout_ms?: number;

  // SABUS ASCII
  device_id?: string | number;
  device_id_width?: number;
  reconnect_delay_ms?: number;
  offline_threshold_ms?: number;
  command_prefix?: string;
  command_terminator?: string;

  id?: string;
  [key: string]: any;
}

export interface ScaleConfig {
  protocol: string;
  scale_id?: number;
  poll_interval: number;
  conn_params: ScaleConfigConnParams;
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
  direction?: string; // IMPORT, EXPORT
  location_id?: number;
  location_name?: string;
  manufacturer_id?: number;
  manufacturer_name?: string;
  manufacturer_code?: string;
  protocol_id?: number;
  protocol_name?: string;
  protocol_code?: string;
  is_active?: boolean;
  created_at?: string;
  created_by?: string;
  updated_at?: string;
  updated_by?: string;
  scale_config?: ScaleConfig;
  // Direct fields on scale (matching response/request payload)
  protocol?: string | any;
  poll_interval?: number;
  conn_params?: ScaleConfigConnParams;
  data_1?: ScaleConfigDataChannel;
  data_2?: ScaleConfigDataChannel;
  data_3?: ScaleConfigDataChannel;
  data_4?: ScaleConfigDataChannel;
  data_5?: ScaleConfigDataChannel;
  // Legacy fields for backward compatibility
  code?: string;
  scaleType?: ScaleType;
  locationId?: number;
  location?: Location;
  manufacturerId?: number;
  manufacturer?: ScaleManufacturer;
  protocolId?: number;
  connectionConfig?: ScaleConnectionConfig;
  readCycle?: number;
  status?: 'active' | 'paused' | 'inactive';
  createdAt?: Date;
  updatedAt?: Date;
}
