// --- START OF FILE ---

import { 
  users, 
  sessions, 
  bookings,
  type User, 
  type InsertUser,
  type Session,
  type InsertSession,
  type Booking,
  type InsertBooking,
  type SessionWithVolunteer,
  type BookingWithDetails
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, asc, gt } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined>;

  createSession(session: InsertSession): Promise<Session>;
  getSessionById(id: number): Promise<SessionWithVolunteer | undefined>;
  getSessionsByVolunteer(volunteerId: number): Promise<SessionWithVolunteer[]>;
  getAvailableSessions(): Promise<SessionWithVolunteer[]>;
  updateSession(id: number, updates: Partial<InsertSession>): Promise<Session | undefined>;
  deleteSession(id: number): Promise<boolean>;

  createBooking(booking: InsertBooking): Promise<Booking>;
  getBookingsByStudent(studentId: number): Promise<BookingWithDetails[]>;
  getBookingsBySession(sessionId: number): Promise<BookingWithDetails[]>;
  cancelBooking(id: number): Promise<boolean>;

  getVolunteerStats(volunteerId: number): Promise<{
    totalSessions: number;
    studentsHelped: number;
    upcomingSessions: number;
  }>;

  sessionStore: any;
}

export class DatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        updatedAt: new Date(),
      })
      .returning();
    return user;
  }

  // FIXED UPDATE USER METHOD
  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    try {
      // Remove undefined and null values
      const cleanUpdates: any = {};
      Object.keys(updates).forEach(key => {
        const value = (updates as any)[key];
        if (value !== undefined && value !== null && value !== '') {
          cleanUpdates[key] = value;
        }
      });

      if (Object.keys(cleanUpdates).length === 0) {
        // No valid updates, return current user
        return await this.getUser(id);
      }

      const [user] = await db
        .update(users)
        .set({
          ...cleanUpdates,
          updatedAt: new Date(),
        })
        .where(eq(users.id, id))
        .returning();
      
      return user || undefined;
    } catch (error) {
      console.error('Error updating user:', error);
      return undefined;
    }
  }

  async createSession(insertSession: InsertSession): Promise<Session> {
    const [session] = await db
      .insert(sessions)
      .values({
        ...insertSession,
        updatedAt: new Date(),
      })
      .returning();
    return session;
  }

  async getSessionById(id: number): Promise<SessionWithVolunteer | undefined> {
    const [session] = await db
      .select()
      .from(sessions)
      .leftJoin(users, eq(sessions.volunteerId, users.id))
      .where(eq(sessions.id, id));
    
    if (!session) return undefined;

    return {
      ...session.sessions,
      volunteer: session.users!,
    };
  }

  async getSessionsByVolunteer(volunteerId: number): Promise<SessionWithVolunteer[]> {
    const results = await db
      .select()
      .from(sessions)
      .leftJoin(users, eq(sessions.volunteerId, users.id))
      .where(and(eq(sessions.volunteerId, volunteerId), eq(sessions.isActive, true)))
      .orderBy(desc(sessions.createdAt));
    
    return results.map(result => ({
      ...result.sessions,
      volunteer: result.users!,
    }));
  }

  // ✅ FIXED FUNCTION — filters out past sessions
  async getAvailableSessions(): Promise<SessionWithVolunteer[]> {
    const now = new Date();
    const results = await db
      .select()
      .from(sessions)
      .leftJoin(users, eq(sessions.volunteerId, users.id))
      .where(and(
        eq(sessions.isActive, true),
        gt(sessions.date, now)
      ))
      .orderBy(asc(sessions.date));
    
    return results.map(result => ({
      ...result.sessions,
      volunteer: result.users!,
    }));
  }

  async updateSession(id: number, updates: Partial<InsertSession>): Promise<Session | undefined> {
    const [session] = await db
      .update(sessions)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(sessions.id, id))
      .returning();
    return session || undefined;
  }

  async deleteSession(id: number): Promise<boolean> {
    const [session] = await db
      .update(sessions)
      .set({ 
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(sessions.id, id))
      .returning();
    return !!session;
  }

  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const [booking] = await db
      .insert(bookings)
      .values(insertBooking)
      .returning();

    const currentBookings = await db
      .select()
      .from(bookings)
      .where(and(eq(bookings.sessionId, insertBooking.sessionId), eq(bookings.status, "active")));

    await db
      .update(sessions)
      .set({
        currentStudents: currentBookings.length,
        updatedAt: new Date(),
      })
      .where(eq(sessions.id, insertBooking.sessionId));

    return booking;
  }

  async getBookingsByStudent(studentId: number): Promise<BookingWithDetails[]> {
    const results = await db
      .select()
      .from(bookings)
      .leftJoin(sessions, eq(bookings.sessionId, sessions.id))
      .leftJoin(users, eq(sessions.volunteerId, users.id))
      .where(and(
        eq(bookings.studentId, studentId), 
        eq(bookings.status, "active"),
        eq(sessions.isActive, true) // Only show active sessions
      ))
      .orderBy(asc(sessions.date));
    
    return results.map(result => ({
      ...result.bookings,
      session: {
        ...result.sessions!,
        volunteer: result.users!,
      },
      student: { id: studentId } as User,
    }));
  }

  async getBookingsBySession(sessionId: number): Promise<BookingWithDetails[]> {
    const results = await db
      .select()
      .from(bookings)
      .leftJoin(users, eq(bookings.studentId, users.id))
      .leftJoin(sessions, eq(bookings.sessionId, sessions.id))
      .where(and(eq(bookings.sessionId, sessionId), eq(bookings.status, "active")));
    
    return results.map(result => ({
      ...result.bookings,
      student: result.users!,
      session: result.sessions! as SessionWithVolunteer,
    }));
  }

  async cancelBooking(id: number): Promise<boolean> {
    const [booking] = await db
      .update(bookings)
      .set({ status: "cancelled" })
      .where(eq(bookings.id, id))
      .returning();
    return !!booking;
  }

  async getVolunteerStats(volunteerId: number): Promise<{
    totalSessions: number;
    studentsHelped: number;
    upcomingSessions: number;
  }> {
    const totalSessionsResult = await db
      .select()
      .from(sessions)
      .where(and(eq(sessions.volunteerId, volunteerId), eq(sessions.isActive, true)));

    const studentsHelpedResult = await db
      .selectDistinct({ studentId: bookings.studentId })
      .from(bookings)
      .leftJoin(sessions, eq(bookings.sessionId, sessions.id))
      .where(and(
        eq(sessions.volunteerId, volunteerId),
        eq(bookings.status, "active")
      ));

    const upcomingSessionsResult = await db
      .select()
      .from(sessions)
      .where(and(
        eq(sessions.volunteerId, volunteerId),
        eq(sessions.isActive, true)
      ));

    return {
      totalSessions: totalSessionsResult.length || 0,
      studentsHelped: studentsHelpedResult.length,
      upcomingSessions: upcomingSessionsResult.length || 0,
    };
  }
}

export const storage = new DatabaseStorage();

// --- END OF FILE ---