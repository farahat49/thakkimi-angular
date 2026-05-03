import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../models/user.model';
import { environment } from '../../environments/environment';
import { EmployeeHierarchyResponse } from '../models/Employee.model';
import { MawaradUser } from '../models/MawaradUser';
import { CreateRoleRequest } from '../models/CreateRoleRequest';
import { RolesData } from '../models/RoleDto';
import { UserRoleRequestDto } from '../models/UserRoleRequestDto';

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users`);
  }

getMawaradUsers(page: number, size: number, search: string = ''): Observable<MawaradUser> {
  let params = new HttpParams()
    .set('pageNumber', page.toString())
    .set('pageSize', size.toString());

  if (search) {
    params = params.set('search', search);
  }

  return this.http.get<MawaradUser>(`${this.apiUrl}/Users/list`, { params });
}

 UpdateUserStatus(id:string):Observable<any>
 {

  return this.http.patch(`${this.apiUrl}/Users/Updatestatus/${id}`,{});
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
  // Removed the extra } at the end of the string
  return this.http.get<EmployeeHierarchyResponse>(`${this.apiUrl}/users/hierarchy/${managerId}`);
} 
addRole(roleData:CreateRoleRequest):Observable<any>
{
  return this.http.post(`${this.apiUrl}/users/add`,roleData);
}

getRoles(page: number, size: number, search: string = ''):Observable<RolesData>
{
 let params = new HttpParams()
    .set('pageNumber', page.toString())
    .set('pageSize', size.toString());

  if (search) {
    params = params.set('search', search);
  }

  return this.http.get<RolesData>(`${this.apiUrl}/Users/GetRoles`, { params });
}


 deleteRole(roleId:string):Observable<any>
 {
  return this.http.delete(`${this.apiUrl}/Users/Delete/${roleId}`);
 }

 AssignUserRole(userRoleRequest:UserRoleRequestDto):Observable<any>
 {
  return this.http.post(`${this.apiUrl}/Users/AssignUserRole`,userRoleRequest);

 }

}


