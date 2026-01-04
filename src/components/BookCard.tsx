import type { NostrEvent } from '@nostrify/nostrify';
import { useAuthor } from '@/hooks/useAuthor';
import { extractBookMetadata, estimateReadingTime, formatPublishDate, truncateText } from '@/lib/bookUtils';
import { genUserName } from '@/lib/genUserName';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Clock, Calendar } from 'lucide-react';
import { nip19 } from 'nostr-tools';

interface BookCardProps {
  event: NostrEvent;
  onClick?: () => void;
}

export function BookCard({ event, onClick }: BookCardProps) {
  const author = useAuthor(event.pubkey);
  const metadata = extractBookMetadata(event);
  const readingTime = estimateReadingTime(event.content);

  const authorName = author.data?.metadata?.name || genUserName(event.pubkey);
  const authorAvatar = author.data?.metadata?.picture;

  const naddr = nip19.naddrEncode({
    kind: event.kind,
    pubkey: event.pubkey,
    identifier: metadata.identifier,
  });

  return (
    <Card
      className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group h-full flex flex-col"
      onClick={onClick}
    >
      {/* Book Cover Image */}
      {metadata.image ? (
        <div className="relative aspect-[3/4] overflow-hidden bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-950 dark:to-purple-950">
          <img
            src={metadata.image}
            alt={metadata.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        </div>
      ) : (
        <div className="aspect-[3/4] bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
          <div className="text-white text-center px-6">
            <h3 className="text-2xl font-bold mb-2">{metadata.title}</h3>
            <p className="text-sm opacity-90">by {authorName}</p>
          </div>
        </div>
      )}

      <CardHeader className="flex-none">
        <CardTitle className="line-clamp-2 text-xl group-hover:text-primary transition-colors">
          {metadata.title}
        </CardTitle>
        {metadata.summary && (
          <CardDescription className="line-clamp-2">
            {truncateText(metadata.summary, 120)}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="flex-grow">
        {/* Tags */}
        {metadata.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {metadata.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {metadata.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{metadata.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Reading Stats */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            <span>{readingTime} min read</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            <span>{formatPublishDate(metadata.publishedAt || event.created_at)}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex-none pt-0">
        {/* Author Info */}
        <div className="flex items-center gap-2 w-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={authorAvatar} alt={authorName} />
            <AvatarFallback>{authorName[0]?.toUpperCase() || '?'}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{authorName}</p>
            <p className="text-xs text-muted-foreground truncate">
              {naddr.slice(0, 12)}...{naddr.slice(-8)}
            </p>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
