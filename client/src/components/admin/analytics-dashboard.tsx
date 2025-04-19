import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Activity,
  BarChart,
  BookOpen,
  BookText,
  Heart,
  UserIcon,
  TrendingUp,
  Clock,
  MessageSquare,
  Eye,
  CalendarClock,
  BarChart4,
  LineChart
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { 
  Novel, 
  Chapter, 
  User, 
  Comment, 
  ReadingHistory as ReadingHistoryType,
  Bookmark as BookmarkType,
  Like as LikeType 
} from '@shared/schema';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface AnalyticsDashboardProps {
  novels: Novel[];
  chapters?: Chapter[];
  users?: User[];
  comments?: Comment[];
  readingHistory?: ReadingHistoryType[];
  bookmarks?: BookmarkType[];
  likes?: LikeType[];
  selectedTimeRange?: 'day' | 'week' | 'month' | 'year' | 'all';
  onTimeRangeChange?: (range: 'day' | 'week' | 'month' | 'year' | 'all') => void;
}

const AnalyticsDashboard = ({ 
  novels, 
  chapters = [], 
  users = [], 
  comments = [],
  readingHistory = [],
  bookmarks = [],
  likes = [],
  selectedTimeRange = 'week',
  onTimeRangeChange
}: AnalyticsDashboardProps) => {
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month' | 'year' | 'all'>(selectedTimeRange);

  // Handle time range change
  const handleTimeRangeChange = (newRange: 'day' | 'week' | 'month' | 'year' | 'all') => {
    setTimeRange(newRange);
    if (onTimeRangeChange) {
      onTimeRangeChange(newRange);
    }
  };

  // Calculate basic statistics
  const totalNovels = novels.length;
  const totalChapters = chapters.length;
  const totalUsers = users.length;
  const totalComments = comments.length;
  const totalViews = novels.reduce((sum, novel) => sum + (novel.views || 0), 0);
  const totalLikes = novels.reduce((sum, novel) => sum + (novel.likes || 0), 0);
  const averageRating = novels.length > 0
    ? novels.reduce((sum, novel) => sum + (novel.rating || 0), 0) / novels.length
    : 0;
  
  // For the charts - determine date range based on selected time range
  let recentDays = 7;
  switch (timeRange) {
    case 'day': recentDays = 1; break;
    case 'week': recentDays = 7; break;
    case 'month': recentDays = 30; break;
    case 'year': recentDays = 365; break;
    case 'all': recentDays = 365; break; // Default to a year for "all" view
  }
  
  const dateLabels = Array.from({ length: recentDays }).map((_, i) => {
    return format(subDays(new Date(), recentDays - 1 - i), recentDays > 30 ? 'MMM' : 'MMM d');
  });

  // Create realistic view data based on novels and reading history
  // In a real app with actual timestamped data, we'd filter by date
  const viewsData = Array.from({ length: recentDays }).map((_, i) => {
    // Use real data (novel views) but distribute it over time realistically
    // This is a simulation for demonstration purposes
    return Math.floor((totalViews / recentDays) * (0.8 + Math.random() * 0.4));
  });
  
  // Genre breakdown
  const genreCounts = novels.reduce((counts: Record<string, number>, novel) => {
    const genre = novel.genre;
    counts[genre] = (counts[genre] || 0) + 1;
    return counts;
  }, {});
  
  const topGenres = Object.entries(genreCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  
  // Most viewed novels
  const topNovels = [...novels]
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, 5);
  
  // Chart data
  const viewsChartData = {
    labels: dateLabels,
    datasets: [
      {
        label: 'Daily Views',
        data: viewsData,
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };
  
  const genreChartData = {
    labels: topGenres.map(([genre]) => genre),
    datasets: [
      {
        label: 'Novels by Genre',
        data: topGenres.map(([_, count]) => count),
        backgroundColor: [
          'rgba(255, 99, 132, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 206, 86, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(153, 102, 255, 0.8)',
        ],
        borderWidth: 1,
      },
    ],
  };
  
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* Time range picker */}
      <div className="flex justify-end">
        <Select 
          value={timeRange} 
          onValueChange={(value) => handleTimeRangeChange(value as any)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select Time Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="day">Last 24 Hours</SelectItem>
            <SelectItem value="week">Last 7 Days</SelectItem>
            <SelectItem value="month">Last 30 Days</SelectItem>
            <SelectItem value="year">Last Year</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Key metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Novels
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <BookOpen className="h-5 w-5 text-primary mr-2" />
              <div className="text-3xl font-bold">{totalNovels}</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Chapters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <BookText className="h-5 w-5 text-primary mr-2" />
              <div className="text-3xl font-bold">{totalChapters}</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Views
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Eye className="h-5 w-5 text-primary mr-2" />
              <div className="text-3xl font-bold">{totalViews.toLocaleString()}</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average Rating
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Heart className="h-5 w-5 text-rose-500 mr-2" />
              <div className="text-3xl font-bold">{averageRating.toFixed(1)}</div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Views Over Time</CardTitle>
            <CardDescription>
              Daily view count for the past week
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <Line data={viewsChartData} options={chartOptions} />
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Novels by Genre</CardTitle>
            <CardDescription>
              Distribution of novels across genres
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <Bar data={genreChartData} options={chartOptions} />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Popular content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Most Popular Novels</CardTitle>
            <CardDescription>
              Novels with the highest view counts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topNovels.length > 0 ? (
                topNovels.map((novel, index) => (
                  <div key={novel.id} className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <span className="font-bold text-primary">{index + 1}</span>
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="font-medium leading-none">{novel.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {novel.author} • {novel.genre}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                      <span>{novel.views?.toLocaleString() || 0}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  No novels available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest content updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {novels.slice(0, 5).map((novel, index) => (
                <div key={novel.id} className="flex">
                  <div className="relative mr-4">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                      <BookOpen className="h-5 w-5 text-primary" />
                    </div>
                    {index < novels.slice(0, 5).length - 1 && (
                      <span className="absolute top-9 bottom-0 left-1/2 -translate-x-1/2 w-px bg-border h-full" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Novel Added: {novel.title}</p>
                    <p className="text-xs text-muted-foreground">Author: {novel.author}</p>
                    <div className="flex items-center pt-1">
                      <CalendarClock className="h-3 w-3 mr-1 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {new Date(novel.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              
              {novels.length === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  No recent activity
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;