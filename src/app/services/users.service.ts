import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../models/user.model';
import { environment } from '../../environments/environment';
import { EmployeeHierarchyResponse } from '../models/Employee.model';

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users`);
  }

  getScopedUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users/team`);
  }

  createUser(user: Partial<User>): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/users`, user);
  }

  updateUser(id: number, user: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/users/${id}`, user);
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/users/${id}`);
  }

  getManagedHierarchyEmployees(managerId: string): Observable<EmployeeHierarchyResponse> {
    return this.http.get<EmployeeHierarchyResponse>(`/Administration/api/calendar/HolidayDay/GetManagedHierarchyEmployees?managerId=${managerId}`);
  }   

}
