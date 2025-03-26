import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import StoryCard from '@/components/StoryCard';
import { Button } from '@/components/Button';
import { useFiles } from '@/context/FileContext';
import { ChevronLeft, ClipboardCopy, Download, Check, Share2 } from 'lucide-react';
import { toast } from "sonner";
import HistoryList from '@/components/HistoryList';
import LoginButton from '@/components/LoginButton';

// Define a type for Story to ensure type safety
interface Story {
  id: string;
  title: string;
  description: string;
  criteria: { description: string }[];
}

const Results: React.FC = () => {
  const { 
    stories, 
    clearFiles, 
    createShareLink, 
    user,
    // Assuming you'll add these methods to your context
    setStoriesInContext 
  } = useFiles();
  
  const navigate = useNavigate();
  const [isCopied, setIsCopied] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [localStories, setLocalStories] = useState<Story[]>([]);

  // Comprehensive initialization and persistence logic
  useEffect(() => {
    // Priority order:
    // 1. Context stories (most recent)
    // 2. Local storage stories (fallback)
    // 3. Empty array
    const initializeStories = () => {
      if (stories && stories.length > 0) {
        // If context has stories, use those
        setLocalStories(stories);
        localStorage.setItem('figgytales_stories', JSON.stringify(stories));
        return;
      }

      // Try to load from localStorage
      const savedStoriesJson = localStorage.getItem('figgytales_stories');
      if (savedStoriesJson) {
        try {
          const savedStories = JSON.parse(savedStoriesJson);
          if (Array.isArray(savedStories) && savedStories.length > 0) {
            // Restore stories from localStorage
            setLocalStories(savedStories);
            
            // Update context (in case it was cleared)
            setStoriesInContext(savedStories);
            return;
          }
        } catch (error) {
          console.error('Failed to parse saved stories:', error);
        }
      }

      // If no stories found, set to empty array
      setLocalStories([]);
    };

    initializeStories();
  }, [stories, setStoriesInContext]);

  // Additional persistence mechanism
  useEffect(() => {
    if (localStories.length > 0) {
      localStorage.setItem('figgytales_stories', JSON.stringify(localStories));
    }
  }, [localStories]);

  const copyAllToClipboard = useCallback(() => {
    if (localStories.length === 0) return;
    
    let textToCopy = localStories.map((story, i) => 
      `${story.title}\n${story.description}\n\nAcceptance Criteria:\n${
        story.criteria.map((c, j) => `${j + 1}. ${c.description}`).join('\n')
      }${i < localStories.length - 1 ? '\n\n' + '-'.repeat(40) + '\n\n' : ''}`
    ).join('');
    
    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
        toast.success("All stories copied to clipboard");
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
        toast.error("Failed to copy to clipboard");
      });
  }, [localStories]);

  const downloadAsCsv = useCallback(() => {
    if (localStories.length === 0) return;
    
    let csvContent = "Title,Description,Acceptance Criteria\n";
    
    localStories.forEach(story => {
      const criteriaText = story.criteria.map(c => 
        c.description.replace(/"/g, '""')
      ).join(' | ');
      
      csvContent += `"${story.title.replace(/"/g, '""')}","${story.description.replace(/"/g, '""')}","${criteriaText}"\n`;
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'figgytales-stories.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success("CSV file downloaded");
  }, [localStories]);

  const handleShareLink = async () => {
    setIsSharing(true);
    await createShareLink();
    setIsSharing(false);
  };
  
// In your Results component
const startOver = () => {
  clearFiles();
  navigate('/', { replace: true }); // Add replace option to prevent back navigation issues
};

// In your "Go to Upload" button
<Button 
  onClick={() => navigate('/', { replace: true })}
  className="mt-4"
>
  Go to Upload
</Button>
  };
  
  return (
    <main className="min-h-screen flex flex-col">
      <Header />
      
      <div className="flex-1 max-w-5xl w-full mx-auto px-4 md:px-6 pb-20">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 animate-fade-in">
          <Button 
            variant="outline" 
            onClick={startOver}
            className="group"
          >
            <ChevronLeft size={16} className="mr-1 group-hover:-translate-x-1 transition-transform" />
            Start Over
          </Button>
          
          <div className="flex gap-3 self-end sm:self-auto">
            <Button 
              variant="secondary" 
              onClick={copyAllToClipboard}
              disabled={localStories.length === 0}
            >
              {isCopied ? <Check size={16} className="mr-2" /> : <ClipboardCopy size={16} className="mr-2" />}
              {isCopied ? 'Copied' : 'Copy All'}
            </Button>
            
            <Button
              variant="secondary"
              onClick={handleShareLink}
              disabled={isSharing || localStories.length === 0}
            >
              <Share2 size={16} className="mr-2" />
              Share
            </Button>
            
            <Button 
              onClick={downloadAsCsv}
              disabled={localStories.length === 0}
            >
              <Download size={16} className="mr-2" />
              Download CSV
            </Button>
          </div>
        </div>

        {!user && (
          <div className="bg-secondary/30 rounded-xl p-4 mb-6 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Sign in to save your generated stories to your history</p>
            <LoginButton />
          </div>
        )}
        
        {user && <HistoryList className="mb-8" />}
        
        {localStories.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground">No stories generated yet. Upload design files and generate stories.</p>
            <Button 
              onClick={() => navigate('/')}
              className="mt-4"
            >
              Go to Upload
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {localStories.map((story, i) => (
              <StoryCard key={story.id} story={story} index={i} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
};

export default Results;
