import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-no-data',
  template: `
    <div class="no-data-container">
      <div class="no-data-icon">
        <span
          nz-icon
          [nzType]="iconType"
          [nzTheme]="iconTheme"
          class="no-data-icon-svg"
        ></span>
      </div>
      <h3 class="no-data-title">{{ displayTitle | translate }}</h3>
      <p class="no-data-description" *ngIf="displayDescription">
        {{ displayDescription | translate }}
      </p>
      <div class="no-data-action" *ngIf="showAction && actionText">
        <button
          nz-button
          nzType="primary"
          nzSize="small"
          (click)="onActionClick()"
        >
          {{ actionText | translate }}
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .no-data-container {
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;
        height: 100%;
        width: 100%;
        text-align: center;
        padding: 24px;
      }

      .no-data-icon {
        margin-bottom: 16px;
      }

      .no-data-icon-svg {
        font-size: 64px;
        color: #9ca3af;
      }

      .dark .no-data-icon-svg {
        color: #6b7280;
      }

      .no-data-title {
        font-size: 18px;
        font-weight: 600;
        color: #374151;
        margin: 0 0 8px 0;
      }

      .dark .no-data-title {
        color: #e5e7eb;
      }

      .no-data-description {
        font-size: 14px;
        color: #6b7280;
        margin: 0 0 24px 0;
        max-width: 400px;
      }

      .dark .no-data-description {
        color: #9ca3af;
      }

      .no-data-action {
        margin-top: 8px;
      }
    `,
  ],
})
export class NoDataComponent implements OnInit {
  @Input() type: 'noData' | 'noResults' | 'error' | 'emptyList' = 'noData';
  @Input() title?: string;
  @Input() description?: string;
  @Input() showAction = false;
  @Input() actionText?: string;
  @Input() onAction?: () => void;

  displayTitle: string = 'common.emptyState.noData';
  displayDescription?: string;

  get iconType(): string {
    switch (this.type) {
      case 'noData':
        return 'inbox';
      case 'noResults':
        return 'search';
      case 'error':
        return 'exclamation-circle';
      case 'emptyList':
        return 'file-text';
      default:
        return 'inbox';
    }
  }

  get iconTheme(): 'outline' | 'fill' | 'twotone' {
    return this.type === 'error' ? 'fill' : 'outline';
  }

  ngOnInit() {
    if (this.title) {
      this.displayTitle = this.title;
    } else {
      switch (this.type) {
        case 'noData':
          this.displayTitle = 'common.emptyState.noData';
          this.displayDescription = 'common.emptyState.noDataDescription';
          break;
        case 'noResults':
          this.displayTitle = 'common.emptyState.noResults';
          this.displayDescription = 'common.emptyState.noResultsDescription';
          break;
        case 'error':
          this.displayTitle = 'common.emptyState.error';
          this.displayDescription = 'common.emptyState.errorDescription';
          break;
        case 'emptyList':
          this.displayTitle = 'common.emptyState.emptyList';
          this.displayDescription = 'common.emptyState.emptyListDescription';
          break;
      }
    }
    if (this.description) {
      this.displayDescription = this.description;
    }
  }

  onActionClick() {
    if (this.onAction) {
      this.onAction();
    }
  }
}
