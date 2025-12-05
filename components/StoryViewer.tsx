import React, { useEffect, useState } from 'react';
import { X, Clover, Share2, Trash2, MapPin } from 'lucide-react';
import { Story } from '../types';

interface StoryViewerProps {
  stories: Story[];
  initialStoryIndex: number;
  currentUserId: string;
  onClose: () => void;
  onMarkViewed: (id: string) => void;
  onDelete: (id: string) => void;
  onLike: (id: string) => void;
  onShare?: (text: string) => void;
}

export const StoryViewer: React.FC<StoryViewerProps> = ({ 
  stories, 
  initialStoryIndex, 
  currentUserId,
  onClose, 
  onMarkViewed,
  onDelete,
  onLike,
  onShare
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialStoryIndex);
  const [progress, setProgress] = useState(0);

  // Safety check if stories change
  if (stories.length === 0) {
    onClose();
    return null;
  }

  const currentStory = stories[currentIndex];
  if (!currentStory) {
    onClose();
    return null;
  }

  const isOwner = currentStory.userId === currentUserId;

  useEffect(() => {
    // Reset progress when current story ID changes
    setProgress(0);
    onMarkViewed(currentStory.id);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          handleNext();
          return 100;
        }
        return prev + 2; // Speed of progress bar
      });
    }, 100); // Update every 100ms

    return () => clearInterval(interval);
  }, [currentStory.id]); // Changed dependency to ID to prevent reset on Like (when object reference changes)

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleDelete = () => {
    if (confirm("¿Eliminar esta historia?")) {
      onDelete(currentStory.id);
      // If there are more stories, they will re-render. If empty, component closes.
      if (stories.length <= 1) onClose();
      else if (currentIndex >= stories.length - 1) setCurrentIndex(currentIndex - 1);
    }
  };

  const handleShareClick = () => {
      if (onShare) {
          onShare(`Mira esta historia de ${currentStory.userName} en Manabí Travel!`);
      }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
      {/* Background blur */}
      <div 
        className="absolute inset-0 bg-cover bg-center blur-xl opacity-30 scale-110"
        style={{ backgroundImage: `url(${currentStory.imageUrl})` }}
      />

      {/* Main Container */}
      <div className="relative w-full md:w-[400px] h-full md:h-[90vh] bg-black md:rounded-2xl overflow-hidden shadow-2xl flex flex-col">
        
        {/* Story Content Layer */}
        <div className="absolute inset-0 z-0">
          <img 
            src={currentStory.imageUrl} 
            alt="Story" 
            className="w-full h-full object-cover"
          />
          {/* Gradient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60 pointer-events-none" />
        </div>

        {/* Progress Bars */}
        <div className="absolute top-4 left-4 right-4 flex space-x-1 z-20">
          {stories.map((story, idx) => (
            <div key={story.id} className="h-1 bg-white/30 flex-1 rounded-full overflow-hidden">
              <div 
                className={`h-full bg-white transition-all duration-100 ease-linear ${
                  idx < currentIndex ? 'w-full' : idx === currentIndex ? '' : 'w-0'
                }`}
                style={{ width: idx === currentIndex ? `${progress}%` : undefined }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-8 left-4 right-4 flex items-center justify-between z-20 text-white">
          <div className="flex items-center space-x-3">
            <img src={currentStory.userAvatar} className="w-8 h-8 rounded-full border border-white/50" alt="" />
            <div>
              <p className="font-bold text-sm shadow-black drop-shadow-md">{currentStory.userName}</p>
              {currentStory.location && (
                <p className="text-xs text-cyan-300 flex items-center shadow-black drop-shadow-sm">
                  <MapPin size={10} className="mr-1" />
                  {currentStory.location}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {isOwner && (
               <button onClick={handleDelete} className="p-2 hover:bg-white/20 hover:text-red-400 rounded-full transition-colors z-50">
                  <Trash2 size={24} />
               </button>
            )}
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors z-50">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Tap Areas (Navigation) */}
        <div className="absolute inset-0 z-10 flex">
          <div className="w-1/3 h-full" onClick={handlePrev} />
          <div className="w-2/3 h-full" onClick={handleNext} />
        </div>

        {/* Footer Area: Caption & Actions */}
        <div className="absolute bottom-0 left-0 right-0 p-4 pb-8 z-20 flex flex-col space-y-4">
          
          {/* Caption */}
          {currentStory.caption && (
            <div className="bg-black/30 backdrop-blur-sm p-3 rounded-xl text-white border border-white/10 self-start max-w-[90%]">
              <p className="text-sm">{currentStory.caption}</p>
            </div>
          )}

          {/* Actions Bar */}
          <div className="flex items-center space-x-4">
            <input 
              type="text" 
              placeholder="Responder historia..." 
              className="flex-1 bg-transparent border border-white/40 rounded-full px-4 py-3 text-white placeholder-white/70 focus:border-white outline-none backdrop-blur-sm transition-colors text-sm"
            />
            <div className="flex items-center gap-2">
                <button 
                  onClick={() => onLike(currentStory.id)}
                  className={`p-2 rounded-full transition-all active:scale-90 ${currentStory.isLiked ? 'text-green-400 bg-white/20' : 'text-white hover:bg-white/10'}`}
                >
                  <Clover size={28} fill={currentStory.isLiked ? "currentColor" : "none"} />
                  {currentStory.likes && currentStory.likes > 0 ? (
                    <span className="absolute -top-1 -right-1 bg-green-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold">
                      {currentStory.likes}
                    </span>
                  ) : null}
                </button>
                <button 
                    onClick={handleShareClick}
                    className="text-white hover:scale-110 hover:text-cyan-400 transition-all p-2 rounded-full hover:bg-white/10"
                >
                  <Share2 size={28} />
                </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};