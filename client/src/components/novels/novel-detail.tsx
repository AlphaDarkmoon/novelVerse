import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Novel, Chapter, Comment } from "@shared/schema";
import { ChapterList } from "./chapter-list";
import { CommentSection } from "./comment-section";
import { 
  ArrowLeft, 
  Book, 
  Bookmark, 
  BookmarkCheck,
  Heart, 
  HeartCrack,
  User as UserIcon,
  BookOpen,
  Eye,
  Clock
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface NovelDetailProps {
  novelId: number;
}

const NovelDetail = ({ novelId }: NovelDetailProps) => {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  
  // Fetch novel data
  const { data: novel, isLoading: isLoadingNovel } = useQuery<Novel>({
    queryKey: [`/api/novels/${novelId}`],
  });
  
  // Fetch chapters
  const { data: chapters = [], isLoading: isLoadingChapters } = useQuery<Chapter[]>({
    queryKey: [`/api/novels/${novelId}/chapters`],
    enabled: !!novel,
  });
  
  // Fetch comments
  const { data: comments = [], isLoading: isLoadingComments } = useQuery<Comment[]>({
    queryKey: [`/api/novels/${novelId}/comments`],
    enabled: !!novel,
  });
  
  // Fetch bookmark status
  useEffect(() => {
    const fetchBookmarkStatus = async () => {
      if (user) {
        try {
          const res = await fetch(`/api/novels/${novelId}/is-bookmarked`, {
            credentials: 'include',
          });
          if (res.ok) {
            const data = await res.json();
            setIsBookmarked(data.isBookmarked);
          }
        } catch (error) {
          console.error("Error fetching bookmark status:", error);
        }
      }
    };
    
    const fetchLikeStatus = async () => {
      if (user) {
        try {
          const res = await fetch(`/api/novels/${novelId}/is-liked`, {
            credentials: 'include',
          });
          if (res.ok) {
            const data = await res.json();
            setIsLiked(data.isLiked);
          }
        } catch (error) {
          console.error("Error fetching like status:", error);
        }
      }
    };
    
    fetchBookmarkStatus();
    fetchLikeStatus();
  }, [user, novelId]);
  
  // Toggle bookmark mutation
  const bookmarkMutation = useMutation({
    mutationFn: async () => {
      if (isBookmarked) {
        await apiRequest("DELETE", `/api/bookmarks/${novelId}`);
      } else {
        await apiRequest("POST", "/api/bookmarks", { novelId });
      }
    },
    onSuccess: () => {
      setIsBookmarked(!isBookmarked);
      toast({
        title: isBookmarked ? "Removed from bookmarks" : "Added to bookmarks",
        duration: 2000,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${isBookmarked ? "remove from" : "add to"} bookmarks: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Toggle like mutation
  const likeMutation = useMutation({
    mutationFn: async () => {
      if (isLiked) {
        await apiRequest("DELETE", `/api/likes/${novelId}`);
      } else {
        await apiRequest("POST", "/api/likes", { novelId });
      }
    },
    onSuccess: () => {
      setIsLiked(!isLiked);
      // Update the novel's likes count optimistically
      if (novel) {
        queryClient.setQueryData([`/api/novels/${novelId}`], {
          ...novel,
        });
      }
      toast({
        title: isLiked ? "Removed from likes" : "Added to likes",
        duration: 2000,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${isLiked ? "unlike" : "like"} novel: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const handleToggleBookmark = () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to bookmark novels",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }
    
    bookmarkMutation.mutate();
  };
  
  const handleToggleLike = () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to like novels",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }
    
    likeMutation.mutate();
  };
  
  // If loading, show skeleton
  if (isLoadingNovel) {
    return (
      <div className="bg-card rounded-lg shadow-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <Skeleton className="aspect-[2/3] w-full h-auto rounded-lg mb-4" />
            <div className="flex space-x-2 mb-4">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="w-12 h-10" />
              <Skeleton className="w-12 h-10" />
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-16" />
            </div>
          </div>
          <div className="md:col-span-2">
            <Skeleton className="h-10 w-3/4 mb-3" />
            <Skeleton className="h-6 w-40 mb-6" />
            <Skeleton className="h-6 w-full mb-2" />
            <Skeleton className="h-6 w-full mb-2" />
            <Skeleton className="h-6 w-3/4 mb-8" />
            <Skeleton className="h-8 w-48 mb-4" />
            <div className="space-y-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!novel) {
    return (
      <div className="bg-card rounded-lg shadow-lg p-6 text-center">
        <h1 className="text-2xl font-heading font-bold mb-4">Novel not found</h1>
        <p className="text-muted-foreground mb-6">The novel you're looking for doesn't exist or has been removed.</p>
        <Button asChild>
          <Link href="/">Go back to homepage</Link>
        </Button>
      </div>
    );
  }
  
  return (
    <div className="bg-card rounded-lg shadow-lg p-6">
      {/* Back button */}
      <Button variant="ghost" className="flex items-center text-muted-foreground hover:text-foreground mb-6" asChild>
        <Link href="/">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Browse
        </Link>
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Novel cover and actions */}
        <div>
          <div className="aspect-[2/3] relative rounded-lg overflow-hidden shadow-lg mb-4">
            <img 
              src={novel.coverImage || "https://via.placeholder.com/600x900?text=No+Cover"}
              alt={novel.title} 
              className="w-full h-full object-cover"
            />
          </div>
          
          <div className="flex space-x-2 mb-4">
            <Button className="flex-1 flex justify-center items-center" asChild>
              <Link href={chapters.length > 0 ? `/read/${chapters[0]?.id}` : "#"}>
                <BookOpen className="mr-2 h-4 w-4" /> Read
              </Link>
            </Button>
            
            <Button 
              variant={isBookmarked ? "secondary" : "outline"} 
              className={`w-12 flex justify-center items-center ${isBookmarked ? 'text-primary' : ''}`}
              onClick={handleToggleBookmark}
              disabled={bookmarkMutation.isPending}
            >
              {isBookmarked ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
            </Button>
            
            <Button 
              variant={isLiked ? "secondary" : "outline"}
              className={`w-12 flex justify-center items-center ${isLiked ? 'text-red-500' : ''}`}
              onClick={handleToggleLike}
              disabled={likeMutation.isPending}
            >
              {isLiked ? <HeartCrack className="h-4 w-4" /> : <Heart className="h-4 w-4" />}
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="secondary">{novel.genre}</Badge>
            {novel.tags?.map((tag, i) => (
              <Badge key={i} variant="outline">{tag}</Badge>
            ))}
          </div>
          
          <div className="text-sm text-muted-foreground">
            <div className="flex items-center mb-2">
              <UserIcon className="mr-2 h-4 w-4" />
              <span>Author: {novel.author}</span>
            </div>
            <div className="flex items-center mb-2">
              <Book className="mr-2 h-4 w-4" />
              <span>Chapters: {chapters?.length || 0}</span>
            </div>
            <div className="flex items-center mb-2">
              <Eye className="mr-2 h-4 w-4" />
              <span>Reviews: {novel.reviewCount}</span>
            </div>
            <div className="flex items-center mb-2">
              <Heart className="mr-2 h-4 w-4" />
              <span>Rating: {novel.rating.toFixed(1)}/5</span>
            </div>
            <div className="flex items-center">
              <Clock className="mr-2 h-4 w-4" />
              <span>Last updated: {new Date(novel.updatedAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
        
        {/* Novel info and chapters */}
        <div className="md:col-span-2">
          <h1 className="text-3xl font-heading font-bold mb-3">{novel.title}</h1>
          
          <div className="flex items-center mb-6">
            <div className="flex text-yellow-500">
              {Array(Math.floor(novel.rating)).fill(0).map((_, i) => (
                <Heart key={i} className="fill-current h-4 w-4" />
              ))}
              {novel.rating % 1 >= 0.5 && <Heart className="h-4 w-4" />}
            </div>
            <span className="ml-2 text-muted-foreground">
              {novel.rating.toFixed(1)} ({novel.reviewCount} reviews)
            </span>
          </div>
          
          <div className="mb-8">
            <h3 className="text-xl font-heading font-medium mb-3">Synopsis</h3>
            <div className="text-foreground/90 leading-relaxed space-y-4">
              {novel.description.split('\n\n').map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </div>
          
          {/* Chapters */}
          {isLoadingChapters ? (
            <div className="space-y-4 mb-8">
              <div className="flex justify-between">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-8 w-40" />
              </div>
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : (
            <ChapterList chapters={chapters} />
          )}
          
          {/* Comments/Reviews */}
          {isLoadingComments ? (
            <div className="space-y-4">
              <div className="flex justify-between">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-8 w-40" />
              </div>
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : (
            <CommentSection 
              novelId={novel.id} 
              comments={comments} 
              currentUser={user} 
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default NovelDetail;
