import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { LayoutComponent } from '../../components/layout/layout.component';
import { UsersService } from '../../services/users.service';
import { OrganizationService, Agency, Department, Section } from '../../services/organization.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, LayoutComponent],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss']
})
export class UsersComponent implements OnInit {
  users: User[] = [];
  loading = true;
  showModal = false;
  saving = false;
  editingUser: Partial<User> = {};
  isEditing = false;
  apiError: string | null = null;

  jobTitles: string[] = [];
  agencies: Agency[] = [];
  departments: Department[] = [];
  sections: Section[] = [];

  constructor(
    private usersService: UsersService,
    private orgService: OrganizationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadUsers();
    this.loadAgencies();
    this.loadJobTitles();
  }

  loadUsers() {
    this.usersService.getUsers().subscribe({
      next: (users) => {
        this.users = [...users];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadAgencies() {
    this.orgService.getAgencies().subscribe({
      next: (agencies) => {
        this.agencies = agencies;
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  loadJobTitles() {
    this.orgService.getJobTitles().subscribe({
      next: (titles) => {
        this.jobTitles = titles.map(t => t.name);
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  onAgencyChange(agencyId: number | undefined) {
    this.editingUser.departmentId = undefined;
    this.editingUser.sectionId = undefined;
    this.departments = [];
    this.sections = [];
    this.apiError = null;

    if (agencyId && agencyId > 0) {
      this.orgService.getDepartmentsByAgency(agencyId).subscribe({
        next: (depts) => {
          this.departments = depts;
          this.cdr.detectChanges();
        },
        error: () => {}
      });
    }
  }

  onDepartmentChange(departmentId: number | undefined) {
    this.editingUser.sectionId = undefined;
    this.sections = [];
    this.apiError = null;

    const selectedDepartment = this.departments.find(d => d.id === departmentId);
    if (selectedDepartment) {
      this.editingUser.agencyId = selectedDepartment.agencyId;
    }

    if (departmentId && departmentId > 0) {
      this.orgService.getSectionsByDepartment(departmentId).subscribe({
        next: (sects) => {
          this.sections = sects;
          this.cdr.detectChanges();
        },
        error: () => {}
      });
    }
  }

  onSectionChange(sectionId: number | undefined) {
    if (!sectionId) {
      return;
    }

    const selectedSection = this.sections.find(s => s.id === sectionId);
    if (!selectedSection) {
      return;
    }

    this.editingUser.sectionId = sectionId;
    this.editingUser.departmentId = selectedSection.departmentId;

    const selectedDepartment = this.departments.find(d => d.id === selectedSection.departmentId);
    if (selectedDepartment) {
      this.editingUser.agencyId = selectedDepartment.agencyId;
    }

    this.apiError = null;
    this.cdr.detectChanges();
  }

  openCreate() {
    this.editingUser = {
      role: 'USER',
      agencyId: undefined,
      departmentId: undefined,
      sectionId: undefined,
      jobTitle: '',
      password: ''
    };
    this.departments = [];
    this.sections = [];
    this.apiError = null;
    this.isEditing = false;
    this.showModal = true;
    this.cdr.detectChanges();
  }

  openEdit(user: User) {
    this.editingUser = {
      ...user,
      password: ''
    };
    this.departments = [];
    this.sections = [];
    this.apiError = null;
    this.isEditing = true;
    this.showModal = true;

    if (user.agencyId) {
      this.orgService.getDepartmentsByAgency(user.agencyId).subscribe({
        next: (depts) => {
          this.departments = depts;
          if (user.departmentId) {
            this.orgService.getSectionsByDepartment(user.departmentId).subscribe({
              next: (sects) => {
                this.sections = sects;
                this.cdr.detectChanges();
              },
              error: () => {}
            });
          }
          this.cdr.detectChanges();
        },
        error: () => {}
      });
    }

    this.cdr.detectChanges();
  }

  isFormValid(): boolean {
    const name = (this.editingUser.name ?? '').trim();
    const nationalId = (this.editingUser.nationalId ?? '').trim();
    const role = (this.editingUser.role ?? '').trim();
    const email = (this.editingUser.email ?? '').trim();

    if (!this.isEditing && !(this.editingUser.password ?? '').trim()) {
      return false;
    }

    return name.length > 0 && nationalId.length === 10 && role.length > 0 && email.length > 0;
  }

  save() {
    if (!this.isFormValid()) return;

    this.synchronizeHierarchyBeforeSave();

    this.saving = true;
    this.apiError = null;

    const payload: Partial<User> = {
      ...this.editingUser,
      name: this.editingUser.name?.trim(),
      email: this.editingUser.email?.trim().toLowerCase(),
      nationalId: this.editingUser.nationalId?.trim(),
      jobTitle: this.editingUser.jobTitle?.trim(),
      password: this.editingUser.password?.trim() || undefined,
      agencyId: this.editingUser.agencyId || undefined,
      departmentId: this.editingUser.departmentId || undefined,
      sectionId: this.editingUser.sectionId || undefined
    };

    const action = this.isEditing
      ? this.usersService.updateUser(this.editingUser.id!, payload)
      : this.usersService.createUser(payload);

    action.subscribe({
      next: () => {
        this.showModal = false;
        this.saving = false;
        this.loadUsers();
      },
      error: (err: HttpErrorResponse) => {
        this.saving = false;
        this.apiError = this.extractErrorMessage(err);
        this.cdr.detectChanges();
      }
    });
  }


  private synchronizeHierarchyBeforeSave(): void {
    const selectedSection = this.sections.find(s => s.id === this.editingUser.sectionId);
    if (selectedSection) {
      this.editingUser.sectionId = selectedSection.id;
      this.editingUser.departmentId = selectedSection.departmentId;
    }

    const selectedDepartment = this.departments.find(d => d.id === this.editingUser.departmentId);
    if (selectedDepartment) {
      this.editingUser.departmentId = selectedDepartment.id;
      this.editingUser.agencyId = selectedDepartment.agencyId;
    }

    if (!selectedDepartment && this.editingUser.departmentId) {
      this.editingUser.sectionId = undefined;
    }

    if (!this.editingUser.departmentId) {
      this.editingUser.sectionId = undefined;
    }

    if (!this.editingUser.agencyId) {
      this.editingUser.departmentId = undefined;
      this.editingUser.sectionId = undefined;
    }
  }

  deleteUser(id: number) {
    if (!confirm('هل أنت متأكد من حذف هذا المستخدم؟')) return;
    this.usersService.deleteUser(id).subscribe({
      next: () => this.loadUsers(),
      error: (err: HttpErrorResponse) => {
        this.apiError = this.extractErrorMessage(err);
        this.cdr.detectChanges();
      }
    });
  }

  private extractErrorMessage(err: HttpErrorResponse): string {
    const errors = err.error?.errors;
    if (Array.isArray(errors) && errors.length > 0) {
      return errors[0];
    }

    return err.error?.message || 'حدث خطأ أثناء حفظ البيانات';
  }
}
