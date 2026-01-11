
import React, { useState, useRef, useEffect } from 'react';
import { X, Clover, MessageSquareText, Share2, MoreVertical, Edit2, Trash2, MapPin, Send, Eye, EyeOff, Download, ChevronRight, ChevronLeft } from 'lucide-react';
import { Post } from '../types';
import { downloadMedia } from '../utils';

interface PostViewerProps {
  post: Post;
  currentUserId: string;
  onClose: () => void;
  onLike: (id: string) => void;
  onComment: (id: string, text: string) => void;
  onShare: (post: Post) => void;
  onEdit: (post: Post) => void;
  onDelete: (id: string) => void;
}

export const PostViewer: React.FC<PostViewerProps> = ({
  post,
  currentUserId,
  onClose,
  onLike,
  onComment,
  onShare,
  onEdit,
  onDelete
}) => {
  const [commentText, setCommentText] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [isImmersive, setIsImmersive] = useState(false);
  
  // GALLERY STATES
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const gallery = post.gallery && post.gallery.length > 0 ? post.gallery : [post.imageUrl];
  const hasGallery = gallery.length > 1;

  const menuRef = useRef<HTMLDivElement>(null);
  const isOwner = post.userId === currentUserId;
  const comments = post.comments || []; 

  const handleScroll = () => {
    if (scrollRef.current) {
        const index = Math.round(scrollRef.current.scrollLeft / scrollRef.current.offsetWidth);
        setCurrentMediaIndex(index);
    }
  };

  const navigateGallery = (direction: 'next' | 'prev') => {
      if (!scrollRef.current) return;
      const width = scrollRef.current.offsetWidth;
      const target = direction === 'next' 
          ? scrollRef.current.scrollLeft + width 
          : scrollRef.current.scrollLeft - width;
      
      scrollRef.current.scrollTo({ left: target, behavior: 'smooth' });
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (commentText.trim()) {
      onComment(post.id, commentText);
      setCommentText('');
    }
  };

  const handleDownload = (e: React.MouseEvent) => {
      e.stopPropagation();
      const currentUrl = gallery[currentMediaIndex];
      const ext = (post.mediaType === 'video' && currentMediaIndex === 0) ? 'mp4' : 'jpg';
      downloadMedia(currentUrl, `ecuador-travel-${post.id}-${currentMediaIndex}.${ext}`);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black animate-in fade-in duration-300">
      
      <button 
        onClick={onClose} 
        className={`absolute top-4 left-4 text-white/70 hover:text-white p-2 rounded-full hover:bg-black/20 transition-all z-[60] ${isImmersive ? 'opacity-50' : 'opacity-100'}`}
      >
        <X size={32} />
      </button>

      {/* --- GALLERY CONTAINER --- */}
      <div className="absolute inset-0 flex items-center justify-center bg-black">
          <div 
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex w-full h-full overflow-x-auto snap-x snap-mandatory no-scrollbar"
          >
              {gallery.map((img, idx) => (
                  <div key={idx} className="w-full h-full shrink-0 snap-start flex items-center justify-center bg-black cursor-pointer" onClick={() => setIsImmersive(!isImmersive)}>
                       {post.mediaType === 'video' && idx === 0 ? (
                          <video src={img} className="max-w-full max-h-full object-contain" autoPlay playsInline loop controls={isImmersive} />
                      ) : (
                          <img src={img} alt={`Slide ${idx}`} className="max-w-full max-h-full object-contain" />
                      )}
                  </div>
              ))}
          </div>

          {/* GALLERY NAVIGATION (DESKTOP) */}
          {hasGallery && !isImmersive && (
              <>
                  <button onClick={() => navigateGallery('prev')} className={`absolute left-4 top-1/2 -translate-y-1/2 p-4 text-white/50 hover:text-white bg-black/20 rounded-full transition-all hidden md:block z-40 ${currentMediaIndex === 0 ? 'opacity-0' : 'opacity-100'}`}>
                      <ChevronLeft size={48} />
                  </button>
                  <button onClick={() => navigateGallery('next')} className={`absolute right-4 top-1/2 -translate-y-1/2 p-4 text-white/50 hover:text-white bg-black/20 rounded-full transition-all hidden md:block z-40 ${currentMediaIndex === gallery.length - 1 ? 'opacity-0' : 'opacity-100'}`}>
                      <ChevronRight size={48} />
                  </button>

                  <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-40 flex gap-2">
                    {gallery.map((_, i) => (
                        <div key={i} className={`h-1.5 rounded-full transition-all ${i === currentMediaIndex ? 'w-6 bg-manabi-400' : 'w-1.5 bg-white/40'}`} />
                    ))}
                  </div>
              </>
          )}
      </div>

      {/* --- SIDEBAR / COMMENTS --- */}
      <div 
        className={`absolute md:right-4 md:top-4 md:bottom-4 md:w-[400px] md:h-auto md:rounded-2xl bottom-0 left-0 right-0 h-[50vh] rounded-t-3xl bg-white/95 backdrop-blur-xl shadow-2xl flex flex-col transition-all duration-500 z-50 overflow-hidden ${isImmersive ? 'opacity-0 translate-y-20 md:translate-x-20 pointer-events-none' : 'opacity-100 translate-y-0 md:translate-x-0'}`}
      >
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white/50">
            <div className="flex items-center space-x-3">
              <img src={post.userAvatar} className="w-10 h-10 rounded-full object-cover border border-white shadow-sm" />
              <div>
                <h3 className="font-bold text-sm text-gray-900">{post.userName}</h3>
                {post.location && <div className="flex items-center text-xs text-cyan-700 font-medium"><MapPin size={10} className="mr-1" />{post.location}</div>}
              </div>
            </div>
            <div className="flex items-center gap-1">
                <button onClick={() => setIsImmersive(true)} className="p-2 text-gray-400 hover:text-cyan-600 md:hidden"><EyeOff size={20} /></button>
                {isOwner && (
                <div className="relative" ref={menuRef}>
                    <button onClick={() => setShowMenu(!showMenu)} className="text-gray-500 hover:text-cyan-600 p-2 rounded-full"><MoreVertical size={20} /></button>
                    {showMenu && (
                    <div className="absolute right-0 top-10 bg-white border border-gray-100 shadow-xl rounded-xl w-32 py-1 z-20">
                        <button onClick={() => { setShowMenu(false); onClose(); onEdit(post); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"><Edit2 size={14} /> Editar</button>
                        <button onClick={() => { setShowMenu(false); onClose(); onDelete(post.id); }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"><Trash2 size={14} /> Eliminar</button>
                    </div>
                    )}
                </div>
                )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white/40 no-scrollbar">
            <div className="flex gap-3">
               <img src={post.userAvatar} className="w-8 h-8 rounded-full object-cover mt-1" />
               <div className="text-sm">
                  <span className="font-bold text-gray-900 mr-2">{post.userName}</span>
                  <span className="text-gray-700 leading-relaxed">{post.caption}</span>
                  {hasGallery && <div className="mt-2 text-[10px] font-black text-manabi-600 bg-manabi-50 px-2 py-0.5 rounded w-fit uppercase">Galería: {currentMediaIndex + 1}/{gallery.length}</div>}
               </div>
            </div>
            <div className="h-px bg-gray-200/50 my-2" />
            {comments.map(comment => (
                <div key={comment.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-700 font-bold text-xs shrink-0">{comment.userName.charAt(0)}</div>
                  <div className="text-sm bg-white/60 p-2 rounded-r-xl rounded-bl-xl"><span className="font-bold text-gray-900 mr-2 block text-xs">{comment.userName}</span><span className="text-gray-700">{comment.text}</span></div>
                </div>
            ))}
          </div>

          <div className="border-t border-gray-100 bg-white/80 backdrop-blur p-4 space-y-3 shrink-0">
            <div className="flex items-center justify-between">
               <div className="flex items-center space-x-4">
                  <button onClick={() => onLike(post.id)} className={`transition-all active:scale-125 ${post.isLiked ? 'text-green-600' : 'text-gray-400 hover:text-green-600'}`}><Clover size={28} fill={post.isLiked ? "currentColor" : "none"} /></button>
                  <button onClick={() => onShare(post)} className="text-gray-400 hover:text-cyan-600 transition-colors"><Share2 size={28} /></button>
                  <button onClick={handleDownload} className="text-gray-400 hover:text-cyan-600 transition-colors"><Download size={28} /></button>
               </div>
               <div className="font-bold text-sm text-gray-800">{post.likes} me gusta</div>
            </div>

            <form onSubmit={handleCommentSubmit} className="relative">
               <input type="text" placeholder="Agrega un comentario..." className="w-full bg-gray-50 border border-gray-200 rounded-full py-2.5 pl-4 pr-10 text-sm outline-none" value={commentText} onChange={(e) => setCommentText(e.target.value)} />
               <button disabled={!commentText.trim()} type="submit" className="absolute right-2 top-2 text-cyan-600 hover:text-cyan-700 p-1"><Send size={18} /></button>
            </form>
          </div>
      </div>
    </div>
  );
};
