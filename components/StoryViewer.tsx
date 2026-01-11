
import React, { useEffect, useState, useRef } from 'react';
import { X, Clover, Share2, Trash2, MapPin, Edit2, Eye, Download } from 'lucide-react';
import { Story, StoryViewer as ViewerType } from '../types';
import { downloadMedia } from '../utils';

interface StoryViewerProps {
  stories: Story[];
  initialStoryIndex: number;
  currentUserId: string;
  onClose: () => void;
  onMarkViewed: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit?: (story: Story) => void;
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
  onEdit,
  onLike,
  onShare
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialStoryIndex);
  const [progress, setProgress] = useState(0);
  const [isLikedLocally, setIsLikedLocally] = useState(false);
  const [likesCountLocally, setLikesCountLocally] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  
  // State for Viewers List
  const [showViewers, setShowViewers] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);

  if (stories.length === 0) {
    onClose();
    return null;
  }

  const currentStory = stories[currentIndex];
  
  // Extract viewers list from the dictionary object in currentStory
  const viewersList: ViewerType[] = currentStory.viewers ? Object.values(currentStory.viewers) : [];

  useEffect(() => {
    if (currentStory) {
      setProgress(0);
      setIsLikedLocally(!!currentStory.isLiked);
      setLikesCountLocally(currentStory.likes || 0);
      onMarkViewed(currentStory.id);
      setIsPaused(false);
      setShowViewers(false); // Reset when changing story
    }
  }, [currentStory]); 

  useEffect(() => {
    if (isPaused || showViewers) return; // Pause progress if viewing viewer list

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          handleNext();
          return 100;
        }
        const increment = currentStory.mediaType === 'video' ? 0.5 : 2; 
        return prev + increment; 
      });
    }, 100); 

    return () => clearInterval(interval);
  }, [currentIndex, isPaused, showViewers, currentStory?.mediaType]);

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
    setIsPaused(true);
    if (confirm("¿Eliminar esta historia?")) {
      onDelete(currentStory.id);
      if (stories.length <= 1) onClose();
      else if (currentIndex >= stories.length - 1) setCurrentIndex(currentIndex - 1);
    } else {
       setIsPaused(false);
    }
  };
  
  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPaused(true);
    if (onEdit) onEdit(currentStory);
  };

  const handleShareClick = () => {
      setIsPaused(true);
      if (onShare) {
          onShare(`Mira esta historia de ${currentStory.userName} en Ecuador Travel!`);
      }
      setTimeout(() => setIsPaused(false), 1000); 
  };

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation(); 
    const newIsLiked = !isLikedLocally;
    setIsLikedLocally(newIsLiked);
    setLikesCountLocally(prev => newIsLiked ? prev + 1 : prev - 1);
    onLike(currentStory.id);
  };

  const handleDownload = (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsPaused(true);
      const ext = currentStory.mediaType === 'video' ? 'mp4' : 'jpg';
      downloadMedia(currentStory.imageUrl, `story-${currentStory.userName}-${currentStory.id}.${ext}`);
      setTimeout(() => setIsPaused(false), 1000);
  };

  const toggleViewersList = (e: React.MouseEvent) => {
      e.stopPropagation();
      setShowViewers(!showViewers);
      setIsPaused(!showViewers); // Pause when list is open
  };

  if (!currentStory) return null;

  const isOwner = currentStory.userId === currentUserId;

  return (
    <div className="fixed inset-0 z-[300] bg-black flex items-center justify-center">
      
      {/* Dynamic Background Blur Layer */}
      <div 
          className="absolute inset-0 bg-cover bg-center blur-xl opacity-30 scale-110 transition-all duration-700"
          style={{ backgroundImage: `url(${currentStory.imageUrl})` }}
      />

      <div 
        className="relative w-full md:w-[400px] h-full md:h-[90vh] bg-black md:rounded-2xl overflow-hidden shadow-2xl flex flex-col select-none"
        onMouseDown={() => !showViewers && setIsPaused(true)}
        onMouseUp={() => !showViewers && setIsPaused(false)}
        onTouchStart={() => !showViewers && setIsPaused(true)}
        onTouchEnd={() => !showViewers && setIsPaused(false)}
      >
        <div className="absolute inset-0 z-0 flex items-center justify-center bg-black">
          {currentStory.mediaType === 'video' ? (
             <video 
                ref={videoRef}
                src={currentStory.imageUrl}
                className="w-full h-full object-contain"
                autoPlay
                playsInline
                loop
             />
          ) : (
             <img 
                src={currentStory.imageUrl} 
                alt="Story" 
                className="w-full h-full object-contain"
             />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60 pointer-events-none" />
        </div>

        {/* Progress Bars */}
        {!showViewers && (
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
        )}

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
            <button onClick={handleDownload} className="p-2 hover:bg-white/20 rounded-full transition-colors z-50">
               <Download size={24} />
            </button>
            {isOwner && (
               <>
                 <button onClick={handleEditClick} className="p-2 hover:bg-white/20 hover:text-cyan-400 rounded-full transition-colors z-50">
                    <Edit2 size={24} />
                 </button>
                 <button onClick={(e) => { e.stopPropagation(); handleDelete(); }} className="p-2 hover:bg-white/20 hover:text-red-400 rounded-full transition-colors z-50">
                    <Trash2 size={24} />
                 </button>
               </>
            )}
            <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="p-2 hover:bg-white/20 rounded-full transition-colors z-50">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Touch Areas for Navigation (Hidden if Viewers List open) */}
        {!showViewers && (
            <div className="absolute inset-0 z-10 flex">
            <div className="w-1/3 h-full" onClick={handlePrev} />
            <div className="w-2/3 h-full" onClick={handleNext} />
            </div>
        )}

        {/* Viewers List Overlay (Only for Owner) */}
        {showViewers && isOwner && (
            <div 
              className="absolute inset-0 z-30 bg-black/90 backdrop-blur-md p-6 overflow-y-auto animate-in slide-in-from-bottom-10"
              onMouseDown={(e) => e.stopPropagation()} // Stop propagation to avoid pausing/unpausing
            >
                <div className="flex justify-between items-center mb-6 border-b border-white/20 pb-4">
                    <h3 className="text-white font-bold text-lg flex items-center gap-2">
                        <Eye size={20} /> Visto por {viewersList.length}
                    </h3>
                    <button onClick={toggleViewersList} className="text-white/70 hover:text-white">
                        <X size={24} />
                    </button>
                </div>
                
                <div className="space-y-4">
                    {viewersList.length === 0 ? (
                        <div className="text-center text-white/50 py-10">
                            Nadie ha visto esto aún.
                        </div>
                    ) : (
                        viewersList.map((viewer) => (
                            <div key={viewer.userId} className="flex items-center gap-3">
                                <img src={viewer.userAvatar} className="w-10 h-10 rounded-full border border-white/30" alt={viewer.userName} />
                                <div className="flex-1">
                                    <p className="text-white font-bold text-sm">{viewer.userName}</p>
                                    <p className="text-white/40 text-xs">
                                        {new Date(viewer.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        )}

        {/* Footer Controls */}
        <div className="absolute bottom-0 left-0 right-0 p-4 pb-8 z-20 flex flex-col space-y-4 pointer-events-none">
          
          {currentStory.caption && !showViewers && (
            <div className="bg-black/30 backdrop-blur-sm p-3 rounded-xl text-white border border-white/10 self-start max-w-[90%]">
              <p className="text-sm">{currentStory.caption}</p>
            </div>
          )}

          <div className="flex items-end justify-between pointer-events-auto">
             {/* Left Action: Viewers (Owner) or Nothing */}
             {isOwner ? (
                <button 
                  onClick={toggleViewersList}
                  className="flex items-center gap-1 text-white text-xs font-bold bg-white/10 hover:bg-white/20 px-3 py-2 rounded-full backdrop-blur-md transition-colors"
                >
                    <Eye size={16} />
                    <span>{viewersList.length}</span>
                </button>
             ) : (
                <div /> // Spacer
             )}

            {/* Right Actions: Like & Share */}
            <div className="flex items-center gap-3">
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
                    <span className="absolute -top-1 -right-1 bg-green-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold border-2 border-black/20 shadow-sm">
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
