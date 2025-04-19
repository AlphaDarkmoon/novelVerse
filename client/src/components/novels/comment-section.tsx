import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Comment, User } from "@shared/schema";
import { Star, StarHalf, Trash2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CommentSectionProps {
  novelId: number;
  comments: Comment[];
  currentUser: User | null;
}

const CommentSection = ({ novelId, comments, currentUser }: CommentSectionProps) => {
  const { toast } = useToast();
  const [content, setContent] = useState("");
  const [rating, setRating] = useState<number>(5);
  const [showAllComments, setShowAllComments] = useState(false);
  
  // Sort comments by most recent
  const sortedComments = [...comments].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  
  // Show only first 3 comments if not expanded
  const displayedComments = showAllComments ? sortedComments : sortedComments.slice(0, 3);
  
  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/novels/${novelId}/comments`, {
        content,
        rating,
      });
      return await res.json();
    },
    onSuccess: () => {
      setContent("");
      queryClient.invalidateQueries({ queryKey: [`/api/novels/${novelId}/comments`] });
      queryClient.invalidateQueries({ queryKey: [`/api/novels/${novelId}`] });
      toast({
        title: "Comment added",
        description: "Your review has been posted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to post comment: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: number) => {
      await apiRequest("DELETE", `/api/comments/${commentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/novels/${novelId}/comments`] });
      queryClient.invalidateQueries({ queryKey: [`/api/novels/${novelId}`] });
      toast({
        title: "Comment deleted",
        description: "Your review has been removed.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete comment: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      toast({
        title: "Error",
        description: "Please enter a comment",
        variant: "destructive",
      });
      return;
    }
    
    if (!currentUser) {
      toast({
        title: "Authentication required",
        description: "Please sign in to post a review",
        variant: "destructive",
      });
      return;
    }
    
    addCommentMutation.mutate();
  };
  
  const handleDeleteComment = (commentId: number) => {
    if (confirm("Are you sure you want to delete this comment?")) {
      deleteCommentMutation.mutate(commentId);
    }
  };
  
  // Format date to relative time (e.g., "2 days ago")
  const getRelativeTime = (date: string | Date) => {
    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
    const now = new Date();
    const commentDate = typeof date === 'string' ? new Date(date) : date;
    const diffInMs = commentDate.getTime() - now.getTime();
    
    const diffInDays = Math.round(diffInMs / (1000 * 60 * 60 * 24));
    const diffInHours = Math.round(diffInMs / (1000 * 60 * 60));
    const diffInMinutes = Math.round(diffInMs / (1000 * 60));
    
    if (diffInDays < -30) {
      return commentDate.toLocaleDateString();
    } else if (diffInDays < -1) {
      return rtf.format(diffInDays, 'day');
    } else if (diffInHours < -1) {
      return rtf.format(diffInHours, 'hour');
    } else if (diffInMinutes < -1) {
      return rtf.format(diffInMinutes, 'minute');
    } else {
      return 'just now';
    }
  };
  
  // Generate star rating display
  const renderStars = (rating: number | null) => {
    const ratingValue = rating || 0;
    const stars = [];
    const fullStars = Math.floor(ratingValue);
    const hasHalfStar = ratingValue % 1 >= 0.5;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={`full-${i}`} className="fill-yellow-500 text-yellow-500 h-4 w-4" />);
    }
    
    if (hasHalfStar) {
      stars.push(<StarHalf key="half" className="fill-yellow-500 text-yellow-500 h-4 w-4" />);
    }
    
    // Add empty stars to make 5 total
    for (let i = stars.length; i < 5; i++) {
      stars.push(<Star key={`empty-${i}`} className="text-gray-400 h-4 w-4" />);
    }
    
    return stars;
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-heading font-medium">Reviews</h3>
        {currentUser && (
          <Button 
            variant="ghost" 
            className="text-primary hover:text-primary hover:bg-primary/10"
            onClick={() => document.getElementById('comment-form')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Write a Review
          </Button>
        )}
      </div>
      
      <div className="space-y-4 mb-6">
        {displayedComments.length > 0 ? (
          displayedComments.map((comment) => (
            <div key={comment.id} className="bg-muted/30 p-4 rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center">
                  <Avatar className="h-10 w-10 mr-3">
                    <AvatarImage src={`https://api.dicebear.com/7.x/personas/svg?seed=${comment.userId}`} alt="User avatar" />
                    <AvatarFallback>U{comment.userId}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">User{comment.userId}</div>
                    <div className="flex text-sm">
                      {renderStars(comment.rating)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="text-xs text-muted-foreground mr-2">
                    {getRelativeTime(comment.createdAt.toString())}
                  </div>
                  {(currentUser?.id === comment.userId || currentUser?.isAdmin) && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDeleteComment(comment.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              <p className="text-foreground/90 whitespace-pre-line">
                {comment.content}
              </p>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No reviews yet. Be the first to share your thoughts!
          </div>
        )}
      </div>
      
      {comments.length > 3 && (
        <div className="mt-4 flex justify-center mb-8">
          <Button
            variant="ghost"
            className="text-primary hover:text-primary hover:bg-primary/10"
            onClick={() => setShowAllComments(!showAllComments)}
          >
            {showAllComments ? "Show Less" : `View All Reviews (${comments.length})`}
          </Button>
        </div>
      )}
      
      {currentUser && (
        <form id="comment-form" onSubmit={handleSubmit} className="bg-muted/30 p-4 rounded-lg">
          <h4 className="font-medium mb-4">Write a Review</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Rating</label>
              <Select value={rating.toString()} onValueChange={(value) => setRating(Number(value))}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">★★★★★ (5/5)</SelectItem>
                  <SelectItem value="4">★★★★☆ (4/5)</SelectItem>
                  <SelectItem value="3">★★★☆☆ (3/5)</SelectItem>
                  <SelectItem value="2">★★☆☆☆ (2/5)</SelectItem>
                  <SelectItem value="1">★☆☆☆☆ (1/5)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Your Review</label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Share your thoughts about this novel..."
                rows={4}
                className="resize-none w-full"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full"
              disabled={addCommentMutation.isPending}
            >
              {addCommentMutation.isPending ? "Posting..." : "Post Review"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default CommentSection;
export { CommentSection };
