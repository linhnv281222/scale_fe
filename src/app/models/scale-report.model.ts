import { Scale } from './scale.model';

export type IntervalType = 'HOUR' | 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';
export type AggregationType = 'ABS' | 'SUM' | 'MAX' | 'AVG';

export interface DataValue {
  value: string;
  name: string;
  used: boolean;
}

export interface IntervalReportRow {
  scale: Scale;
  period: string;
  recordCount: number;
  data_values: {
    data_1?: DataValue;
    data_2?: DataValue;
    data_3?: DataValue;
    data_4?: DataValue;
    data_5?: DataValue;
  };
}

export interface IntervalReportResponse {
  interval?: IntervalType;
  fromDate?: string;
  toDate?: string;
  dataFieldNames?: {
    [key: string]: string;
  };
  aggregationByField?: {
    [key: string]: AggregationType;
  };
  rows?: IntervalReportRow[];
  // New response shape: data is array of IntervalReportRow
  data?: IntervalReportRow[];
}

export interface ScaleHistoryItem {
  scaleId: number;
  scaleCode?: string;
  scaleName: string;
  locationName?: string;
  createdAt: string;
  lastTime: string;
  data1?: string;
  data2?: string;
  dataValues: {
    data_1?: DataValue;
    data_2?: DataValue;
    data_3?: DataValue;
    data_4?: DataValue;
    data_5?: DataValue;
  };
}

export interface ScaleHistoryResponse {
  content: ScaleHistoryItem[];
  page: number;
  size: number;
  total_elements: number;
  total_pages: number;
  is_first: boolean;
  is_last: boolean;
  has_next: boolean;
  has_previous: boolean;
}

