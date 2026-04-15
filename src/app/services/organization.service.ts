import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Agency {
  id: number;
  name: string;
}

export interface Department {
  id: number;
  name: string;
  agencyId: number;
  agencyName?: string;
}

export interface Section {
  id: number;
  name: string;
  departmentId: number;
  departmentName?: string;
}

export interface JobTitle {
  id: number;
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class OrganizationService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getAgencies(): Observable<Agency[]> {
    return this.http.get<Agency[]>(`${this.apiUrl}/organizations/agencies`);
  }

  createAgency(payload: Partial<Agency>): Observable<Agency> {
    return this.http.post<Agency>(`${this.apiUrl}/organizations/agencies`, payload);
  }

  updateAgency(id: number, payload: Partial<Agency>): Observable<Agency> {
    return this.http.put<Agency>(`${this.apiUrl}/organizations/agencies/${id}`, payload);
  }

  deleteAgency(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/organizations/agencies/${id}`);
  }

  getDepartments(): Observable<Department[]> {
    return this.http.get<Department[]>(`${this.apiUrl}/organizations/departments`);
  }

  getDepartmentsByAgency(agencyId: number): Observable<Department[]> {
    return this.http.get<Department[]>(`${this.apiUrl}/organizations/agencies/${agencyId}/departments`);
  }

  createDepartment(payload: Partial<Department>): Observable<Department> {
    return this.http.post<Department>(`${this.apiUrl}/organizations/departments`, payload);
  }

  updateDepartment(id: number, payload: Partial<Department>): Observable<Department> {
    return this.http.put<Department>(`${this.apiUrl}/organizations/departments/${id}`, payload);
  }

  deleteDepartment(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/organizations/departments/${id}`);
  }

  getSections(): Observable<Section[]> {
    return this.http.get<Section[]>(`${this.apiUrl}/organizations/sections`);
  }

  getSectionsByDepartment(departmentId: number): Observable<Section[]> {
    return this.http.get<Section[]>(`${this.apiUrl}/organizations/departments/${departmentId}/sections`);
  }

  createSection(payload: Partial<Section>): Observable<Section> {
    return this.http.post<Section>(`${this.apiUrl}/organizations/sections`, payload);
  }

  updateSection(id: number, payload: Partial<Section>): Observable<Section> {
    return this.http.put<Section>(`${this.apiUrl}/organizations/sections/${id}`, payload);
  }

  deleteSection(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/organizations/sections/${id}`);
  }

  getJobTitles(): Observable<JobTitle[]> {
    return this.http.get<JobTitle[]>(`${this.apiUrl}/jobtitles`);
  }

  createJobTitle(payload: Partial<JobTitle>): Observable<JobTitle> {
    return this.http.post<JobTitle>(`${this.apiUrl}/jobtitles`, payload);
  }

  updateJobTitle(id: number, payload: Partial<JobTitle>): Observable<JobTitle> {
    return this.http.put<JobTitle>(`${this.apiUrl}/jobtitles/${id}`, payload);
  }

  deleteJobTitle(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/jobtitles/${id}`);
  }
}
