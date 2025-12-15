import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PageActionService {
  private addNewSubject = new Subject<void>();
  addNew$ = this.addNewSubject.asObservable();

  triggerAddNew(): void {
    this.addNewSubject.next();
  }
}

