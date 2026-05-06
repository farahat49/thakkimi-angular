import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LayoutComponent } from '../../components/layout/layout.component';
import { ItemsService } from '../../services/items.service';
import { UsersService } from '../../services/users.service';
import { Item } from '../../models/item.model';
import { Employee } from '../../models/Employee.model';

@Component({
  selector: 'app-managers',
  standalone: true,
  imports: [CommonModule, RouterModule, LayoutComponent],
  templateUrl: './managers.component.html',
  styleUrls: ['./managers.component.scss']
})
export class ManagersComponent implements OnInit {
  items: Item[] = [];
  employees: Employee[] = [];
  loading = true;
  expandedUser: number | null = null;

  constructor(
    private itemsService: ItemsService,
    private usersService: UsersService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.itemsService.getItems().subscribe({
      next: (items) => {
        this.items = [...items];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
    const managerId = localStorage.getItem('UserIdentity') ?? '';
    this.usersService.getManagedHierarchyEmployees(managerId).subscribe({
      next: (response) => {
        this.employees = response.data ?? [];
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  getUserStats() {
    return this.employees
      .filter(e => e.localUserId != null)
      .map(employee => {
        const localId = employee.localUserId!;
        const assigned = this.items.filter(i =>
          i.assigneeIds?.includes(localId) ||
          i.memberIds?.includes(localId) ||
          i.mawaradCreatedBy === localId
        );
        const completed = assigned.filter(i => i.status === 'COMPLETED');
        const overdue = assigned.filter(i => i.status === 'OVERDUE');
        const active = assigned.filter(i => i.status === 'ACTIVE');
        const rate = assigned.length > 0 ? Math.round((completed.length / assigned.length) * 100) : 0;
        return { employee, total: assigned.length, completed: completed.length, overdue: overdue.length, active: active.length, rate, items: assigned };
      })
      .sort((a, b) => b.total - a.total);
  }

  toggleUser(userId: number) {
    this.expandedUser = this.expandedUser === userId ? null : userId;
    this.cdr.detectChanges();
  }
}
