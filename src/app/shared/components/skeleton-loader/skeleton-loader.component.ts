import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-skeleton-loader',
  templateUrl: './skeleton-loader.component.html',
  styleUrls: ['./skeleton-loader.component.css'],
})
export class SkeletonLoaderComponent {
  @Input() type: 'table' | 'card' | 'list' | 'form' = 'table';
  @Input() rows: number = 5;
  @Input() columns: number = 4;
}

