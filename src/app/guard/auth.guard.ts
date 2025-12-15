import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard  {
  constructor(private router: Router) {}
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ):
    | Observable<boolean | UrlTree>
    | Promise<boolean | UrlTree>
    | boolean
    | UrlTree {
    // Get roles from authentication service or localStorage
    const userRoles: string[] = JSON.parse(localStorage.getItem('userRoles') || '[]');
    if (userRoles && userRoles.length > 0) {
      const requiredRole = route.data['requiredRole'];

      if (this.checkRoles(requiredRole, userRoles)) {
        return true;
      } else {
        this.router.navigate(['exception/403']);
        return false;
      }
    } else {
      this.router.navigate(['exception/403']);
      return false;
    }
  }
  checkRoles(rolesToCheck: string[], roles: string[]): boolean {
    return rolesToCheck.some((role) => roles.includes(role));
  }
}
