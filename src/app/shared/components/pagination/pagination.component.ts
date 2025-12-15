import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-pagination',
  template: `
    <div class="flex items-center justify-between w-full py-2 px-3 gap-4">
      <!-- Page Size Selector -->
      <div class="flex-shrink-0">
        <nz-select
          [(ngModel)]="currentSize"
          (ngModelChange)="changeSize()"
          class="w-32"
          [nzDropdownMatchSelectWidth]="false"
          [nzPlacement]="'bottomLeft'"
        >
          <nz-option
            [nzValue]="10"
            [nzLabel]="'10/' + ('common.page' | translate)"
          ></nz-option>
          <nz-option
            [nzValue]="20"
            [nzLabel]="'20/' + ('common.page' | translate)"
          ></nz-option>
          <nz-option
            [nzValue]="40"
            [nzLabel]="'40/' + ('common.page' | translate)"
          ></nz-option>
          <nz-option
            [nzValue]="80"
            [nzLabel]="'80/' + ('common.page' | translate)"
          ></nz-option>
          <nz-option
            [nzValue]="300"
            [nzLabel]="'300/' + ('common.page' | translate)"
          ></nz-option>
          <nz-option
            [nzValue]="500"
            [nzLabel]="'500/' + ('common.page' | translate)"
          ></nz-option>
        </nz-select>
      </div>

      <!-- Pagination Control -->
      <div class="flex-1 flex items-center justify-center gap-3">
        <!-- Page Info Text -->
        <span class="text-sm text-gray-600 dark:text-white whitespace-nowrap">
          {{ 'common.page' | translate }} {{ currentPage }}
          {{ 'common.of' | translate }} {{ totalPage }} ({{ total }}
          {{ 'common.record' | translate }})
        </span>

        <!-- Custom Pagination Buttons -->
        <div class="flex items-center gap-1.5">
          <!-- Previous Button -->
          <button
            type="button"
            [disabled]="currentPage <= 1"
            (click)="goToPage(currentPage - 1)"
            class="pagination-btn pagination-btn-nav"
            [class.disabled]="currentPage <= 1"
          >
            <span nz-icon nzType="left" nzTheme="outline"></span>
          </button>

          <!-- Page Numbers -->
          <ng-container *ngFor="let page of getPageNumbers()">
            <button
              *ngIf="page !== '...'"
              type="button"
              (click)="goToPageNumber(page)"
              class="pagination-btn pagination-btn-number"
              [class.active]="page === currentPage"
            >
              {{ page }}
            </button>
            <span
              *ngIf="page === '...'"
              class="px-2 text-gray-400 dark:text-gray-500"
            >
              ...
            </span>
          </ng-container>

          <!-- Next Button -->
          <button
            type="button"
            [disabled]="currentPage >= totalPage"
            (click)="goToPage(currentPage + 1)"
            class="pagination-btn pagination-btn-nav"
            [class.disabled]="currentPage >= totalPage"
          >
            <span nz-icon nzType="right" nzTheme="outline"></span>
          </button>
        </div>
      </div>

      <!-- Go To Page -->
      <div class="flex items-center gap-2.5 flex-shrink-0">
        <span class="text-sm text-gray-600 dark:text-white whitespace-nowrap">
          {{ 'common.goTo' | translate }}
        </span>
        <input
          [(ngModel)]="goToPageValue"
          (keyup)="changePage($event)"
          type="text"
          nz-input
          class="w-16 text-center"
        />
      </div>
    </div>
  `,
  styles: [
    `
      .pagination-btn {
        @apply inline-flex items-center justify-center min-w-[32px] h-8 px-2 rounded-md;
        @apply border border-gray-300 dark:border-gray-600;
        @apply bg-white dark:bg-gray-800;
        @apply text-gray-700 dark:text-gray-300;
        @apply transition-colors duration-200;
        @apply font-medium text-sm;
      }

      .pagination-btn:hover:not(.disabled):not(.active) {
        @apply border-gray-400 dark:border-gray-500;
        @apply bg-gray-50 dark:bg-gray-700;
      }

      .pagination-btn:focus {
        @apply outline-none ring-2 ring-blue-500 ring-offset-1;
      }

      .pagination-btn.disabled {
        @apply opacity-50 cursor-not-allowed;
        @apply bg-gray-100 dark:bg-gray-800;
      }

      .pagination-btn.active {
        background-color: #3b82f6 !important;
        border-color: #3b82f6 !important;
        color: #ffffff !important;
      }

      .pagination-btn.active:hover {
        background-color: #2563eb !important;
        border-color: #2563eb !important;
        color: #ffffff !important;
      }

      .dark .pagination-btn.active {
        background-color: #3b82f6 !important;
        border-color: #3b82f6 !important;
        color: #ffffff !important;
      }

      .dark .pagination-btn.active:hover {
        background-color: #2563eb !important;
        border-color: #2563eb !important;
        color: #ffffff !important;
      }

      .pagination-btn-nav {
        @apply min-w-[32px];
      }

      .pagination-btn-number {
        @apply min-w-[32px];
      }
    `,
  ],
})
export class PaginationComponent implements OnInit, OnChanges {
  constructor(private toast: ToastrService) {}
  @Input() total: number = 0;
  @Output() emitPage: EventEmitter<any> = new EventEmitter();
  @Output() goToChange: EventEmitter<any> = new EventEmitter();
  @Input() currentPage = 1;

  @Input() currentSize = 20;

  pageSize: any;
  totalPage: number = 0;
  goToPageValue: number = 1;

  getPage(page: number) {
    this.currentPage = page;
  }
  getSize(size: number) {
    this.currentSize = size;
  }
  changeSize() {
    this.totalPage = this.currentSize
      ? Math.ceil(this.total / this.currentSize)
      : 1;
    // Reset to page 1 when size changes
    if (this.currentPage > this.totalPage) {
      this.currentPage = 1;
    }
    this.emitPage.emit({ page: this.currentPage, size: this.currentSize });
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPage && page !== this.currentPage) {
      this.currentPage = page;
      this.goToPageValue = page;
      this.emitPage.emit({ page: this.currentPage, size: this.currentSize });
    }
  }

  goToPageNumber(page: number | string) {
    if (typeof page === 'number') {
      this.goToPage(page);
    }
  }

  changePage($event: any) {
    if ($event.keyCode === 13 || $event.key === 'Enter') {
      const page = parseInt(this.goToPageValue.toString(), 10);
      if (isNaN(page) || page < 1) {
        this.toast.warning('Trang nhỏ nhất là 1');
        this.goToPageValue = this.currentPage;
      } else if (page > this.totalPage) {
        this.toast.warning('Trang lớn nhất là ' + this.totalPage);
        this.goToPageValue = this.currentPage;
      } else {
        this.goToPage(page);
      }
    }
  }

  getPageNumbers(): (number | string)[] {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (this.totalPage <= maxVisible) {
      // Show all pages if total pages <= maxVisible
      for (let i = 1; i <= this.totalPage; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (this.currentPage <= 3) {
        // Near the start
        for (let i = 2; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(this.totalPage);
      } else if (this.currentPage >= this.totalPage - 2) {
        // Near the end
        pages.push('...');
        for (let i = this.totalPage - 3; i <= this.totalPage; i++) {
          pages.push(i);
        }
      } else {
        // In the middle
        pages.push('...');
        for (let i = this.currentPage - 1; i <= this.currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(this.totalPage);
      }
    }

    return pages;
  }

  ngOnInit(): void {
    this.totalPage = this.currentSize
      ? Math.ceil(this.total / this.currentSize)
      : 1;
    this.goToPageValue = this.currentPage;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['total']) {
      this.totalPage = this.currentSize
        ? Math.ceil(this.total / this.currentSize)
        : 1;
      // Reset currentPage if it exceeds totalPage
      if (this.currentPage > this.totalPage && this.totalPage > 0) {
        this.currentPage = 1;
        this.goToPageValue = 1;
      }
    }

    // Update totalPage when currentSize changes
    if (changes['currentSize']) {
      this.totalPage = this.currentSize
        ? Math.ceil(this.total / this.currentSize)
        : 1;
      // Reset currentPage if it exceeds totalPage
      if (this.currentPage > this.totalPage && this.totalPage > 0) {
        this.currentPage = 1;
        this.goToPageValue = 1;
      }
    }

    // Update goToPageValue when currentPage changes
    if (changes['currentPage']) {
      this.goToPageValue = this.currentPage;
    }
  }
}
