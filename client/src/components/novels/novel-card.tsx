import { Link } from 'wouter';
import { Novel } from '@shared/schema';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Heart, Clock, Star } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface NovelCardProps {
  novel: Novel;
  compact?: boolean;
}

const NovelCard = ({ novel, compact = false }: NovelCardProps) => {
  return (
    <Link href={`/novel/${novel.id}`}>
      <a className="block">
        <div className="group relative overflow-hidden rounded-lg border bg-card transition-all duration-300 hover:shadow-md">
          {/* Cover image */}
          <div className={cn("relative", {
            "pt-[65%]": !compact,
            "pt-[50%]": compact
          })}>
            {novel.coverImage ? (
              <img
                src={novel.coverImage}
                alt={novel.title}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="absolute inset-0 flex h-full w-full items-center justify-center bg-muted">
                <BookOpen className="h-12 w-12 text-muted-foreground/50" />
              </div>
            )}

            {/* Badges */}
            <div className="absolute top-2 right-2 flex flex-col gap-1">
              {novel.isFeatured && (
                <Badge className="bg-blue-500">Featured</Badge>
              )}
              {novel.isTrending && (
                <Badge className="bg-orange-500">Trending</Badge>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            <h3 className="font-semibold line-clamp-1 group-hover:text-primary">
              {novel.title}
            </h3>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
              by {novel.author}
            </p>

            {!compact && (
              <p className="mt-2 text-sm line-clamp-2">
                {novel.description}
              </p>
            )}

            <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-4">
                {/* Rating */}
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span>{novel.rating?.toFixed(1) || '0.0'}</span>
                </div>

                {/* Likes */}
                <div className="flex items-center gap-1">
                  <Heart className="h-4 w-4 text-rose-500" />
                  <span>{novel.likes || 0}</span>
                </div>
              </div>

              {/* Release date */}
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{format(new Date(novel.createdAt), 'MMM d, yyyy')}</span>
              </div>
            </div>

            {/* Genre */}
            <div className="mt-3">
              <Badge variant="outline" className="text-xs">
                {novel.genre}
              </Badge>
            </div>
          </div>
        </div>
      </a>
    </Link>
  );
};

export default NovelCard;