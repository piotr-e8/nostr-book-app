import { useSeoMeta } from '@unhead/react';
import { BookPublisher } from '@/components/BookPublisher';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Publish = () => {
  const navigate = useNavigate();

  useSeoMeta({
    title: 'Publish Your Book - NostrBooks',
    description: 'Write and publish your book on the Nostr protocol. Share your stories and knowledge with the world.',
  });

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

        <BookPublisher />
      </div>
    </div>
  );
};

export default Publish;
