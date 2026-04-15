export type ItemType = 'TASK' | 'COMMITTEE';
export type ItemStatus = 'ACTIVE' | 'OVERDUE' | 'COMPLETED';
export type Importance = 'NORMAL' | 'SECRET';
export type CommitteeType = 'INTERNAL' | 'EXTERNAL';

export interface Item {
  id: number;
  itemNumber: string;
  type: ItemType;
  title: string;
  description: string;
  importance: Importance;
  committeeType?: CommitteeType | null;
  status: ItemStatus;
  completedDate?: string | null;
  dueDate: string;
  createdById: number;
  departmentId: number;
  createdAt: string;
  updatedAt: string;
  memberIds: number[];
  assigneeIds: number[];
  unreadCount?: number;
  hasUnreadUpdates?: boolean;
}

export interface CreateItemRequest {
  type: ItemType;
  title: string;
  description: string;
  importance: Importance;
  committeeType?: CommitteeType | null;
  dueDate: string;
  memberIds: number[];
  assigneeIds: number[];
  memberNationalIds?: string[];
  assigneeNationalIds?: string[];
}

export interface ChatMessage {
  id: number;
  itemId: number;
  userId: number;
  text: string;
  attachmentFileName?: string;
  hasAttachment?: boolean;
  createdAt: string;
  userName?: string;
}

export interface ItemAuditEvent {
  id: number;
  actionType: string;
  userId: number;
  userName: string;
  description: string;
  timestamp: string;
}

export interface Notification {
  id: number;
  userId: number;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}
