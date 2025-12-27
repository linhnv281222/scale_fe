import {
    Component,
    EventEmitter,
    Input,
    OnDestroy,
    OnInit,
    Output,
} from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { AuthService } from '../../../../services/auth.service';
import { LanguageService } from '../../../../services/language.service';
import { PageActionService } from '../../../../services/page-action.service';
import { ThemeService } from '../../../../services/theme.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  @Output() toggleSidebar = new EventEmitter<void>();
  @Output() addNew = new EventEmitter<void>();
  @Input() pageTitle: string = 'app.title';
  @Input() searchPlaceholder: string = 'common.search';
  @Input() menuItems: any[] = [];

  currentUser: any = null;
  isDarkMode = false;
  currentLang = 'vi_VN';

  constructor(
    private authService: AuthService,
    public themeService: ThemeService,
    public languageService: LanguageService,
    public translate: TranslateService,
    private router: Router,
    private pageActionService: PageActionService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.currentLang = this.languageService.getCurrentLanguage();
    this.themeService.theme$
      .pipe(takeUntil(this.destroy$))
      .subscribe((theme) => {
        this.isDarkMode = theme === 'dark';
      });

    // Update page title based on route
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.updatePageTitle();
      });
    this.updatePageTitle();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  updatePageTitle(): void {
    const url = this.router.url;
    if (url.includes('/locations')) {
      this.pageTitle = 'locations.title';
      this.searchPlaceholder = 'locations.searchPlaceholder';
    } else if (
      url.includes('/scales') &&
      !url.includes('/manufacturers') &&
      !url.includes('/protocols')
    ) {
      this.pageTitle = 'scales.title';
      this.searchPlaceholder = 'scales.searchPlaceholder';
    } else if (url.includes('/manufacturers')) {
      this.pageTitle = 'scales.manufacturers';
      this.searchPlaceholder = 'common.search';
    } else if (url.includes('/protocols')) {
      this.pageTitle = 'scales.protocols';
      this.searchPlaceholder = 'common.search';
    } else if (url.includes('/shifts')) {
      this.pageTitle = 'shifts.title';
      this.searchPlaceholder = 'common.search';
    } else if (url.includes('/users') || url.includes('/accounts')) {
      this.pageTitle = 'users.title';
      this.searchPlaceholder = 'common.search';
    } else if (url.includes('/permissions')) {
      this.pageTitle = 'permissions.title';
      this.searchPlaceholder = 'common.search';
    } else if (url.includes('/configs')) {
      this.pageTitle = 'configs.title';
      this.searchPlaceholder = 'common.search';
    } else if (url.includes('/data-collection')) {
      this.pageTitle = 'scaleData.title';
      this.searchPlaceholder = 'common.search';
    } else if (url.includes('/scale-report')) {
      this.pageTitle = 'reports.scaleReport';
      this.searchPlaceholder = 'common.search';
    } else if (url.includes('/shift-report')) {
      this.pageTitle = 'reports.shiftReport';
      this.searchPlaceholder = 'common.search';
    } else if (url.includes('/export-template')) {
      this.pageTitle = 'reports.exportTemplate';
      this.searchPlaceholder = 'common.search';
    } else if (url.includes('/templates')) {
      this.pageTitle = 'templates.title';
      this.searchPlaceholder = 'common.search';
    } else if (url.includes('/licenses')) {
      this.pageTitle = 'licenses.title';
      this.searchPlaceholder = 'common.search';
    } else if (url.includes('/connection-status')) {
      this.pageTitle = 'connectionStatus.title';
      this.searchPlaceholder = 'common.search';
    } else if (url.includes('/dashboard')) {
      this.pageTitle = 'menu.dashboard';
      this.searchPlaceholder = 'common.search';
    } else {
      this.pageTitle = 'app.title';
      this.searchPlaceholder = 'common.search';
    }
  }

  onLanguageChange(lang: string): void {
    this.languageService.setLanguage(lang);
    this.currentLang = lang;
  }

  onToggleSidebar(): void {
    this.toggleSidebar.emit();
  }

  onToggleTheme(): void {
    this.themeService.toggleTheme();
  }

  async logout(): Promise<void> {
    await this.authService.logout();
  }

  onProfile(): void {
    // TODO: Navigate to profile page or open profile modal
    console.log('Profile clicked');
  }

  onSettings(): void {
    // TODO: Navigate to settings page or open settings modal
    console.log('Settings clicked');
  }

  onAddNew(): void {
    this.addNew.emit();
    this.pageActionService.triggerAddNew();
  }
}
