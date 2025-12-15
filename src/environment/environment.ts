// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  url_home_page:
    'http://dev.fcim.facenet.vn/home-page/#/auth/business-acc-setting/home-page',
  api_end_point_mdm: 'http://dev.apifcim.facenet.vn/mdm-v2',
  api_end_point_mdm_v1: 'http://dev.apifcim.facenet.vn/mdm',
  api_end_point_pos: 'http://dev.apifcim.facenet.vn/pos',
  api_end_point_dms: 'http://dev.apifcim.facenet.vn/dms',
  api_end_point: 'http://dev.apifcim.facenet.vn/hobi',
  api_end_point_aps_v2: 'http://dev.apifcim.facenet.vn/hobi',
  // api_end_point: 'http://localhost:10312',
  api_end_point_pms: 'http://dev.apifcim.facenet.vn/pms',
  // api_end_point_pms: 'http://192.168.1.98:10316',
  api_end_point_qms: 'http://dev.apifcim.facenet.vn/qms',
  api_end_point_all: 'http://dev.apifcim.facenet.vn/all',
  api_end_point_s3: 'http://dev.apifcim.facenet.vn/s3',
  // api_end_point_s3: 'http://192.168.1.190:10300',

  api_end_point_preview:
    'http://dev.apifcim.facenet.vn/s3/assets/getFile?path=',
  api_end_point_download: 'http://dev.apifcim.facenet.vn/s3/api/assets',
  api_end_point_template: 'http://dev.apifcim.facenet.vn/template',
  api_end_point_excel:
    'https://sin1.contabostorage.com/cf2afab5ee3b4f658b343e49ae70391c:fcimcloud/',
  domain_name_qs: 'http://localhost:4300/manage-po/list-po',
  auth_api: '/api/auth/',
  BASE_API_URI: {
    BASE_SERVICE_API: 'http://localhost:8088/',
    CLIENT_ADDRESS: 'http://localhost:8082',
  },
  API_URL: 'http://dev.apifcim.facenet.vn/all',
  URL_PMS: 'http://dev.fcim.facenet.vn/pms',
  URL_DMS: 'http://dev.fcim.facenet.vn/dms',
};
