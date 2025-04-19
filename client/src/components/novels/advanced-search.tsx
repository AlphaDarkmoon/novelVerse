import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Novel, genreEnum } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Filter, X, BookOpen, BarChart, Clock, TrendingUp } from 'lucide-react';
import NovelCard from './novel-card';

// Search form schema
const searchSchema = z.object({
  query: z.string().optional(),
  genre: z.enum(['All', ...genreEnum.enumValues]).default('All'),
  sortBy: z.enum(['Newest', 'Popular', 'Rating', 'Title']).default('Newest'),
  minRating: z.number().min(0).max(5).default(0),
  maxChapters: z.number().min(1).default(100),
});

type SearchFormValues = z.infer<typeof searchSchema>;

interface AdvancedSearchProps {
  onResultsFound?: (count: number) => void;
}

const AdvancedSearch = ({ onResultsFound }: AdvancedSearchProps) => {
  const [searchResults, setSearchResults] = useState<Novel[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [viewType, setViewType] = useState<'grid' | 'list'>('grid');

  // Fetch all novels to filter client-side
  const { data: novels = [], isLoading: isNovelsLoading } = useQuery<Novel[]>({
    queryKey: ['/api/novels'],
  });

  // Popular tags derived from all novels
  const popularTags = Array.from(
    new Set(novels.flatMap((novel) => novel.tags || []))
  ).slice(0, 10);

  // Setup search form
  const form = useForm<SearchFormValues>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      query: '',
      genre: 'All',
      sortBy: 'Newest',
      minRating: 0,
      maxChapters: 100,
    },
  });

  // Handle search submission
  const onSubmit = (data: SearchFormValues) => {
    setIsSearching(true);

    // Filter novels based on search criteria
    let results = [...novels];

    // Filter by search query (title, author, description)
    if (data.query) {
      const query = data.query.toLowerCase();
      results = results.filter(
        (novel) =>
          novel.title.toLowerCase().includes(query) ||
          novel.author.toLowerCase().includes(query) ||
          novel.description.toLowerCase().includes(query)
      );
    }

    // Filter by genre
    if (data.genre !== 'All') {
      results = results.filter((novel) => novel.genre === data.genre);
    }

    // Filter by tags (if any selected)
    if (selectedTags.length > 0) {
      results = results.filter((novel) =>
        selectedTags.every((tag) => novel.tags?.includes(tag))
      );
    }

    // Filter by rating
    if (data.minRating > 0) {
      results = results.filter((novel) => (novel.rating || 0) >= data.minRating);
    }

    // Sort results
    switch (data.sortBy) {
      case 'Newest':
        results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'Popular':
        results.sort((a, b) => (b.likes || 0) - (a.likes || 0));
        break;
      case 'Rating':
        results.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'Title':
        results.sort((a, b) => a.title.localeCompare(b.title));
        break;
    }

    setSearchResults(results);
    setIsSearching(false);

    if (onResultsFound) {
      onResultsFound(results.length);
    }
  };

  // Reset search
  const handleReset = () => {
    form.reset();
    setSelectedTags([]);
    setSearchResults([]);
  };

  // Toggle a tag in the selected tags
  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Advanced Search
          </CardTitle>
          <CardDescription>
            Find the perfect novel with our powerful search tools
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <FormField
                    control={form.control}
                    name="query"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input
                            placeholder="Search by title, author, or keyword..."
                            className="pl-9"
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <Button type="submit" className="gap-2">
                  <Search className="h-4 w-4" />
                  Search
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReset}
                  className="gap-2"
                >
                  <X className="h-4 w-4" />
                  Reset
                </Button>
              </div>

              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="filters">
                  <AccordionTrigger className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Advanced Filters
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                      <FormField
                        control={form.control}
                        name="genre"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Genre</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select genre" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="All">All Genres</SelectItem>
                                {genreEnum.enumValues.map((genre) => (
                                  <SelectItem key={genre} value={genre}>
                                    {genre}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="sortBy"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Sort By</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Sort by" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Newest">
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    Newest First
                                  </div>
                                </SelectItem>
                                <SelectItem value="Popular">
                                  <div className="flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4" />
                                    Most Popular
                                  </div>
                                </SelectItem>
                                <SelectItem value="Rating">
                                  <div className="flex items-center gap-2">
                                    <BarChart className="h-4 w-4" />
                                    Highest Rated
                                  </div>
                                </SelectItem>
                                <SelectItem value="Title">
                                  <div className="flex items-center gap-2">
                                    <BookOpen className="h-4 w-4" />
                                    Title A-Z
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="minRating"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Minimum Rating: {field.value}</FormLabel>
                            <FormControl>
                              <Slider
                                defaultValue={[field.value]}
                                max={5}
                                step={0.5}
                                onValueChange={(vals) => field.onChange(vals[0])}
                              />
                            </FormControl>
                            <FormDescription>Filter by rating (0-5 stars)</FormDescription>
                          </FormItem>
                        )}
                      />

                      <div>
                        <FormLabel>Tags</FormLabel>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {popularTags.map((tag) => (
                            <Badge
                              key={tag}
                              variant={selectedTags.includes(tag) ? "default" : "outline"}
                              className="cursor-pointer"
                              onClick={() => toggleTag(tag)}
                            >
                              {tag}
                              {selectedTags.includes(tag) && (
                                <X className="ml-1 h-3 w-3" />
                              )}
                            </Badge>
                          ))}
                          {popularTags.length === 0 && (
                            <span className="text-muted-foreground text-sm">No tags available</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </form>
          </Form>
        </CardContent>
      </Card>

      {searchResults.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">
              {searchResults.length} {searchResults.length === 1 ? 'Result' : 'Results'}
            </h3>
            <div className="flex items-center gap-2">
              <Button
                variant={viewType === 'grid' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewType('grid')}
                className="px-3"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                </svg>
              </Button>
              <Button
                variant={viewType === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewType('list')}
                className="px-3"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="8" y1="6" x2="21" y2="6" />
                  <line x1="8" y1="12" x2="21" y2="12" />
                  <line x1="8" y1="18" x2="21" y2="18" />
                  <line x1="3" y1="6" x2="3.01" y2="6" />
                  <line x1="3" y1="12" x2="3.01" y2="12" />
                  <line x1="3" y1="18" x2="3.01" y2="18" />
                </svg>
              </Button>
            </div>
          </div>

          {viewType === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {searchResults.map((novel) => (
                <NovelCard key={novel.id} novel={novel} />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {searchResults.map((novel) => (
                <Card key={novel.id} className="overflow-hidden">
                  <div className="flex">
                    {novel.coverImage && (
                      <div className="w-24 h-32 flex-shrink-0">
                        <img
                          src={novel.coverImage}
                          alt={novel.title}
                          className="object-cover w-full h-full"
                        />
                      </div>
                    )}
                    <div className="flex-1 p-4">
                      <h3 className="font-semibold">{novel.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        by {novel.author}
                      </p>
                      <p className="text-sm line-clamp-2">{novel.description}</p>
                      <div className="flex mt-2 gap-2">
                        <Badge variant="outline">{novel.genre}</Badge>
                        {novel.isFeatured && (
                          <Badge className="bg-blue-500">Featured</Badge>
                        )}
                      </div>
                    </div>
                    <div className="p-4 flex items-center">
                      <Button variant="outline" className="gap-2" size="sm">
                        <BookOpen className="h-4 w-4" />
                        Read
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {searchResults.length === 0 && form.formState.isSubmitted && !isSearching && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">No Results Found</h3>
            <p className="text-muted-foreground text-center max-w-md">
              We couldn't find any novels matching your search criteria. Try adjusting your filters or search terms.
            </p>
            <Button className="mt-4" onClick={handleReset}>
              Reset Search
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdvancedSearch;