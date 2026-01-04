import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import type { NostrEvent } from '@nostrify/nostrify';

/**
 * Validates a NIP-23 long-form content event to ensure it has required book fields
 */
function validateBookEvent(event: NostrEvent): boolean {
  if (event.kind !== 30023) return false;

  const title = event.tags.find(([name]) => name === 'title')?.[1];
  const d = event.tags.find(([name]) => name === 'd')?.[1];

  // Books must have a title and identifier
  return !!(title && d);
}

export interface UseBookOptions {
  limit?: number;
  authors?: string[];
  tags?: string[];
}

/**
 * Hook to fetch books (NIP-23 long-form content events)
 */
export function useBooks(options: UseBookOptions = {}) {
  const { nostr } = useNostr();
  const { limit = 20, authors, tags } = options;

  return useQuery({
    queryKey: ['books', limit, authors, tags],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(3000)]);

      const filter: Record<string, unknown> = {
        kinds: [30023],
        limit,
      };

      if (authors && authors.length > 0) {
        filter.authors = authors;
      }

      if (tags && tags.length > 0) {
        filter['#t'] = tags;
      }

      const events = await nostr.query([filter], { signal });

      // Filter and validate book events
      return events.filter(validateBookEvent);
    },
  });
}
