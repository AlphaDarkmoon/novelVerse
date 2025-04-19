import { users, novels, chapters, comments, bookmarks, readingHistory, likes, userSettings, genreEnum } from "@shared/schema";
import type {
  User, InsertUser, Novel, InsertNovel, Chapter, InsertChapter,
  Comment, InsertComment, Bookmark, InsertBookmark,
  ReadingHistory, InsertReadingHistory, Like, InsertLike,
  UserSettings, InsertUserSettings
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// Interface for storage methods
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  
  // Novel methods
  getNovels(options?: { limit?: number, offset?: number, genre?: string }): Promise<Novel[]>;
  getNovel(id: number): Promise<Novel | undefined>;
  getFeaturedNovels(limit?: number): Promise<Novel[]>;
  getTrendingNovels(limit?: number): Promise<Novel[]>;
  getRecentNovels(limit?: number): Promise<Novel[]>;
  createNovel(novel: InsertNovel): Promise<Novel>;
  updateNovel(id: number, novel: Partial<Novel>): Promise<Novel | undefined>;
  deleteNovel(id: number): Promise<boolean>;
  searchNovels(query: string): Promise<Novel[]>;
  
  // Chapter methods
  getChapters(novelId: number): Promise<Chapter[]>;
  getChapter(id: number): Promise<Chapter | undefined>;
  createChapter(chapter: InsertChapter): Promise<Chapter>;
  updateChapter(id: number, chapter: Partial<Chapter>): Promise<Chapter | undefined>;
  deleteChapter(id: number): Promise<boolean>;
  
  // Comment methods
  getComments(novelId: number): Promise<Comment[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  deleteComment(id: number): Promise<boolean>;
  
  // Bookmark methods
  getBookmarks(userId: number): Promise<(Bookmark & { novel: Novel })[]>;
  createBookmark(bookmark: InsertBookmark): Promise<Bookmark>;
  deleteBookmark(userId: number, novelId: number): Promise<boolean>;
  isBookmarked(userId: number, novelId: number): Promise<boolean>;
  
  // Reading History methods
  getReadingHistory(userId: number): Promise<(ReadingHistory & { novel: Novel, chapter: Chapter })[]>;
  updateReadingHistory(history: InsertReadingHistory): Promise<ReadingHistory>;
  
  // Like methods
  getLikes(userId: number): Promise<(Like & { novel: Novel })[]>;
  createLike(like: InsertLike): Promise<Like>;
  deleteLike(userId: number, novelId: number): Promise<boolean>;
  isLiked(userId: number, novelId: number): Promise<boolean>;
  
  // User Settings methods
  getUserSettings(userId: number): Promise<UserSettings | undefined>;
  updateUserSettings(userId: number, settings: Partial<UserSettings>): Promise<UserSettings>;
  
  // Session store
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private novels: Map<number, Novel>;
  private chapters: Map<number, Chapter>;
  private comments: Map<number, Comment>;
  private bookmarks: Map<number, Bookmark>;
  private readingHistories: Map<number, ReadingHistory>;
  private likes: Map<number, Like>;
  private userSettings: Map<number, UserSettings>;
  
  private userIdCounter: number;
  private novelIdCounter: number;
  private chapterIdCounter: number;
  private commentIdCounter: number;
  private bookmarkIdCounter: number;
  private readingHistoryIdCounter: number;
  private likeIdCounter: number;
  private userSettingsIdCounter: number;
  
  public sessionStore: session.SessionStore;

  constructor() {
    this.users = new Map();
    this.novels = new Map();
    this.chapters = new Map();
    this.comments = new Map();
    this.bookmarks = new Map();
    this.readingHistories = new Map();
    this.likes = new Map();
    this.userSettings = new Map();
    
    this.userIdCounter = 1;
    this.novelIdCounter = 1;
    this.chapterIdCounter = 1;
    this.commentIdCounter = 1;
    this.bookmarkIdCounter = 1;
    this.readingHistoryIdCounter = 1;
    this.likeIdCounter = 1;
    this.userSettingsIdCounter = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
    
    // Initialize with sample data
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Sample genres and tags
    const genres = ['Fantasy', 'Science Fiction', 'Romance', 'Mystery', 'Horror', 'Historical', 'Adventure'];
    const tagsList = [
      ['magic', 'medieval', 'dragons'],
      ['space', 'future', 'technology'],
      ['love', 'relationships', 'drama'],
      ['detective', 'crime', 'suspense'],
      ['supernatural', 'fear', 'monsters'],
      ['history', 'war', 'politics'],
      ['action', 'travel', 'quest']
    ];
    
    // Create admin user
    this.createUser({
      username: 'admin',
      password: 'admin123',
      email: 'admin@novelverse.com',
      isAdmin: true
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    const newUser: User = {
      ...user,
      id,
      createdAt: now
    };
    
    this.users.set(id, newUser);
    
    // Create default user settings
    this.updateUserSettings(id, {
      userId: id,
      theme: 'dark',
      fontSize: 18,
      fontFamily: 'serif',
      lineSpacing: 150,
      backgroundColor: 'dark'
    });
    
    return newUser;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    
    return updatedUser;
  }

  // Novel methods
  async getNovels(options: { limit?: number, offset?: number, genre?: string } = {}): Promise<Novel[]> {
    let novels = Array.from(this.novels.values());
    
    // Filter by genre if provided
    if (options.genre) {
      novels = novels.filter(novel => novel.genre === options.genre);
    }
    
    // Sort by most recent first
    novels.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    
    // Apply pagination
    if (options.offset !== undefined || options.limit !== undefined) {
      const offset = options.offset || 0;
      const limit = options.limit || novels.length;
      novels = novels.slice(offset, offset + limit);
    }
    
    return novels;
  }

  async getNovel(id: number): Promise<Novel | undefined> {
    return this.novels.get(id);
  }

  async getFeaturedNovels(limit: number = 4): Promise<Novel[]> {
    const novels = Array.from(this.novels.values())
      .filter(novel => novel.isFeatured)
      .sort((a, b) => b.rating - a.rating);
    
    return novels.slice(0, limit);
  }

  async getTrendingNovels(limit: number = 4): Promise<Novel[]> {
    const novels = Array.from(this.novels.values())
      .filter(novel => novel.isTrending)
      .sort((a, b) => b.rating - a.rating);
    
    return novels.slice(0, limit);
  }

  async getRecentNovels(limit: number = 4): Promise<Novel[]> {
    const novels = Array.from(this.novels.values())
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    
    return novels.slice(0, limit);
  }

  async createNovel(novel: InsertNovel): Promise<Novel> {
    const id = this.novelIdCounter++;
    const now = new Date();
    const newNovel: Novel = {
      ...novel,
      id,
      rating: 0,
      reviewCount: 0,
      isFeatured: false,
      isTrending: false,
      createdAt: now,
      updatedAt: now
    };
    
    this.novels.set(id, newNovel);
    return newNovel;
  }

  async updateNovel(id: number, novelData: Partial<Novel>): Promise<Novel | undefined> {
    const novel = await this.getNovel(id);
    if (!novel) return undefined;
    
    const updatedNovel = { 
      ...novel, 
      ...novelData,
      updatedAt: new Date()
    };
    
    this.novels.set(id, updatedNovel);
    return updatedNovel;
  }

  async deleteNovel(id: number): Promise<boolean> {
    const novel = await this.getNovel(id);
    if (!novel) return false;
    
    // Delete all related data
    const chaptersToDelete = Array.from(this.chapters.values())
      .filter(chapter => chapter.novelId === id);
    
    for (const chapter of chaptersToDelete) {
      await this.deleteChapter(chapter.id);
    }
    
    // Delete comments
    const commentsToDelete = Array.from(this.comments.values())
      .filter(comment => comment.novelId === id);
    
    for (const comment of commentsToDelete) {
      await this.deleteComment(comment.id);
    }
    
    // Delete bookmarks
    const bookmarksToDelete = Array.from(this.bookmarks.values())
      .filter(bookmark => bookmark.novelId === id);
    
    for (const bookmark of bookmarksToDelete) {
      await this.deleteBookmark(bookmark.userId, bookmark.novelId);
    }
    
    // Delete reading history
    const historyToDelete = Array.from(this.readingHistories.values())
      .filter(history => history.novelId === id);
    
    for (const history of historyToDelete) {
      this.readingHistories.delete(history.id);
    }
    
    // Delete likes
    const likesToDelete = Array.from(this.likes.values())
      .filter(like => like.novelId === id);
    
    for (const like of likesToDelete) {
      await this.deleteLike(like.userId, like.novelId);
    }
    
    return this.novels.delete(id);
  }

  async searchNovels(query: string): Promise<Novel[]> {
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.novels.values()).filter(novel => {
      return (
        novel.title.toLowerCase().includes(lowercaseQuery) ||
        novel.author.toLowerCase().includes(lowercaseQuery) ||
        novel.description.toLowerCase().includes(lowercaseQuery) ||
        novel.genre.toLowerCase().includes(lowercaseQuery) ||
        (novel.tags?.some(tag => tag.toLowerCase().includes(lowercaseQuery)) ?? false)
      );
    });
  }

  // Chapter methods
  async getChapters(novelId: number): Promise<Chapter[]> {
    return Array.from(this.chapters.values())
      .filter(chapter => chapter.novelId === novelId)
      .sort((a, b) => a.chapterNumber - b.chapterNumber);
  }

  async getChapter(id: number): Promise<Chapter | undefined> {
    return this.chapters.get(id);
  }

  async createChapter(chapter: InsertChapter): Promise<Chapter> {
    const id = this.chapterIdCounter++;
    const now = new Date();
    const newChapter: Chapter = {
      ...chapter,
      id,
      createdAt: now,
      updatedAt: now
    };
    
    this.chapters.set(id, newChapter);
    
    // Update novel's updatedAt time
    await this.updateNovel(chapter.novelId, { updatedAt: now });
    
    return newChapter;
  }

  async updateChapter(id: number, chapterData: Partial<Chapter>): Promise<Chapter | undefined> {
    const chapter = await this.getChapter(id);
    if (!chapter) return undefined;
    
    const now = new Date();
    const updatedChapter = { 
      ...chapter, 
      ...chapterData,
      updatedAt: now
    };
    
    this.chapters.set(id, updatedChapter);
    
    // Update novel's updatedAt time
    await this.updateNovel(chapter.novelId, { updatedAt: now });
    
    return updatedChapter;
  }

  async deleteChapter(id: number): Promise<boolean> {
    const chapter = await this.getChapter(id);
    if (!chapter) return false;
    
    // Delete related bookmarks
    const bookmarksToUpdate = Array.from(this.bookmarks.values())
      .filter(bookmark => bookmark.chapterId === id);
    
    for (const bookmark of bookmarksToUpdate) {
      // If it's the only bookmark for the novel, delete it
      // Otherwise, set chapterId to null
      await this.deleteBookmark(bookmark.userId, bookmark.novelId);
    }
    
    // Delete related reading history
    const historyToDelete = Array.from(this.readingHistories.values())
      .filter(history => history.chapterId === id);
    
    for (const history of historyToDelete) {
      this.readingHistories.delete(history.id);
    }
    
    // Update novel's updatedAt time
    await this.updateNovel(chapter.novelId, { updatedAt: new Date() });
    
    return this.chapters.delete(id);
  }

  // Comment methods
  async getComments(novelId: number): Promise<Comment[]> {
    return Array.from(this.comments.values())
      .filter(comment => comment.novelId === novelId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createComment(comment: InsertComment): Promise<Comment> {
    const id = this.commentIdCounter++;
    const now = new Date();
    const newComment: Comment = {
      ...comment,
      id,
      createdAt: now
    };
    
    this.comments.set(id, newComment);
    
    // Update novel rating
    await this.updateNovelRating(comment.novelId);
    
    return newComment;
  }

  async deleteComment(id: number): Promise<boolean> {
    const comment = await this.comments.get(id);
    if (!comment) return false;
    
    const result = this.comments.delete(id);
    
    // Update novel rating
    if (result) {
      await this.updateNovelRating(comment.novelId);
    }
    
    return result;
  }

  private async updateNovelRating(novelId: number): Promise<void> {
    const novel = await this.getNovel(novelId);
    if (!novel) return;
    
    const comments = await this.getComments(novelId);
    const ratings = comments.map(comment => comment.rating).filter(rating => rating > 0);
    
    let newRating = 0;
    if (ratings.length > 0) {
      newRating = Math.round(ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length);
    }
    
    await this.updateNovel(novelId, { 
      rating: newRating,
      reviewCount: comments.length
    });
  }

  // Bookmark methods
  async getBookmarks(userId: number): Promise<(Bookmark & { novel: Novel })[]> {
    const bookmarks = Array.from(this.bookmarks.values())
      .filter(bookmark => bookmark.userId === userId);
    
    return bookmarks.map(bookmark => {
      const novel = this.novels.get(bookmark.novelId)!;
      return { ...bookmark, novel };
    });
  }

  async createBookmark(bookmark: InsertBookmark): Promise<Bookmark> {
    // First check if the bookmark already exists
    const existing = Array.from(this.bookmarks.values()).find(
      b => b.userId === bookmark.userId && b.novelId === bookmark.novelId
    );
    
    if (existing) {
      // Update the existing bookmark
      existing.chapterId = bookmark.chapterId;
      return existing;
    }
    
    const id = this.bookmarkIdCounter++;
    const now = new Date();
    const newBookmark: Bookmark = {
      ...bookmark,
      id,
      createdAt: now
    };
    
    this.bookmarks.set(id, newBookmark);
    return newBookmark;
  }

  async deleteBookmark(userId: number, novelId: number): Promise<boolean> {
    const bookmark = Array.from(this.bookmarks.values()).find(
      b => b.userId === userId && b.novelId === novelId
    );
    
    if (!bookmark) return false;
    return this.bookmarks.delete(bookmark.id);
  }

  async isBookmarked(userId: number, novelId: number): Promise<boolean> {
    return Array.from(this.bookmarks.values()).some(
      bookmark => bookmark.userId === userId && bookmark.novelId === novelId
    );
  }

  // Reading History methods
  async getReadingHistory(userId: number): Promise<(ReadingHistory & { novel: Novel, chapter: Chapter })[]> {
    const histories = Array.from(this.readingHistories.values())
      .filter(history => history.userId === userId)
      .sort((a, b) => new Date(b.lastRead).getTime() - new Date(a.lastRead).getTime());
    
    return histories.map(history => {
      const novel = this.novels.get(history.novelId)!;
      const chapter = this.chapters.get(history.chapterId)!;
      return { ...history, novel, chapter };
    });
  }

  async updateReadingHistory(history: InsertReadingHistory): Promise<ReadingHistory> {
    // Check if an entry already exists
    const existing = Array.from(this.readingHistories.values()).find(
      h => h.userId === history.userId && h.novelId === history.novelId && h.chapterId === history.chapterId
    );
    
    if (existing) {
      // Update existing entry
      const updatedHistory: ReadingHistory = {
        ...existing,
        progress: history.progress,
        lastRead: new Date()
      };
      
      this.readingHistories.set(existing.id, updatedHistory);
      return updatedHistory;
    }
    
    // Create new entry
    const id = this.readingHistoryIdCounter++;
    const newHistory: ReadingHistory = {
      ...history,
      id,
      lastRead: new Date()
    };
    
    this.readingHistories.set(id, newHistory);
    return newHistory;
  }

  // Like methods
  async getLikes(userId: number): Promise<(Like & { novel: Novel })[]> {
    const likes = Array.from(this.likes.values())
      .filter(like => like.userId === userId);
    
    return likes.map(like => {
      const novel = this.novels.get(like.novelId)!;
      return { ...like, novel };
    });
  }

  async createLike(like: InsertLike): Promise<Like> {
    // Check if already liked
    const existing = Array.from(this.likes.values()).find(
      l => l.userId === like.userId && l.novelId === like.novelId
    );
    
    if (existing) {
      return existing;
    }
    
    const id = this.likeIdCounter++;
    const now = new Date();
    const newLike: Like = {
      ...like,
      id,
      createdAt: now
    };
    
    this.likes.set(id, newLike);
    return newLike;
  }

  async deleteLike(userId: number, novelId: number): Promise<boolean> {
    const like = Array.from(this.likes.values()).find(
      l => l.userId === userId && l.novelId === novelId
    );
    
    if (!like) return false;
    return this.likes.delete(like.id);
  }

  async isLiked(userId: number, novelId: number): Promise<boolean> {
    return Array.from(this.likes.values()).some(
      like => like.userId === userId && like.novelId === novelId
    );
  }

  // User Settings methods
  async getUserSettings(userId: number): Promise<UserSettings | undefined> {
    return Array.from(this.userSettings.values()).find(
      settings => settings.userId === userId
    );
  }

  async updateUserSettings(userId: number, settings: Partial<UserSettings>): Promise<UserSettings> {
    const existing = await this.getUserSettings(userId);
    
    if (existing) {
      const updatedSettings: UserSettings = {
        ...existing,
        ...settings
      };
      
      this.userSettings.set(existing.id, updatedSettings);
      return updatedSettings;
    }
    
    const id = this.userSettingsIdCounter++;
    const newSettings: UserSettings = {
      id,
      userId,
      theme: settings.theme || 'dark',
      fontSize: settings.fontSize || 18,
      fontFamily: settings.fontFamily || 'serif',
      lineSpacing: settings.lineSpacing || 150,
      backgroundColor: settings.backgroundColor || 'dark'
    };
    
    this.userSettings.set(id, newSettings);
    return newSettings;
  }
}

import { DatabaseStorage } from "./database-storage";

// Uncomment to use database storage instead of memory storage
export const storage = new DatabaseStorage();
// export const storage = new MemStorage();
