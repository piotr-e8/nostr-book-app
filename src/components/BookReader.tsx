import type { NostrEvent } from '@nostrify/nostrify';
import { useState } from 'react';
import { useAuthor } from '@/hooks/useAuthor';
import { extractBookMetadata, estimateReadingTime, formatPublishDate } from '@/lib/bookUtils';
import { genUserName } from '@/lib/genUserName';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { BookOpen, Clock, Calendar, Share2, Heart, MessageCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useToast } from '@/hooks/useToast';
import { useBookRoot } from '@/hooks/useBookRoot';
import { nip19 } from 'nostr-tools';
import { useParams } from 'react-router-dom';
import { Link } from 'react-router-dom';

function extractTOC(markdown?: string) {
  console.log({title: "markdown: " + markdown}); 
  if (!markdown) return [];

  const toc: { title: string; naddr: string }[] = [];
  const regex = /\[([^\]]+)\]\(nostr:([^)]+)\)/g;

  let match;
  while ((match = regex.exec(markdown))) {
    toc.push({ title: match[1], naddr: match[2] });
  }
  console.log({toc});
  return toc;
}


interface BookReaderProps {
  event: NostrEvent;
}

export function BookReader({ event }: BookReaderProps) {
  const { toast } = useToast();
  const author = useAuthor(event.pubkey);
  const metadata = extractBookMetadata(event);
  const readingTime = estimateReadingTime(event.content);
  const [liked, setLiked] = useState(false);

  const authorName = author.data?.metadata?.name || genUserName(event.pubkey);
  const authorAvatar = author.data?.metadata?.picture;
  const authorAbout = author.data?.metadata?.about;

  const [fontSize, setFontSize] = useState(18);
  const bookSlug =
  event.tags.find((t) => t[0] === 'book')?.[1] ??
  event.tags.find((t) => t[0] === 'd')?.[1];
const bookRoot = useBookRoot(bookSlug, event.pubkey);
const toc = extractTOC(bookRoot.data?.content);
const [tocOpen, setTocOpen] = useState(false);
const params = useParams();


  const naddr = nip19.naddrEncode({
    kind: event.kind,
    pubkey: event.pubkey,
    identifier: metadata.identifier,
  });

  const handleShare = async () => {
    const url = `${window.location.origin}/${naddr}`;
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: 'Link copied!',
        description: 'Book link has been copied to clipboard.',
      });
    } catch (err) {
      toast({
        title: 'Failed to copy',
        description: 'Please copy the link manually.',
        variant: 'destructive',
      });
    }
  };

  const handleLike = () => {
    setLiked(!liked);
    toast({
      title: liked ? 'Removed from favorites' : 'Added to favorites',
      description: liked ? 'Book removed from your reading list.' : 'Book added to your reading list.',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Hero Section */}
      <div className="relative">
        {metadata.image && (
          <div className="absolute inset-0 h-[400px] overflow-hidden">
            <img
              src={metadata.image}
              alt={metadata.title}
              className="w-full h-full object-cover opacity-20 blur-2xl"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/80 to-background" />
          </div>
        )}

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Book Cover */}
            {metadata.image ? (
              <div className="w-full md:w-64 flex-shrink-0">
                <div className="aspect-[3/4] rounded-lg overflow-hidden shadow-2xl">
                  <img
                    src={metadata.image}
                    alt={metadata.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            ) : (
              <div className="w-full md:w-64 flex-shrink-0">
                <div className="aspect-[3/4] rounded-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-2xl">
                  <BookOpen className="h-24 w-24 text-white opacity-80" />
                </div>
              </div>
            )}

            {/* Book Info */}
            <div className="flex-1">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                {metadata.title}
              </h1>

              {metadata.summary && (
                <p className="text-lg text-muted-foreground mb-6">
                  {metadata.summary}
                </p>
              )}

              {/* Tags */}
              {metadata.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {metadata.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-sm">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Stats */}
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-6">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{readingTime} min read</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{formatPublishDate(metadata.publishedAt || event.created_at)}</span>
                </div>
              </div>

              {/* Author */}
              <div className="flex items-center gap-3 mb-6 p-4 bg-card rounded-lg border">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={authorAvatar} alt={authorName} />
                  <AvatarFallback>{authorName[0]?.toUpperCase() || '?'}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{authorName}</p>
                  {authorAbout && (
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {authorAbout}
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3">
                <Button onClick={handleLike} variant={liked ? 'default' : 'outline'}>
                  <Heart className={`h-4 w-4 mr-2 ${liked ? 'fill-current' : ''}`} />
                  {liked ? 'Favorited' : 'Add to Favorites'}
                </Button>
                <Button onClick={handleShare} variant="outline">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
                <Button variant="outline">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Comments
                </Button>
                <Button
  variant="outline"
  onClick={() => setTocOpen(true)}
>
  ☰ Contents
</Button>

              </div>
            </div>
          </div>
        </div>
      </div>

      <Separator className="my-8" />

      {/* Book Content */}
<div
  className="
    max-w-[720px]
    mx-auto
    px-6
    pb-24
    h-[calc(100vh-120px)]
    overflow-y-auto
    scroll-smooth
    snap-y
    snap-mandatory
  "
>

        <div className="flex justify-center gap-2 mb-6 sticky top-2 z-10">
  <Button size="sm" variant="outline" onClick={() => setFontSize(s => Math.max(14, s - 2))}>A−</Button>
  <Button size="sm" variant="outline" onClick={() => setFontSize(s => Math.min(26, s + 2))}>A+</Button>
</div>

        <article
  className="
    prose
    prose-lg
    dark:prose-invert
    leading-relaxed
    prose-p:my-6
    prose-headings:scroll-mt-24
    snap-start
  "
          style={{ fontSize }}
>
          <ReactMarkdown
  remarkPlugins={[remarkGfm]}
  components={{
    h2: ({ node, ...props }) => (
      <h2 className="snap-start" {...props} />
    ),
    a: ({ node, children, ...props }) => {
      // node.url zawiera markdownowy link
      const url = node.url as string;

      if (url?.startsWith('nostr:')) {
        const naddr = url.replace('nostr:', '');
        return (
          <Link
            to={`/${naddr}`}
            {...props}
            className="text-primary underline"
          >
            {children}
          </Link>
        );
      }

      return <a href={url} {...props}>{children}</a>;
    },
  }}
>
  {event.content}
</ReactMarkdown>

        </article>
      </div>

      {/* Footer */}
      <div className="border-t bg-muted/30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-16 w-16">
                <AvatarImage src={authorAvatar} alt={authorName} />
                <AvatarFallback>{authorName[0]?.toUpperCase() || '?'}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-lg">Written by {authorName}</p>
                {authorAbout && (
                  <p className="text-sm text-muted-foreground">{authorAbout}</p>
                )}
              </div>
            </div>
            <Button variant="outline">View More Books</Button>
          </div>
        </div>
      </div>
      {tocOpen && (
  <div className="fixed inset-0 z-50 bg-black/40">
    <div className="absolute right-0 top-0 h-full w-80 bg-background shadow-xl p-6 overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold text-lg">Contents</h2>
        <button onClick={() => setTocOpen(false)}>✕</button>
      </div>

      <nav className="space-y-2">
        {toc.map((item) => (
          <a
  key={item.naddr}
  href={`/${item.naddr}`}
  className={`block px-3 py-2 rounded ${
    params.nip19 === item.naddr
      ? 'bg-primary text-primary-foreground'
      : 'hover:bg-muted'
  }`}
>
  {item.title}
</a>
        ))}
      </nav>
    </div>
  </div>
)}

    </div>
  );
}
