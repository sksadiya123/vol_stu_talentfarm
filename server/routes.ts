import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { setupAuth, getCurrentUser } from "./auth";
import { storage } from "./storage";
import { insertSessionSchema, insertBookingSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configure multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadsDir = path.join(process.cwd(), 'uploads');
      fs.mkdirSync(uploadsDir, { recursive: true });
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'resume') {
      if (["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"].includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error("Only PDF and DOC files allowed for resume"));
      }
    } else if (file.fieldname === 'profilePicture') {
      if (file.mimetype.startsWith("image/")) {
        cb(null, true);
      } else {
        cb(new Error("Only image files allowed for profile picture"));
      }
    } else {
      cb(new Error("Unexpected field"));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // CHAT ENDPOINT FOR CHATBOT
  app.post('/api/chat', async (req, res) => {
    try {
      const { message, conversationHistory } = req.body;

      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Message is required' });
      }

      // Build conversation context
      let conversationContext = '';
      if (conversationHistory && Array.isArray(conversationHistory)) {
        conversationContext = conversationHistory
          .slice(-5)
          .map((msg: any) => `${msg.isBot ? 'Assistant' : 'User'}: ${msg.content}`)
          .join('\n');
      }

      const systemPrompt = `You are EduBot, an intelligent and friendly assistant for an educational platform called EduConnect that connects students with no access to formal education to volunteers who teach them. 

Your role is to:
- Answer any general education-related questions (e.g., science, math, language, coding, history, etc.)
- Help users understand how to use the platform:
  * How to sign up as a student or volunteer
  * How to book a session (for students)
  * How to create a session (for volunteers)  
  * How to upload resume (for volunteers)
  * How to view dashboard features
  * How to edit profile
  * How to change profile picture
  * How to view booked sessions
  * How to view enrolled students (for volunteers)
  * How to edit or delete sessions (for volunteers)
- Provide clear, simple, and respectful guidance for both students and volunteers
- Encourage learning and help users feel supported, no matter their background

Platform-specific information:
- Students can browse and book sessions created by volunteers
- Volunteers can create sessions, view their students, manage and edit their sessions
- Both users can edit their profiles and upload profile pictures
- The platform is designed for people without access to formal education
- Sessions can be on any educational topic
- Volunteers can edit their sessions anytime before they start
- If a volunteer deletes a session, it will be removed from student view automatically

Always assume the user may be new to technology and needs clear step-by-step answers. Avoid technical jargon. Be friendly, encouraging, and supportive at all times. Keep responses concise but helpful.`;

      const messages = [
        {
          role: 'system',
          content: systemPrompt
        }
      ];

      if (conversationContext) {
        messages.push({
          role: 'user',
          content: `Previous conversation context:\n${conversationContext}\n\nCurrent question: ${message}`
        });
      } else {
        messages.push({
          role: 'user',
          content: message
        });
      }

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:5000',
          'X-Title': 'EduConnect Chatbot'
        },
        body: JSON.stringify({
          model: 'openai/gpt-3.5-turbo',
          messages: messages,
          max_tokens: 500,
          temperature: 0.7,
          top_p: 1,
          frequency_penalty: 0,
          presence_penalty: 0
        })
      });

      if (!response.ok) {
        console.error('OpenRouter API error:', response.status, response.statusText);
        throw new Error(`OpenRouter API error: ${response.status}`);
      }

      const data = await response.json() as any;
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        console.error('Invalid response from OpenRouter:', data);
        throw new Error('Invalid response from OpenRouter API');
      }

      const botResponse = data.choices[0].message.content;

      res.json({
        response: botResponse,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Chat API error:', error);
      res.status(500).json({
        error: 'Failed to process chat request',
        response: "I'm having trouble connecting right now. Please try again in a moment, or feel free to explore the platform features on your own!"
      });
    }
  });

  // SESSION CREATE
  app.post("/api/sessions", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Authentication required" });
    if (req.user!.role !== 'volunteer') return res.status(403).json({ message: "Only volunteers can create sessions" });

    try {
      const sessionData = insertSessionSchema.parse({
        ...req.body,
        volunteerId: req.user!.id,
        date: new Date(req.body.date + 'T' + req.body.time),
      });
      const session = await storage.createSession(sessionData);
      res.status(201).json(session);
    } catch (error) {
      console.error("Create session error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid session data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create session" });
    }
  });

  // SESSION UPDATE (NEW)
  app.put("/api/sessions/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Authentication required" });
    if (req.user!.role !== 'volunteer') return res.status(403).json({ message: "Only volunteers can edit sessions" });

    try {
      const sessionId = parseInt(req.params.id);
      const session = await storage.getSessionById(sessionId);
      
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      if (session.volunteerId !== req.user!.id) {
        return res.status(403).json({ message: "You can only edit your own sessions" });
      }

      const updateData = {
        ...req.body,
        date: req.body.date && req.body.time ? new Date(req.body.date + 'T' + req.body.time) : undefined,
      };

      // Remove undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });

      const updatedSession = await storage.updateSession(sessionId, updateData);
      if (!updatedSession) {
        return res.status(500).json({ message: "Failed to update session" });
      }

      res.json(updatedSession);
    } catch (error) {
      console.error("Update session error:", error);
      res.status(500).json({ message: "Failed to update session" });
    }
  });

  // GET ALL SESSIONS
  app.get("/api/sessions", async (req, res) => {
    try {
      const sessions = await storage.getAvailableSessions();
      res.json(sessions);
    } catch (error) {
      console.error("Get sessions error:", error);
      res.status(500).json({ message: "Failed to fetch sessions" });
    }
  });

  // GET MY SESSIONS
  app.get("/api/sessions/my", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Authentication required" });
    if (req.user!.role !== 'volunteer') return res.status(403).json({ message: "Only volunteers can view their sessions" });

    try {
      const sessions = await storage.getSessionsByVolunteer(req.user!.id);
      res.json(sessions);
    } catch (error) {
      console.error("Get my sessions error:", error);
      res.status(500).json({ message: "Failed to fetch sessions" });
    }
  });

  // DELETE SESSION (UPDATED)
  app.delete("/api/sessions/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Authentication required" });
    if (req.user!.role !== 'volunteer') return res.status(403).json({ message: "Only volunteers can delete sessions" });

    try {
      const sessionId = parseInt(req.params.id);
      const session = await storage.getSessionById(sessionId);
      
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      if (session.volunteerId !== req.user!.id) {
        return res.status(403).json({ message: "You can only delete your own sessions" });
      }

      const success = await storage.deleteSession(sessionId);
      if (!success) {
        return res.status(500).json({ message: "Failed to delete session" });
      }

      res.json({ message: "Session deleted successfully" });
    } catch (error) {
      console.error("Delete session error:", error);
      res.status(500).json({ message: "Failed to delete session" });
    }
  });

  // BOOKING
  app.post("/api/bookings", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Authentication required" });
    if (req.user!.role !== 'student') return res.status(403).json({ message: "Only students can book sessions" });

    try {
      const bookingData = insertBookingSchema.parse({
        ...req.body,
        studentId: req.user!.id,
      });

      const session = await storage.getSessionById(bookingData.sessionId);
      if (!session) return res.status(404).json({ message: "Session not found" });
      if (session.currentStudents >= session.maxStudents) {
        return res.status(400).json({ message: "Session is full" });
      }

      const booking = await storage.createBooking(bookingData);
      res.status(201).json(booking);
    } catch (error) {
      console.error("Create booking error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid booking data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create booking" });
    }
  });

  // GET MY BOOKINGS
  app.get("/api/bookings/my", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Authentication required" });
    if (req.user!.role !== 'student') return res.status(403).json({ message: "Only students can view their bookings" });

    try {
      const bookings = await storage.getBookingsByStudent(req.user!.id);
      res.json(bookings);
    } catch (error) {
      console.error("Get my bookings error:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  // CANCEL BOOKING
  app.put("/api/bookings/:id/cancel", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Authentication required" });

    try {
      const bookingId = parseInt(req.params.id);
      const success = await storage.cancelBooking(bookingId);
      
      if (!success) {
        return res.status(404).json({ message: "Booking not found" });
      }

      res.json({ message: "Booking cancelled successfully" });
    } catch (error) {
      console.error("Cancel booking error:", error);
      res.status(500).json({ message: "Failed to cancel booking" });
    }
  });

  // UPDATE PROFILE (FIXED)
  app.put("/api/profile", upload.fields([
    { name: 'resume', maxCount: 1 },
    { name: 'profilePicture', maxCount: 1 }
  ]), async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Authentication required" });

    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const updates: any = {};

      // Add text fields
      Object.keys(req.body).forEach(key => {
        if (req.body[key] !== undefined && req.body[key] !== '') {
          updates[key] = req.body[key];
        }
      });

      // Add file URLs
      if (files?.resume?.[0]) {
        updates.resumeUrl = `/uploads/${files.resume[0].filename}`;
      }
      if (files?.profilePicture?.[0]) {
        updates.profilePicture = `/uploads/${files.profilePicture[0].filename}`;
      }

      const updatedUser = await storage.updateUser(req.user!.id, updates);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        message: "Profile updated successfully",
        user: updatedUser
      });
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // VOLUNTEER STATS
  app.get("/api/volunteer/stats", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Authentication required" });
    if (req.user!.role !== 'volunteer') return res.status(403).json({ message: "Only volunteers can view stats" });

    try {
      const stats = await storage.getVolunteerStats(req.user!.id);
      res.json(stats);
    } catch (error) {
      console.error("Get volunteer stats error:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // GET BOOKINGS FOR A SESSION (only by owner)
  app.get("/api/sessions/:id/bookings", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Authentication required" });

    try {
      const sessionId = parseInt(req.params.id);
      const session = await storage.getSessionById(sessionId);
      if (!session) return res.status(404).json({ message: "Session not found" });

      if (session.volunteerId !== req.user!.id) {
        return res.status(403).json({ message: "Cannot view session bookings" });
      }

      const bookings = await storage.getBookingsBySession(sessionId);
      res.json(bookings);
    } catch (error) {
      console.error("Get session bookings error:", error);
      res.status(500).json({ message: "Failed to fetch session bookings" });
    }
  });

  return createServer(app);
}