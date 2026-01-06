import { useState } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useUploadFile } from '@/hooks/useUploadFile';
import { generateSlug } from '@/lib/bookUtils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/useToast';
import { BookOpen, Eye, Upload, X, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { nip19 } from 'nostr-tools';
import { useNavigate } from 'react-router-dom';

type Chapter = {
  title: string;
  content: string;
  order: number;
};

function parseMarkdownChapters(markdown: string): Chapter[] {
  const lines = markdown.split('\n');
  const chapters: Chapter[] = [];
  let current: Chapter | null = null;
  let order = 1;

  for (const line of lines) {
    if (line.startsWith('## ')) {
      if (current) chapters.push(current);
      current = {
        title: line.replace('## ', '').trim(),
        content: '',
        order: order++,
      };
    } else if (current) {
      current.content += line + '\n';
    }
  }

  if (current) chapters.push(current);
  return chapters;
}

function extractTitleAndSummary(markdown: string) {
  const lines = markdown.split('\n');

  let title = '';
  let summary = '';
  let summaryLines: string[] = [];

  for (let line of lines) {
    if (!title && line.startsWith('# ')) {
      title = line.replace('# ', '').trim();
      continue;
    }

    if (title && !line.startsWith('## ')) {
      if (line.trim() !== '') {
        summaryLines.push(line.trim());
      }
    }

    if (line.startsWith('## ')) {
      break; // summary tylko do pierwszego rozdziału
    }
  }

  summary = summaryLines.join(' ').slice(0, 300); // max 300 znaków
  return { title, summary };
}

export function BookPublisher() {
  const { user } = useCurrentUser();
const { mutateAsync: createEventAsync, isPending } = useNostrPublish();
  const { mutateAsync: uploadFile, isPending: isUploading } = useUploadFile();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);


  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!identifier) {
      setIdentifier(generateSlug(value));
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const [[_, url]] = await uploadFile(file);
      setCoverImage(url);
      toast({
        title: 'Cover uploaded',
        description: 'Book cover image has been uploaded successfully.',
      });
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: 'Failed to upload cover image. Please try again.',
        variant: 'destructive',
      });
    }
  };

const handlePublish = async () => {
  if (!title || !identifier || !content) {
    toast({
      title: 'Missing data',
      description: 'Title, identifier and content are required.',
      variant: 'destructive',
    });
    return;
  }

  const chapters = parseMarkdownChapters(content);

  if (chapters.length === 0) {
    toast({
      title: 'No chapters found',
      description: 'Use ## Chapter title to define chapters.',
      variant: 'destructive',
    });
    return;
  }

  try {
    // 1️⃣ Publish chapters
    const publishedChapters: {
      title: string;
      order: number;
      eventId: string;
    }[] = [];

    for (const chapter of chapters) {
      const chapterIdentifier = `${identifier}:chapter:${chapter.order}`;

      const event = await createEventAsync({
        kind: 30023,
        content: chapter.content.trim(),
        tags: [
          ['d', chapterIdentifier],
          ['title', chapter.title],
          ['book', identifier],
          ['chapter', chapter.order.toString()],
          ['published_at', Math.floor(Date.now() / 1000).toString()],
        ],
      });

      if (!!coverImage) event.tags.push(['image', coverImage]);

      publishedChapters.push({
        title: chapter.title,
        order: chapter.order,
        eventId: event.id,
naddr: nip19.naddrEncode({
          kind: 30023,
          pubkey: event.pubkey,
          identifier: chapterIdentifier,
        })
      });
    }

    // 2️⃣ Publish BOOK MANIFEST
const manifestMarkdown = `# ${title}

${summary}

## Table of Contents
${publishedChapters
  .map(
    (ch, idx) =>
      `${idx + 1}. [${ch.title}](nostr:${ch.naddr})`
  )
  .join('\n')}
`;

    const manifestEvent = await createEventAsync({
      kind: 30023,
      content: manifestMarkdown,
      tags: [
        ['d', identifier],
        ['title', title],
        ['type', 'book'],
        ['published_at', Math.floor(Date.now() / 1000).toString()],
      ],
    });

    toast({
      title: 'Book published 🎉',
      description: `${chapters.length} chapters + manifest published`,
    });

    const naddr = nip19.naddrEncode({
      kind: 30023,
      pubkey: manifestEvent.pubkey,
      identifier,
    });

    navigate(`/${naddr}`);
  } catch (err) {
    console.error(err);
    toast({
      title: 'Publishing failed',
      description: 'An error occurred while publishing the book.',
      variant: 'destructive',
    });
  }
};

const handleMarkdownUpload = async (
  e: React.ChangeEvent<HTMLInputElement>
) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const text = await file.text();

  setContent(text);

  // auto-extract title & summary
  const { title: extractedTitle, summary: extractedSummary } =
    extractTitleAndSummary(text);

  if (extractedTitle) {
    setTitle(extractedTitle);
    if (!identifier) setIdentifier(generateSlug(extractedTitle));
  }

  if (extractedSummary) {
    setSummary(extractedSummary);
  }

  toast({
    title: "Markdown loaded",
    description: `Loaded ${file.name}`,
  });
};


  if (!user) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Login Required</CardTitle>
          <CardDescription>
            You must be logged in to publish books on Nostr.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <BookOpen className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Publish a Book</h1>
          <p className="text-muted-foreground">
            Share your story with the world on Nostr
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Editor */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Book Content</CardTitle>
              <CardDescription>
                Write your book in Markdown format
<div className="flex items-center gap-2 mb-3">
  <Button
    type="button"
    variant="outline"
    size="sm"
    onClick={() => document.getElementById('md-upload')?.click()}
  >
    Upload Markdown
  </Button>

  <input
    id="md-upload"
    type="file"
    accept=".md,.markdown,.txt"
    className="hidden"
    onChange={handleMarkdownUpload}
  />
</div>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs
  value={activeTab}
  onValueChange={(v) => {
    const tab = v as 'write' | 'preview';
    setActiveTab(tab);

    if (tab === 'preview') {
      const parsed = parseMarkdownChapters(content);
      setChapters(parsed);
      setActiveChapterIndex(0);
    }
  }}
>

                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="write">Write</TabsTrigger>
                  <TabsTrigger value="preview">
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="write" className="mt-4">

                  <Textarea
                    value={content}
                    onChange={(e) => {
    const newContent = e.target.value;
    setContent(newContent);

    // automatyczne uzupełnienie title i summary
    const { title: extractedTitle, summary: extractedSummary } = extractTitleAndSummary(newContent);

    if (extractedTitle && !title) {
      setTitle(extractedTitle);
      if (!identifier) setIdentifier(generateSlug(extractedTitle));
    }

    if (extractedSummary && !summary) {
      setSummary(extractedSummary);
    }
  }}
                    placeholder="Once upon a time..."
                    className="min-h-[500px] font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Supports Markdown formatting
                  </p>
                </TabsContent>

                <TabsContent value="preview" className="mt-4">
  {chapters.length === 0 ? (
    <p className="text-muted-foreground text-center py-8">
      Add chapters using <code>## Chapter title</code> to preview the book.
    </p>
  ) : (
    <div className="grid grid-cols-12 gap-6 min-h-[500px]">
      {/* TOC */}
      <aside className="col-span-12 md:col-span-4 lg:col-span-3">
        <Card className="p-4 sticky top-24">
          <h3 className="text-sm font-semibold mb-3">Table of Contents</h3>
          <ul className="space-y-1">
            {chapters.map((chapter, index) => (
              <li key={index}>
                <button
                  onClick={() => setActiveChapterIndex(index)}
                  className={`w-full text-left px-2 py-1 rounded text-sm transition ${
                    index === activeChapterIndex
                      ? 'bg-muted font-medium'
                      : 'hover:bg-muted/50'
                  }`}
                >
                  {chapter.order}. {chapter.title}
                </button>
              </li>
            ))}
          </ul>
        </Card>
      </aside>

      {/* READER */}
      <section className="col-span-12 md:col-span-8 lg:col-span-9">
        <article className="prose dark:prose-invert max-w-none leading-relaxed">
          <h1>{chapters[activeChapterIndex].title}</h1>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {chapters[activeChapterIndex].content}
          </ReactMarkdown>
        </article>

        <div className="flex justify-between mt-10">
          <Button
            variant="outline"
            disabled={activeChapterIndex === 0}
            onClick={() => setActiveChapterIndex((i) => i - 1)}
          >
            Previous
          </Button>

          <Button
            variant="outline"
            disabled={activeChapterIndex === chapters.length - 1}
            onClick={() => setActiveChapterIndex((i) => i + 1)}
          >
            Next
          </Button>
        </div>
      </section>
    </div>
  )}
</TabsContent>

              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Metadata Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Book Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="My Amazing Book"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="identifier">Identifier *</Label>
                <Input
                  id="identifier"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="my-amazing-book"
                />
                <p className="text-xs text-muted-foreground">
                  Unique identifier for your book (URL-safe)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="summary">Summary</Label>
                <Textarea
                  id="summary"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="A brief description of your book..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cover">Cover Image</Label>
                {coverImage ? (
                  <div className="relative">
                    <img
                      src={coverImage}
                      alt="Cover preview"
                      className="w-full aspect-[3/4] object-cover rounded-lg"
                    />
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute top-2 right-2"
                      onClick={() => setCoverImage('')}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed rounded-lg p-6 text-center">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <Label
                      htmlFor="cover-upload"
                      className="cursor-pointer text-sm text-primary hover:underline"
                    >
                      Upload cover image
                    </Label>
                    <Input
                      id="cover-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                      disabled={isUploading}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <div className="flex gap-2">
                  <Input
                    id="tags"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    placeholder="fiction"
                  />
                  <Button type="button" onClick={handleAddTag}>
                    Add
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                        <button
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Button
            size="lg"
            className="w-full"
            onClick={handlePublish}
            disabled={isPending || isUploading}
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Publishing...
              </>
            ) : (
              <>
                <BookOpen className="h-4 w-4 mr-2" />
                Publish Book
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
