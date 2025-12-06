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
  const [isLikedLocally, setIsLikedLocally] = useState(false);
  const [likesCountLocally, setLikesCountLocally] = useState(0);

  if (stories.length === 0) {
    onClose();
    return null;
  }

  const currentStory = stories[currentIndex];

  useEffect(() => {
    if (currentStory) {
      setProgress(0);
      setIsLikedLocally(!!currentStory.isLiked);
      setLikesCountLocally(currentStory.likes || 0);
      onMarkViewed(currentStory.id);
    }
  }, [currentStory]); // Dependencia simplificada para evitar reinicios innecesarios

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          handleNext();
          return 100;
        }
        return prev + 2; 
      });
    }, 100); 

    return () => clearInterval(interval);
  }, [currentIndex]);

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
      if (stories.length <= 1) onClose();
      else if (currentIndex >= stories.length - 1) setCurrentIndex(currentIndex - 1);
    }
  };

  const handleShareClick = () => {
      if (onShare) {
          onShare(`Mira esta historia de ${currentStory.userName} en Ecuador Travel!`);
      }
  };

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Evitar cambiar de historia al dar like
    
    // Actualización optimista (UI instantánea)
    const newIsLiked = !isLikedLocally;
    setIsLikedLocally(newIsLiked);
    setLikesCountLocally(prev => newIsLiked ? prev + 1 : prev - 1);
    
    // Llamada real al servidor
    onLike(currentStory.id);
  };

  if (!currentStory) return null;

  const isOwner = currentStory.userId === currentUserId;

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-cover bg-center blur-xl opacity-30 scale-110"
        style={{ backgroundImage: `url(${currentStory.imageUrl})` }}
      />

      <div className="relative w-full md:w-[400px] h-full md:h-[90vh] bg-black md:rounded-2xl overflow-hidden shadow-2xl flex flex-col">
        <div className="absolute inset-0 z-0">
          <img 
            src={currentStory.imageUrl} 
            alt="Story" 
            className="w-full h-full object-cover"
          />
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
               <button onClick={(e) => { e.stopPropagation(); handleDelete(); }} className="p-2 hover:bg-white/20 hover:text-red-400 rounded-full transition-colors z-50">
                  <Trash2 size={24} />
               </button>
            )}
            <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="p-2 hover:bg-white/20 rounded-full transition-colors z-50">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Touch Areas for Navigation */}
        <div className="absolute inset-0 z-10 flex">
          <div className="w-1/3 h-full" onClick={handlePrev} />
          <div className="w-2/3 h-full" onClick={handleNext} />
        </div>

        {/* Footer Controls */}
        <div className="absolute bottom-0 left-0 right-0 p-4 pb-8 z-20 flex flex-col space-y-4">
          
          {currentStory.caption && (
            <div className="bg-black/30 backdrop-blur-sm p-3 rounded-xl text-white border border-white/10 self-start max-w-[90%] animate-in slide-in-from-bottom-2 fade-in">
              <p className="text-sm">{currentStory.caption}</p>
            </div>
          )}

          <div className="flex items-center space-x-4">
            <input 
              type="text" 
              placeholder="Responder historia..." 
              className="flex-1 bg-transparent border border-white/40 rounded-full px-4 py-3 text-white placeholder-white/70 focus:border-white outline-none backdrop-blur-sm transition-colors text-sm"
              onClick={(e) => e.stopPropagation()} // Prevent nav click
            />
            <div className="flex items-center gap-2">
                <button 
                  onClick={handleLikeClick}
                  className={`p-3 rounded-full transition-all active:scale-90 relative group ${isLikedLocally ? 'bg-white/20' : 'hover:bg-white/10'}`}
                >
                  <Clover 
                    size={28} 
                    className={`transition-all duration-300 ${isLikedLocally ? 'text-green-400 scale-110 drop-shadow-[0_0_8px_rgba(74,222,128,0.5)]' : 'text-white'}`}
                    fill={isLikedLocally ? "currentColor" : "none"} 
                  />
                  {likesCountLocally > 0 && (
                    <span className="absolute -top-1 -right-1 bg-green-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold border-2 border-black/20 shadow-sm animate-in zoom-in">
                      {likesCountLocally}
                    </span>
                  )}
                </button>
                <button 
                    onClick={(e) => { e.stopPropagation(); handleShareClick(); }}
                    className="text-white hover:scale-110 hover:text-cyan-400 transition-all p-3 rounded-full hover:bg-white/10"
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