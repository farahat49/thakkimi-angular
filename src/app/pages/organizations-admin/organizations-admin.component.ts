import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { LayoutComponent } from '../../components/layout/layout.component';
import {
  OrganizationService,
  Agency,
  Department,
  Section,
  JobTitle
} from '../../services/organization.service';

@Component({
  selector: 'app-organizations-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, LayoutComponent],
  templateUrl: './organizations-admin.component.html',
  styleUrls: ['./organizations-admin.component.scss']
})
export class OrganizationsAdminComponent implements OnInit {
  agencies: Agency[] = [];
  departments: Department[] = [];
  sections: Section[] = [];
  jobTitles: JobTitle[] = [];

  newAgency = '';
  newDepartment: { name: string; agencyId?: number } = { name: '' };
  newSection: { name: string; departmentId?: number } = { name: '' };
  newJobTitle = '';

  loading = false;
  busyAction: string | null = null;
  apiError: string | null = null;
  successMessage: string | null = null;

  constructor(
    private organizationService: OrganizationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.loading = true;
    this.apiError = null;

    forkJoin({
      agencies: this.organizationService.getAgencies(),
      departments: this.organizationService.getDepartments(),
      sections: this.organizationService.getSections(),
      jobTitles: this.organizationService.getJobTitles()
    }).subscribe({
      next: ({ agencies, departments, sections, jobTitles }) => {
        this.agencies = agencies;
        this.departments = departments;
        this.sections = sections;
        this.jobTitles = jobTitles;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => this.handleError(err)
    });
  }

  createAgency(): void {
    const name = this.newAgency.trim();
    if (!name || this.busyAction) return;

    this.startAction('agency');
    this.organizationService.createAgency({ name }).subscribe({
      next: () => {
        this.newAgency = '';
        this.finishSuccess('تمت إضافة الوكالة بنجاح');
      },
      error: (err) => this.handleError(err)
    });
  }

  deleteAgency(id: number): void {
    if (this.busyAction) return;

    this.startAction(`delete-agency-${id}`);
    this.organizationService.deleteAgency(id).subscribe({
      next: () => this.finishSuccess('تم حذف الوكالة بنجاح'),
      error: (err) => this.handleError(err)
    });
  }

  createDepartment(): void {
    const name = this.newDepartment.name.trim();
    const agencyId = this.newDepartment.agencyId;

    if (!name || agencyId == null || this.busyAction) return;

    this.startAction('department');
    this.organizationService.createDepartment({ name, agencyId }).subscribe({
      next: () => {
        this.newDepartment = { name: '' };
        this.finishSuccess('تمت إضافة الإدارة بنجاح');
      },
      error: (err) => this.handleError(err)
    });
  }

  deleteDepartment(id: number): void {
    if (this.busyAction) return;

    this.startAction(`delete-department-${id}`);
    this.organizationService.deleteDepartment(id).subscribe({
      next: () => this.finishSuccess('تم حذف الإدارة بنجاح'),
      error: (err) => this.handleError(err)
    });
  }

  createSection(): void {
    const name = this.newSection.name.trim();
    const departmentId = this.newSection.departmentId;

    if (!name || departmentId == null || this.busyAction) return;

    this.startAction('section');
    this.organizationService.createSection({ name, departmentId }).subscribe({
      next: () => {
        this.newSection = { name: '' };
        this.finishSuccess('تمت إضافة الشعبة بنجاح');
      },
      error: (err) => this.handleError(err)
    });
  }

  deleteSection(id: number): void {
    if (this.busyAction) return;

    this.startAction(`delete-section-${id}`);
    this.organizationService.deleteSection(id).subscribe({
      next: () => this.finishSuccess('تم حذف الشعبة بنجاح'),
      error: (err) => this.handleError(err)
    });
  }

  createJobTitle(): void {
    const name = this.newJobTitle.trim();
    if (!name || this.busyAction) return;

    this.startAction('job-title');
    this.organizationService.createJobTitle({ name }).subscribe({
      next: () => {
        this.newJobTitle = '';
        this.finishSuccess('تمت إضافة المسمى الوظيفي بنجاح');
      },
      error: (err) => this.handleError(err)
    });
  }

  deleteJobTitle(id: number): void {
    if (this.busyAction) return;

    this.startAction(`delete-job-title-${id}`);
    this.organizationService.deleteJobTitle(id).subscribe({
      next: () => this.finishSuccess('تم حذف المسمى الوظيفي بنجاح'),
      error: (err) => this.handleError(err)
    });
  }

  getAgencyName(id: number): string {
    return this.agencies.find(a => a.id === id)?.name ?? '-';
  }

  getDepartmentName(id: number): string {
    return this.departments.find(d => d.id === id)?.name ?? '-';
  }

  isBusy(action: string): boolean {
    return this.busyAction === action;
  }

  private startAction(action: string): void {
    this.busyAction = action;
    this.apiError = null;
    this.successMessage = null;
    this.cdr.detectChanges();
  }

  private finishSuccess(message: string): void {
    this.busyAction = null;
    this.successMessage = message;
    this.loadAll();
  }

  private handleError(err: unknown): void {
    this.loading = false;
    this.busyAction = null;
    this.apiError = this.extractErrorMessage(err);
    this.cdr.detectChanges();
  }

  private extractErrorMessage(err: unknown): string {
    const httpErr = err as HttpErrorResponse;
    const payload = httpErr?.error;

    if (Array.isArray(payload?.errors) && payload.errors.length > 0) {
      return payload.errors.join('، ');
    }

    if (typeof payload?.message === 'string' && payload.message.trim()) {
      return payload.message;
    }

    if (typeof payload === 'string' && payload.trim()) {
      return payload;
    }

    return 'تعذر تنفيذ العملية. تحقق من البيانات ثم حاول مرة أخرى.';
  }
}
