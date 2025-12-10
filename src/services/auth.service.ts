import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { UserRole } from '../models';


@Injectable({ providedIn: 'root' })
export class AuthService {
  private roleSubject = new BehaviorSubject<UserRole>('specialist');
  role$ = this.roleSubject.asObservable();

  setRole(role: UserRole) {
    this.roleSubject.next(role);
    localStorage.setItem('userRole', role);
  }

  getRole(): UserRole {
    return (localStorage.getItem('userRole') as UserRole) || 'specialist';
  }
}
