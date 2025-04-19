import { 
  User, InsertUser, Novel, InsertNovel, Chapter, InsertChapter,
  Comment, InsertComment, Bookmark, InsertBookmark,
  ReadingHistory, InsertReadingHistory, Like, InsertLike,
  UserSettings, InsertUserSettings
} from "@shared/schema";
import { 
  users, novels, chapters, comments, bookmarks, readingHistory, 
  likes, userSettings 
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, like, sql, or } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";
import { IStorage } from "./storage";

const PostgresSessionStore = connectPg(session);

export class DatabaseStorage implements IStorage {
  public sessionStore: session.SessionStore;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  // Novel methods
  async getNovels(options: { limit?: number, offset?: number, genre?: string } = {}): Promise<Novel[]> {
    let query = db.select().from(novels);
    
    if (options.genre) {
      query = query.where(eq(novels.genre, options.genre));
    }
    
    query = query.orderBy(desc(novels.createdAt));
    
    if (options.limit) {
      query = query.limit(options.limit);
    }
    
    if (options.offset) {
      query = query.offset(options.offset);
    }
    
    return await query;
  }

  async getNovel(id: number): Promise<Novel | undefined> {
    const [novel] = await db.select().from(novels).where(eq(novels.id, id));
    return novel;
  }

  async getFeaturedNovels(limit: number = 4): Promise<Novel[]> {
    return await db
      .select()
      .from(novels)
      .where(eq(novels.isFeatured, true))
      .orderBy(desc(novels.createdAt))
      .limit(limit);
  }

  async getTrendingNovels(limit: number = 4): Promise<Novel[]> {
    return await db
      .select()
      .from(novels)
      .where(eq(novels.isTrending, true))
      .orderBy(desc(novels.createdAt))
      .limit(limit);
  }

  async getRecentNovels(limit: number = 4): Promise<Novel[]> {
    return await db
      .select()
      .from(novels)
      .orderBy(desc(novels.createdAt))
      .limit(limit);
  }

  async createNovel(novel: InsertNovel): Promise<Novel> {
    const [newNovel] = await db.insert(novels).values(novel).returning();
    return newNovel;
  }

  async updateNovel(id: number, novelData: Partial<Novel>): Promise<Novel | undefined> {
    const [updatedNovel] = await db
      .update(novels)
      .set(novelData)
      .where(eq(novels.id, id))
      .returning();
    return updatedNovel;
  }

  async deleteNovel(id: number): Promise<boolean> {
    // First delete all associated data
    await db.delete(chapters).where(eq(chapters.novelId, id));
    await db.delete(comments).where(eq(comments.novelId, id));
    await db.delete(bookmarks).where(eq(bookmarks.novelId, id));
    await db.delete(likes).where(eq(likes.novelId, id));
    await db.delete(readingHistory).where(eq(readingHistory.novelId, id));
    
    // Then delete the novel
    const result = await db.delete(novels).where(eq(novels.id, id)).returning();
    return result.length > 0;
  }

  async searchNovels(query: string): Promise<Novel[]> {
    return await db
      .select()
      .from(novels)
      .where(
        or(
          like(novels.title, `%${query}%`),
          like(novels.description, `%${query}%`),
          like(novels.author, `%${query}%`)
        )
      )
      .orderBy(desc(novels.createdAt));
  }

  // Chapter methods
  async getChapters(novelId: number): Promise<Chapter[]> {
    return await db
      .select()
      .from(chapters)
      .where(eq(chapters.novelId, novelId))
      .orderBy(asc(chapters.chapterNumber));
  }

  async getChapter(id: number): Promise<Chapter | undefined> {
    const [chapter] = await db.select().from(chapters).where(eq(chapters.id, id));
    return chapter;
  }

  async createChapter(chapter: InsertChapter): Promise<Chapter> {
    const [newChapter] = await db.insert(chapters).values(chapter).returning();
    return newChapter;
  }

  async updateChapter(id: number, chapterData: Partial<Chapter>): Promise<Chapter | undefined> {
    const [updatedChapter] = await db
      .update(chapters)
      .set(chapterData)
      .where(eq(chapters.id, id))
      .returning();
    return updatedChapter;
  }

  async deleteChapter(id: number): Promise<boolean> {
    // Delete associated reading history records
    await db.delete(readingHistory).where(eq(readingHistory.chapterId, id));
    
    // Delete comments for this chapter
    await db.delete(comments).where(eq(comments.chapterId, id));
    
    // Then delete the chapter
    const result = await db.delete(chapters).where(eq(chapters.id, id)).returning();
    return result.length > 0;
  }

  // Comment methods
  async getComments(novelId: number): Promise<Comment[]> {
    return await db
      .select()
      .from(comments)
      .where(eq(comments.novelId, novelId))
      .orderBy(desc(comments.createdAt));
  }

  async createComment(comment: InsertComment): Promise<Comment> {
    const [newComment] = await db.insert(comments).values(comment).returning();
    return newComment;
  }

  async deleteComment(id: number): Promise<boolean> {
    const result = await db.delete(comments).where(eq(comments.id, id)).returning();
    return result.length > 0;
  }

  // Bookmark methods
  async getBookmarks(userId: number): Promise<(Bookmark & { novel: Novel })[]> {
    const bookmarkRecords = await db
      .select()
      .from(bookmarks)
      .where(eq(bookmarks.userId, userId))
      .orderBy(desc(bookmarks.createdAt));
    
    const bookmarksWithNovels = await Promise.all(
      bookmarkRecords.map(async (bookmark) => {
        const novel = await this.getNovel(bookmark.novelId);
        return { ...bookmark, novel: novel! };
      })
    );
    
    return bookmarksWithNovels;
  }

  async createBookmark(bookmark: InsertBookmark): Promise<Bookmark> {
    // Check if bookmark already exists
    const existing = await db
      .select()
      .from(bookmarks)
      .where(
        and(
          eq(bookmarks.userId, bookmark.userId),
          eq(bookmarks.novelId, bookmark.novelId)
        )
      );
    
    if (existing.length > 0) {
      return existing[0];
    }
    
    const [newBookmark] = await db.insert(bookmarks).values(bookmark).returning();
    return newBookmark;
  }

  async deleteBookmark(userId: number, novelId: number): Promise<boolean> {
    const result = await db
      .delete(bookmarks)
      .where(
        and(
          eq(bookmarks.userId, userId),
          eq(bookmarks.novelId, novelId)
        )
      )
      .returning();
    return result.length > 0;
  }

  async isBookmarked(userId: number, novelId: number): Promise<boolean> {
    const result = await db
      .select()
      .from(bookmarks)
      .where(
        and(
          eq(bookmarks.userId, userId),
          eq(bookmarks.novelId, novelId)
        )
      );
    return result.length > 0;
  }

  // Reading History methods
  async getReadingHistory(userId: number): Promise<(ReadingHistory & { novel: Novel, chapter: Chapter })[]> {
    const historyRecords = await db
      .select()
      .from(readingHistory)
      .where(eq(readingHistory.userId, userId))
      .orderBy(desc(readingHistory.updatedAt));
    
    const historyWithDetails = await Promise.all(
      historyRecords.map(async (history) => {
        const novel = await this.getNovel(history.novelId);
        const chapter = await this.getChapter(history.chapterId);
        return { ...history, novel: novel!, chapter: chapter! };
      })
    );
    
    return historyWithDetails;
  }

  async updateReadingHistory(history: InsertReadingHistory): Promise<ReadingHistory> {
    // Check if history entry already exists
    const existing = await db
      .select()
      .from(readingHistory)
      .where(
        and(
          eq(readingHistory.userId, history.userId),
          eq(readingHistory.novelId, history.novelId),
          eq(readingHistory.chapterId, history.chapterId)
        )
      );
    
    if (existing.length > 0) {
      const id = existing[0].id;
      const [updatedHistory] = await db
        .update(readingHistory)
        .set({
          progress: history.progress,
          updatedAt: new Date()
        })
        .where(eq(readingHistory.id, id))
        .returning();
      return updatedHistory;
    }
    
    const [newHistory] = await db.insert(readingHistory).values(history).returning();
    return newHistory;
  }

  // Like methods
  async getLikes(userId: number): Promise<(Like & { novel: Novel })[]> {
    const likeRecords = await db
      .select()
      .from(likes)
      .where(eq(likes.userId, userId))
      .orderBy(desc(likes.createdAt));
    
    const likesWithNovels = await Promise.all(
      likeRecords.map(async (like) => {
        const novel = await this.getNovel(like.novelId);
        return { ...like, novel: novel! };
      })
    );
    
    return likesWithNovels;
  }

  async createLike(like: InsertLike): Promise<Like> {
    // Check if like already exists
    const existing = await db
      .select()
      .from(likes)
      .where(
        and(
          eq(likes.userId, like.userId),
          eq(likes.novelId, like.novelId)
        )
      );
    
    if (existing.length > 0) {
      return existing[0];
    }
    
    const [newLike] = await db.insert(likes).values(like).returning();
    
    // Update novel's like count
    const novel = await this.getNovel(like.novelId);
    if (novel) {
      await this.updateNovel(novel.id, { likes: (novel.likes || 0) + 1 });
    }
    
    return newLike;
  }

  async deleteLike(userId: number, novelId: number): Promise<boolean> {
    const result = await db
      .delete(likes)
      .where(
        and(
          eq(likes.userId, userId),
          eq(likes.novelId, novelId)
        )
      )
      .returning();
      
    // Update novel's like count if the like was deleted
    if (result.length > 0) {
      const novel = await this.getNovel(novelId);
      if (novel && novel.likes && novel.likes > 0) {
        await this.updateNovel(novel.id, { likes: novel.likes - 1 });
      }
    }
    
    return result.length > 0;
  }

  async isLiked(userId: number, novelId: number): Promise<boolean> {
    const result = await db
      .select()
      .from(likes)
      .where(
        and(
          eq(likes.userId, userId),
          eq(likes.novelId, novelId)
        )
      );
    return result.length > 0;
  }

  // User Settings methods
  async getUserSettings(userId: number): Promise<UserSettings | undefined> {
    const [settings] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId));
    return settings;
  }

  async updateUserSettings(userId: number, settings: Partial<UserSettings>): Promise<UserSettings> {
    const existing = await this.getUserSettings(userId);
    
    if (existing) {
      const [updatedSettings] = await db
        .update(userSettings)
        .set(settings)
        .where(eq(userSettings.userId, userId))
        .returning();
      return updatedSettings;
    }
    
    const [newSettings] = await db
      .insert(userSettings)
      .values({
        userId,
        ...settings,
      } as any)
      .returning();
    return newSettings;
  }
}