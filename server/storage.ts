import { users, feedback, type User, type InsertUser, type Feedback, type InsertFeedback } from "@shared/schema";
import { drizzle } from "drizzle-orm/neon-serverless";
import { neon } from "@neondatabase/serverless";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getFeedback(): Promise<Feedback[]>;
  getFeedbackById(id: number): Promise<Feedback | undefined>;
  createFeedback(feedback: InsertFeedback, ipAddress?: string, userAgent?: string): Promise<Feedback>;
  updateFeedback(id: number, feedback: Partial<InsertFeedback>): Promise<Feedback | undefined>;
  deleteFeedback(id: number): Promise<boolean>;
}

// In-memory storage for development
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private feedbacks: Map<number, Feedback>;
  private currentUserId: number;
  private currentFeedbackId: number;

  constructor() {
    this.users = new Map();
    this.feedbacks = new Map();
    this.currentUserId = 1;
    this.currentFeedbackId = 1;

    // Add some sample data
    this.seedData();
  }

  private seedData() {
    // Add sample feedback
    const sampleFeedbacks = [
      { name: "John Doe", email: "john@example.com", rating: 5, comment: "Excellent service! Very impressed with the quality." },
      { name: "Sarah Wilson", email: "sarah@example.com", rating: 4, comment: "Great experience overall. Would recommend to others." },
      { name: "Mike Johnson", email: "", rating: 3, comment: "Good but could be improved in some areas." },
    ];

    sampleFeedbacks.forEach(fb => {
      const id = this.currentFeedbackId++;
      const feedback: Feedback = {
        ...fb,
        id,
        timestamp: new Date(Date.now() - Math.random() * 86400000), // Random time in last 24h
        ip_address: "127.0.0.1",
        user_agent: "Sample User Agent",
      };
      this.feedbacks.set(id, feedback);
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser, 
      id, 
      created_at: new Date() 
    };
    this.users.set(id, user);
    return user;
  }

  async getFeedback(): Promise<Feedback[]> {
    return Array.from(this.feedbacks.values()).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  async getFeedbackById(id: number): Promise<Feedback | undefined> {
    return this.feedbacks.get(id);
  }

  async createFeedback(insertFeedback: InsertFeedback, ipAddress?: string, userAgent?: string): Promise<Feedback> {
    const id = this.currentFeedbackId++;
    const feedback: Feedback = {
      ...insertFeedback,
      id,
      timestamp: new Date(),
      ip_address: ipAddress || null,
      user_agent: userAgent || null,
    };
    this.feedbacks.set(id, feedback);
    return feedback;
  }

  async updateFeedback(id: number, updateData: Partial<InsertFeedback>): Promise<Feedback | undefined> {
    const existing = this.feedbacks.get(id);
    if (!existing) return undefined;

    const updated: Feedback = { ...existing, ...updateData };
    this.feedbacks.set(id, updated);
    return updated;
  }

  async deleteFeedback(id: number): Promise<boolean> {
    return this.feedbacks.delete(id);
  }
}

// Supabase PostgreSQL Storage Implementation
export class SupabaseStorage implements IStorage {
  private db: ReturnType<typeof drizzle>;

  constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is required for Supabase storage");
    }
    
    const sql = neon(process.env.DATABASE_URL);
    this.db = drizzle(sql);
  }

  async getUser(id: number): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await this.db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async getFeedback(): Promise<Feedback[]> {
    const result = await this.db.select().from(feedback).orderBy(desc(feedback.timestamp));
    return result;
  }

  async getFeedbackById(id: number): Promise<Feedback | undefined> {
    const result = await this.db.select().from(feedback).where(eq(feedback.id, id)).limit(1);
    return result[0];
  }

  async createFeedback(insertFeedback: InsertFeedback, ipAddress?: string, userAgent?: string): Promise<Feedback> {
    const result = await this.db.insert(feedback).values({
      ...insertFeedback,
      ip_address: ipAddress || null,
      user_agent: userAgent || null,
    }).returning();
    return result[0];
  }

  async updateFeedback(id: number, updateData: Partial<InsertFeedback>): Promise<Feedback | undefined> {
    const result = await this.db.update(feedback).set(updateData).where(eq(feedback.id, id)).returning();
    return result[0];
  }

  async deleteFeedback(id: number): Promise<boolean> {
    const result = await this.db.delete(feedback).where(eq(feedback.id, id)).returning();
    return result.length > 0;
  }
}

// Storage factory - automatically uses Supabase if DATABASE_URL is available
export const storage = process.env.DATABASE_URL ? new SupabaseStorage() : new MemStorage();