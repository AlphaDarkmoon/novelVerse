import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Novel, genreEnum, Chapter } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Loader2, 
  AlertTriangle, 
  Edit, 
  Trash, 
  Plus, 
  Book, 
  FileText, 
  LayoutDashboard, 
  PlusCircle, 
  Library, 
  BookText, 
  User as UserIcon,
  UserPlus,
  MessageSquare, 
  Settings, 
  Home, 
  ChevronRight, 
  BarChart, 
  Columns,
  Tag,
  Heart,
  Bookmark,
  ClipboardList,
  Search,
  Eye,
  Calendar,
  ArrowUpDown,
  Terminal,
  Pencil,
  MoreHorizontal,
  Filter,
  Shield,
  UserCog,
  Users
} from "lucide-react";
import RichTextEditor from "@/components/ui/rich-text-editor";
import AnalyticsDashboard from "@/components/admin/analytics-dashboard";

// Define the novel form schema
const novelSchema = z.object({
  title: z.string().min(1, "Title is required"),
  author: z.string().min(1, "Author is required"),
  coverImage: z.string().url("Must be a valid URL").optional().or(z.literal('')),
  description: z.string().min(10, "Description must be at least 10 characters"),
  genre: z.enum(genreEnum.enumValues),
  tags: z.array(z.string()).optional(),
  isFeatured: z.boolean().default(false),
  isTrending: z.boolean().default(false),
});

// Define the chapter form schema
const chapterSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(100, "Content must be at least 100 characters"),
  chapterNumber: z.number().min(1, "Chapter number must be at least 1"),
  novelId: z.number(),
});

type NovelFormValues = z.infer<typeof novelSchema>;
type ChapterFormValues = z.infer<typeof chapterSchema>;

const AdminPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedNovel, setSelectedNovel] = useState<Novel | null>(null);
  const [editNovelId, setEditNovelId] = useState<number | null>(null);
  const [addChapterNovelId, setAddChapterNovelId] = useState<number | null>(null);
  const [editChapterId, setEditChapterId] = useState<number | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [novelSearchQuery, setNovelSearchQuery] = useState("");
  
  // Check if user is admin
  if (!user?.isAdmin) {
    return (
      <div className="container py-12">
        <Alert variant="destructive">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You need administrator privileges to access this page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Fetch novels
  const { data: novels = [], isLoading: isNovelsLoading } = useQuery<Novel[]>({
    queryKey: ["/api/novels"],
  });
  
  // Fetch chapters for selected novel
  const { data: chapters = [], isLoading: isChaptersLoading } = useQuery<Chapter[]>({
    queryKey: [`/api/novels/${selectedNovel?.id}/chapters`],
    enabled: !!selectedNovel,
  });
  
  // Novel form
  const novelForm = useForm<NovelFormValues>({
    resolver: zodResolver(novelSchema),
    defaultValues: {
      title: "",
      author: "",
      coverImage: "",
      description: "",
      genre: "Fantasy",
      tags: [],
      isFeatured: false,
      isTrending: false,
    },
  });
  
  // Chapter form
  const chapterForm = useForm<ChapterFormValues>({
    resolver: zodResolver(chapterSchema),
    defaultValues: {
      title: "",
      content: "",
      chapterNumber: 1,
      novelId: 0,
    },
  });
  
  // Add/Edit novel mutation
  const novelMutation = useMutation({
    mutationFn: async (data: NovelFormValues) => {
      const formData = {
        ...data,
        tags: selectedTags,
      };
      
      if (editNovelId) {
        const res = await apiRequest("PUT", `/api/novels/${editNovelId}`, formData);
        return await res.json();
      } else {
        const res = await apiRequest("POST", "/api/novels", formData);
        return await res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/novels"] });
      queryClient.invalidateQueries({ queryKey: ["/api/novels/featured"] });
      queryClient.invalidateQueries({ queryKey: ["/api/novels/trending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/novels/recent"] });
      
      toast({
        title: editNovelId ? "Novel updated" : "Novel created",
        description: editNovelId 
          ? "The novel has been updated successfully." 
          : "The novel has been created successfully.",
      });
      
      // Reset form
      novelForm.reset();
      setSelectedTags([]);
      setEditNovelId(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${editNovelId ? "update" : "create"} novel: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Delete novel mutation
  const deleteNovelMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/novels/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/novels"] });
      queryClient.invalidateQueries({ queryKey: ["/api/novels/featured"] });
      queryClient.invalidateQueries({ queryKey: ["/api/novels/trending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/novels/recent"] });
      
      toast({
        title: "Novel deleted",
        description: "The novel has been deleted successfully.",
      });
      
      if (selectedNovel) {
        setSelectedNovel(null);
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete novel: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Add/Edit chapter mutation
  const chapterMutation = useMutation({
    mutationFn: async (data: ChapterFormValues) => {
      if (editChapterId) {
        const res = await apiRequest("PUT", `/api/chapters/${editChapterId}`, data);
        return await res.json();
      } else {
        const res = await apiRequest("POST", `/api/novels/${data.novelId}/chapters`, data);
        return await res.json();
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [`/api/novels/${variables.novelId}/chapters`] });
      queryClient.invalidateQueries({ queryKey: ["/api/novels/recent"] });
      
      toast({
        title: editChapterId ? "Chapter updated" : "Chapter created",
        description: editChapterId
          ? "The chapter has been updated successfully."
          : "The chapter has been created successfully.",
      });
      
      // Reset form
      chapterForm.reset();
      setEditChapterId(null);
      setAddChapterNovelId(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${editChapterId ? "update" : "create"} chapter: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Delete chapter mutation
  const deleteChapterMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/chapters/${id}`);
    },
    onSuccess: () => {
      if (selectedNovel) {
        queryClient.invalidateQueries({ queryKey: [`/api/novels/${selectedNovel.id}/chapters`] });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/novels/recent"] });
      
      toast({
        title: "Chapter deleted",
        description: "The chapter has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete chapter: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Handle novel form submission
  const onNovelSubmit = (data: NovelFormValues) => {
    novelMutation.mutate(data);
  };
  
  // Handle chapter form submission
  const onChapterSubmit = (data: ChapterFormValues) => {
    chapterMutation.mutate(data);
  };
  
  // Handle novel edit
  const handleEditNovel = (novel: Novel) => {
    setEditNovelId(novel.id);
    setSelectedTags(novel.tags || []);
    novelForm.reset({
      title: novel.title,
      author: novel.author,
      coverImage: novel.coverImage || "",
      description: novel.description,
      genre: novel.genre,
      isFeatured: novel.isFeatured ?? false,
      isTrending: novel.isTrending ?? false,
    });
    setActiveTab("addNovel");
  };
  
  // Handle novel delete
  const handleDeleteNovel = (id: number) => {
    if (confirm("Are you sure you want to delete this novel? This action cannot be undone.")) {
      deleteNovelMutation.mutate(id);
    }
  };
  
  // Handle chapter edit
  const handleEditChapter = (chapter: Chapter) => {
    setEditChapterId(chapter.id);
    chapterForm.reset({
      title: chapter.title,
      content: chapter.content,
      chapterNumber: chapter.chapterNumber,
      novelId: chapter.novelId,
    });
    setActiveTab("addChapter");
  };
  
  // Handle chapter delete
  const handleDeleteChapter = (id: number) => {
    if (confirm("Are you sure you want to delete this chapter? This action cannot be undone.")) {
      deleteChapterMutation.mutate(id);
    }
  };
  
  // Handle adding a new tag
  const handleAddTag = () => {
    if (newTag.trim() && !selectedTags.includes(newTag.trim())) {
      setSelectedTags([...selectedTags, newTag.trim()]);
      setNewTag("");
    }
  };
  
  // Handle removing a tag
  const handleRemoveTag = (tag: string) => {
    setSelectedTags(selectedTags.filter(t => t !== tag));
  };
  
  // Handle setting up a new chapter form for a novel
  const handleAddChapter = (novel: Novel) => {
    setAddChapterNovelId(novel.id);
    setSelectedNovel(novel);
    const nextChapterNumber = chapters.length > 0 
      ? Math.max(...chapters.map(c => c.chapterNumber)) + 1 
      : 1;
    
    chapterForm.reset({
      title: "",
      content: "",
      chapterNumber: nextChapterNumber,
      novelId: novel.id,
    });
    setActiveTab("addChapter");
  };

  // Filter novels based on search query
  const filteredNovels = novelSearchQuery 
    ? novels.filter(novel => 
        novel.title.toLowerCase().includes(novelSearchQuery.toLowerCase()) ||
        novel.author.toLowerCase().includes(novelSearchQuery.toLowerCase())
      )
    : novels;
  
  // Stats for dashboard
  const totalNovels = novels.length;
  // Getting the total chapters would normally require a separate API call to count all chapters,
  // but for this UI demo, we'll show it as if we had the data
  const totalChapters = novels.length > 0 ? novels.length * 5 : 0; // Placeholder
  const featuredNovels = novels.filter(novel => novel.isFeatured).length;
  const trendingNovels = novels.filter(novel => novel.isTrending).length;

  // Side menu items
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5 mr-2" />, content: 'dashboard' },
    { id: 'novels', label: 'Manage Novels', icon: <Book className="w-5 h-5 mr-2" />, content: 'novels' },
    { id: 'chapters', label: 'Manage Chapters', icon: <BookText className="w-5 h-5 mr-2" />, content: 'chapters' },
    { id: 'add-novel', label: 'Add Novel', icon: <PlusCircle className="w-5 h-5 mr-2" />, content: 'addNovel' },
    { id: 'add-chapter', label: 'Add Chapter', icon: <FileText className="w-5 h-5 mr-2" />, content: 'addChapter', disabled: !selectedNovel },
    { id: 'comments', label: 'Comments', icon: <MessageSquare className="w-5 h-5 mr-2" />, content: 'comments' },
    { id: 'users', label: 'Manage Users', icon: <UserIcon className="w-5 h-5 mr-2" />, content: 'users' },
    { id: 'add-user', label: 'Add User', icon: <UserPlus className="w-5 h-5 mr-2" />, content: 'addUser' },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5 mr-2" />, content: 'settings' },
  ];

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Side Navigation */}
      <div className="w-64 border-r shadow-sm bg-card h-full py-4 flex flex-col">
        <div className="px-4 mb-6">
          <h2 className="text-xl font-semibold flex items-center">
            <Terminal className="w-5 h-5 mr-2 text-primary" />
            Admin Panel
          </h2>
          <p className="text-muted-foreground text-sm">Manage your content</p>
        </div>
        
        <div className="flex-1 overflow-auto">
          <div className="space-y-1 px-2">
            {menuItems.map((item) => (
              <Button
                key={item.id}
                variant={activeTab === item.content ? "secondary" : "ghost"}
                className={`w-full justify-start ${item.disabled ? 'opacity-50' : ''}`}
                onClick={() => !item.disabled && setActiveTab(item.content)}
                disabled={item.disabled}
              >
                {item.icon}
                {item.label}
                {activeTab === item.content && <ChevronRight className="w-4 h-4 ml-auto" />}
              </Button>
            ))}
          </div>
        </div>
        
        <div className="mt-auto px-4 py-4 border-t">
          <div className="flex items-center">
            <div className="flex-shrink-0 mr-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                {user?.username?.charAt(0).toUpperCase() || 'A'}
              </div>
            </div>
            <div>
              <p className="font-medium text-sm">{user?.username || 'Admin'}</p>
              <p className="text-xs text-muted-foreground">Administrator</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Dashboard */}
          <TabsContent value="dashboard" className="m-0">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
            </div>
            
            <AnalyticsDashboard novels={novels} chapters={chapters} />
          </TabsContent>
          
          {/* Former Dashboard - Now removed */}
          <TabsContent value="oldDashboard" className="space-y-6 m-0 hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Novels</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <Book className="h-5 w-5 text-primary mr-2" />
                    <div className="text-3xl font-bold">{totalNovels}</div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Chapters</CardTitle>
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
                  <CardTitle className="text-sm font-medium text-muted-foreground">Featured Novels</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <Tag className="h-5 w-5 text-blue-500 mr-2" />
                    <div className="text-3xl font-bold">{featuredNovels}</div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Trending Novels</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <Heart className="h-5 w-5 text-rose-500 mr-2" />
                    <div className="text-3xl font-bold">{trendingNovels}</div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest content changes on your platform</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  {novels.slice(0, 5).map((novel, index) => (
                    <div key={novel.id} className="flex items-start">
                      <div className="relative mr-4">
                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                          <Book className="h-5 w-5 text-primary" />
                        </div>
                        {index < novels.slice(0, 5).length - 1 && (
                          <span className="absolute top-9 bottom-0 left-1/2 -translate-x-1/2 w-px bg-border h-full" />
                        )}
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">Novel Added: {novel.title}</p>
                        <p className="text-xs text-muted-foreground">Author: {novel.author}</p>
                        <div className="flex items-center pt-1">
                          <Calendar className="h-3 w-3 mr-1 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {new Date(novel.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {novels.length === 0 && (
                    <div className="flex items-center justify-center py-6 text-center">
                      <div>
                        <Book className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-20" />
                        <p className="text-muted-foreground">No novels added yet</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Add your first novel to start building your library
                        </p>
                        <Button 
                          className="mt-4" 
                          size="sm" 
                          onClick={() => setActiveTab('addNovel')}
                        >
                          <PlusCircle className="h-4 w-4 mr-1" /> Add Novel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Novels Management */}
          <TabsContent value="novels" className="m-0">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold">Manage Novels</h1>
              <div className="flex gap-3">
                <div className="relative w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search novels..."
                    className="w-full pl-8"
                    value={novelSearchQuery}
                    onChange={(e) => setNovelSearchQuery(e.target.value)}
                  />
                </div>
                <Button onClick={() => setActiveTab('addNovel')}>
                  <PlusCircle className="h-4 w-4 mr-2" /> Add Novel
                </Button>
              </div>
            </div>
            
            <Card>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>All Novels</CardTitle>
                    <CardDescription>View, edit, or delete novels</CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isNovelsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : filteredNovels.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[50px]">#</TableHead>
                          <TableHead>Title</TableHead>
                          <TableHead>Author</TableHead>
                          <TableHead>Genre</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredNovels.map((novel, index) => (
                          <TableRow key={novel.id}>
                            <TableCell className="font-medium">{index + 1}</TableCell>
                            <TableCell className="font-medium">{novel.title}</TableCell>
                            <TableCell>{novel.author}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize">
                                {novel.genre}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {novel.isFeatured && (
                                  <Badge variant="secondary" className="bg-blue-500 text-white">Featured</Badge>
                                )}
                                {novel.isTrending && (
                                  <Badge variant="secondary" className="bg-green-500 text-white">Trending</Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end space-x-2">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="ghost" 
                                        size="icon"
                                        onClick={() => {
                                          setSelectedNovel(novel);
                                          setActiveTab('chapters');
                                        }}
                                      >
                                        <BookText className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      View Chapters
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="ghost" 
                                        size="icon"
                                        onClick={() => handleAddChapter(novel)}
                                      >
                                        <Plus className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      Add Chapter
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="ghost" 
                                        size="icon"
                                        onClick={() => handleEditNovel(novel)}
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      Edit Novel
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="ghost" 
                                        size="icon"
                                        className="text-destructive" 
                                        onClick={() => handleDeleteNovel(novel.id)}
                                        disabled={deleteNovelMutation.isPending}
                                      >
                                        <Trash className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      Delete Novel
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    {novelSearchQuery ? 
                      "No novels match your search criteria. Try a different search term." :
                      "No novels found. Click the 'Add Novel' button to create one."}
                  </div>
                )}
              </CardContent>
              {filteredNovels.length > 0 && (
                <CardFooter className="flex items-center justify-between border-t px-6 py-4">
                  <div className="text-xs text-muted-foreground">
                    Showing <strong>{filteredNovels.length}</strong> of <strong>{novels.length}</strong> novels
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" disabled>
                      Previous
                    </Button>
                    <Button variant="outline" size="sm" disabled>
                      Next
                    </Button>
                  </div>
                </CardFooter>
              )}
            </Card>
          </TabsContent>
          
          {/* Chapters Management */}
          <TabsContent value="chapters" className="m-0">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold">Manage Chapters</h1>
              {selectedNovel && (
                <Button 
                  onClick={() => handleAddChapter(selectedNovel)}
                  disabled={!selectedNovel}
                >
                  <PlusCircle className="h-4 w-4 mr-2" /> Add Chapter
                </Button>
              )}
            </div>
            
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Chapters</CardTitle>
                    <CardDescription>
                      {selectedNovel 
                        ? `Manage chapters for "${selectedNovel.title}"` 
                        : "Select a novel to view its chapters"}
                    </CardDescription>
                  </div>
                  {selectedNovel && (
                    <div className="flex items-center space-x-2">
                      <Badge>Novel: {selectedNovel.title}</Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedNovel(null)}
                      >
                        Clear selection
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {!selectedNovel ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Select a novel from the novels list to view its chapters.
                    <div className="mt-4">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setActiveTab('novels')}
                      >
                        <Book className="h-4 w-4 mr-2" /> 
                        Go to novels list
                      </Button>
                    </div>
                  </div>
                ) : isChaptersLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : chapters.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Chapter</TableHead>
                          <TableHead>Title</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead>Updated</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {chapters.map((chapter) => (
                          <TableRow key={chapter.id}>
                            <TableCell className="font-medium">#{chapter.chapterNumber}</TableCell>
                            <TableCell>{chapter.title}</TableCell>
                            <TableCell>{new Date(chapter.createdAt).toLocaleDateString()}</TableCell>
                            <TableCell>{new Date(chapter.updatedAt).toLocaleDateString()}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end space-x-2">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="ghost" 
                                        size="icon"
                                        onClick={() => handleEditChapter(chapter)}
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      Edit Chapter
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="ghost" 
                                        size="icon"
                                        className="text-destructive"
                                        onClick={() => handleDeleteChapter(chapter.id)}
                                        disabled={deleteChapterMutation.isPending}
                                      >
                                        <Trash className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      Delete Chapter
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No chapters found for this novel. Click the "Add Chapter" button to create one.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Add/Edit Novel Form */}
          <TabsContent value="addNovel" className="m-0">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold">{editNovelId ? "Edit Novel" : "Add New Novel"}</h1>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>{editNovelId ? "Edit Novel" : "Add New Novel"}</CardTitle>
                <CardDescription>
                  {editNovelId 
                    ? "Update the details of an existing novel" 
                    : "Create a new novel to add to the library"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Form {...novelForm}>
                  <form onSubmit={novelForm.handleSubmit(onNovelSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={novelForm.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Title</FormLabel>
                            <FormControl>
                              <Input placeholder="Novel title" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={novelForm.control}
                        name="author"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Author</FormLabel>
                            <FormControl>
                              <Input placeholder="Author name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={novelForm.control}
                      name="coverImage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cover Image URL</FormLabel>
                          <FormControl>
                            <Input placeholder="https://example.com/image.jpg" {...field} />
                          </FormControl>
                          <FormDescription>
                            Enter a valid URL for the novel's cover image
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={novelForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Provide a brief summary of the novel..."
                              className="min-h-[120px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={novelForm.control}
                        name="genre"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Genre</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a genre" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {genreEnum.enumValues.map((genre) => (
                                  <SelectItem key={genre} value={genre}>{genre}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="space-y-2">
                        <FormLabel>Tags</FormLabel>
                        <div className="flex gap-2">
                          <Input
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            placeholder="Add a tag"
                            className="flex-1"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddTag();
                              }
                            }}
                          />
                          <Button 
                            type="button" 
                            onClick={handleAddTag}
                            disabled={!newTag.trim()}
                          >
                            Add
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {selectedTags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="gap-1">
                              {tag}
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-4 w-4 rounded-full p-0"
                                onClick={() => handleRemoveTag(tag)}
                              >
                                <Trash className="h-3 w-3" />
                              </Button>
                            </Badge>
                          ))}
                          {selectedTags.length === 0 && (
                            <span className="text-sm text-muted-foreground">No tags added</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={novelForm.control}
                        name="isFeatured"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Featured Novel</FormLabel>
                              <FormDescription>
                                Display this novel in the featured section on the home page
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={novelForm.control}
                        name="isTrending"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Trending Novel</FormLabel>
                              <FormDescription>
                                Mark this novel as trending to appear in the trending section
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="flex justify-end space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          novelForm.reset();
                          setSelectedTags([]);
                          setEditNovelId(null);
                          setActiveTab('novels');
                        }}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={novelMutation.isPending}
                      >
                        {novelMutation.isPending && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        {editNovelId ? "Update Novel" : "Create Novel"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Add/Edit Chapter Form */}
          <TabsContent value="addChapter" className="m-0">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold">{editChapterId ? "Edit Chapter" : "Add New Chapter"}</h1>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>{editChapterId ? "Edit Chapter" : "Add New Chapter"}</CardTitle>
                <CardDescription>
                  {editChapterId 
                    ? "Update the content of an existing chapter" 
                    : selectedNovel 
                      ? `Add a new chapter to "${selectedNovel.title}"` 
                      : "Select a novel first before adding a chapter"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedNovel || editChapterId ? (
                  <Form {...chapterForm}>
                    <form onSubmit={chapterForm.handleSubmit(onChapterSubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={chapterForm.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Chapter Title</FormLabel>
                              <FormControl>
                                <Input placeholder="Chapter title" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={chapterForm.control}
                          name="chapterNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Chapter Number</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min={1}
                                  value={field.value}
                                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={chapterForm.control}
                        name="content"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Chapter Content</FormLabel>
                            <FormControl>
                              <div className="min-h-[500px]">
                                <RichTextEditor
                                  value={field.value}
                                  onChange={field.onChange}
                                  placeholder="Write the chapter content here..."
                                  height={500}
                                />
                              </div>
                            </FormControl>
                            <FormDescription>
                              Use the toolbar to format your content with rich text elements
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex justify-end space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            chapterForm.reset();
                            setEditChapterId(null);
                            if (selectedNovel) {
                              setActiveTab('chapters');
                            }
                          }}
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={chapterMutation.isPending}
                        >
                          {chapterMutation.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          {editChapterId ? "Update Chapter" : "Create Chapter"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Please select a novel first before adding a chapter.
                    <div className="mt-4">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setActiveTab('novels')}
                      >
                        <Book className="h-4 w-4 mr-2" /> 
                        Go to novels list
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Comments Management */}
          <TabsContent value="comments" className="m-0">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold">Manage Comments</h1>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Comments</CardTitle>
                <CardDescription>
                  Review and moderate user comments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p className="text-muted-foreground">Comment management coming soon</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Users Management */}
          <TabsContent value="users" className="m-0">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold">Manage Users</h1>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Users</CardTitle>
                <CardDescription>
                  Manage user accounts and permissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <UserIcon className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p className="text-muted-foreground">User management coming soon</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Settings */}
          <TabsContent value="settings" className="m-0">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold">Settings</h1>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Platform Settings</CardTitle>
                <CardDescription>
                  Configure global platform settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Settings className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p className="text-muted-foreground">Settings panel coming soon</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPage;