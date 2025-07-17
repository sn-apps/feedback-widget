import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertFeedbackSchema } from "@shared/schema";
import { z } from "zod";

// Extended request interface for IP and User Agent
interface ExtendedRequest extends Request {
  ip?: string;
  get(name: string): string | undefined;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all feedback
  app.get("/api/feedback", async (req: ExtendedRequest, res) => {
    try {
      const feedbacks = await storage.getFeedback();
      res.json(feedbacks);
    } catch (error) {
      console.error("Error fetching feedback:", error);
      res.status(500).json({ message: "Failed to retrieve feedback" });
    }
  });

  // Get feedback by ID
  app.get("/api/feedback/:id", async (req: ExtendedRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid feedback ID" });
      }

      const feedback = await storage.getFeedbackById(id);
      if (!feedback) {
        return res.status(404).json({ message: "Feedback not found" });
      }

      res.json(feedback);
    } catch (error) {
      console.error("Error fetching feedback:", error);
      res.status(500).json({ message: "Failed to retrieve feedback" });
    }
  });

  // Create new feedback
  app.post("/api/feedback", async (req: ExtendedRequest, res) => {
    try {
      const validatedData = insertFeedbackSchema.parse(req.body);
      
      // Get client IP and User Agent
      const ipAddress = req.ip || req.connection.remoteAddress || "unknown";
      const userAgent = req.get("User-Agent") || "unknown";

      const feedback = await storage.createFeedback(validatedData, ipAddress, userAgent);
      res.status(201).json(feedback);
    } catch (error) {
      console.error("Error creating feedback:", error);
      
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          message: "Invalid feedback data", 
          errors: error.errors 
        });
      } else {
        res.status(500).json({ message: "Failed to create feedback" });
      }
    }
  });

  // Update feedback (for admin use)
  app.put("/api/feedback/:id", async (req: ExtendedRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid feedback ID" });
      }

      const validatedData = insertFeedbackSchema.partial().parse(req.body);
      const feedback = await storage.updateFeedback(id, validatedData);
      
      if (!feedback) {
        return res.status(404).json({ message: "Feedback not found" });
      }

      res.json(feedback);
    } catch (error) {
      console.error("Error updating feedback:", error);
      
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          message: "Invalid feedback data", 
          errors: error.errors 
        });
      } else {
        res.status(500).json({ message: "Failed to update feedback" });
      }
    }
  });

  // Delete feedback (for admin use)
  app.delete("/api/feedback/:id", async (req: ExtendedRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid feedback ID" });
      }

      const success = await storage.deleteFeedback(id);
      
      if (!success) {
        return res.status(404).json({ message: "Feedback not found" });
      }

      res.json({ message: "Feedback deleted successfully" });
    } catch (error) {
      console.error("Error deleting feedback:", error);
      res.status(500).json({ message: "Failed to delete feedback" });
    }
  });

  // Health check endpoint
  app.get("/api/health", (req: ExtendedRequest, res) => {
    res.json({ 
      status: "healthy", 
      timestamp: new Date().toISOString(),
      storage: process.env.DATABASE_URL ? "supabase" : "memory"
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}