import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NotificationsService } from '../../services/notifications.service';
import { Notification } from '../../models/item.model';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss']
})
export class LayoutComponent implements OnInit {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() backPath = '';

  sidebarOpen = false;
  notificationsOpen = false;
  notifications: Notification[] = [];
  unreadCount = 0;

  navItems = [
    { label: 'لوحة التحكم', path: '/dashboard', icon: 'dashboard' },
    { label: 'قيد التنفيذ', path: '/todo', icon: 'task' },
    { label: 'المتأخرة', path: '/overdue', icon: 'warning' },
    { label: 'المكتملة', path: '/completed', icon: 'check_circle' },
  ];

  adminNavItems = [
    { label: 'المستخدمون', path: '/users', icon: 'group' },
    { label: 'الهيكل التنظيمي', path: '/organizations-admin', icon: 'account_tree' }
  ];

  managerNavItems = [
    { label: 'تقارير الفريق', path: '/managers', icon: 'bar_chart' }
  ];

  constructor(
    public authService: AuthService,
    private notificationsService: NotificationsService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadNotifications();
  }

  loadNotifications() {
    this.notificationsService.getNotifications().subscribe({
      next: (notifs) => {
        this.notifications = notifs;
        this.unreadCount = notifs.filter(n => !n.isRead).length;
      },
      error: () => {}
    });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  toggleNotifications() {
    this.notificationsOpen = !this.notificationsOpen;
    if (this.notificationsOpen) {
      this.loadNotifications();
    }
  }

  markRead(id: number) {
    this.notificationsService.markRead(id).subscribe(() => {
      this.loadNotifications();
    });
  }

  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  get isManager(): boolean {
    return this.authService.isManager();
  }

  get currentUser() {
    return this.authService.currentUser;
  }
}
