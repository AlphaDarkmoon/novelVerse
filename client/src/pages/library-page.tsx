import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { User, Novel, Chapter } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  Bookmark, 
  History, 
  Clock, 
  ChevronRight,
  AlertTriangle
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const LibraryPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("bookmarks");
  
  // Fetch bookmarks
  const { data: bookmarks = [], isLoading: isBookmarksLoading } = useQuery({
    queryKey: ["/api/bookmarks"],
    enabled: !!user,
  });
  
  // Fetch reading history
  const { data: readingHistory = [], isLoading: isReadingHistoryLoading } = useQuery({
    queryKey: ["/api/reading-history"],
    enabled: !!user,
  });
  
  // Fetch liked novels
  const { data: likes = [], isLoading: isLikesLoading } = useQuery({
    queryKey: ["/api/likes"],
    enabled: !!user,
  });
  
  if (!user) {
    return (
      <div className="container py-12">
        <Alert variant="warning">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle>Authentication Required</AlertTitle>
          <AlertDescription>
            You need to sign in to access your library.
            <div className="mt-4">
              <Button asChild>
                <Link href="/auth">Sign In</Link>
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  return (
    <div className="container py-8">
      <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold">My Library</h1>
          <p className="text-muted-foreground">
            Manage your reading collection and history
          </p>
        </div>
        
        <Card className="w-full md:w-auto">
          <CardContent className="p-4">
            <div className="flex items-center">
              <Avatar className="h-10 w-10 mr-4">
                <AvatarImage src={user.avatar || ""} alt={user.username} />
                <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{user.username}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="bookmarks">
            <Bookmark className="h-4 w-4 mr-2" />
            Bookmarks
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="h-4 w-4 mr-2" />
            Reading History
          </TabsTrigger>
          <TabsTrigger value="likes">
            <BookOpen className="h-4 w-4 mr-2" />
            Liked Novels
          </TabsTrigger>
        </TabsList>
        
        {/* Bookmarks */}
        <TabsContent value="bookmarks">
          <Card>
            <CardHeader>
              <CardTitle>My Bookmarks</CardTitle>
              <CardDescription>
                Continue reading your bookmarked novels
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isBookmarksLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-16 w-12 rounded" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-2/3" />
                        <Skeleton className="h-3 w-1/3" />
                      </div>
                      <Skeleton className="h-9 w-24" />
                    </div>
                  ))}
                </div>
              ) : bookmarks.length > 0 ? (
                <div className="divide-y">
                  {bookmarks.map((bookmark: any) => (
                    <div key={bookmark.id} className="py-4 flex items-center gap-4">
                      <div className="aspect-[2/3] h-16 relative rounded overflow-hidden">
                        <img
                          src={bookmark.novel.coverImage || "https://via.placeholder.com/120x180?text=No+Cover"}
                          alt={bookmark.novel.title}
                          className="object-cover w-full h-full"
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">{bookmark.novel.title}</h3>
                        <div className="flex items-center mt-1 text-sm text-muted-foreground">
                          <Badge variant="outline" className="mr-2">
                            {bookmark.novel.genre}
                          </Badge>
                          <span>by {bookmark.novel.author}</span>
                        </div>
                        {bookmark.chapterId && (
                          <p className="text-sm text-muted-foreground mt-1">
                            <Clock className="inline-block h-3 w-3 mr-1" />
                            Bookmarked Chapter #{
                              bookmark.chapter?.chapterNumber || 
                              "Unknown"
                            }
                          </p>
                        )}
                      </div>
                      <Button asChild>
                        <Link 
                          href={bookmark.chapterId 
                            ? `/read/${bookmark.chapterId}` 
                            : `/novel/${bookmark.novelId}`
                          }
                        >
                          Continue
                          <ChevronRight className="ml-1 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Bookmark className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <h3 className="font-medium text-lg mb-1">No bookmarks yet</h3>
                  <p>Bookmark novels or chapters to continue reading them later.</p>
                  <Button className="mt-4" asChild>
                    <Link href="/">Browse Novels</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Reading History */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Reading History</CardTitle>
              <CardDescription>
                Your recent reading activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isReadingHistoryLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-16 w-12 rounded" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-2/3" />
                        <Skeleton className="h-3 w-1/3" />
                        <Skeleton className="h-2 w-full" />
                      </div>
                      <Skeleton className="h-9 w-24" />
                    </div>
                  ))}
                </div>
              ) : readingHistory.length > 0 ? (
                <div className="divide-y">
                  {readingHistory.map((history: any) => (
                    <div key={history.id} className="py-4 flex items-center gap-4">
                      <div className="aspect-[2/3] h-16 relative rounded overflow-hidden">
                        <img
                          src={history.novel.coverImage || "https://via.placeholder.com/120x180?text=No+Cover"}
                          alt={history.novel.title}
                          className="object-cover w-full h-full"
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">{history.novel.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          Chapter {history.chapter.chapterNumber}: {history.chapter.title}
                        </p>
                        
                        {/* Progress bar */}
                        <div className="mt-2 h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary" 
                            style={{ width: `${history.progress}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          <Clock className="inline-block h-3 w-3 mr-1" />
                          Last read: {new Date(history.lastRead).toLocaleDateString()}
                        </p>
                      </div>
                      <Button asChild>
                        <Link href={`/read/${history.chapterId}`}>
                          Continue
                          <ChevronRight className="ml-1 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <h3 className="font-medium text-lg mb-1">No reading history</h3>
                  <p>Your reading activity will appear here once you start reading novels.</p>
                  <Button className="mt-4" asChild>
                    <Link href="/">Browse Novels</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Liked Novels */}
        <TabsContent value="likes">
          <Card>
            <CardHeader>
              <CardTitle>Liked Novels</CardTitle>
              <CardDescription>
                Novels you've liked
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLikesLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-16 w-12 rounded" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-2/3" />
                        <Skeleton className="h-3 w-1/3" />
                      </div>
                      <Skeleton className="h-9 w-24" />
                    </div>
                  ))}
                </div>
              ) : likes.length > 0 ? (
                <div className="divide-y">
                  {likes.map((like: any) => (
                    <div key={like.id} className="py-4 flex items-center gap-4">
                      <div className="aspect-[2/3] h-16 relative rounded overflow-hidden">
                        <img
                          src={like.novel.coverImage || "https://via.placeholder.com/120x180?text=No+Cover"}
                          alt={like.novel.title}
                          className="object-cover w-full h-full"
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">{like.novel.title}</h3>
                        <div className="flex items-center mt-1 text-sm text-muted-foreground">
                          <Badge variant="outline" className="mr-2">
                            {like.novel.genre}
                          </Badge>
                          <span>by {like.novel.author}</span>
                        </div>
                        <div className="flex text-yellow-500 text-sm mt-1">
                          {Array(5).fill(0).map((_, i) => (
                            <svg
                              key={i}
                              className={`h-4 w-4 ${i < like.novel.rating ? 'fill-current' : 'text-gray-300 dark:text-gray-600'}`}
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                            >
                              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                            </svg>
                          ))}
                          <span className="ml-1 text-muted-foreground">
                            {like.novel.rating.toFixed(1)}
                          </span>
                        </div>
                      </div>
                      <Button asChild>
                        <Link href={`/novel/${like.novelId}`}>
                          View
                          <ChevronRight className="ml-1 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <h3 className="font-medium text-lg mb-1">No liked novels</h3>
                  <p>Novels you like will appear here.</p>
                  <Button className="mt-4" asChild>
                    <Link href="/">Browse Novels</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LibraryPage;
