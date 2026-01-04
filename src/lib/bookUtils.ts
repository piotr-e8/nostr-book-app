import type { NostrEvent } from '@nostrify/nostrify';

export interface BookMetadata {
  title: string;
  identifier: string;
  summary?: string;
  image?: string;
  publishedAt?: number;
  tags: string[];
}

/**
 * Extract book metadata from a NIP-23 event
 */
export function extractBookMetadata(event: NostrEvent): BookMetadata {
  const title = event.tags.find(([name]) => name === 'title')?.[1] || 'Untitled';
  const identifier = event.tags.find(([name]) => name === 'd')?.[1] || '';
  const summary = event.tags.find(([name]) => name === 'summary')?.[1];
  const image = event.tags.find(([name]) => name === 'image')?.[1];
  const publishedAtStr = event.tags.find(([name]) => name === 'published_at')?.[1];
  const publishedAt = publishedAtStr ? parseInt(publishedAtStr, 10) : event.created_at;
  const tags = event.tags.filter(([name]) => name === 't').map(([, value]) => value);

  return {
    title,
    identifier,
    summary,
    image,
    publishedAt,
    tags,
  };
}

/**
 * Estimate reading time in minutes based on content
 */
export function estimateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}

/**
 * Format a Unix timestamp to a readable date string
 */
export function formatPublishDate(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Truncate text to a specified length with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

/**
 * Generate a URL-safe slug from a title
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}
