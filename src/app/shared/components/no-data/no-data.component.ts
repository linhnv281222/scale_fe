import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-no-data',
  template: `
    <div class="no-data-container">
      <img class="no-data-image" src="./assets/icon/no-result.svg" />
      <br />
      <span class="color-text">
        {{ 'message.noData' | translate }}
      </span>
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
      }

      .no-data-image {
        width: 6vw;
      }

      .color-text {
        color: #667085;
        font-size: 12px;
        font-style: normal;
        font-weight: 300;
        line-height: 16px;
      }
    `,
  ],
})
export class NoDataComponent {}
