import { useSeoMeta } from '@unhead/react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBooks } from '@/hooks/useBooks';
import { BookCard } from '@/components/BookCard';
import { LoginArea } from '@/components/auth/LoginArea';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, PenTool, Search, TrendingUp, Clock, Heart } from 'lucide-react';
import { nip19 } from 'nostr-tools';

const Index = () => {
  useSeoMeta({
    title: 'NostrBooks - Publish & Discover Books on Nostr',
    description: 'A decentralized book publishing platform built on Nostr. Write, publish, and discover amazing books from authors worldwide.',
  });

  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('recent');

  const { data: recentBooks, isLoading: isLoadingRecent } = useBooks({ limit: 12 });
  const { data: fictionBooks, isLoading: isLoadingFiction } = useBooks({
    limit: 12,
    tags: ['fiction', 'novel', 'story']
  });
  const { data: nonFictionBooks, isLoading: isLoadingNonFiction } = useBooks({
    limit: 12,
    tags: ['non-fiction', 'education', 'history', 'science']
  });

  const handleBookClick = (event: any) => {
    const identifier = event.tags.find(([name]: string[]) => name === 'd')?.[1];
    if (!identifier) return;

    const naddr = nip19.naddrEncode({
      kind: event.kind,
      pubkey: event.pubkey,
      identifier,
    });
    navigate(`/${naddr}`);
  };

  const filteredBooks = (books: any[] | undefined) => {
    if (!books) return [];
    if (!searchQuery.trim()) return books;

    const query = searchQuery.toLowerCase();
    return books.filter((book) => {
      const title = book.tags.find(([name]: string[]) => name === 'title')?.[1] || '';
      const summary = book.tags.find(([name]: string[]) => name === 'summary')?.[1] || '';
      return title.toLowerCase().includes(query) || summary.toLowerCase().includes(query);
    });
  };

  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <Card key={i} className="h-full flex flex-col">
          <Skeleton className="aspect-[3/4] w-full" />
          <div className="p-4 space-y-3 flex-1 flex flex-col">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <div className="flex-1" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="h-8 w-full" />
          </div>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="text-center space-y-8">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-2xl">
                <BookOpen className="h-16 w-16 text-white" />
              </div>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              NostrBooks
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              A decentralized book publishing platform on Nostr. Write your stories, share your knowledge, and discover amazing books from authors worldwide.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <Button
                size="lg"
                className="text-lg px-8 py-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                onClick={() => navigate('/publish')}
              >
                <PenTool className="h-5 w-5 mr-2" />
                Publish Your Book
              </Button>
              <LoginArea className="w-full sm:w-auto" />
            </div>
          </div>
        </div>
      </div>

      {/* Search Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 mb-16">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search for books, authors, topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 py-6 text-lg shadow-xl bg-card"
          />
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-indigo-500/10 to-indigo-600/5 border-indigo-200 dark:border-indigo-800">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-3 bg-indigo-600 rounded-lg">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">{recentBooks?.length || 0}+</p>
                <p className="text-sm text-muted-foreground">Published Books</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-200 dark:border-purple-800">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-3 bg-purple-600 rounded-lg">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">24/7</p>
                <p className="text-sm text-muted-foreground">Always Available</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-pink-500/10 to-pink-600/5 border-pink-200 dark:border-pink-800">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-3 bg-pink-600 rounded-lg">
                <Heart className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">∞</p>
                <p className="text-sm text-muted-foreground">Censorship Resistant</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Books Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-8">
          <TabsList className="grid w-full md:w-auto md:inline-grid grid-cols-3 gap-4">
            <TabsTrigger value="recent" className="text-base">
              Recent Books
            </TabsTrigger>
            <TabsTrigger value="fiction" className="text-base">
              Fiction
            </TabsTrigger>
            <TabsTrigger value="non-fiction" className="text-base">
              Non-Fiction
            </TabsTrigger>
          </TabsList>

          <TabsContent value="recent" className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold mb-2">Recently Published</h2>
              <p className="text-muted-foreground">
                Discover the latest books published on Nostr
              </p>
            </div>

            {isLoadingRecent ? (
              <LoadingSkeleton />
            ) : filteredBooks(recentBooks).length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredBooks(recentBooks).map((book) => (
                  <BookCard
                    key={book.id}
                    event={book}
                    onClick={() => handleBookClick(book)}
                  />
                ))}
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="py-12 px-8 text-center">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    {searchQuery ? 'No books found matching your search.' : 'No books found. Be the first to publish!'}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="fiction" className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold mb-2">Fiction</h2>
              <p className="text-muted-foreground">
                Explore imaginative stories and novels
              </p>
            </div>

            {isLoadingFiction ? (
              <LoadingSkeleton />
            ) : filteredBooks(fictionBooks).length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredBooks(fictionBooks).map((book) => (
                  <BookCard
                    key={book.id}
                    event={book}
                    onClick={() => handleBookClick(book)}
                  />
                ))}
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="py-12 px-8 text-center">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    {searchQuery ? 'No fiction books found matching your search.' : 'No fiction books found yet.'}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="non-fiction" className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold mb-2">Non-Fiction</h2>
              <p className="text-muted-foreground">
                Learn from educational and informative works
              </p>
            </div>

            {isLoadingNonFiction ? (
              <LoadingSkeleton />
            ) : filteredBooks(nonFictionBooks).length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredBooks(nonFictionBooks).map((book) => (
                  <BookCard
                    key={book.id}
                    event={book}
                    onClick={() => handleBookClick(book)}
                  />
                ))}
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="py-12 px-8 text-center">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    {searchQuery ? 'No non-fiction books found matching your search.' : 'No non-fiction books found yet.'}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Footer */}
      <footer className="border-t bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center space-y-4">
            <div className="flex justify-center gap-2 items-center text-sm text-muted-foreground">
              <BookOpen className="h-4 w-4" />
              <span>
                Vibed with{' '}
                <a
                  href="https://shakespeare.diy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Shakespeare
                </a>
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              A decentralized book publishing platform built on the Nostr protocol
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
