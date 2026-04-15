import { Component, OnInit, ChangeDetectorRef } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { RouterModule, ActivatedRoute, Router } from "@angular/router";
import { LayoutComponent } from "../../components/layout/layout.component";
import { ItemsService } from "../../services/items.service";
import { UsersService } from "../../services/users.service";
import { AuthService } from "../../services/auth.service";
import {
  Item,
  ChatMessage,
  ItemAuditEvent,
  ItemStatus,
  ItemType,
} from "../../models/item.model";
import { User } from "../../models/user.model";

@Component({
  selector: "app-item-detail",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LayoutComponent],
  templateUrl: "./item-detail.component.html",
  styleUrls: ["./item-detail.component.scss"],
})
export class ItemDetailComponent implements OnInit {
  item: Item | null = null;
  messages: ChatMessage[] = [];
  auditEvents: ItemAuditEvent[] = [];
  users: User[] = [];
  loading = true;
  messageText = "";
  selectedAttachment: File | null = null;
  sending = false;
  completing = false;
  deleting = false;
  activeTab: "details" | "chat" | "members" | "activity" = "details";
  chatMarkedRead = false;

  showEditModal = false;
  saving = false;
  editForm = this.emptyEditForm();

  selectedAddUserId: number | null = null;
  memberActionBusy = false;
  memberActionError: string | null = null;

  constructor(
    private itemsService: ItemsService,
    private usersService: UsersService,
    public authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get("id"));
    this.loadItem(id);
    this.loadMessages(id);
    this.loadAudit(id);
    this.loadUsers();
  }

  loadItem(id: number) {
    this.itemsService.getItem(id).subscribe({
      next: (item) => {
        this.item = item;
        this.loading = false;
        this.cdr.detectChanges();
        this.loadMessages(id);
        this.loadAudit(id);
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
        this.router.navigate(["/dashboard"]);
      },
    });
  }

  loadMessages(id: number) {
    this.itemsService.getMessages(id).subscribe({
      next: (msgs) => {
        this.messages = [...msgs];
        this.cdr.detectChanges();
      },
      error: () => {},
    });
  }

  loadAudit(id: number) {
    this.itemsService.getAudit(id).subscribe({
      next: (events) => {
        this.auditEvents = [...events];
        this.cdr.detectChanges();
      },
      error: () => {},
    });
  }

  loadUsers() {
    this.usersService.getUsers().subscribe({
      next: (users) => {
        this.users = [...users];
        this.cdr.detectChanges();
      },
      error: () => {},
    });
  }

  setActiveTab(tab: "details" | "chat" | "members" | "activity") {
    this.activeTab = tab;
    if (tab === "chat" && this.item && !this.chatMarkedRead) {
      this.itemsService.markMessagesRead(this.item.id).subscribe({
        next: () => {
          this.chatMarkedRead = true;
          if (this.item) {
            this.item = {
              ...this.item,
              unreadCount: 0,
              hasUnreadUpdates: false,
            };
          }
          this.cdr.detectChanges();
        },
      });
    }
  }

  openEdit() {
    if (!this.item) return;
    this.editForm = {
      type: this.item.type,
      title: this.item.title,
      description: this.item.description ?? "",
      importance: this.item.importance,
      committeeType: this.item.committeeType ?? "",
      dueDate: this.item.dueDate
        ? new Date(this.item.dueDate).toISOString().split("T")[0]
        : "",
      memberIds: [...(this.item.memberIds ?? [])],
      assigneeIds: [...(this.item.assigneeIds ?? [])],
    };
    this.showEditModal = true;
    this.cdr.detectChanges();
  }

  toggleEditMember(userId: number) {
    const idx = this.editForm.memberIds.indexOf(userId);
    if (idx >= 0) {
      this.editForm.memberIds.splice(idx, 1);
      return;
    }
    this.editForm.memberIds.push(userId);
  }

  toggleEditAssignee(userId: number) {
    const idx = this.editForm.assigneeIds.indexOf(userId);
    if (idx >= 0) {
      this.editForm.assigneeIds.splice(idx, 1);
      return;
    }
    this.editForm.assigneeIds.push(userId);
  }

  saveEdit() {
    if (!this.item || !this.editForm.title.trim()) return;
    this.saving = true;

    const payload = {
      type: this.editForm.type,
      title: this.editForm.title.trim(),
      description: this.editForm.description,
      importance: this.editForm.importance,
      committeeType:
        this.editForm.type === "COMMITTEE"
          ? this.editForm.committeeType || null
          : null,
      dueDate: this.editForm.dueDate,
      memberIds: this.editForm.memberIds,
      assigneeIds: this.editForm.assigneeIds,
    };

    this.itemsService.updateItem(this.item.id, payload as never).subscribe({
      next: (updated) => {
        this.item = updated;
        this.showEditModal = false;
        this.saving = false;
        this.loadAudit(updated.id);
        this.cdr.detectChanges();
      },
      error: () => {
        this.saving = false;
        this.cdr.detectChanges();
      },
    });
  }

  private emptyEditForm() {
    return {
      type: "TASK" as ItemType,
      title: "",
      description: "",
      importance: "NORMAL",
      committeeType: "",
      dueDate: "",
      memberIds: [] as number[],
      assigneeIds: [] as number[],
    };
  }

  get nonMembers(): User[] {
    if (!this.item) return [];
    return this.users.filter(
      (user) => !this.item?.memberIds?.includes(user.id),
    );
  }

  addMember() {
    if (!this.item || !this.selectedAddUserId) return;
    this.memberActionBusy = true;
    this.memberActionError = null;

    this.itemsService
      .addMember(this.item.id, this.selectedAddUserId)
      .subscribe({
        next: (updated) => {
          this.item = updated;
          this.selectedAddUserId = null;
          this.memberActionBusy = false;
          this.loadAudit(updated.id);
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.memberActionError =
            err?.error?.message ?? "حدث خطأ أثناء إضافة العضو";
          this.memberActionBusy = false;
          this.cdr.detectChanges();
        },
      });
  }

  removeMember(userId: number) {
    if (!this.item) return;
    this.memberActionBusy = true;
    this.memberActionError = null;

    this.itemsService.removeMember(this.item.id, userId).subscribe({
      next: (updated) => {
        this.item = updated;
        this.memberActionBusy = false;
        this.loadAudit(updated.id);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.memberActionError =
          err?.error?.message ?? "حدث خطأ أثناء إزالة العضو";
        this.memberActionBusy = false;
        this.cdr.detectChanges();
      },
    });
  }

  onAttachmentSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    this.selectedAttachment = input.files?.[0] ?? null;
  }

  clearAttachment() {
    this.selectedAttachment = null;
  }

  sendMessage() {
    if ((!this.messageText.trim() && !this.selectedAttachment) || !this.item)
      return;
    this.sending = true;

    this.itemsService
      .sendMessage(this.item.id, this.messageText, this.selectedAttachment)
      .subscribe({
        next: (msg) => {
          this.messages = [...this.messages, msg];
          this.messageText = "";
          this.selectedAttachment = null;
          this.sending = false;
          this.loadAudit(this.item!.id);
          this.cdr.detectChanges();
        },
        error: () => {
          this.sending = false;
          this.cdr.detectChanges();
        },
      });
  }

  downloadAttachment(message: ChatMessage) {
    this.itemsService.downloadAttachment(message.id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank");
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      },
    });
  }

  completeItem() {
    if (!this.item) return;
    this.completing = true;
    this.itemsService.completeItem(this.item.id).subscribe({
      next: (updated) => {
        this.item = updated;
        this.completing = false;
        this.loadAudit(updated.id);
        this.cdr.detectChanges();
      },
      error: () => {
        this.completing = false;
        this.cdr.detectChanges();
      },
    });
  }

  deleteItem() {
    if (!this.item || !confirm("هل أنت متأكد من الحذف؟")) return;
    this.deleting = true;
    this.itemsService.deleteItem(this.item.id).subscribe({
      next: () => {
        this.router.navigate(["/todo"]);
      },
      error: () => {
        this.deleting = false;
        this.cdr.detectChanges();
      },
    });
  }

  getUserName(id: number): string {
    return this.users.find((user) => user.id === id)?.name || `مستخدم ${id}`;
  }

  getUserInitial(id: number): string {
    return this.getUserName(id).trim().charAt(0) || "؟";
  }

  getItemTypeLabel(type: ItemType): string {
    return type === "TASK" ? "مهمة" : "لجنة";
  }

  getStatusLabel(status: ItemStatus): string {
    if (status === "COMPLETED") return "مكتملة";
    if (status === "OVERDUE") return "متأخرة";
    return "قيد التنفيذ";
  }

  getStatusClass(status: ItemStatus): string {
    if (status === "COMPLETED") return "completed";
    if (status === "OVERDUE") return "overdue";
    return "active";
  }

  isCurrentUser(userId: number): boolean {
    return this.authService.currentUser?.id === userId;
  }

  get canManage(): boolean {
    return this.authService.canManageItems();
  }

  get canComplete(): boolean {
    return this.item?.status !== "COMPLETED" && this.canManage;
  }
}
