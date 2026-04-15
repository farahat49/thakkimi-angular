import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { AuthResponse, LoginRequest, User } from '../models/user.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (token && user) {
      this.currentUserSubject.next(JSON.parse(user));
    }
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    const normalizedCredentials: LoginRequest = {
      email: credentials.email.trim().toLowerCase(),
      password: credentials.password
    };

    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, normalizedCredentials).pipe(
      tap(response => {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        localStorage.setItem("UserIdentity",response.user.nationalId??"");
        this.currentUserSubject.next(response.user);
      })
    );
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
  }

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  get isLoggedIn(): boolean {
    return !!this.currentUserSubject.value;
  }

  get token(): string | null {
    return localStorage.getItem('token');
  }

  isAdmin(): boolean {
    return this.currentUser?.role === 'ADMIN';
  }

  isManager(): boolean {
    return this.currentUser?.role === 'MANAGER';
  }

  isAdminOrManager(): boolean {
    return this.isAdmin() || this.isManager();
  }

  canManageItems(): boolean {
    return this.isAdmin() || this.isManager();
  }
}
