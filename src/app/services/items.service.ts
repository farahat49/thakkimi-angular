import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Item, CreateItemRequest, ChatMessage, ItemAuditEvent } from '../models/item.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ItemsService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getItems(filters?: { status?: string; type?: string; search?: string; agencyId?: number; departmentId?: number; sectionId?: number }): Observable<Item[]> {
    let params = new HttpParams();

    if (filters?.status) params = params.set('status', filters.status);
    if (filters?.type) params = params.set('type', filters.type);
    if (filters?.search) params = params.set('search', filters.search);
    if (filters?.agencyId) params = params.set('agencyId', filters.agencyId);
    if (filters?.departmentId) params = params.set('departmentId', filters.departmentId);
    if (filters?.sectionId) params = params.set('sectionId', filters.sectionId);

    return this.http.get<Item[]>(`${this.apiUrl}/items`, { params });
  }

  getItem(id: number): Observable<Item> {
    return this.http.get<Item>(`${this.apiUrl}/items/${id}`);
  }

  createItem(item: CreateItemRequest): Observable<Item> {
    return this.http.post<Item>(`${this.apiUrl}/items`, item);
  }

  updateItem(id: number, item: Partial<Item>): Observable<Item> {
    return this.http.put<Item>(`${this.apiUrl}/items/${id}`, item);
  }

  deleteItem(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/items/${id}`);
  }

  completeItem(id: number): Observable<Item> {
    return this.http.patch<Item>(`${this.apiUrl}/items/${id}/complete`, {});
  }

  exportItems(filters?: { status?: string; type?: string; search?: string; agencyId?: number; departmentId?: number; sectionId?: number }): Observable<Blob> {
    let params = new HttpParams();

    if (filters?.status) params = params.set('status', filters.status);
    if (filters?.type) params = params.set('type', filters.type);
    if (filters?.search) params = params.set('search', filters.search);
    if (filters?.agencyId) params = params.set('agencyId', filters.agencyId);
    if (filters?.departmentId) params = params.set('departmentId', filters.departmentId);
    if (filters?.sectionId) params = params.set('sectionId', filters.sectionId);

    return this.http.get(`${this.apiUrl}/items/export`, { params, responseType: 'blob' });
  }

  getAudit(itemId: number): Observable<ItemAuditEvent[]> {
    return this.http.get<ItemAuditEvent[]>(`${this.apiUrl}/items/${itemId}/audit`);
  }

  getMessages(itemId: number): Observable<ChatMessage[]> {
    return this.http.get<ChatMessage[]>(`${this.apiUrl}/items/${itemId}/messages`);
  }

  sendMessage(itemId: number, text: string, attachment?: File | null): Observable<ChatMessage> {
    const formData = new FormData();
    formData.append('text', text ?? '');
    if (attachment) {
      formData.append('attachment', attachment);
    }

    return this.http.post<ChatMessage>(`${this.apiUrl}/items/${itemId}/messages`, formData);
  }

  downloadAttachment(messageId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/items/attachments/${messageId}`, {
      responseType: 'blob'
    });
  }

  markMessagesRead(itemId: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/items/${itemId}/messages/read`, {});
  }

  addMember(itemId: number, userId: number): Observable<Item> {
    return this.http.post<Item>(`${this.apiUrl}/items/${itemId}/members`, { userId });
  }

  removeMember(itemId: number, userId: number): Observable<Item> {
    return this.http.delete<Item>(`${this.apiUrl}/items/${itemId}/members/${userId}`);
  }
}
