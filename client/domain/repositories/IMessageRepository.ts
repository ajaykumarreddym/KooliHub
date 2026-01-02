/**
 * Repository Interface: Message
 * Clean Architecture - Domain Layer
 */

import { Message } from '../entities/Message';

export interface IMessageRepository {
  // Message CRUD
  getById(id: string): Promise<Message | null>;
  getTripMessages(tripId: string): Promise<Message[]>;
  getConversation(tripId: string, userId1: string, userId2: string): Promise<Message[]>;
  getUnreadCount(userId: string, tripId: string): Promise<number>;
  send(message: Omit<Message, 'id' | 'createdAt'>): Promise<Message>;
  markAsRead(messageIds: string[]): Promise<void>;
  markConversationAsRead(tripId: string, receiverId: string): Promise<void>;
  
  // Real-time
  subscribeToTrip(tripId: string, callback: (message: Message) => void): () => void;
}

