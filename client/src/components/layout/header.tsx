import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useTheme } from "@/components/ui/theme-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger, 
  SheetClose 
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { useMediaQuery } from "@/hooks/use-mobile";
import { 
  Moon, 
  Sun, 
  Menu, 
  Search, 
  ChevronDown,
  Book,
  Compass,
  Library,
  User as UserIcon,
  LogOut,
  Settings,
  History,
  Bookmark
} from "lucide-react";

const Header = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [location, navigate] = useLocation();
  const { theme, setTheme } = useTheme();
  const { user, logoutMutation } = useAuth();
  const isMobile = useMediaQuery("(max-width: 768px)");
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="container flex justify-between items-center py-4">
        {/* Logo */}
        <div className="flex items-center">
          <Link href="/" className="flex items-center">
            <Book className="h-6 w-6 text-primary mr-2" />
            <h1 className="text-xl font-heading font-bold">NovelVerse</h1>
          </Link>
        </div>
        
        {/* Search bar - hidden on mobile */}
        {!isMobile && (
          <form onSubmit={handleSearch} className="hidden md:flex flex-grow max-w-lg mx-8">
            <div className="relative w-full">
              <Input
                type="text"
                placeholder="Search novels, authors, genres..."
                className="w-full pl-4 pr-10 py-2 rounded-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button 
                type="submit" 
                variant="ghost" 
                size="icon" 
                className="absolute right-2 top-1/2 transform -translate-y-1/2"
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </form>
        )}
        
        {/* Navigation - hidden on mobile */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link href="/" className="text-sm font-medium hover:text-primary">
            Browse
          </Link>
          <Link href="/library" className="text-sm font-medium hover:text-primary">
            Library
          </Link>
          
          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Moon className="h-5 w-5" />
            ) : (
              <Sun className="h-5 w-5" />
            )}
          </Button>
          
          {/* User dropdown or auth buttons */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-1 focus:outline-none p-1">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar || ""} alt={user.username} />
                    <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm hidden lg:block">{user.username}</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer">Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/library" className="cursor-pointer">Reading List</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/history" className="cursor-pointer">History</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="cursor-pointer">Settings</Link>
                </DropdownMenuItem>
                {user.isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="cursor-pointer">Admin Panel</Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center space-x-4">
              <Link href="/auth">
                <Button variant="ghost" size="sm">Sign In</Button>
              </Link>
              <Link href="/auth">
                <Button size="sm">Sign Up</Button>
              </Link>
            </div>
          )}
        </nav>
        
        {/* Mobile menu button */}
        {isMobile && (
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <div className="flex flex-col h-full py-4">
                <form onSubmit={handleSearch} className="mb-6">
                  <div className="relative w-full">
                    <Input
                      type="text"
                      placeholder="Search novels, authors, genres..."
                      className="w-full pl-4 pr-10 py-2"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <Button 
                      type="submit" 
                      variant="ghost" 
                      size="icon" 
                      className="absolute right-2 top-1/2 transform -translate-y-1/2"
                    >
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                </form>
                
                <div className="space-y-4">
                  <SheetClose asChild>
                    <Link href="/" className="flex items-center p-2 hover:bg-accent hover:text-accent-foreground rounded-md">
                      <Compass className="mr-2 h-5 w-5" />
                      Browse
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link href="/library" className="flex items-center p-2 hover:bg-accent hover:text-accent-foreground rounded-md">
                      <Library className="mr-2 h-5 w-5" />
                      Library
                    </Link>
                  </SheetClose>
                  {user && (
                    <>
                      <SheetClose asChild>
                        <Link href="/profile" className="flex items-center p-2 hover:bg-accent hover:text-accent-foreground rounded-md">
                          <UserIcon className="mr-2 h-5 w-5" />
                          Profile
                        </Link>
                      </SheetClose>
                      <SheetClose asChild>
                        <Link href="/bookmarks" className="flex items-center p-2 hover:bg-accent hover:text-accent-foreground rounded-md">
                          <Bookmark className="mr-2 h-5 w-5" />
                          Bookmarks
                        </Link>
                      </SheetClose>
                      <SheetClose asChild>
                        <Link href="/history" className="flex items-center p-2 hover:bg-accent hover:text-accent-foreground rounded-md">
                          <History className="mr-2 h-5 w-5" />
                          History
                        </Link>
                      </SheetClose>
                      <SheetClose asChild>
                        <Link href="/settings" className="flex items-center p-2 hover:bg-accent hover:text-accent-foreground rounded-md">
                          <Settings className="mr-2 h-5 w-5" />
                          Settings
                        </Link>
                      </SheetClose>
                      {user.isAdmin && (
                        <SheetClose asChild>
                          <Link href="/admin" className="flex items-center p-2 hover:bg-accent hover:text-accent-foreground rounded-md">
                            <Settings className="mr-2 h-5 w-5" />
                            Admin Panel
                          </Link>
                        </SheetClose>
                      )}
                    </>
                  )}
                </div>
                
                <div className="mt-auto space-y-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    className="flex items-center w-full justify-start"
                  >
                    {theme === "dark" ? (
                      <>
                        <Sun className="mr-2 h-5 w-5" />
                        Light Mode
                      </>
                    ) : (
                      <>
                        <Moon className="mr-2 h-5 w-5" />
                        Dark Mode
                      </>
                    )}
                  </Button>
                  
                  {user ? (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleLogout}
                      className="flex items-center w-full justify-start"
                    >
                      <LogOut className="mr-2 h-5 w-5" />
                      Sign Out
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <SheetClose asChild>
                        <Link href="/auth">
                          <Button variant="outline" size="sm" className="w-full">Sign In</Button>
                        </Link>
                      </SheetClose>
                      <SheetClose asChild>
                        <Link href="/auth">
                          <Button size="sm" className="w-full">Sign Up</Button>
                        </Link>
                      </SheetClose>
                    </div>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        )}
      </div>
      
      {/* Mobile search - visible only on mobile and only on homepage */}
      {isMobile && location === "/" && (
        <div className="md:hidden px-4 pb-4">
          <form onSubmit={handleSearch}>
            <div className="relative w-full">
              <Input
                type="text"
                placeholder="Search novels, authors, genres..."
                className="w-full pl-4 pr-10 py-2 rounded-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button 
                type="submit" 
                variant="ghost" 
                size="icon" 
                className="absolute right-2 top-1/2 transform -translate-y-1/2"
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </div>
      )}
    </header>
  );
};

export default Header;
