/**
 * Domain Entity: Message (Chat)
 * Clean Architecture - Domain Layer
 */

export interface Message {
  id: string;
  tripId: string;
  bookingId?: string;
  senderId: string;
  receiverId: string;
  messageText: string;
  messageType: 'text' | 'system' | 'location' | 'quick_reply';
  isRead: boolean;
  readAt?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export class MessageEntity implements Message {
  id: string;
  tripId: string;
  bookingId?: string;
  senderId: string;
  receiverId: string;
  messageText: string;
  messageType: 'text' | 'system' | 'location' | 'quick_reply';
  isRead: boolean;
  readAt?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;

  constructor(data: Message) {
    Object.assign(this, data);
  }

  // Business Rules
  markAsRead(): void {
    this.isRead = true;
    this.readAt = new Date();
  }

  isFromDriver(driverId: string): boolean {
    return this.senderId === driverId;
  }

  isSystemMessage(): boolean {
    return this.messageType === 'system';
  }

  isQuickReply(): boolean {
    return this.messageType === 'quick_reply';
  }

  getTimeSinceSent(): string {
    const now = new Date();
    const sentTime = new Date(this.createdAt);
    const diffMs = now.getTime() - sentTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  }
}

