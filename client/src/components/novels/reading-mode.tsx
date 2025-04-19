import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { Settings, ArrowLeft, Bookmark, BookmarkCheck, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Chapter, Novel } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import ReadingSettings, { ReadingSettings as ReadingSettingsType } from "./reading-settings";

interface ReadingModeProps {
  chapter: Chapter;
  novel: Novel;
  nextChapterId?: number;
  prevChapterId?: number;
  totalChapters: number;
  userId?: number;
}

const ReadingMode = ({ 
  chapter, 
  novel, 
  nextChapterId, 
  prevChapterId,
  totalChapters,
  userId
}: ReadingModeProps) => {
  const { toast } = useToast();
  const contentRef = useRef<HTMLDivElement>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  // Default reading settings
  const [settings, setSettings] = useState<ReadingSettingsType>({
    fontSize: 18,
    fontFamily: 'serif',
    lineSpacing: 150,
    theme: 'dark',
    isFullWidth: false,
    isTtsEnabled: false
  });
  
  // Load saved settings from localStorage or user settings
  useEffect(() => {
    const savedSettings = localStorage.getItem('novelverse-reading-settings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
    
    // If user is logged in, we'll fetch their settings from the server
    if (userId) {
      fetch('/api/user-settings', { credentials: 'include' })
        .then(res => {
          if (res.ok) return res.json();
          throw new Error('Failed to fetch user settings');
        })
        .then(data => {
          if (data) {
            setSettings({
              fontSize: data.fontSize || 18,
              fontFamily: data.fontFamily || 'serif',
              lineSpacing: data.lineSpacing || 150,
              theme: data.backgroundColor || 'dark',
              isFullWidth: settings.isFullWidth,
              isTtsEnabled: settings.isTtsEnabled
            });
          }
        })
        .catch(err => console.error(err));
    }
    
    // Check if this chapter is bookmarked
    if (userId) {
      fetch('/api/bookmarks', { credentials: 'include' })
        .then(res => {
          if (res.ok) return res.json();
          throw new Error('Failed to fetch bookmarks');
        })
        .then(bookmarks => {
          const isBookmarked = bookmarks.some(
            (bookmark: any) => bookmark.novelId === novel.id && bookmark.chapterId === chapter.id
          );
          setIsBookmarked(isBookmarked);
        })
        .catch(err => console.error(err));
    }
    
    // Cleanup TTS on unmount
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [userId, novel.id, chapter.id, settings.isFullWidth, settings.isTtsEnabled]);
  
  // Track reading progress
  useEffect(() => {
    const updateProgress = () => {
      if (!contentRef.current) return;
      
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      const totalScrollable = scrollHeight - clientHeight;
      const currentProgress = Math.min(100, Math.round((scrollTop / totalScrollable) * 100));
      
      setReadingProgress(currentProgress);
      
      // Save reading progress to server if logged in
      if (userId && currentProgress > 10) {
        // Save progress every 5 seconds instead of on every scroll
        updateReadingHistoryMutation.mutate({
          novelId: novel.id,
          chapterId: chapter.id,
          progress: currentProgress
        });
      }
    };
    
    window.addEventListener('scroll', updateProgress);
    return () => window.removeEventListener('scroll', updateProgress);
  }, [userId, novel.id, chapter.id]);
  
  // Handle text-to-speech
  useEffect(() => {
    if (!settings.isTtsEnabled || !window.speechSynthesis) return;
    
    if (isSpeaking) {
      const text = contentRef.current?.textContent || '';
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
      
      utterance.onend = () => setIsSpeaking(false);
    } else {
      window.speechSynthesis.cancel();
    }
  }, [isSpeaking, settings.isTtsEnabled]);
  
  // Apply theme styles
  useEffect(() => {
    const body = document.body;
    
    // Reset any existing theme classes
    body.classList.remove('reading-theme-dark', 'reading-theme-light', 'reading-theme-sepia');
    
    // Add the new theme class
    body.classList.add(`reading-theme-${settings.theme}`);
    
    return () => {
      // Clean up on unmount
      body.classList.remove('reading-theme-dark', 'reading-theme-light', 'reading-theme-sepia');
    };
  }, [settings.theme]);
  
  // Update reading history mutation
  const updateReadingHistoryMutation = useMutation({
    mutationFn: async (data: { novelId: number, chapterId: number, progress: number }) => {
      await apiRequest("POST", "/api/reading-history", data);
    },
    // We don't need success handler or error toast here because this happens in the background
  });
  
  // Toggle bookmark mutation
  const bookmarkMutation = useMutation({
    mutationFn: async () => {
      if (isBookmarked) {
        await apiRequest("DELETE", `/api/bookmarks/${novel.id}`);
      } else {
        await apiRequest("POST", "/api/bookmarks", { 
          novelId: novel.id,
          chapterId: chapter.id 
        });
      }
    },
    onSuccess: () => {
      setIsBookmarked(!isBookmarked);
      queryClient.invalidateQueries({ queryKey: ['/api/bookmarks'] });
      toast({
        title: isBookmarked ? "Bookmark removed" : "Bookmark added",
        description: isBookmarked 
          ? "This chapter has been removed from your bookmarks." 
          : "This chapter has been added to your bookmarks.",
        duration: 3000,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${isBookmarked ? "remove" : "add"} bookmark: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const handleToggleBookmark = () => {
    if (!userId) {
      toast({
        title: "Authentication required",
        description: "Please sign in to bookmark chapters",
        variant: "destructive",
      });
      return;
    }
    
    bookmarkMutation.mutate();
  };
  
  const handleToggleTTS = () => {
    if (!settings.isTtsEnabled) {
      toast({
        title: "Text-to-speech is disabled",
        description: "Enable it in reading settings first",
      });
      return;
    }
    
    setIsSpeaking(!isSpeaking);
  };
  
  // Get appropriate theme classes
  const getThemeClasses = () => {
    switch (settings.theme) {
      case 'light':
        return 'bg-gray-50 text-gray-900';
      case 'sepia':
        return 'bg-[#f8f1e3] text-[#5f4b32]';
      case 'dark':
      default:
        return 'bg-dark-bg text-dark-text';
    }
  };
  
  return (
    <div className={`min-h-screen relative ${getThemeClasses()}`}>
      {/* Progress bar */}
      <div 
        className="progress-bar h-1 bg-primary fixed top-0 left-0 z-50" 
        style={{ width: `${readingProgress}%` }}
      ></div>
      
      {/* Top navigation */}
      <div className={`sticky top-0 z-30 border-b ${settings.theme === 'dark' ? 'bg-dark-surface border-gray-800' : settings.theme === 'sepia' ? 'bg-[#ebe5d7] border-[#d4c9b0]' : 'bg-white border-gray-200'}`}>
        <div className={`${settings.isFullWidth ? 'max-w-full px-6' : 'max-w-3xl px-4 sm:px-6'} mx-auto py-3 flex justify-between items-center`}>
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/novel/${novel.id}`} className="flex items-center">
              <ArrowLeft className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Back to Novel</span>
            </Link>
          </Button>
          
          <div className="text-center flex-1 mx-4 truncate">
            <h1 className="text-sm font-medium truncate">{novel.title}</h1>
            <p className="text-xs text-muted-foreground truncate">Chapter {chapter.chapterNumber}: {chapter.title}</p>
          </div>
          
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="icon" 
              title="Reading settings"
              onClick={() => setSettingsOpen(true)}
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              title={isBookmarked ? "Remove bookmark" : "Add bookmark"}
              onClick={handleToggleBookmark}
              disabled={bookmarkMutation.isPending}
            >
              {isBookmarked ? (
                <BookmarkCheck className="h-4 w-4 text-primary" />
              ) : (
                <Bookmark className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Chapter content */}
      <div 
        className={`${settings.isFullWidth ? 'max-w-full px-8' : 'max-w-3xl px-6'} mx-auto py-8`}
        style={{
          fontFamily: settings.fontFamily === 'serif' 
            ? '"Libre Baskerville", serif' 
            : settings.fontFamily === 'sans' 
              ? '"Source Sans Pro", sans-serif' 
              : 'monospace'
        }}
      >
        <article 
          ref={contentRef}
          className="prose prose-lg max-w-none"
          style={{
            fontSize: `${settings.fontSize}px`,
            lineHeight: `${settings.lineSpacing}%`,
            color: settings.theme === 'dark' 
              ? '#E0E0E0' 
              : settings.theme === 'sepia' 
                ? '#5f4b32' 
                : '#212121'
          }}
        >
          <h2 className="text-2xl font-heading font-bold mb-6 text-center">
            Chapter {chapter.chapterNumber}: {chapter.title}
          </h2>
          
          {chapter.content.split('\n\n').map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
          
          {nextChapterId && (
            <p className="font-medium mt-8 text-center">
              To be continued in Chapter {chapter.chapterNumber + 1}
            </p>
          )}
        </article>
      </div>
      
      {/* Chapter navigation */}
      <div className={`sticky bottom-0 z-30 border-t ${settings.theme === 'dark' ? 'bg-dark-surface border-gray-800' : settings.theme === 'sepia' ? 'bg-[#ebe5d7] border-[#d4c9b0]' : 'bg-white border-gray-200'}`}>
        <div className={`${settings.isFullWidth ? 'max-w-full px-6' : 'max-w-3xl px-4 sm:px-6'} mx-auto py-3 flex justify-between items-center`}>
          {/* Previous chapter button or empty placeholder */}
          {prevChapterId ? (
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/read/${prevChapterId}`} className="flex items-center">
                <ChevronLeft className="mr-1 h-4 w-4" />
                Previous
              </Link>
            </Button>
          ) : (
            <div></div>
          )}
          
          <div className="text-sm">
            <span className="text-primary">{chapter.chapterNumber}</span>
            <span className="text-muted-foreground mx-1">/</span>
            <span className="text-muted-foreground">{totalChapters}</span>
          </div>
          
          {/* Next chapter button or empty placeholder */}
          {nextChapterId ? (
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/read/${nextChapterId}`} className="flex items-center">
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <div></div>
          )}
        </div>
      </div>
      
      {/* Reading settings dialog */}
      <ReadingSettings
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        settings={settings}
        onSettingsChange={setSettings}
      />
      
      {/* Mobile bottom space to account for mobile browser UI */}
      <div className="h-10 md:hidden"></div>
    </div>
  );
};

export default ReadingMode;
