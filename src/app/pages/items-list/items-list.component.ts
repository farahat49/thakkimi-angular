import { Component, OnInit, ChangeDetectorRef } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { HttpErrorResponse } from "@angular/common/http";
import { RouterModule, ActivatedRoute } from "@angular/router";
import { Subject, debounceTime, distinctUntilChanged } from "rxjs";
import { LayoutComponent } from "../../components/layout/layout.component";
import { ItemsService } from "../../services/items.service";
import { UsersService } from "../../services/users.service";
import { AuthService } from "../../services/auth.service";

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
  loading = true;
  status: ItemStatus = "ACTIVE";
  searchQuery = "";
  filterType = "";
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


  employee: Employee[] = [];
  membersExpanded = false;
  committeeSearchQuery = '';
  committeeSearchResults: { fullName: string; identityNumber: string }[] = [];
  committeeSearchSelected: { fullName: string; identityNumber: string }[] = [];
  committeeSearchLoading = false;
  private committeeSearch$ = new Subject<string>();

  constructor(
    private itemsService: ItemsService,
    private usersService: UsersService,
    public authService: AuthService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.route.data.subscribe((data) => {
      this.status = data["status"] || "ACTIVE";
      this.loadAssignableUsers();
      this.loadData();
      this.loadHierarchy();
    });

    this.committeeSearch$.pipe(debounceTime(300), distinctUntilChanged()).subscribe(q => {
      this.searchCommitteeUsers(q);
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

  loadData(): void {
    this.loading = true;
    this.itemsService
      .getItems({
        status: this.status,
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

    const payload: CreateItemRequest = {
      ...this.newItem,
      title: this.newItem.title.trim(),
      description: this.newItem.description.trim(),
      memberNationalIds: this.committeeSearchSelected.map(e => e.identityNumber),
      assigneeNationalIds: [],
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
      next: () => {
        this.showCreateModal = false;
        this.creating = false;
        this.resetNewItem();
        this.cdr.detectChanges();
        this.loadData();
      },
      error: (err: HttpErrorResponse) => {
        this.creating = false;
        this.createError = this.extractErrorMessage(err);
        this.cdr.detectChanges();
      },
    });
  }

  openCreateModal(): void {
    this.resetNewItem();
    this.newItem.memberIds = this.employee.map(e => +e.identityNumber);
    this.membersExpanded = false;
    this.committeeSearchQuery = '';
    this.committeeSearchResults = [];
    this.committeeSearchSelected = [];
    this.showCreateModal = true;
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
    this.committeeSearchQuery = '';
    this.committeeSearchResults = [];
    this.committeeSearchSelected = [];
    this.createError = null;
  }

  onCommitteeSearch(): void {
    const q = this.committeeSearchQuery.trim();
    if (!q) { this.committeeSearchResults = []; return; }
    this.committeeSearch$.next(q);
  }

  private searchCommitteeUsers(q: string): void {
    this.committeeSearchLoading = true;
    this.usersService.getMawaradUsers(1, 8, q).subscribe({
      next: (res) => {
        this.committeeSearchResults = res.items.map(u => ({
          fullName: u.fullName,
          identityNumber: u.userName
        }));
        this.committeeSearchLoading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.committeeSearchLoading = false; }
    });
  }

  get committeeCanAddByNationalId(): boolean {
    const q = this.committeeSearchQuery.trim();
    return /^\d{10}$/.test(q) &&
      !this.committeeSearchLoading &&
      !this.committeeSearchResults.find(e => e.identityNumber === q) &&
      !this.committeeSearchSelected.find(e => e.identityNumber === q);
  }

  addByNationalId(): void {
    const id = this.committeeSearchQuery.trim();
    if (!/^\d{10}$/.test(id)) return;
    if (!this.committeeSearchSelected.find(e => e.identityNumber === id)) {
      this.committeeSearchSelected = [
        ...this.committeeSearchSelected,
        { fullName: id, identityNumber: id }
      ];
    }
    this.committeeSearchQuery = '';
    this.committeeSearchResults = [];
  }

  addToCommitteeList(emp: { fullName: string; identityNumber: string }): void {
    if (!this.committeeSearchSelected.find(e => e.identityNumber === emp.identityNumber)) {
      this.committeeSearchSelected = [...this.committeeSearchSelected, emp];
    }
    this.committeeSearchQuery = '';
    this.committeeSearchResults = [];
  }

  removeFromCommitteeList(emp: { fullName: string; identityNumber: string }): void {
    this.committeeSearchSelected = this.committeeSearchSelected.filter(
      e => e.identityNumber !== emp.identityNumber
    );
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
