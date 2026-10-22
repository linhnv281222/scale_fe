
import { environment } from '../../../environment/environment';
declare global {
  interface Window {
    scaleHubConfig?: {
      apiBaseUrl?: string;
    };
  }
}

export function getApiBaseUrl(): string {
  const runtimeUrl = window.scaleHubConfig?.apiBaseUrl;

  return (
    runtimeUrl ||
    environment.api_end_point ||
    'http://localhost:8080'
  ).replace(/\/+$/, '');
}
