export const SCROLL_TABLE = {
  SCROLL_X: '2000px',
  SCROLL_Y: '750px',
};

export const DATA_TYPE = {
  INTEGER: 0,
  NUMBER: 1,
  STRING: 2,
  LONG_STRING: 3,
  DATE_TIME: 4,
  BOOLEAN: 5,
  IMAGE: 6,
  RELATION: 7,
  MULTI_RELATION: 8,
  PARAM: 9,
  ANY: 10,
  OBJECT: 11,
  MONTH: 12,
  COLOR: 13,
  DATE_WITH_HOUR: 14,
  HOUR: 15,
  FILE: 16,
  STATUS: 17,
  RANGE_DATE: 18,
};

export const QR_TYPE = {
  employee_qr: 1,
  machine_qr: 2,
  wo_qr: 3,
  shape_qr: 4,
  box_qr: 5,
  prod_qr: 6,
};

export const TEMPLATE_CODE = {
  phieu_sx: 'PHIEU_SX',
};

export const STATUS_STAGE = {
  new: 0,
  production: 1,
  pause: 2,
  finish: 3,
};

export const CURRENCY_CODE = [
  { currencyCode: 'CHF', countryCode: 'ch' },
  { currencyCode: 'CNY', countryCode: 'cn' },
  { currencyCode: 'DKK', countryCode: 'dk' },
  { currencyCode: 'EUR', countryCode: 'eu' },
  { currencyCode: 'GBP', countryCode: 'gb' },
  { currencyCode: 'HKD', countryCode: 'hk' },
  { currencyCode: 'INR', countryCode: 'in' },
  { currencyCode: 'JPY', countryCode: 'jp' },
  { currencyCode: 'KRW', countryCode: 'kr' },
  { currencyCode: 'KWD', countryCode: 'kw' },
  { currencyCode: 'MYR', countryCode: 'my' },
  { currencyCode: 'NOK', countryCode: 'no' },
  { currencyCode: 'RUB', countryCode: 'ru' },
  { currencyCode: 'SAR', countryCode: 'sa' },
  { currencyCode: 'SEK', countryCode: 'se' },
  { currencyCode: 'SGD', countryCode: 'sg' },
  { currencyCode: 'THB', countryCode: 'th' },
  { currencyCode: 'USD', countryCode: 'us' },
  { currencyCode: 'AUD', countryCode: 'au' },
  { currencyCode: 'CAD', countryCode: 'ca' },
];

export const SHAPE = {
  hexagon: 'Lục giác',
  rectangle: 'Hình tấm',
  cylinder_solid: 'Phi tròn đặc',
  cylinder_pipe: 'Phi tròn ống',
};

export const STATUS_BLUEPRINT = {
  new: 0,
  technical_analysis: 1,
  update_quotation: 2,
  check: 3,
  wait_approve: 4,
  approve: 5,
  completed: 6,
};

export const ROLE_NAME = {
  CREATE: 'create',
  COPY: 'copy',
  DELETE_BATCH: 'delete-batch',
  VIEW_DETAIL: 'view-detail',
  UPDATE: 'update',
  DELETE: 'delete',
  CREATE_PARAM: 'create-param',
  IMPORT_FILE: 'import-file',
};

export const PI = 3.141592653589793238462643383279502884197169399375105820974944592307816406286208998628034825342117067982148086513282306647093844609550582231725359;

export const ROUTER_SYSTEM = {};

export const ROLE_SYSTEM = {};
