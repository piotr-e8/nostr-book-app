import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import type { NostrEvent } from '@nostrify/nostrify';

export function useBookRoot(bookSlug?: string) {
  const { nostr } = useNostr();

  return useQuery<NostrEvent | null>({
    queryKey: ['book-root', bookSlug],
    enabled: !!bookSlug,
    queryFn: async () => {
      if (!bookSlug) return null;

      const events = await nostr.query([
        {
          kinds: [30023],
          '#d': [bookSlug],
          limit: 1,
        },
      ]);

      return events[0] ?? null;
    },
  });
}
