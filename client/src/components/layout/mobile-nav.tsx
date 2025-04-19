import { Link, useLocation } from "wouter";
import { Home, Compass, Library, User } from "lucide-react";

const MobileNav = () => {
  const [location] = useLocation();

  const isActive = (path: string) => {
    return location === path;
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t shadow-[0_-2px_10px_rgba(0,0,0,0.1)] z-40">
      <div className="flex items-center justify-around py-3">
        <Link href="/">
          <div className={`flex flex-col items-center ${isActive('/') ? 'text-primary' : 'text-muted-foreground'}`}>
            <Home className="h-5 w-5" />
            <span className="text-xs mt-1">Home</span>
          </div>
        </Link>
        
        <Link href="/explore">
          <div className={`flex flex-col items-center ${isActive('/explore') ? 'text-primary' : 'text-muted-foreground'}`}>
            <Compass className="h-5 w-5" />
            <span className="text-xs mt-1">Explore</span>
          </div>
        </Link>
        
        <Link href="/library">
          <div className={`flex flex-col items-center ${isActive('/library') ? 'text-primary' : 'text-muted-foreground'}`}>
            <Library className="h-5 w-5" />
            <span className="text-xs mt-1">Library</span>
          </div>
        </Link>
        
        <Link href="/profile">
          <div className={`flex flex-col items-center ${isActive('/profile') ? 'text-primary' : 'text-muted-foreground'}`}>
            <User className="h-5 w-5" />
            <span className="text-xs mt-1">Profile</span>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default MobileNav;
