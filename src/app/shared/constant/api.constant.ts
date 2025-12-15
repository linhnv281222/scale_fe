import { environment } from 'src/environment/environment';

export const API = {
  BUSINESS: environment.API_URL + '/api/v1/tenant',
  BUSINESS_ACCOUNT_MANAGEMENT: environment.API_URL + '/api/v1/tenant',
};
