import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Novel } from "@shared/schema";
import NovelCard from "@/components/novels/novel-card";
import GenreFilter from "@/components/novels/genre-filter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const HomePage = () => {
  const [selectedGenre, setSelectedGenre] = useState("All");
  
  // Fetch featured novels
  const { data: featuredNovels = [], isLoading: isFeaturedLoading } = useQuery<Novel[]>({
    queryKey: ["/api/novels/featured"],
  });
  
  // Fetch trending novels
  const { data: trendingNovels = [], isLoading: isTrendingLoading } = useQuery<Novel[]>({
    queryKey: ["/api/novels/trending"],
  });
  
  // Fetch recently updated novels
  const { data: recentNovels = [], isLoading: isRecentLoading } = useQuery<Novel[]>({
    queryKey: ["/api/novels/recent"],
  });
  
  // Filter novels by genre if a genre is selected
  const filterByGenre = (novels: Novel[]) => {
    if (selectedGenre === "All") return novels;
    return novels.filter(novel => novel.genre === selectedGenre);
  };
  
  // Handle genre change
  const handleGenreChange = (genre: string) => {
    setSelectedGenre(genre);
  };
  
  // Render novel card skeleton during loading
  const renderSkeletons = (count: number) => {
    return Array(count).fill(0).map((_, i) => (
      <div key={i} className="flex flex-col h-full">
        <Skeleton className="w-full aspect-[2/3] rounded-lg mb-4" />
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2 mb-3" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4 mb-4" />
        <Skeleton className="h-10 w-full mt-auto" />
      </div>
    ));
  };
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Genres Filter */}
      <GenreFilter 
        selectedGenre={selectedGenre} 
        onGenreChange={handleGenreChange} 
      />
      
      {/* Featured Section */}
      <section className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-heading font-bold">Featured Novels</h2>
          <Link href="/featured">
            <Button variant="link" className="text-sm text-primary hover:text-primary/90">
              View All
            </Button>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {isFeaturedLoading ? (
            renderSkeletons(4)
          ) : filterByGenre(featuredNovels).length > 0 ? (
            filterByGenre(featuredNovels).map(novel => (
              <NovelCard key={novel.id} novel={novel} />
            ))
          ) : (
            <div className="col-span-full text-center py-10 text-muted-foreground">
              No featured novels found in the {selectedGenre} genre.
            </div>
          )}
        </div>
      </section>
      
      {/* Trending Section */}
      <section className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-heading font-bold">Trending Now</h2>
          <Link href="/trending">
            <Button variant="link" className="text-sm text-primary hover:text-primary/90">
              View All
            </Button>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {isTrendingLoading ? (
            renderSkeletons(4)
          ) : filterByGenre(trendingNovels).length > 0 ? (
            filterByGenre(trendingNovels).map(novel => (
              <NovelCard key={novel.id} novel={novel} />
            ))
          ) : (
            <div className="col-span-full text-center py-10 text-muted-foreground">
              No trending novels found in the {selectedGenre} genre.
            </div>
          )}
        </div>
      </section>
      
      {/* Recently Updated Section */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-heading font-bold">Recently Updated</h2>
          <Link href="/recent">
            <Button variant="link" className="text-sm text-primary hover:text-primary/90">
              View All
            </Button>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {isRecentLoading ? (
            renderSkeletons(4)
          ) : filterByGenre(recentNovels).length > 0 ? (
            filterByGenre(recentNovels).map(novel => (
              <NovelCard key={novel.id} novel={novel} />
            ))
          ) : (
            <div className="col-span-full text-center py-10 text-muted-foreground">
              No recently updated novels found in the {selectedGenre} genre.
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
