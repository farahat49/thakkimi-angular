import { ChangeDetectorRef, Component, OnInit } from "@angular/core";
import { LayoutComponent } from "../../components/layout/layout.component";
import { UsersService } from "../../services/users.service";
import { debounceTime, distinctUntilChanged, Subject } from "rxjs";
import { RolesData } from "../../models/RoleDto";
import { NgFor, NgIf } from "@angular/common";
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";
import { CreateRoleRequest } from "../../models/CreateRoleRequest";
import { ConfirmDialog, Toast } from "../../Shared/sweet-alert.utils";
@Component({
  standalone: true,
  selector: "app-roles",
  imports: [LayoutComponent,ReactiveFormsModule],
  templateUrl: "./roles.html",
  styleUrl: "./roles.scss",
})
export class Roles implements OnInit {

  loading = true;
roles:RolesData|null = null;
currentPage: number = 1;
  pageSize: number = 10;
  searchSubject = new Subject<string>(); 
  searchTerm: string = '';
  isSubmitting=false;
  roleForm=new FormGroup({
    name:new FormControl('',[Validators.required]),
    displayName:new FormControl('',[Validators.required])
  });

constructor(private usersService: UsersService,private cdr: ChangeDetectorRef) {
  
      this.searchSubject.pipe(
        debounceTime(500),         
        distinctUntilChanged()    
      ).subscribe(searchText => {
        this.searchTerm = searchText;
        this.currentPage = 1;      
        this.loadRoles();          
      });
 }

  ngOnInit(): void {

        this.loadRoles(this.currentPage, this.pageSize ,'');

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


onSearch(event: any) {
    const value = event.target.value;
    this.searchSubject.next(value); // أرسل القيمة للـ Subject
  }
  
  onPageChange(page: number): void {
    if (page >= 1 && this.roles && page <= this.roles.totalPages) {
      this.currentPage = page;
      this.loadRoles(); 
    }
  }
 
onPageSizeChange(event: any) {
  const size = event.target.value;
  this.pageSize = size;
  this.loadRoles(1, size); 
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

onSubmitRole()
{
  if(this.roleForm.invalid) return;

   this.isSubmitting=true;
    this.isSubmitting = true;
    const requestData: CreateRoleRequest = {
      name: this.roleForm.value.name!,
      displayName: this.roleForm.value.displayName!
    };

     this.usersService.addRole(requestData).subscribe({
     
      next:()=>{
        this.isSubmitting=false;
        this.roleForm.reset();
      
      document.getElementById('closeModalBtn')?.click();
      Toast.fire({
        icon: 'success',
        title: 'تمت إضافة الصلاحية بنجاح'
      })
        this.loadRoles();
        this.cdr.detectChanges();
      },error:()=>{
        this.isSubmitting=false;
        Toast.fire({
      icon: 'error',
      title: 'حدث خطأ أثناء الحفظ'
    });
      }


     });


    }

  

onDeleteRole(item: any) {
  console.log(item);
  
  ConfirmDialog(
    'هل أنت متأكد؟',
    `سيتم حذف صلاحية "${item.displayName}" نهائياً. لا يمكن التراجع عن هذا الإجراء!`
  ).then((result) => {
    
    if (result.isConfirmed) {
      this.usersService.deleteRole(item.id).subscribe({
        next: () => {
          Toast.fire({
            icon: 'success',
            title: 'تم حذف الصلاحية بنجاح'
          });
          
          this.loadRoles();
        },
        error: () => {
          
          Toast.fire({
            icon: 'error',
            title: 'فشل الحذف، قد تكون الصلاحية مرتبطة ببيانات أخرى'
          });
        }
      });
    }
  });
}
   
}



