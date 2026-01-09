import type { NostrEvent } from '@nostrify/nostrify';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Link } from 'react-router-dom';
import { useBookRoot } from '@/hooks/useBookRoot';

interface Props {
  event: NostrEvent;
}

function extractTOC(markdown?: string) {
  if (!markdown) return [];
  const regex = /\[([^\]]+)\]\(nostr:([^)]+)\)/g;

  const toc: { title: string; naddr: string }[] = [];
  let match;
  while ((match = regex.exec(markdown))) {
    toc.push({ title: match[1], naddr: match[2] });
  }
  return toc;
}

export function BookReaderImmersive({ event }: Props) {
  const [fontSize, setFontSize] = useState(18);
  const [tocOpen, setTocOpen] = useState(false);

  const bookSlug =
    event.tags.find(t => t[0] === 'book')?.[1] ??
    event.tags.find(t => t[0] === 'd')?.[1];

  const bookRoot = useBookRoot(bookSlug);
  const toc = extractTOC(bookRoot.data?.content);

  return (
    <div className="min-h-screen bg-[#faf9f7] text-[#1c1c1c]">
      {/* Header */}
      <header className="sticky top-0 z-20 backdrop-blur bg-[#faf9f7]/80 border-b">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <h1 className="text-lg font-semibold truncate">
            {event.tags.find(t => t[0] === 'title')?.[1]}
          </h1>
        </div>
      </header>

      {/* Reader */}
      <main className="max-w-[680px] mx-auto px-6 py-16">
        <article
          className="prose prose-lg leading-[1.75]
                     prose-p:my-6
                     prose-headings:font-semibold
                     prose-headings:scroll-mt-24"
          style={{ fontSize }}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              a: ({ node, children }) => {
                const url = node.url as string;

                if (url?.startsWith('nostr:')) {
                  const naddr = url.replace('nostr:', '');
                  return (
                    <Link
                      to={`/${naddr}`}
                      className="text-blue-600 underline"
                    >
                      {children}
                    </Link>
                  );
                }

                return (
                  <a href={url} className="underline">
                    {children}
                  </a>
                );
              },
            }}
          >
            {event.content}
          </ReactMarkdown>
        </article>
      </main>

      {/* Floating controls */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-2 z-30">
        <button
          onClick={() => setTocOpen(true)}
          className="px-4 py-2 rounded-full bg-white shadow border"
        >
          ☰
        </button>

        <button
          onClick={() => setFontSize(s => Math.min(26, s + 2))}
          className="px-4 py-2 rounded-full bg-white shadow border"
        >
          A+
        </button>

        <button
          onClick={() => setFontSize(s => Math.max(14, s - 2))}
          className="px-4 py-2 rounded-full bg-white shadow border"
        >
          A−
        </button>
      </div>

      {/* TOC Drawer */}
      {tocOpen && (
        <div className="fixed inset-0 z-40 bg-black/40">
          <aside className="absolute right-0 top-0 h-full w-80 bg-white p-6 overflow-y-auto">
            <div className="flex justify-between mb-4">
              <h2 className="font-semibold">Contents</h2>
              <button onClick={() => setTocOpen(false)}>✕</button>
            </div>

            <nav className="space-y-2">
              {toc.map(item => (
                <Link
                  key={item.naddr}
                  to={`/${item.naddr}`}
                  className="block px-3 py-2 rounded hover:bg-gray-100"
                  onClick={() => setTocOpen(false)}
                >
                  {item.title}
                </Link>
              ))}
            </nav>
          </aside>
        </div>
      )}
    </div>
  );
}
