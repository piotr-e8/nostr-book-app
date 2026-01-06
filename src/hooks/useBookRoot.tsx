import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import type { NostrEvent } from '@nostrify/nostrify';

export function useBookRoot(bookSlug?: string, bookAuthor?: string) {
  const { nostr } = useNostr();

  return useQuery<NostrEvent | null>({
    queryKey: ['book-root', bookSlug, bookAuthor],
    enabled: !!bookSlug && !!bookAuthor,
    queryFn: async () => {
      console.log({bookSlug, bookAuthor});
      if (!bookSlug || !bookAuthor) return null;

      const events = await nostr.query([
        {
          kinds: [30023],
          authors: [bookAuthor],
          '#d': [bookSlug],
          limit: 1,
        },
      ]);

      console.log({event: events[0] ?? null});
      
      return events[0] ?? null;
    },
  });
}
