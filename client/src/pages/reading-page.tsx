import { useEffect } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Novel, Chapter } from "@shared/schema";
import ReadingMode from "@/components/novels/reading-mode";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const ReadingPage = () => {
  // Get chapter ID from URL params
  const params = useParams<{ chapterId: string }>();
  const chapterId = parseInt(params.chapterId);
  const { user } = useAuth();
  
  // Check if ID is a valid number
  if (isNaN(chapterId)) {
    return (
      <div className="container py-12">
        <Alert variant="destructive">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle>Invalid chapter ID</AlertTitle>
          <AlertDescription>
            The chapter ID in the URL is not valid. Please check the URL and try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  // Fetch chapter data
  const { 
    data: chapter, 
    isLoading: isChapterLoading, 
    error: chapterError 
  } = useQuery<Chapter>({
    queryKey: [`/api/chapters/${chapterId}`],
  });
  
  // Fetch novel data when chapter is loaded
  const { 
    data: novel, 
    isLoading: isNovelLoading, 
    error: novelError 
  } = useQuery<Novel>({
    queryKey: [`/api/novels/${chapter?.novelId}`],
    enabled: !!chapter,
  });
  
  // Fetch all chapters to determine next/prev and total
  const { 
    data: allChapters = [], 
    isLoading: isAllChaptersLoading 
  } = useQuery<Chapter[]>({
    queryKey: [`/api/novels/${chapter?.novelId}/chapters`],
    enabled: !!chapter,
  });
  
  // Determine next and previous chapters
  const currentChapterIndex = allChapters.findIndex(c => c.id === chapterId);
  const nextChapter = currentChapterIndex >= 0 && currentChapterIndex < allChapters.length - 1 
    ? allChapters[currentChapterIndex + 1] 
    : undefined;
  const prevChapter = currentChapterIndex > 0 
    ? allChapters[currentChapterIndex - 1] 
    : undefined;
  
  // Record reading history when the page loads
  useEffect(() => {
    if (user && chapter && novel) {
      fetch('/api/reading-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          novelId: novel.id,
          chapterId: chapter.id,
          progress: 0,
        }),
      }).catch(err => console.error('Error recording reading history:', err));
    }
  }, [user, chapter, novel]);
  
  // Loading state
  if (isChapterLoading || isNovelLoading || isAllChaptersLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // Error state
  if (chapterError || novelError || !chapter || !novel) {
    return (
      <div className="container py-12">
        <Alert variant="destructive">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle>Error loading content</AlertTitle>
          <AlertDescription>
            {((chapterError || novelError) as Error)?.message || "The requested chapter or novel could not be found."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  return (
    <ReadingMode
      chapter={chapter}
      novel={novel}
      nextChapterId={nextChapter?.id}
      prevChapterId={prevChapter?.id}
      totalChapters={allChapters.length}
      userId={user?.id}
    />
  );
};

export default ReadingPage;
