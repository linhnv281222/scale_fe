import { environment } from 'src/environment/environment';
import { getApiBaseUrl } from '../config/runtime-config';
export const API = {
  BUSINESS: getApiBaseUrl() + '/api/v1/tenant',
  BUSINESS_ACCOUNT_MANAGEMENT: getApiBaseUrl() + '/api/v1/tenant',
};
