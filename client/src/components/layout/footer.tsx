import { Link } from "wouter";
import { Book, Twitter, Facebook, Instagram, Send } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t mt-auto">
      <div className="container px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center mb-4">
              <Book className="h-6 w-6 text-primary mr-2" />
              <h2 className="text-xl font-heading font-bold">NovelVerse</h2>
            </div>
            <p className="text-muted-foreground mb-4">
              Explore endless worlds through the power of stories. Read, write, and connect with fellow book lovers.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Send className="h-5 w-5" />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="font-heading font-bold mb-4">Discover</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/genres" className="text-muted-foreground hover:text-primary transition-colors">
                  Browse Genres
                </Link>
              </li>
              <li>
                <Link href="/top-rated" className="text-muted-foreground hover:text-primary transition-colors">
                  Top Rated
                </Link>
              </li>
              <li>
                <Link href="/new-releases" className="text-muted-foreground hover:text-primary transition-colors">
                  New Releases
                </Link>
              </li>
              <li>
                <Link href="/completed" className="text-muted-foreground hover:text-primary transition-colors">
                  Completed Series
                </Link>
              </li>
              <li>
                <Link href="/community-picks" className="text-muted-foreground hover:text-primary transition-colors">
                  Community Picks
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-heading font-bold mb-4">Community</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/forums" className="text-muted-foreground hover:text-primary transition-colors">
                  Forums
                </Link>
              </li>
              <li>
                <Link href="/contests" className="text-muted-foreground hover:text-primary transition-colors">
                  Writing Contests
                </Link>
              </li>
              <li>
                <Link href="/authors" className="text-muted-foreground hover:text-primary transition-colors">
                  Author Spotlights
                </Link>
              </li>
              <li>
                <Link href="/groups" className="text-muted-foreground hover:text-primary transition-colors">
                  Reading Groups
                </Link>
              </li>
              <li>
                <Link href="/resources" className="text-muted-foreground hover:text-primary transition-colors">
                  Writer Resources
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-heading font-bold mb-4">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-muted-foreground hover:text-primary transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-muted-foreground hover:text-primary transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/careers" className="text-muted-foreground hover:text-primary transition-colors">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-muted-foreground hover:text-primary transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-muted-foreground hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-border mt-12 pt-8 text-center text-muted-foreground text-sm">
          <p>&copy; {new Date().getFullYear()} NovelVerse. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
