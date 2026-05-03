import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { LayoutComponent } from '../../components/layout/layout.component';
import { UsersService } from '../../services/users.service';
import { OrganizationService, Agency, Department, Section } from '../../services/organization.service';
import { User } from '../../models/user.model';
import { MawaradUser } from '../../models/MawaradUser';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { RolesData } from '../../models/RoleDto';
import { Toast } from '../../Shared/sweet-alert.utils';
import { UserRoleRequestDto } from '../../models/UserRoleRequestDto';
import { NgSelectModule } from '@ng-select/ng-select';
@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, LayoutComponent,NgSelectModule],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss']
})
export class UsersComponent implements OnInit {
  users: User[] = [];
  MawaradUsers: MawaradUser | null = null;
  roles:RolesData|null = null;
  
  loading = true;
currentPage: number = 1;
  pageSize: number = 10;
searchTerm: string = '';
selectedUserId!:number;
selectedRoleIds:string='';
lookupRoles: any[] = [];
rolePage = 1;
rolePageSize = 10;
loadingRoles = false;
hasMoreRoles = true;
searchSubject = new Subject<string>(); 
  constructor(
    private usersService: UsersService,
    private cdr: ChangeDetectorRef
  ) {

    this.searchSubject.pipe(
      debounceTime(500),         
      distinctUntilChanged()    
    ).subscribe(searchText => {
      this.searchTerm = searchText;
      this.currentPage = 1;      
      this.loadUsers();          
    });

  }

  ngOnInit() {
    this.loadUsers(this.currentPage, this.pageSize ,'');
            this.loadRoles(this.currentPage, this.pageSize ,'');


  }

  loadUsers(currentPage: number = this.currentPage, pageSize: number = this.pageSize, search: string = this.searchTerm): void {
    this.usersService.getMawaradUsers(currentPage, pageSize, search).subscribe({
      next: (MawaradUsers) => {
        this.MawaradUsers = MawaradUsers;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });

    
  }

onSearch(event: any) {
    const value = event.target.value;
    this.searchSubject.next(value); // أرسل القيمة للـ Subject
  }
  
  onPageChange(page: number): void {
    if (page >= 1 && this.MawaradUsers && page <= this.MawaradUsers.totalPages) {
      this.currentPage = page;
      this.loadUsers(); 
    }
  }
 
onPageSizeChange(event: any) {
  const size = event.target.value;
  this.pageSize = size;
  this.loadUsers(1, size); 
}
 
onToggleStatus(user: any) {
  this.usersService.UpdateUserStatus(user.id).subscribe({
    next: (response) => {

      user.isActive = !user.isActive;
      this.cdr.detectChanges();

    
    },
    error: (err) => {
    }
  });
}


 loadRoles(currentPage: number = this.currentPage, pageSize: number = this.pageSize, search: string = this.searchTerm)
{

 this.usersService.getRoles(currentPage, pageSize, search).subscribe({
      next: (roles) => {
        this.roles = roles;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
      }
    });

}

onPreparedRole(userId:number)
{
  this.selectedUserId=userId;
  this.selectedRoleIds='';
  this.lookupRoles = []; // تصفير القائمة
  this.rolePage = 1;     // البدء من الصفحة الأولى
  this.hasMoreRoles = true;
  this.onLoadMoreRoles(); // أول تحميل

}
onLoadMoreRoles() {
  if (this.loadingRoles || !this.hasMoreRoles) return;

  this.loadingRoles = true;
  this.usersService.getRoles(this.rolePage, this.rolePageSize, '').subscribe({
    next: (res) => {
      if (res.items.length > 0) {
        // إضافة البيانات الجديدة للقديمة
        this.lookupRoles = [...this.lookupRoles, ...res.items];
        this.rolePage++;
      } else {
        this.hasMoreRoles = false;
      }
      this.loadingRoles = false;
      this.cdr.detectChanges();
    },
    error: () => this.loadingRoles = false
  });
}

onSaveUserRole()
{


  if(!this.selectedRoleIds)
  {
    Toast.fire({
      icon: 'error',
      title: ' يرجى اختيار صلاحية واحدة على الأقل.'
    });    return;
  }

  const payload :UserRoleRequestDto = {
    userId: this.selectedUserId,
    roleId: this.selectedRoleIds
  };

  console.log(payload);
  

  this.usersService.AssignUserRole(payload).subscribe({
    next: (res) => {
      const modalElement = document.getElementById('closeRoleModal');
      modalElement?.click();
      
      Toast.fire({
        icon: 'success',
        title: 'تم إسناد الصلاحية بنجاح'
      });
    },
    error: (err: any) => {
      Toast.fire({
        icon: 'error',
        title: err.error.message || 'حدث خطأ أثناء الإضافة'
      });
    }
  });

}






}
