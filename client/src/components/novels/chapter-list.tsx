import { useState } from "react";
import { Link } from "wouter";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Chapter } from "@shared/schema";
import { ChevronRight } from "lucide-react";

interface ChapterListProps {
  chapters: Chapter[];
  initialLimit?: number;
}

const ChapterList = ({ chapters, initialLimit = 5 }: ChapterListProps) => {
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [expanded, setExpanded] = useState(false);
  
  // Sort chapters based on the selected order
  const sortedChapters = [...chapters].sort((a, b) => {
    const aDate = new Date(a.createdAt).getTime();
    const bDate = new Date(b.createdAt).getTime();
    return sortOrder === "newest" ? bDate - aDate : aDate - bDate;
  });
  
  // Limit chapters if not expanded
  const displayedChapters = expanded ? sortedChapters : sortedChapters.slice(0, initialLimit);
  
  const handleSortChange = (value: string) => {
    setSortOrder(value as "newest" | "oldest");
  };
  
  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-heading font-medium">Chapters</h3>
        <div className="flex items-center text-sm">
          <span className="text-muted-foreground mr-2">Sort by:</span>
          <Select value={sortOrder} onValueChange={handleSortChange}>
            <SelectTrigger className="w-[140px] h-8">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="bg-background/50 rounded-lg divide-y divide-border">
        {displayedChapters.length > 0 ? (
          displayedChapters.map((chapter) => (
            <Link key={chapter.id} href={`/read/${chapter.id}`}>
              <div className="flex justify-between items-center p-4 hover:bg-accent/10 transition duration-150 cursor-pointer">
                <div>
                  <span className="font-medium">Chapter {chapter.chapterNumber}: {chapter.title}</span>
                  <p className="text-sm text-muted-foreground mt-1">
                    Published: {new Date(chapter.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <ChevronRight className="text-primary h-5 w-5" />
              </div>
            </Link>
          ))
        ) : (
          <div className="p-4 text-center text-muted-foreground">
            No chapters available yet.
          </div>
        )}
      </div>
      
      {chapters.length > initialLimit && (
        <div className="mt-4 flex justify-center">
          <Button 
            variant="ghost" 
            className="text-primary hover:text-primary hover:bg-primary/10" 
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? "Show Less" : `View All Chapters (${chapters.length})`}
          </Button>
        </div>
      )}
    </div>
  );
};

export default ChapterList;
export { ChapterList };
