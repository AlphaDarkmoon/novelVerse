import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Novel, Chapter, Comment } from "@shared/schema";
import NovelDetail from "@/components/novels/novel-detail";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

const NovelPage = () => {
  // Get novel ID from URL params
  const params = useParams<{ id: string }>();
  const novelId = parseInt(params.id);
  
  // Check if ID is a valid number
  if (isNaN(novelId)) {
    return (
      <div className="container py-12">
        <Alert variant="destructive">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle>Invalid novel ID</AlertTitle>
          <AlertDescription>
            The novel ID in the URL is not valid. Please check the URL and try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  // Fetch novel data
  const { data: novel, isLoading: isNovelLoading, error: novelError } = useQuery<Novel>({
    queryKey: [`/api/novels/${novelId}`],
  });
  
  // Fetch chapters
  const { data: chapters = [], isLoading: isChaptersLoading } = useQuery<Chapter[]>({
    queryKey: [`/api/novels/${novelId}/chapters`],
    enabled: !!novel,
  });
  
  // Fetch comments
  const { data: comments = [], isLoading: isCommentsLoading } = useQuery<Comment[]>({
    queryKey: [`/api/novels/${novelId}/comments`],
    enabled: !!novel,
  });
  
  // Show error if novel not found
  if (novelError) {
    return (
      <div className="container py-12">
        <Alert variant="destructive">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle>Error loading novel</AlertTitle>
          <AlertDescription>
            {(novelError as Error).message || "Novel not found or could not be loaded."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  return (
    <div className="container py-8">
      <NovelDetail 
        novelId={novelId} 
      />
    </div>
  );
};

export default NovelPage;
