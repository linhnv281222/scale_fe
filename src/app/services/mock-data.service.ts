import { Injectable } from '@angular/core';
import {
  Config,
  ConfigCategory,
  ConfigDataType,
  ConnectionStatus,
  License,
  Location,
  Protocol,
  ProtocolType,
  Scale,
  ScaleConnectionConfig,
  ScaleData,
  ScaleManufacturer,
  ScaleType,
  Shift,
  Template,
  TemplateType,
  User,
} from '../models';

@Injectable({
  providedIn: 'root',
})
export class MockDataService {
  getMockLocations(): Location[] {
    const now = new Date();

    return [
      // Nhà máy chính (root)
      {
        id: 1,
        name: 'Nhà máy Sản xuất Chính',
        code: 'NM-001',
        type: 'Nhà máy',
        status: 'active',
        parentId: undefined,
        createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        updatedAt: now,
      },
      {
        id: 2,
        name: 'Nhà máy Sản xuất Phụ',
        code: 'NM-002',
        type: 'Nhà máy',
        status: 'active',
        parentId: undefined,
        createdAt: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000),
        updatedAt: now,
      },

      // Khu vực của Nhà máy 1
      {
        id: 3,
        name: 'Khu vực Sản xuất A',
        code: 'KV-A-001',
        type: 'Khu vực',
        status: 'active',
        parentId: 1,
        createdAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
        updatedAt: now,
      },
      {
        id: 4,
        name: 'Khu vực Sản xuất B',
        code: 'KV-B-001',
        type: 'Khu vực',
        status: 'active',
        parentId: 1,
        createdAt: new Date(now.getTime() - 18 * 24 * 60 * 60 * 1000),
        updatedAt: now,
      },
      {
        id: 5,
        name: 'Khu vực Kho',
        code: 'KV-KHO-001',
        type: 'Khu vực',
        status: 'active',
        parentId: 1,
        createdAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
        updatedAt: now,
      },

      // Khu vực của Nhà máy 2
      {
        id: 6,
        name: 'Khu vực Sản xuất C',
        code: 'KV-C-001',
        type: 'Khu vực',
        status: 'active',
        parentId: 2,
        createdAt: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000),
        updatedAt: now,
      },

      // Dây chuyền của Khu vực A
      {
        id: 7,
        name: 'Dây chuyền Sản xuất 1',
        code: 'DC-001',
        type: 'Dây chuyền',
        status: 'active',
        parentId: 3,
        createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
        updatedAt: now,
      },
      {
        id: 8,
        name: 'Dây chuyền Sản xuất 2',
        code: 'DC-002',
        type: 'Dây chuyền',
        status: 'active',
        parentId: 3,
        createdAt: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000),
        updatedAt: now,
      },

      // Dây chuyền của Khu vực B
      {
        id: 9,
        name: 'Dây chuyền Đóng gói 1',
        code: 'DC-DG-001',
        type: 'Dây chuyền',
        status: 'active',
        parentId: 4,
        createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        updatedAt: now,
      },
      {
        id: 10,
        name: 'Dây chuyền Đóng gói 2',
        code: 'DC-DG-002',
        type: 'Dây chuyền',
        status: 'active',
        parentId: 4,
        createdAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000),
        updatedAt: now,
      },

      // Dây chuyền của Khu vực Kho
      {
        id: 11,
        name: 'Dây chuyền Nhập kho',
        code: 'DC-NK-001',
        type: 'Dây chuyền',
        status: 'active',
        parentId: 5,
        createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        updatedAt: now,
      },
      {
        id: 12,
        name: 'Dây chuyền Xuất kho',
        code: 'DC-XK-001',
        type: 'Dây chuyền',
        status: 'active',
        parentId: 5,
        createdAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
        updatedAt: now,
      },

      // Trạm cân của Dây chuyền 1
      {
        id: 13,
        name: 'Trạm cân Nguyên liệu 1',
        code: 'TC-NL-001',
        type: 'Trạm cân',
        status: 'active',
        parentId: 7,
        createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
        updatedAt: now,
      },
      {
        id: 14,
        name: 'Trạm cân Thành phẩm 1',
        code: 'TC-TP-001',
        type: 'Trạm cân',
        status: 'active',
        parentId: 7,
        createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        updatedAt: now,
      },

      // Trạm cân của Dây chuyền 2
      {
        id: 15,
        name: 'Trạm cân Nguyên liệu 2',
        code: 'TC-NL-002',
        type: 'Trạm cân',
        status: 'active',
        parentId: 8,
        createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
        updatedAt: now,
      },
      {
        id: 16,
        name: 'Trạm cân Thành phẩm 2',
        code: 'TC-TP-002',
        type: 'Trạm cân',
        status: 'active',
        parentId: 8,
        createdAt: now,
        updatedAt: now,
      },

      // Trạm cân của Dây chuyền Đóng gói 1
      {
        id: 17,
        name: 'Trạm cân Kiểm tra 1',
        code: 'TC-KT-001',
        type: 'Trạm cân',
        status: 'active',
        parentId: 9,
        createdAt: now,
        updatedAt: now,
      },

      // Trạm cân của Dây chuyền Nhập kho
      {
        id: 18,
        name: 'Trạm cân Nhập kho 1',
        code: 'TC-NK-001',
        type: 'Trạm cân',
        status: 'active',
        parentId: 11,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 19,
        name: 'Trạm cân Nhập kho 2',
        code: 'TC-NK-002',
        type: 'Trạm cân',
        status: 'active',
        parentId: 11,
        createdAt: now,
        updatedAt: now,
      },

      // Trạm cân của Dây chuyền Xuất kho
      {
        id: 20,
        name: 'Trạm cân Xuất kho 1',
        code: 'TC-XK-001',
        type: 'Trạm cân',
        status: 'active',
        parentId: 12,
        createdAt: now,
        updatedAt: now,
      },
    ];
  }

  getMockProtocols(): Protocol[] {
    const now = new Date();
    return [
      {
        id: 1,
        name: 'Modbus TCP',
        code: 'MODBUS_TCP',
        type: ProtocolType.MODBUS_TCP,
        status: 'active',
        createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        updatedAt: now,
      },
      {
        id: 2,
        name: 'Modbus RTU',
        code: 'MODBUS_RTU',
        type: ProtocolType.MODBUS_RTU,
        status: 'active',
        createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        updatedAt: now,
      },
      {
        id: 3,
        name: 'Sabus',
        code: 'SABUS',
        type: ProtocolType.SABUS,
        status: 'active',
        createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        updatedAt: now,
      },
    ];
  }

  getMockLicenses(): License[] {
    const now = new Date();
    return [
      {
        id: 1,
        licenseKey: 'LIC-2024-001',
        maxScales: 50,
        isActive: true,
        expiresAt: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        updatedAt: now,
      },
    ];
  }

  getMockScales(): Scale[] {
    const now = new Date();
    const protocols = this.getMockProtocols();

    return [
      // Modbus TCP Scales
      {
        id: 1,
        name: 'Cân Nguyên liệu 1',
        code: 'CAN-NL-001',
        scaleType: ScaleType.INPUT,
        protocolId: 1,
        protocol: protocols[0],
        connectionConfig: {
          protocolType: ProtocolType.MODBUS_TCP,
          modbusTcp: {
            ip: '192.168.1.100',
            port: 502,
          },
        } as ScaleConnectionConfig,
        readCycle: 60,
        status: 'active',
        createdAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
        updatedAt: now,
      },
      {
        id: 2,
        name: 'Cân Nguyên liệu 2',
        code: 'CAN-NL-002',
        scaleType: ScaleType.INPUT,
        protocolId: 1,
        protocol: protocols[0],
        connectionConfig: {
          protocolType: ProtocolType.MODBUS_TCP,
          modbusTcp: {
            ip: '192.168.1.101',
            port: 502,
          },
        } as ScaleConnectionConfig,
        readCycle: 60,
        status: 'active',
        createdAt: new Date(now.getTime() - 18 * 24 * 60 * 60 * 1000),
        updatedAt: now,
      },
      {
        id: 3,
        name: 'Cân Thành phẩm 1',
        code: 'CAN-TP-001',
        scaleType: ScaleType.OUTPUT,
        protocolId: 1,
        protocol: protocols[0],
        connectionConfig: {
          protocolType: ProtocolType.MODBUS_TCP,
          modbusTcp: {
            ip: '192.168.1.102',
            port: 502,
          },
        } as ScaleConnectionConfig,
        readCycle: 30,
        status: 'active',
        createdAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
        updatedAt: now,
      },
      {
        id: 4,
        name: 'Cân Thành phẩm 2',
        code: 'CAN-TP-002',
        scaleType: ScaleType.OUTPUT,
        protocolId: 1,
        protocol: protocols[0],
        connectionConfig: {
          protocolType: ProtocolType.MODBUS_TCP,
          modbusTcp: {
            ip: '192.168.1.103',
            port: 502,
          },
        } as ScaleConnectionConfig,
        readCycle: 30,
        status: 'active',
        createdAt: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000),
        updatedAt: now,
      },
      {
        id: 5,
        name: 'Cân Kiểm tra 1',
        code: 'CAN-KT-001',
        scaleType: ScaleType.INPUT,
        protocolId: 1,
        protocol: protocols[0],
        connectionConfig: {
          protocolType: ProtocolType.MODBUS_TCP,
          modbusTcp: {
            ip: '192.168.1.104',
            port: 502,
          },
        } as ScaleConnectionConfig,
        readCycle: 45,
        status: 'paused',
        createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
        updatedAt: now,
      },

      // Modbus RTU Scales
      {
        id: 6,
        name: 'Cân Nhập kho 1',
        code: 'CAN-NK-001',
        scaleType: ScaleType.INPUT,
        protocolId: 2,
        protocol: protocols[1],
        connectionConfig: {
          protocolType: ProtocolType.MODBUS_RTU,
          modbusRtu: {
            port: 'COM1',
            baudRate: 9600,
            dataBits: 8,
            stopBits: 1,
            parity: 'NONE',
          },
        } as ScaleConnectionConfig,
        readCycle: 60,
        status: 'active',
        createdAt: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000),
        updatedAt: now,
      },
      {
        id: 7,
        name: 'Cân Nhập kho 2',
        code: 'CAN-NK-002',
        scaleType: ScaleType.INPUT,
        protocolId: 2,
        protocol: protocols[1],
        connectionConfig: {
          protocolType: ProtocolType.MODBUS_RTU,
          modbusRtu: {
            port: 'COM2',
            baudRate: 19200,
            dataBits: 8,
            stopBits: 1,
            parity: 'EVEN',
          },
        } as ScaleConnectionConfig,
        readCycle: 60,
        status: 'active',
        createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        updatedAt: now,
      },
      {
        id: 8,
        name: 'Cân Xuất kho 1',
        code: 'CAN-XK-001',
        scaleType: ScaleType.OUTPUT,
        protocolId: 2,
        protocol: protocols[1],
        connectionConfig: {
          protocolType: ProtocolType.MODBUS_RTU,
          modbusRtu: {
            port: 'COM3',
            baudRate: 9600,
            dataBits: 7,
            stopBits: 2,
            parity: 'ODD',
          },
        } as ScaleConnectionConfig,
        readCycle: 30,
        status: 'active',
        createdAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000),
        updatedAt: now,
      },
      {
        id: 9,
        name: 'Cân Xuất kho 2',
        code: 'CAN-XK-002',
        scaleType: ScaleType.OUTPUT,
        protocolId: 2,
        protocol: protocols[1],
        connectionConfig: {
          protocolType: ProtocolType.MODBUS_RTU,
          modbusRtu: {
            port: 'COM4',
            baudRate: 38400,
            dataBits: 8,
            stopBits: 1,
            parity: 'NONE',
          },
        } as ScaleConnectionConfig,
        readCycle: 30,
        status: 'inactive',
        createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        updatedAt: now,
      },

      // Sabus Scales
      {
        id: 10,
        name: 'Cân Đặc biệt 1',
        code: 'CAN-DB-001',
        scaleType: ScaleType.INPUT,
        protocolId: 3,
        protocol: protocols[2],
        connectionConfig: {
          protocolType: ProtocolType.SABUS,
          sabus: {
            config: 'SABUS_CONFIG_001',
          },
        } as ScaleConnectionConfig,
        readCycle: 60,
        status: 'active',
        createdAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
        updatedAt: now,
      },
      {
        id: 11,
        name: 'Cân Đặc biệt 2',
        code: 'CAN-DB-002',
        scaleType: ScaleType.OUTPUT,
        protocolId: 3,
        protocol: protocols[2],
        connectionConfig: {
          protocolType: ProtocolType.SABUS,
          sabus: {
            config: 'SABUS_CONFIG_002',
          },
        } as ScaleConnectionConfig,
        readCycle: 45,
        status: 'active',
        createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
        updatedAt: now,
      },
      {
        id: 12,
        name: 'Cân Bảo trì 1',
        code: 'CAN-BT-001',
        scaleType: ScaleType.INPUT,
        protocolId: 1,
        protocol: protocols[0],
        connectionConfig: {
          protocolType: ProtocolType.MODBUS_TCP,
          modbusTcp: {
            ip: '192.168.1.200',
            port: 502,
          },
        } as ScaleConnectionConfig,
        readCycle: 60,
        status: 'inactive',
        createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        updatedAt: now,
      },
    ];
  }

  getMockScaleManufacturers(): ScaleManufacturer[] {
    const now = new Date();

    return [
      {
        id: 1,
        name: 'Mettler Toledo',
        code: 'MT-001',
        status: 'active',
        createdAt: new Date(now.getTime() - 100 * 24 * 60 * 60 * 1000),
        updatedAt: now,
      },
      {
        id: 2,
        name: 'Sartorius',
        code: 'SAR-001',
        status: 'active',
        createdAt: new Date(now.getTime() - 95 * 24 * 60 * 60 * 1000),
        updatedAt: now,
      },
      {
        id: 3,
        name: 'Ohaus',
        code: 'OHA-001',
        status: 'active',
        createdAt: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
        updatedAt: now,
      },
      {
        id: 4,
        name: 'A&D Weighing',
        code: 'AD-001',
        status: 'active',
        createdAt: new Date(now.getTime() - 85 * 24 * 60 * 60 * 1000),
        updatedAt: now,
      },
      {
        id: 5,
        name: 'Shimadzu',
        code: 'SHI-001',
        status: 'active',
        createdAt: new Date(now.getTime() - 80 * 24 * 60 * 60 * 1000),
        updatedAt: now,
      },
      {
        id: 6,
        name: 'Kern & Sohn',
        code: 'KER-001',
        status: 'active',
        createdAt: new Date(now.getTime() - 75 * 24 * 60 * 60 * 1000),
        updatedAt: now,
      },
      {
        id: 7,
        name: 'Radwag',
        code: 'RAD-001',
        status: 'active',
        createdAt: new Date(now.getTime() - 70 * 24 * 60 * 60 * 1000),
        updatedAt: now,
      },
      {
        id: 8,
        name: 'Precisa',
        code: 'PRE-001',
        status: 'active',
        createdAt: new Date(now.getTime() - 65 * 24 * 60 * 60 * 1000),
        updatedAt: now,
      },
      {
        id: 9,
        name: 'Adam Equipment',
        code: 'ADE-001',
        status: 'active',
        createdAt: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
        updatedAt: now,
      },
      {
        id: 10,
        name: 'Tanita',
        code: 'TAN-001',
        status: 'active',
        createdAt: new Date(now.getTime() - 55 * 24 * 60 * 60 * 1000),
        updatedAt: now,
      },
      {
        id: 11,
        name: 'CAS',
        code: 'CAS-001',
        status: 'active',
        createdAt: new Date(now.getTime() - 50 * 24 * 60 * 60 * 1000),
        updatedAt: now,
      },
      {
        id: 12,
        name: 'AND Weighing',
        code: 'AND-001',
        status: 'active',
        createdAt: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000),
        updatedAt: now,
      },
      {
        id: 13,
        name: 'Rice Lake Weighing Systems',
        code: 'RLW-001',
        status: 'active',
        createdAt: new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000),
        updatedAt: now,
      },
      {
        id: 14,
        name: 'Cardinal Scale',
        code: 'CAR-001',
        status: 'active',
        createdAt: new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000),
        updatedAt: now,
      },
      {
        id: 15,
        name: 'Avery Weigh-Tronix',
        code: 'AWT-001',
        status: 'inactive',
        createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        updatedAt: now,
      },
    ];
  }

  getMockShifts(): Shift[] {
    const now = new Date();

    return [
      {
        id: 1,
        name: 'Ca Sáng',
        startTime: '06:00',
        endTime: '14:00',
        status: 'active',
        isActive: true,
        createdAt: new Date(now.getTime() - 100 * 24 * 60 * 60 * 1000),
        updatedAt: now,
      },
      {
        id: 2,
        name: 'Ca Chiều',
        startTime: '14:00',
        endTime: '22:00',
        status: 'active',
        isActive: true,
        createdAt: new Date(now.getTime() - 95 * 24 * 60 * 60 * 1000),
        updatedAt: now,
      },
      {
        id: 3,
        name: 'Ca Đêm',
        startTime: '22:00',
        endTime: '06:00',
        status: 'active',
        isActive: true,
        createdAt: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
        updatedAt: now,
      },
      {
        id: 4,
        name: 'Ca Hành Chính',
        startTime: '08:00',
        endTime: '17:00',
        status: 'active',
        isActive: true,
        createdAt: new Date(now.getTime() - 85 * 24 * 60 * 60 * 1000),
        updatedAt: now,
      },
      {
        id: 5,
        name: 'Ca Tăng Cường',
        startTime: '18:00',
        endTime: '02:00',
        status: 'active',
        isActive: true,
        createdAt: new Date(now.getTime() - 80 * 24 * 60 * 60 * 1000),
        updatedAt: now,
      },
      {
        id: 6,
        name: 'Ca Phụ',
        startTime: '10:00',
        endTime: '18:00',
        status: 'inactive',
        isActive: false,
        createdAt: new Date(now.getTime() - 75 * 24 * 60 * 60 * 1000),
        updatedAt: now,
      },
    ];
  }

  getMockUsers(): User[] {
    const now = new Date();

    return [
      {
        id: 1,
        username: 'admin',
        password: 'admin123', // In real app, this should be hashed
        fullName: 'Super Admin',
        email: 'admin@example.com',
        status: 'active',
        isActive: true,
        createdAt: new Date(now.getTime() - 200 * 24 * 60 * 60 * 1000),
        updatedAt: now,
      },
      {
        id: 2,
        username: 'manager1',
        password: 'manager123',
        fullName: 'Nguyễn Văn A',
        email: 'manager1@example.com',
        status: 'active',
        isActive: true,
        createdAt: new Date(now.getTime() - 150 * 24 * 60 * 60 * 1000),
        updatedAt: now,
      },
      {
        id: 3,
        username: 'operator1',
        password: 'operator123',
        fullName: 'Trần Thị B',
        email: 'operator1@example.com',
        status: 'active',
        isActive: true,
        createdAt: new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000),
        updatedAt: now,
      },
      {
        id: 4,
        username: 'operator2',
        password: 'operator123',
        fullName: 'Lê Văn C',
        email: 'operator2@example.com',
        status: 'active',
        isActive: true,
        createdAt: new Date(now.getTime() - 100 * 24 * 60 * 60 * 1000),
        updatedAt: now,
      },
      {
        id: 5,
        username: 'viewer1',
        password: 'viewer123',
        fullName: 'Phạm Thị D',
        email: 'viewer1@example.com',
        status: 'active',
        isActive: true,
        createdAt: new Date(now.getTime() - 80 * 24 * 60 * 60 * 1000),
        updatedAt: now,
      },
      {
        id: 6,
        username: 'testuser',
        password: 'test123',
        fullName: 'Test User',
        email: 'test@example.com',
        status: 'inactive',
        isActive: false,
        createdAt: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
        updatedAt: now,
      },
      {
        id: 7,
        username: 'manager2',
        password: 'manager123',
        fullName: 'Hoàng Văn E',
        email: 'manager2@example.com',
        status: 'active',
        isActive: true,
        createdAt: new Date(now.getTime() - 50 * 24 * 60 * 60 * 1000),
        updatedAt: now,
      },
      {
        id: 8,
        username: 'operator3',
        password: 'operator123',
        fullName: 'Võ Thị F',
        email: 'operator3@example.com',
        status: 'active',
        isActive: true,
        createdAt: new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000),
        updatedAt: now,
      },
    ];
  }

  getMockScaleReportData(params?: any): any[] {
    const now = new Date();
    const scales = this.getMockScales();
    const reportData: any[] = [];

    // Generate data for the last 24 hours by default
    const startDate = params?.startDate
      ? new Date(params.startDate)
      : new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const endDate = params?.endDate ? new Date(params.endDate) : now;

    // Filter scales by type if provided
    let filteredScales = scales;
    if (params?.scaleType) {
      filteredScales = filteredScales.filter(
        (s) => s.scaleType === params.scaleType
      );
    }

    // Filter scales by IDs if provided
    if (params?.scaleIds && params.scaleIds.length > 0) {
      filteredScales = filteredScales.filter((s) =>
        params.scaleIds.includes(s.id)
      );
    }

    // Generate data for each scale
    filteredScales.forEach((scale) => {
      const currentDate = new Date(startDate);
      let id = 1;

      while (currentDate <= endDate) {
        // Generate data every 15 minutes
        for (let hour = 0; hour < 24; hour++) {
          for (let minute = 0; minute < 60; minute += 15) {
            const timestamp = new Date(currentDate);
            timestamp.setHours(hour, minute, 0, 0);

            if (timestamp >= startDate && timestamp <= endDate) {
              // Generate random weight with some variation
              const baseWeight = scale.scaleType === 'INPUT' ? 1000 : 500;
              const variation = Math.random() * 200 - 100; // -100 to +100
              const weight = Math.max(0, baseWeight + variation);

              reportData.push({
                id: id++,
                scaleId: scale.id!,
                scale: scale,
                weight: Math.round(weight * 100) / 100, // Round to 2 decimals
                timestamp: timestamp,
                isCurrent: false,
                createdAt: timestamp,
              });
            }
          }
        }

        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
        currentDate.setHours(0, 0, 0, 0);
      }
    });

    // Sort by timestamp
    reportData.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    return reportData;
  }

  getMockShiftReportData(params?: any): any[] {
    const now = new Date();
    const shifts = this.getMockShifts();
    const scales = this.getMockScales();
    const reportData: any[] = [];

    // Generate data for the last 7 days by default
    const startDate = params?.startDate
      ? new Date(params.startDate)
      : new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const endDate = params?.endDate ? new Date(params.endDate) : now;

    // Filter shifts if provided
    let filteredShifts = shifts;
    if (params?.shiftIds && params.shiftIds.length > 0) {
      filteredShifts = filteredShifts.filter((s) =>
        params.shiftIds.includes(s.id)
      );
    }

    // Filter scales if provided
    let filteredScales = scales;
    if (params?.scaleIds && params.scaleIds.length > 0) {
      filteredScales = filteredScales.filter((s) =>
        params.scaleIds.includes(s.id)
      );
    }

    // Generate data for each shift and scale combination
    filteredShifts.forEach((shift) => {
      filteredScales.forEach((scale) => {
        const currentDate = new Date(startDate);
        let id = 1;

        while (currentDate <= endDate) {
          // Generate data for each hour during shift hours
          const [startHour, startMinute] = shift.startTime.split(':').map(Number);
          const [endHour, endMinute] = shift.endTime.split(':').map(Number);

          for (let hour = startHour; hour <= endHour; hour++) {
            const timestamp = new Date(currentDate);
            timestamp.setHours(hour, 0, 0, 0);

            if (timestamp >= startDate && timestamp <= endDate) {
              // Generate random values with some variation
              const baseFlowRate = 100 + Math.random() * 50; // 100-150
              const baseTotalAccumulated = 1000 + Math.random() * 500; // 1000-1500
              const baseSpeed = 10 + Math.random() * 5; // 10-15
              const baseWeight = scale.scaleType === 'INPUT' ? 1000 : 500;
              const weightVariation = Math.random() * 200 - 100; // -100 to +100
              const weight = Math.max(0, baseWeight + weightVariation);

              // Random connection status (90% connected)
              const connectionStatus = Math.random() > 0.1 ? 'CONNECTED' : 'DISCONNECTED';

              reportData.push({
                id: id++,
                shiftId: shift.id!,
                shift: shift,
                scaleId: scale.id!,
                scale: scale,
                date: timestamp,
                flowRate: Math.round(baseFlowRate * 100) / 100,
                totalAccumulated: Math.round(baseTotalAccumulated * 100) / 100,
                speed: Math.round(baseSpeed * 100) / 100,
                connectionStatus: connectionStatus,
                weight: Math.round(weight * 100) / 100,
                createdAt: timestamp,
              });
            }
          }

          // Move to next day
          currentDate.setDate(currentDate.getDate() + 1);
          currentDate.setHours(0, 0, 0, 0);
        }
      });
    });

    // Sort by date
    reportData.sort((a, b) => a.date.getTime() - b.date.getTime());

    return reportData;
  }

  getMockTemplates(): Template[] {
    const now = new Date();
    
    return [
      {
        id: 1,
        name: 'Biểu mẫu báo cáo cân hàng ngày',
        type: TemplateType.SCALE_REPORT,
        content: `BÁO CÁO CÂN HÀNG NGÀY
Ngày: {{date}}
Tổng số cân: {{totalScales}}
Tổng khối lượng: {{totalWeight}} kg
Chi tiết:
{{#each scales}}
- {{name}}: {{weight}} kg
{{/each}}`,
        isActive: true,
        createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        id: 2,
        name: 'Biểu mẫu báo cáo cân theo tuần',
        type: TemplateType.SCALE_REPORT,
        content: `BÁO CÁO CÂN THEO TUẦN
Tuần: {{week}}
Từ ngày: {{startDate}} đến {{endDate}}
Tổng số cân: {{totalScales}}
Tổng khối lượng: {{totalWeight}} kg
Trung bình mỗi ngày: {{averageWeight}} kg`,
        isActive: true,
        createdAt: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        id: 3,
        name: 'Biểu mẫu báo cáo ca sáng',
        type: TemplateType.SHIFT_REPORT,
        content: `BÁO CÁO CA SÁNG
Ngày: {{date}}
Ca: {{shiftName}}
Thời gian: {{startTime}} - {{endTime}}
Lưu lượng: {{flowRate}} m³/h
Tổng tích lũy: {{totalAccumulated}} kg
Tốc độ: {{speed}} m/s
Khối lượng: {{weight}} kg
Tình trạng kết nối: {{connectionStatus}}`,
        isActive: true,
        createdAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        id: 4,
        name: 'Biểu mẫu báo cáo ca chiều',
        type: TemplateType.SHIFT_REPORT,
        content: `BÁO CÁO CA CHIỀU
Ngày: {{date}}
Ca: {{shiftName}}
Thời gian: {{startTime}} - {{endTime}}
Lưu lượng: {{flowRate}} m³/h
Tổng tích lũy: {{totalAccumulated}} kg
Tốc độ: {{speed}} m/s
Khối lượng: {{weight}} kg
Tình trạng kết nối: {{connectionStatus}}`,
        isActive: true,
        createdAt: new Date(now.getTime() - 18 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      },
      {
        id: 5,
        name: 'Biểu mẫu báo cáo ca đêm',
        type: TemplateType.SHIFT_REPORT,
        content: `BÁO CÁO CA ĐÊM
Ngày: {{date}}
Ca: {{shiftName}}
Thời gian: {{startTime}} - {{endTime}}
Lưu lượng: {{flowRate}} m³/h
Tổng tích lũy: {{totalAccumulated}} kg
Tốc độ: {{speed}} m/s
Khối lượng: {{weight}} kg
Tình trạng kết nối: {{connectionStatus}}`,
        isActive: true,
        createdAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(now.getTime() - 10 * 60 * 60 * 1000),
      },
      {
        id: 6,
        name: 'Biểu mẫu báo cáo cân tổng hợp',
        type: TemplateType.SCALE_REPORT,
        content: `BÁO CÁO CÂN TỔNG HỢP
Khoảng thời gian: {{startDate}} - {{endDate}}
Tổng số cân: {{totalScales}}
Tổng khối lượng: {{totalWeight}} kg
Trung bình: {{averageWeight}} kg
Cân cao nhất: {{maxWeight}} kg
Cân thấp nhất: {{minWeight}} kg`,
        isActive: false,
        createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000),
      },
      {
        id: 7,
        name: 'Biểu mẫu báo cáo ca tổng hợp',
        type: TemplateType.SHIFT_REPORT,
        content: `BÁO CÁO CA TỔNG HỢP
Khoảng thời gian: {{startDate}} - {{endDate}}
Tổng số ca: {{totalShifts}}
Tổng lưu lượng: {{totalFlowRate}} m³/h
Tổng tích lũy: {{totalAccumulated}} kg
Tốc độ trung bình: {{averageSpeed}} m/s
Khối lượng trung bình: {{averageWeight}} kg`,
        isActive: true,
        createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      },
    ];
  }

  getMockConnectionStatuses(): ConnectionStatus[] {
    const now = new Date();
    const scales = this.getMockScales();
    
    return scales.map((scale, index) => {
      // Simulate different connection statuses
      // Some scales have recent data, some have old data, some have no data
      let lastDataTime: Date | undefined;
      let status: 'ONLINE' | 'OFFLINE' | 'ERROR' = 'ONLINE';
      let errorMessage: string | undefined;
      
      // Simulate different scenarios
      if (index === 0) {
        // First scale: recent data (1 minute ago)
        lastDataTime = new Date(now.getTime() - 1 * 60 * 1000);
        status = 'ONLINE';
      } else if (index === 1) {
        // Second scale: data 3 minutes ago (warning)
        lastDataTime = new Date(now.getTime() - 3 * 60 * 1000);
        status = 'ONLINE';
      } else if (index === 2) {
        // Third scale: data 10 minutes ago (warning)
        lastDataTime = new Date(now.getTime() - 10 * 60 * 1000);
        status = 'ONLINE';
      } else if (index === 3) {
        // Fourth scale: data 20 minutes ago (error)
        lastDataTime = new Date(now.getTime() - 20 * 60 * 1000);
        status = 'OFFLINE';
        errorMessage = 'Không nhận được dữ liệu từ cân';
      } else if (index === 4) {
        // Fifth scale: data 2 hours ago (error)
        lastDataTime = new Date(now.getTime() - 2 * 60 * 60 * 1000);
        status = 'OFFLINE';
        errorMessage = 'Mất kết nối với cân';
      } else if (index === 5) {
        // Sixth scale: data 1 day ago (error)
        lastDataTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        status = 'ERROR';
        errorMessage = 'Lỗi kết nối nghiêm trọng';
      } else if (index === 6) {
        // Seventh scale: no data
        lastDataTime = undefined;
        status = 'ERROR';
        errorMessage = 'Chưa có dữ liệu';
      } else {
        // Other scales: random recent data
        const minutesAgo = Math.floor(Math.random() * 5);
        lastDataTime = new Date(now.getTime() - minutesAgo * 60 * 1000);
        status = 'ONLINE';
      }
      
      return {
        id: index + 1,
        scaleId: scale.id!,
        scale: scale,
        isConnected: status === 'ONLINE',
        lastDataTime: lastDataTime,
        status: status,
        errorMessage: errorMessage,
        updatedAt: now,
      };
    });
  }

  getMockConfigs(): Config[] {
    const now = new Date();
    return [
      // System Configs
      {
        id: 1,
        key: 'defaultReadCycle',
        value: '60',
        dataType: ConfigDataType.NUMBER,
        description: 'Chu kỳ đọc dữ liệu mặc định (giây)',
        category: ConfigCategory.SYSTEM_CONFIG,
        module: 'system',
        createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        updatedAt: now,
      },
      {
        id: 2,
        key: 'maxStorageTime',
        value: '90',
        dataType: ConfigDataType.NUMBER,
        description: 'Thời gian lưu dữ liệu tối đa (ngày)',
        category: ConfigCategory.SYSTEM_CONFIG,
        module: 'system',
        createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        updatedAt: now,
      },
      // Field Metadata - Users Module
      {
        id: 3,
        key: 'users.userName',
        value: 'tenTaiKhoan',
        dataType: ConfigDataType.STRING,
        description: 'Tên key cho trường tên đăng nhập',
        category: ConfigCategory.FIELD_METADATA,
        module: 'users',
        fieldKey: 'userName',
        displayName: 'Tên đăng nhập',
        createdAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
        updatedAt: now,
      },
      {
        id: 4,
        key: 'users.fullName',
        value: 'hoVaTen',
        dataType: ConfigDataType.STRING,
        description: 'Tên key cho trường họ và tên',
        category: ConfigCategory.FIELD_METADATA,
        module: 'users',
        fieldKey: 'fullName',
        displayName: 'Họ và tên',
        createdAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
        updatedAt: now,
      },
      {
        id: 5,
        key: 'users.email',
        value: 'email',
        dataType: ConfigDataType.STRING,
        description: 'Tên key cho trường email',
        category: ConfigCategory.FIELD_METADATA,
        module: 'users',
        fieldKey: 'email',
        displayName: 'Email',
        createdAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
        updatedAt: now,
      },
      // Field Metadata - Scales Module
      {
        id: 6,
        key: 'scales.name',
        value: 'tenCan',
        dataType: ConfigDataType.STRING,
        description: 'Tên key cho trường tên cân',
        category: ConfigCategory.FIELD_METADATA,
        module: 'scales',
        fieldKey: 'name',
        displayName: 'Tên cân',
        createdAt: new Date(now.getTime() - 18 * 24 * 60 * 60 * 1000),
        updatedAt: now,
      },
      {
        id: 7,
        key: 'scales.code',
        value: 'maCan',
        dataType: ConfigDataType.STRING,
        description: 'Tên key cho trường mã cân',
        category: ConfigCategory.FIELD_METADATA,
        module: 'scales',
        fieldKey: 'code',
        displayName: 'Mã cân',
        createdAt: new Date(now.getTime() - 18 * 24 * 60 * 60 * 1000),
        updatedAt: now,
      },
      {
        id: 8,
        key: 'scales.scaleType',
        value: 'loaiCan',
        dataType: ConfigDataType.STRING,
        description: 'Tên key cho trường loại cân',
        category: ConfigCategory.FIELD_METADATA,
        module: 'scales',
        fieldKey: 'scaleType',
        displayName: 'Loại cân',
        createdAt: new Date(now.getTime() - 18 * 24 * 60 * 60 * 1000),
        updatedAt: now,
      },
      // Field Metadata - Locations Module
      {
        id: 9,
        key: 'locations.name',
        value: 'tenViTri',
        dataType: ConfigDataType.STRING,
        description: 'Tên key cho trường tên vị trí',
        category: ConfigCategory.FIELD_METADATA,
        module: 'locations',
        fieldKey: 'name',
        displayName: 'Tên vị trí',
        createdAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
        updatedAt: now,
      },
      {
        id: 10,
        key: 'locations.code',
        value: 'maViTri',
        dataType: ConfigDataType.STRING,
        description: 'Tên key cho trường mã vị trí',
        category: ConfigCategory.FIELD_METADATA,
        module: 'locations',
        fieldKey: 'code',
        displayName: 'Mã vị trí',
        createdAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
        updatedAt: now,
      },
      // Field Metadata - Shifts Module
      {
        id: 11,
        key: 'shifts.name',
        value: 'tenCa',
        dataType: ConfigDataType.STRING,
        description: 'Tên key cho trường tên ca',
        category: ConfigCategory.FIELD_METADATA,
        module: 'shifts',
        fieldKey: 'name',
        displayName: 'Tên ca',
        createdAt: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000),
        updatedAt: now,
      },
      {
        id: 12,
        key: 'shifts.startTime',
        value: 'thoiGianBatDau',
        dataType: ConfigDataType.DATETIME,
        description: 'Tên key cho trường thời gian bắt đầu',
        category: ConfigCategory.FIELD_METADATA,
        module: 'shifts',
        fieldKey: 'startTime',
        displayName: 'Thời gian bắt đầu',
        createdAt: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000),
        updatedAt: now,
      },
      {
        id: 13,
        key: 'shifts.endTime',
        value: 'thoiGianKetThuc',
        dataType: ConfigDataType.DATETIME,
        description: 'Tên key cho trường thời gian kết thúc',
        category: ConfigCategory.FIELD_METADATA,
        module: 'shifts',
        fieldKey: 'endTime',
        displayName: 'Thời gian kết thúc',
        createdAt: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000),
        updatedAt: now,
      },
    ];
  }

  getMockScaleData(params?: any): ScaleData[] {
    const now = new Date();
    const scales = this.getMockScales();
    const scaleData: ScaleData[] = [];

    // Generate historical data (last 30 days by default)
    const startDate = params?.dateFrom
      ? new Date(params.dateFrom)
      : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const endDate = params?.dateTo ? new Date(params.dateTo) : now;

    // Filter by scaleId if provided
    let filteredScales = scales;
    if (params?.scaleId) {
      filteredScales = filteredScales.filter((s) => s.id === params.scaleId);
    }

    // Generate data for each scale
    filteredScales.forEach((scale) => {
      const currentDate = new Date(startDate);
      let id = 1;

      while (currentDate <= endDate) {
        // Generate data every hour
        for (let hour = 0; hour < 24; hour++) {
          const timestamp = new Date(currentDate);
          timestamp.setHours(hour, Math.floor(Math.random() * 60), Math.floor(Math.random() * 60), 0);

          if (timestamp >= startDate && timestamp <= endDate) {
            // Generate random weight
            const baseWeight = scale.scaleType === 'INPUT' ? 1000 : 500;
            const variation = Math.random() * 200 - 100;
            const weight = Math.max(0, baseWeight + variation);

            scaleData.push({
              id: id++,
              scaleId: scale.id!,
              scale: scale,
              weight: Math.round(weight * 100) / 100,
              timestamp: timestamp,
              isCurrent: false,
              createdAt: timestamp,
            });
          }
        }

        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
        currentDate.setHours(0, 0, 0, 0);
      }
    });

    // Sort by timestamp descending (newest first)
    scaleData.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return scaleData;
  }

  getMockCurrentScaleData(): ScaleData[] {
    const now = new Date();
    const scales = this.getMockScales();
    const currentData: ScaleData[] = [];

    // Generate latest data for each scale (within last 5 minutes)
    scales.forEach((scale) => {
      const timestamp = new Date(now.getTime() - Math.random() * 5 * 60 * 1000);
      const baseWeight = scale.scaleType === 'INPUT' ? 1000 : 500;
      const variation = Math.random() * 200 - 100;
      const weight = Math.max(0, baseWeight + variation);

      currentData.push({
        id: scale.id,
        scaleId: scale.id!,
        scale: scale,
        weight: Math.round(weight * 100) / 100,
        timestamp: timestamp,
        isCurrent: true,
        createdAt: timestamp,
      });
    });

    // Sort by timestamp descending
    currentData.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return currentData;
  }
}
