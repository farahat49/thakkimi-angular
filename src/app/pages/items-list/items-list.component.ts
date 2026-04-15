import { Component, OnInit, ChangeDetectorRef } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { HttpErrorResponse } from "@angular/common/http";
import { RouterModule, ActivatedRoute } from "@angular/router";
import { LayoutComponent } from "../../components/layout/layout.component";
import { ItemsService } from "../../services/items.service";
import { UsersService } from "../../services/users.service";
import { AuthService } from "../../services/auth.service";
import {
  OrganizationService,
  Agency,
  Department,
  Section,
} from "../../services/organization.service";
import { Item, CreateItemRequest, ItemStatus } from "../../models/item.model";
import { User } from "../../models/user.model";
import { Employee, EmployeeHierarchyResponse } from "../../models/Employee.model";

@Component({
  selector: "app-items-list",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LayoutComponent],
  templateUrl: "./items-list.component.html",
  styleUrls: ["./items-list.component.scss"],
})
export class ItemsListComponent implements OnInit {
  items: Item[] = [];
  filteredItems: Item[] = [];
  users: User[] = [];
  agencies: Agency[] = [];
  departments: Department[] = [];
  sections: Section[] = [];
  loading = true;
  status: ItemStatus = "ACTIVE";
  searchQuery = "";
  filterType = "";
  selectedAgencyId?: number;
  selectedDepartmentId?: number;
  selectedSectionId?: number;
  showCreateModal = false;
  creating = false;
  exporting = false;
  createError: string | null = null;

  memberNationalIdsText = "";
  assigneeNationalIdsText = "";

  newItem: CreateItemRequest = {
    type: "TASK",
    title: "",
    description: "",
    importance: "NORMAL",
    dueDate: "",
    memberIds: [],
    assigneeIds: [],
    memberNationalIds: [],
    assigneeNationalIds: [],
  };

  titles: Record<ItemStatus, string> = {
    ACTIVE: "قيد التنفيذ",
    OVERDUE: "المتأخرة",
    COMPLETED: "المكتملة",
  };


  employee:Employee[] = [];
  constructor(
    private itemsService: ItemsService,
    private usersService: UsersService,
    private orgService: OrganizationService,
    public authService: AuthService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.route.data.subscribe((data) => {
      this.status = data["status"] || "ACTIVE";
      this.loadFilterData();
      this.loadAssignableUsers();
      this.loadData();

      this.loadHierarchy();
    });
  }


   loadHierarchy(): void {
    
    var id=localStorage.getItem("UserIdentity")??"";
    this.usersService.getManagedHierarchyEmployees(id).subscribe({
      next: (response: EmployeeHierarchyResponse) => {
        this.employee = response.data;
        console.log('Employees:', this.employee);},
       error: () => {
        
       },
    
    });
  }




  loadFilterData(): void {
    if (!this.authService.isAdminOrManager()) return;

    this.orgService.getAgencies().subscribe({
      next: (agencies) => {
        this.agencies = agencies;
        this.cdr.detectChanges();
      },
      error: () => {},
    });
  }

  loadAssignableUsers(): void {
    if (!this.authService.isAdminOrManager()) {
      this.users = [];
      return;
    }

    const usersRequest = this.authService.isAdmin()
      ? this.usersService.getUsers()
      : this.usersService.getScopedUsers();
    usersRequest.subscribe({
      next: (users) => {
        this.users = [...users];
        this.cdr.detectChanges();
      },
      error: () => {},
    });
  }

  onAgencyFilterChange(): void {
    this.selectedDepartmentId = undefined;
    this.selectedSectionId = undefined;
    this.sections = [];

    if (!this.selectedAgencyId) {
      this.departments = [];
      this.loadData();
      return;
    }

    this.orgService.getDepartmentsByAgency(this.selectedAgencyId).subscribe({
      next: (departments) => {
        this.departments = departments;
        this.loadData();
        this.cdr.detectChanges();
      },
      error: () => this.loadData(),
    });
  }

  onDepartmentFilterChange(): void {
    this.selectedSectionId = undefined;

    if (!this.selectedDepartmentId) {
      this.sections = [];
      this.loadData();
      return;
    }

    this.orgService
      .getSectionsByDepartment(this.selectedDepartmentId)
      .subscribe({
        next: (sections) => {
          this.sections = sections;
          this.loadData();
          this.cdr.detectChanges();
        },
        error: () => this.loadData(),
      });
  }

  loadData(): void {
    this.loading = true;
    this.itemsService
      .getItems({
        status: this.status,
        agencyId: this.selectedAgencyId,
        departmentId: this.selectedDepartmentId,
        sectionId: this.selectedSectionId,
      })
      .subscribe({
        next: (items) => {
          this.items = items.filter((i) => i.status === this.status);
          this.applyFilters();
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error("Items error:", err);
          this.loading = false;
          this.cdr.detectChanges();
        },
      });
  }

  applyFilters(): void {
    let result = [...this.items];

    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.itemNumber.toLowerCase().includes(q),
      );
    }

    if (this.filterType) {
      result = result.filter((i) => i.type === this.filterType);
    }

    this.filteredItems = result;
    this.cdr.detectChanges();
  }

  createItem(): void {
    if (this.creating || !this.newItem.title.trim() || !this.newItem.dueDate)
      return;

    this.createError = null;

    const memberNationalIdsResult = this.collectNationalIds(
      this.memberNationalIdsText,
    );
    const assigneeNationalIdsResult = this.collectNationalIds(
      this.assigneeNationalIdsText,
    );

    if (memberNationalIdsResult.invalidTokens.length > 0) {
      this.createError = `أرقام هوية الأعضاء غير صالحة: ${memberNationalIdsResult.invalidTokens.join("، ")}`;
      this.cdr.detectChanges();
      return;
    }

    if (assigneeNationalIdsResult.invalidTokens.length > 0) {
      this.createError = `أرقام هوية المكلّفين غير صالحة: ${assigneeNationalIdsResult.invalidTokens.join("، ")}`;
      this.cdr.detectChanges();
      return;
    }

    const payload: CreateItemRequest = {
      ...this.newItem,
      title: this.newItem.title.trim(),
      description: this.newItem.description.trim(),
      memberNationalIds: memberNationalIdsResult.ids,
      assigneeNationalIds: assigneeNationalIdsResult.ids,
    };

    if (
      payload.type === "COMMITTEE" &&
      payload.memberIds.length === 0 &&
      (payload.memberNationalIds?.length ?? 0) === 0
    ) {
      this.createError =
        "يجب تحديد عضو واحد على الأقل للجنة، سواء من القائمة أو عبر رقم الهوية.";
      this.cdr.detectChanges();
      return;
    }

    this.creating = true;
    this.itemsService.createItem(payload).subscribe({
      next: (createdItem) => {
        this.showCreateModal = false;
        this.creating = false;
        this.items = [createdItem, ...this.items];
        this.applyFilters();
        this.resetNewItem();
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        this.creating = false;
        this.createError = this.extractErrorMessage(err);
        this.cdr.detectChanges();
      },
    });
  }

  resetNewItem(): void {
    this.newItem = {
      type: "TASK",
      title: "",
      description: "",
      importance: "NORMAL",
      dueDate: "",
      memberIds: [],
      assigneeIds: [],
      memberNationalIds: [],
      assigneeNationalIds: [],
    };
    this.memberNationalIdsText = "";
    this.assigneeNationalIdsText = "";
    this.createError = null;
  }

  toggleMember(userId: number): void {
    const idx = this.newItem.memberIds.indexOf(userId);
    if (idx >= 0) {
      this.newItem.memberIds.splice(idx, 1);
    } else {
      this.newItem.memberIds.push(userId);
    }
  }

  toggleAssignee(userId: number): void {
    const idx = this.newItem.assigneeIds.indexOf(userId);
    if (idx >= 0) {
      this.newItem.assigneeIds.splice(idx, 1);
    } else {
      this.newItem.assigneeIds.push(userId);
    }
  }

  getUserName(id: number): string {
    return this.users.find((u) => u.id === id)?.name || "";
  }

  get pageTitle(): string {
    return this.titles[this.status];
  }

  exportCurrentView(): void {
    if (this.exporting) return;

    this.exporting = true;
    this.itemsService
      .exportItems({
        status: this.status,
        type: this.filterType || undefined,
        search: this.searchQuery || undefined,
        agencyId: this.selectedAgencyId,
        departmentId: this.selectedDepartmentId,
        sectionId: this.selectedSectionId,
      })
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const anchor = document.createElement("a");
          anchor.href = url;
          anchor.download = `${this.status.toLowerCase()}-items.xlsx`;
          anchor.click();
          window.URL.revokeObjectURL(url);
          this.exporting = false;
        },
        error: (err) => {
          console.error("Export error:", err);
          this.exporting = false;
        },
      });
  }

  get canCreate(): boolean {
    return this.authService.canManageItems();
  }

  private collectNationalIds(value: string): {
    ids: string[];
    invalidTokens: string[];
  } {
    const tokens = value
      .split(/[\s,،\n\r]+/)
      .map((v) => v.trim())
      .filter((v) => v.length > 0);

    const ids = Array.from(new Set(tokens.filter((v) => /^\d{10}$/.test(v))));
    const invalidTokens = Array.from(
      new Set(tokens.filter((v) => !/^\d{10}$/.test(v))),
    );
    return { ids, invalidTokens };
  }

  private extractErrorMessage(err: HttpErrorResponse): string {
    const payload = err?.error;

    if (Array.isArray(payload?.errors) && payload.errors.length > 0) {
      return payload.errors.join("، ");
    }

    if (typeof payload?.message === "string" && payload.message.trim()) {
      return payload.message;
    }

    if (typeof payload === "string" && payload.trim()) {
      return payload;
    }

    return "تعذر إنشاء العنصر. تحقق من البيانات وصلاحيات المستخدمين المحددين.";
  }
}
