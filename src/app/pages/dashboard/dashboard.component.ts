import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { LayoutComponent } from '../../components/layout/layout.component';
import { ItemsService } from '../../services/items.service';
import { UsersService } from '../../services/users.service';
import { AuthService } from '../../services/auth.service';
import { Item } from '../../models/item.model';
import { User } from '../../models/user.model';
import { EmployeeHierarchyResponse } from '../../models/Employee.model';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, LayoutComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class DashboardComponent implements OnInit {
  items: Item[] = [];
  users: User[] = [];
  loading = true;
  expandedUser: number | null = null;

  readonly PAGE_SIZE = 8;
  userStatsPage = 1;
  deptStatsPage = 1;
  private _userStats: any[] = [];
  private _deptStats: any[] = [];

  constructor(
    private itemsService: ItemsService,
    private usersService: UsersService,
    public authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading = true;
    const managerId = localStorage.getItem('UserIdentity') ?? '';

    if ((this.authService.isAdmin() || this.authService.isManager()) && managerId) {
      // Admin or Manager with a Mawared national ID → use hierarchy-scoped view
      const hierarchyReq = this.usersService.getManagedHierarchyEmployees(managerId).pipe(
        catchError(() => of({ data: [], pageIndex: 0, pageSize: 0, totalCount: 0 } as EmployeeHierarchyResponse))
      );
      forkJoin({
        items: this.itemsService.getItems({ pageSize: 500 }),
        hierarchy: hierarchyReq
      }).subscribe({
        next: ({ items, hierarchy }) => {
          const employees = hierarchy.data ?? [];
          this.users = employees
            .filter(e => e.localUserId != null)
            .map(e => ({
              id: e.localUserId!,
              name: e.fullName,
              email: e.workEmail ?? '',
              nationalId: e.identityNumber,
              role: 'USER' as const
            }));
          const hierarchyUserIds = new Set<number>(this.users.map(u => u.id));
          this.items = hierarchyUserIds.size > 0
            ? items.filter(item =>
                hierarchyUserIds.has(item.mawaradCreatedBy) ||
                item.assigneeIds.some(id => hierarchyUserIds.has(id)) ||
                item.memberIds.some(id => hierarchyUserIds.has(id))
              )
            : [...items];
          this.loading = false;
          this._computeStats();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Dashboard load error:', err);
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
    } else if (this.authService.isAdmin()) {
      // Admin without a national ID → full admin view showing all users
      forkJoin({ items: this.itemsService.getItems({ pageSize: 500 }), users: this.usersService.getUsers() }).subscribe({
        next: ({ items, users }) => {
          this.items = [...items];
          this.users = [...users];
          this.loading = false;
          this._computeStats();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Dashboard load error:', err);
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
    } else {
      this.itemsService.getItems({ pageSize: 500 }).subscribe({
        next: (items) => {
          this.items = [...items];
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Items API error:', err);
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

  private _computeStats() {
    this._userStats = this.getUserStats();
    this._deptStats = this.getDepartmentStats();
    this.userStatsPage = 1;
    this.deptStatsPage = 1;
  }

  get pagedUserStats() {
    const start = (this.userStatsPage - 1) * this.PAGE_SIZE;
    return this._userStats.slice(start, start + this.PAGE_SIZE);
  }

  get userStatsTotalPages() {
    return Math.ceil(this._userStats.length / this.PAGE_SIZE);
  }

  get pagedDeptStats() {
    const start = (this.deptStatsPage - 1) * this.PAGE_SIZE;
    return this._deptStats.slice(start, start + this.PAGE_SIZE);
  }

  get deptStatsTotalPages() {
    return Math.ceil(this._deptStats.length / this.PAGE_SIZE);
  }

  setUserStatsPage(p: number) {
    this.userStatsPage = p;
    this.cdr.detectChanges();
  }

  setDeptStatsPage(p: number) {
    this.deptStatsPage = p;
    this.cdr.detectChanges();
  }

  get totalItems() { return this.items.length; }
  get todoItems() { return this.items.filter(i => i.status === 'ACTIVE').length; }
  get overdueItems() { return this.items.filter(i => i.status === 'OVERDUE').length; }
  get completedItems() { return this.items.filter(i => i.status === 'COMPLETED').length; }

  getUserStats() {
    return this.users.map(user => {
      const assigned = this.items.filter(i => i.assigneeIds?.includes(user.id));
      const completed = assigned.filter(i => i.status === 'COMPLETED');
      const overdue = assigned.filter(i => i.status === 'OVERDUE');
      const todo = assigned.filter(i => i.status === 'ACTIVE');
      const rate = assigned.length > 0 ? Math.round((completed.length / assigned.length) * 100) : 0;
      return { user, total: assigned.length, completed: completed.length, overdue: overdue.length, active: todo.length, rate, items: assigned };
    }).sort((a, b) => b.total - a.total);
  }

  getDepartmentStats() {
    const groups = new Map<string, { name: string; total: number; active: number; overdue: number; completed: number }>();

    for (const user of this.users) {
      const key = user.departmentName || 'غير محدد';
      if (!groups.has(key)) {
        groups.set(key, { name: key, total: 0, active: 0, overdue: 0, completed: 0 });
      }
    }

    for (const item of this.items) {
      const participantUsers = this.users.filter(user =>
        item.createdById === user.id ||
        item.memberIds.includes(user.id) ||
        item.assigneeIds.includes(user.id)
      );

      const departments = new Set(participantUsers.map(u => u.departmentName || 'غير محدد'));
      for (const departmentName of departments) {
        const group = groups.get(departmentName) || { name: departmentName, total: 0, active: 0, overdue: 0, completed: 0 };
        group.total += 1;
        if (item.status === 'ACTIVE') group.active += 1;
        if (item.status === 'OVERDUE') group.overdue += 1;
        if (item.status === 'COMPLETED') group.completed += 1;
        groups.set(departmentName, group);
      }
    }

    return Array.from(groups.values()).sort((a, b) => b.total - a.total);
  }

  toggleUser(userId: number) {
    this.expandedUser = this.expandedUser === userId ? null : userId;
    this.cdr.detectChanges();
  }
}
