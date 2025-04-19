import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { 
  insertNovelSchema, insertChapterSchema, insertCommentSchema,
  insertBookmarkSchema, insertReadingHistorySchema, insertLikeSchema,
  insertUserSettingsSchema
} from "@shared/schema";
import { z } from "zod";

// Helper function to ensure user is authenticated
function ensureAuthenticated(req: Request, res: Response, next: Function) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}

// Helper function to ensure user is admin
function ensureAdmin(req: Request, res: Response, next: Function) {
  if (req.isAuthenticated() && req.user.isAdmin) {
    return next();
  }
  res.status(403).json({ message: "Forbidden" });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // ---- Novel Routes ----
  app.get("/api/novels", async (req, res) => {
    try {
      const { limit, offset, genre } = req.query;
      const options = {
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
        genre: genre as string | undefined
      };
      
      const novels = await storage.getNovels(options);
      res.json(novels);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "An error occurred while fetching novels" });
    }
  });

  app.get("/api/novels/featured", async (req, res) => {
    try {
      const { limit } = req.query;
      const featuredNovels = await storage.getFeaturedNovels(limit ? parseInt(limit as string) : undefined);
      res.json(featuredNovels);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "An error occurred while fetching featured novels" });
    }
  });

  app.get("/api/novels/trending", async (req, res) => {
    try {
      const { limit } = req.query;
      const trendingNovels = await storage.getTrendingNovels(limit ? parseInt(limit as string) : undefined);
      res.json(trendingNovels);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "An error occurred while fetching trending novels" });
    }
  });

  app.get("/api/novels/recent", async (req, res) => {
    try {
      const { limit } = req.query;
      const recentNovels = await storage.getRecentNovels(limit ? parseInt(limit as string) : undefined);
      res.json(recentNovels);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "An error occurred while fetching recent novels" });
    }
  });

  app.get("/api/novels/search", async (req, res) => {
    try {
      const { query } = req.query;
      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }
      
      const novels = await storage.searchNovels(query as string);
      res.json(novels);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "An error occurred while searching novels" });
    }
  });

  app.get("/api/novels/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const novel = await storage.getNovel(id);
      
      if (!novel) {
        return res.status(404).json({ message: "Novel not found" });
      }
      
      res.json(novel);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "An error occurred while fetching the novel" });
    }
  });

  app.post("/api/novels", ensureAdmin, async (req, res) => {
    try {
      const validatedData = insertNovelSchema.parse(req.body);
      const novel = await storage.createNovel({
        ...validatedData,
        createdBy: req.user.id
      });
      
      res.status(201).json(novel);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error(error);
      res.status(500).json({ message: "An error occurred while creating the novel" });
    }
  });

  app.put("/api/novels/:id", ensureAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const novel = await storage.getNovel(id);
      
      if (!novel) {
        return res.status(404).json({ message: "Novel not found" });
      }
      
      const validatedData = insertNovelSchema.partial().parse(req.body);
      const updatedNovel = await storage.updateNovel(id, validatedData);
      
      res.json(updatedNovel);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error(error);
      res.status(500).json({ message: "An error occurred while updating the novel" });
    }
  });

  app.delete("/api/novels/:id", ensureAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const novel = await storage.getNovel(id);
      
      if (!novel) {
        return res.status(404).json({ message: "Novel not found" });
      }
      
      await storage.deleteNovel(id);
      res.status(204).send();
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "An error occurred while deleting the novel" });
    }
  });

  // ---- Chapter Routes ----
  app.get("/api/novels/:novelId/chapters", async (req, res) => {
    try {
      const novelId = parseInt(req.params.novelId);
      const novel = await storage.getNovel(novelId);
      
      if (!novel) {
        return res.status(404).json({ message: "Novel not found" });
      }
      
      const chapters = await storage.getChapters(novelId);
      res.json(chapters);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "An error occurred while fetching chapters" });
    }
  });

  app.get("/api/chapters/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const chapter = await storage.getChapter(id);
      
      if (!chapter) {
        return res.status(404).json({ message: "Chapter not found" });
      }
      
      res.json(chapter);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "An error occurred while fetching the chapter" });
    }
  });

  app.post("/api/novels/:novelId/chapters", ensureAdmin, async (req, res) => {
    try {
      const novelId = parseInt(req.params.novelId);
      const novel = await storage.getNovel(novelId);
      
      if (!novel) {
        return res.status(404).json({ message: "Novel not found" });
      }
      
      const validatedData = insertChapterSchema.parse({ ...req.body, novelId });
      const chapter = await storage.createChapter(validatedData);
      
      res.status(201).json(chapter);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error(error);
      res.status(500).json({ message: "An error occurred while creating the chapter" });
    }
  });

  app.put("/api/chapters/:id", ensureAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const chapter = await storage.getChapter(id);
      
      if (!chapter) {
        return res.status(404).json({ message: "Chapter not found" });
      }
      
      const validatedData = insertChapterSchema.partial().parse(req.body);
      const updatedChapter = await storage.updateChapter(id, validatedData);
      
      res.json(updatedChapter);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error(error);
      res.status(500).json({ message: "An error occurred while updating the chapter" });
    }
  });

  app.delete("/api/chapters/:id", ensureAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const chapter = await storage.getChapter(id);
      
      if (!chapter) {
        return res.status(404).json({ message: "Chapter not found" });
      }
      
      await storage.deleteChapter(id);
      res.status(204).send();
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "An error occurred while deleting the chapter" });
    }
  });

  // ---- Comment Routes ----
  app.get("/api/novels/:novelId/comments", async (req, res) => {
    try {
      const novelId = parseInt(req.params.novelId);
      const novel = await storage.getNovel(novelId);
      
      if (!novel) {
        return res.status(404).json({ message: "Novel not found" });
      }
      
      const comments = await storage.getComments(novelId);
      res.json(comments);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "An error occurred while fetching comments" });
    }
  });

  app.post("/api/novels/:novelId/comments", ensureAuthenticated, async (req, res) => {
    try {
      const novelId = parseInt(req.params.novelId);
      const novel = await storage.getNovel(novelId);
      
      if (!novel) {
        return res.status(404).json({ message: "Novel not found" });
      }
      
      const validatedData = insertCommentSchema.parse({
        ...req.body,
        novelId,
        userId: req.user.id
      });
      
      const comment = await storage.createComment(validatedData);
      res.status(201).json(comment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error(error);
      res.status(500).json({ message: "An error occurred while creating the comment" });
    }
  });

  app.delete("/api/comments/:id", ensureAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const comment = await storage.comments.get(id);
      
      if (!comment) {
        return res.status(404).json({ message: "Comment not found" });
      }
      
      // Only allow the comment owner or admin to delete
      if (comment.userId !== req.user.id && !req.user.isAdmin) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      await storage.deleteComment(id);
      res.status(204).send();
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "An error occurred while deleting the comment" });
    }
  });

  // ---- Bookmark Routes ----
  app.get("/api/bookmarks", ensureAuthenticated, async (req, res) => {
    try {
      const bookmarks = await storage.getBookmarks(req.user.id);
      res.json(bookmarks);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "An error occurred while fetching bookmarks" });
    }
  });

  app.post("/api/bookmarks", ensureAuthenticated, async (req, res) => {
    try {
      const validatedData = insertBookmarkSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      const bookmark = await storage.createBookmark(validatedData);
      res.status(201).json(bookmark);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error(error);
      res.status(500).json({ message: "An error occurred while creating the bookmark" });
    }
  });

  app.delete("/api/bookmarks/:novelId", ensureAuthenticated, async (req, res) => {
    try {
      const novelId = parseInt(req.params.novelId);
      await storage.deleteBookmark(req.user.id, novelId);
      res.status(204).send();
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "An error occurred while deleting the bookmark" });
    }
  });

  app.get("/api/novels/:novelId/is-bookmarked", ensureAuthenticated, async (req, res) => {
    try {
      const novelId = parseInt(req.params.novelId);
      const isBookmarked = await storage.isBookmarked(req.user.id, novelId);
      res.json({ isBookmarked });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "An error occurred" });
    }
  });

  // ---- Reading History Routes ----
  app.get("/api/reading-history", ensureAuthenticated, async (req, res) => {
    try {
      const history = await storage.getReadingHistory(req.user.id);
      res.json(history);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "An error occurred while fetching reading history" });
    }
  });

  app.post("/api/reading-history", ensureAuthenticated, async (req, res) => {
    try {
      const validatedData = insertReadingHistorySchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      const history = await storage.updateReadingHistory(validatedData);
      res.status(201).json(history);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error(error);
      res.status(500).json({ message: "An error occurred while updating reading history" });
    }
  });

  // ---- Like Routes ----
  app.get("/api/likes", ensureAuthenticated, async (req, res) => {
    try {
      const likes = await storage.getLikes(req.user.id);
      res.json(likes);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "An error occurred while fetching likes" });
    }
  });

  app.post("/api/likes", ensureAuthenticated, async (req, res) => {
    try {
      const validatedData = insertLikeSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      const like = await storage.createLike(validatedData);
      res.status(201).json(like);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error(error);
      res.status(500).json({ message: "An error occurred while creating the like" });
    }
  });

  app.delete("/api/likes/:novelId", ensureAuthenticated, async (req, res) => {
    try {
      const novelId = parseInt(req.params.novelId);
      await storage.deleteLike(req.user.id, novelId);
      res.status(204).send();
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "An error occurred while deleting the like" });
    }
  });

  app.get("/api/novels/:novelId/is-liked", ensureAuthenticated, async (req, res) => {
    try {
      const novelId = parseInt(req.params.novelId);
      const isLiked = await storage.isLiked(req.user.id, novelId);
      res.json({ isLiked });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "An error occurred" });
    }
  });

  // ---- User Settings Routes ----
  app.get("/api/user-settings", ensureAuthenticated, async (req, res) => {
    try {
      const settings = await storage.getUserSettings(req.user.id);
      res.json(settings);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "An error occurred while fetching user settings" });
    }
  });

  app.put("/api/user-settings", ensureAuthenticated, async (req, res) => {
    try {
      const validatedData = insertUserSettingsSchema.partial().parse(req.body);
      const settings = await storage.updateUserSettings(req.user.id, validatedData);
      res.json(settings);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error(error);
      res.status(500).json({ message: "An error occurred while updating user settings" });
    }
  });

  // Create the HTTP server
  const httpServer = createServer(app);

  return httpServer;
}
