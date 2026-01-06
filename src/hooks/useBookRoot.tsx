import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import type { NostrEvent } from '@nostrify/nostrify';

export function useBookRoot(bookSlug?: string, bookAuthor?: string) {
  const { nostr } = useNostr();

  return useQuery<NostrEvent | null>({
    queryKey: ['book-root', bookSlug, bookAuthor],
    queryFn: async (c) => {
      console.log({bookSlug, bookAuthor});
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(3000)]);

      if (!bookSlug || !bookAuthor) return null;

      const events = await nostr.query([
        {
          kinds: [30023],
          authors: [bookAuthor],
          '#d': [bookSlug],
          limit: 1,
        },
      ], { signal});

      console.log({event: events[0] ?? null});
      
      return events[0] ?? null;
    },
  });
}
