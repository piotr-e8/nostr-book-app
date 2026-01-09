import { nip19 } from 'nostr-tools';
import { useParams, useNavigate } from 'react-router-dom';
import { useBook } from '@/hooks/useBook';
import { BookReader } from '@/components/BookReader';
import { BookReaderImmersive } from '@/components/BookReaderImmersive';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, BookOpen } from 'lucide-react';
import NotFound from './NotFound';

export function NIP19Page() {
  const { nip19: identifier } = useParams<{ nip19: string }>();
  const navigate = useNavigate();

  if (!identifier) {
    return <NotFound />;
  }

  let decoded;
  try {
    decoded = nip19.decode(identifier);
  } catch {
    return <NotFound />;
  }

  const { type, data } = decoded;

  // Handle book viewing (naddr for kind 30023)
  if (type === 'naddr') {
    const addrData = data as nip19.AddressPointer;

    // Only handle kind 30023 (books) for now
    if (addrData.kind === 30023) {
      const { data: book, isLoading, error } = useBook({
        author: addrData.pubkey,
        identifier: addrData.identifier,
      });

      if (isLoading) {
        return (
          <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <Button
                variant="ghost"
                onClick={() => navigate('/')}
                className="mb-6"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                  <Skeleton className="aspect-[3/4] w-full rounded-lg" />
                </div>
                <div className="lg:col-span-2 space-y-4">
                  <Skeleton className="h-12 w-3/4" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-5/6" />
                  <div className="space-y-2 pt-8">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-4/5" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      }

      if (error || !book) {
        return (
          <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
              <Button
                variant="ghost"
                onClick={() => navigate('/')}
                className="mb-6"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>

              <Card className="border-dashed">
                <CardContent className="py-12 px-8 text-center">
                  <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h2 className="text-2xl font-bold mb-2">Book Not Found</h2>
                  <p className="text-muted-foreground mb-6">
                    The book you're looking for doesn't exist or couldn't be loaded.
                  </p>
                  <Button onClick={() => navigate('/')}>
                    Browse Books
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        );
      }

      return (
        <div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </div>
          // <BookReader event={book} />
          <BookReaderImmersive event={book} />
        </div>
      );
    }

    // Other naddr types not yet implemented
    return <div>Addressable event placeholder (kind {addrData.kind})</div>;
  }

  // Handle other identifier types
  switch (type) {
    case 'npub':
    case 'nprofile':
      // AI agent should implement profile view here
      return <div>Profile placeholder</div>;

    case 'note':
      // AI agent should implement note view here
      return <div>Note placeholder</div>;

    case 'nevent':
      // AI agent should implement event view here
      return <div>Event placeholder</div>;

    default:
      return <NotFound />;
  }
}
