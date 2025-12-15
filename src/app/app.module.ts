import { CommonModule } from '@angular/common';
import {
  APP_INITIALIZER,
  CUSTOM_ELEMENTS_SCHEMA,
  NgModule,
} from '@angular/core';
import { BrowserModule, Title } from '@angular/platform-browser';

import { registerLocaleData } from '@angular/common';
import {
  HttpClient,
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import en from '@angular/common/locales/en';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
// import { enUS } from 'date-fns/locale';
import { en_US, NZ_I18N, NzI18nModule } from 'ng-zorro-antd/i18n';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
// Page Components
import { IconsProviderModule } from './icons-provider.module';
import { ConfigsComponent } from './pages/configs/configs.component';
import { ConnectionStatusComponent } from './pages/connection-status/connection-status.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { LicensesComponent } from './pages/licenses/licenses.component';
import { LocationsComponent } from './pages/locations/locations.component';
import { LoginComponent } from './pages/login/login.component';
import { PermissionsComponent } from './pages/permissions/permissions.component';
import { ProtocolsComponent } from './pages/protocols/protocols.component';
import { ScaleDataComponent } from './pages/scale-data/scale-data.component';
import { ScaleManufacturersComponent } from './pages/scale-manufacturers/scale-manufacturers.component';
import { ScaleReportComponent } from './pages/scale-report/scale-report.component';
import { ScalesComponent } from './pages/scales/scales.component';
import { ShiftReportComponent } from './pages/shift-report/shift-report.component';
import { ShiftsComponent } from './pages/shifts/shifts.component';
import { TemplatesComponent } from './pages/templates/templates.component';
import { UsersComponent } from './pages/users/users.component';
import { SharedModule } from './shared/components/components.module';

//
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { NgxEchartsModule } from 'ngx-echarts';
import { ToastrModule } from 'ngx-toastr';
// import { NgxSpinnerModule } from "ngx-spinner";
export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}
registerLocaleData(en);
//
// import {
//   GANTT_GLOBAL_CONFIG,
//   GanttI18nLocale,
//   NgxGanttModule,
// } from '@worktile/gantt';
import { NgxUiLoaderConfig, PB_DIRECTION, SPINNER } from 'ngx-ui-loader';
import { initializer } from './app-init';
import { NgZorroModuleExport } from './shared/modules/ng-zorro.module';

// Page Components

const ngxUiLoaderConfig: NgxUiLoaderConfig = {
  text: 'Đang tải...',
  textColor: '#FFFFFF',
  textPosition: 'center-center',
  pbColor: '#2C73EB',
  bgsColor: 'white',
  fgsColor: '#2C73EB',
  fgsType: SPINNER.rectangleBounce,
  fgsSize: 40,
  pbDirection: PB_DIRECTION.leftToRight,
  pbThickness: 3,
};

@NgModule({
  declarations: [
    AppComponent,
    // Page Components
    DashboardComponent,
    LocationsComponent,
    ScalesComponent,
    ScaleManufacturersComponent,
    ProtocolsComponent,
    ShiftsComponent,
    UsersComponent,
    PermissionsComponent,
    ConfigsComponent,
    ScaleDataComponent,
    ScaleReportComponent,
    ShiftReportComponent,
    TemplatesComponent,
    LicensesComponent,
    ConnectionStatusComponent,
    LoginComponent,
  ],
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    AppRoutingModule,
    // ExceptionModule, // Temporarily disabled
    // TourMatMenuModule, // Temporarily disabled
    CommonModule,
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    NzI18nModule,
    BrowserAnimationsModule,
    ToastrModule.forRoot({
      positionClass: 'toast-top-right',
      preventDuplicates: true,
      countDuplicates: true,
    }),
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: createTranslateLoader,
        deps: [HttpClient],
      },
    }),
    TranslateModule, // Import TranslateModule to use translate pipe in components
    IconsProviderModule,
    SharedModule,
    NgxEchartsModule.forRoot({
      echarts: () => import('echarts'),
    }),
    NgZorroModuleExport,
  ],
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: initializer,
      multi: true,
    },
    // { provide: NZ_DATE_LOCALE, useValue: enUS },
    // {
    //   provide: GANTT_GLOBAL_CONFIG,
    //   useValue: {
    //     locale: GanttI18nLocale.enUs,
    //     dateFormat: {
    //       timeZone: 'Asia/Bangkok',
    //       weekStartsOn: 1,
    //     },
    //   },
    // },
    // {
    //   provide: HTTP_INTERCEPTORS,
    //   useClass: TokenInterceptor,
    //   multi: true,
    // },
    Title,
    { provide: NZ_I18N, useValue: en_US },
    provideHttpClient(withInterceptorsFromDi()),
  ],
})
export class AppModule {}
