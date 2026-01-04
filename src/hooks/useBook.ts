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

export interface UseBookParams {
  author: string;
  identifier: string;
}

/**
 * Hook to fetch a single book by author pubkey and identifier
 */
export function useBook({ author, identifier }: UseBookParams) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['book', author, identifier],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(3000)]);

      const events = await nostr.query(
        [
          {
            kinds: [30023],
            authors: [author],
            '#d': [identifier],
            limit: 1,
          },
        ],
        { signal }
      );

      const book = events.find(validateBookEvent);
      return book || null;
    },
  });
}
