import React, { useState, useRef, useEffect } from 'react';
import { Clover, MessageSquareText, Share2, MapPin, MoreVertical, Edit2, Trash2, Play, Send, Loader2 } from 'lucide-react';
import { Post } from '../types';

interface PostCardProps {
  post: Post;
  currentUserId: string;
  onLike: (id: string) => void;
  onComment: (id: string, text: string) => void;
  onShare?: (post: Post) => void;
  onUserClick: (userId: string) => void;
  onImageClick?: (post: Post) => void;
  onEdit: (post: Post) => void;
  onDelete: (id: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({ 
  post, 
  currentUserId,
  onLike, 
  onComment, 
  onShare,
  onUserClick,
  onImageClick,
  onEdit,
  onDelete
}) => {
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [showAllComments, setShowAllComments] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const commentInputRef = useRef<HTMLInputElement>(null);

  const isOwner = post.userId === currentUserId;
  const comments = post.comments || [];
  
  // Mostrar solo los últimos 3 si está colapsado
  const displayedComments = showAllComments ? comments : comments.slice(-3);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (commentText.trim()) {
      setIsSubmittingComment(true);
      // Simular delay de red para mejor UX
      await new Promise(resolve => setTimeout(resolve, 300));
      onComment(post.id, commentText);
      setCommentText('');
      setIsSubmittingComment(false);
      setShowAllComments(true); // Auto-expandir al comentar
    }
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
    <div className="bg-white border border-stone-100 rounded-3xl shadow-sm mb-8 overflow-hidden hover:shadow-md transition-shadow duration-300">
      
      {/* HEADER */}
      <div className="flex items-center justify-between p-4 relative">
        <div 
          className="flex items-center space-x-3 cursor-pointer group"
          onClick={() => onUserClick(post.userId)}
        >
          <div className="relative">
             <img src={post.userAvatar} alt={post.userName} className="w-10 h-10 rounded-full object-cover ring-2 ring-transparent group-hover:ring-cyan-400 transition-all" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-stone-800 group-hover:text-cyan-700 transition-colors leading-tight">{post.userName}</h3>
            {post.location && (
              <div className="flex items-center text-[11px] text-stone-500 font-medium mt-0.5">
                <MapPin size={10} className="mr-1 text-cyan-500" />
                {post.location}
              </div>
            )}
          </div>
        </div>
        
        {isOwner && (
          <div className="relative" ref={menuRef}>
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="text-stone-400 hover:text-stone-600 p-2 rounded-full hover:bg-stone-50 transition-colors"
            >
              <MoreVertical size={20} />
            </button>
            
            {showMenu && (
              <div className="absolute right-0 top-10 bg-white border border-stone-100 shadow-xl rounded-2xl w-40 py-2 z-10 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                <button 
                  onClick={() => { setShowMenu(false); onEdit(post); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-stone-600 hover:bg-stone-50 flex items-center gap-2 transition-colors"
                >
                  <Edit2 size={14} /> Editar
                </button>
                <button 
                  onClick={() => { setShowMenu(false); onDelete(post.id); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 flex items-center gap-2 transition-colors"
                >
                  <Trash2 size={14} /> Eliminar
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MEDIA */}
      <div 
        className="relative aspect-[4/5] sm:aspect-square md:aspect-[4/3] bg-stone-100 cursor-pointer overflow-hidden group"
        onClick={() => onImageClick && onImageClick(post)}
        onMouseEnter={() => { if(post.mediaType === 'video') videoRef.current?.play(); }}
        onMouseLeave={() => { if(post.mediaType === 'video') { videoRef.current?.pause(); videoRef.current!.currentTime = 0; } }}
      >
        {post.mediaType === 'video' ? (
           <>
              <video 
                ref={videoRef}
                src={post.imageUrl} 
                className="w-full h-full object-cover" 
                muted 
                loop 
                playsInline
              />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/30 backdrop-blur-sm rounded-full p-4 group-hover:scale-110 transition-transform">
                 <Play size={32} className="text-white fill-white ml-1" />
              </div>
           </>
        ) : (
           <img 
            src={post.imageUrl} 
            alt="Post content" 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
            loading="lazy" 
          />
        )}
      </div>

      {/* ACTIONS & CAPTION */}
      <div className="p-4 pb-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
             <button 
                onClick={() => onLike(post.id)}
                className={`transition-all active:scale-125 flex items-center gap-1.5 ${post.isLiked ? 'text-green-500' : 'text-stone-400 hover:text-stone-600'}`}
             >
                <Clover size={26} strokeWidth={post.isLiked ? 2.5 : 2} />
             </button>
             <button 
                onClick={() => commentInputRef.current?.focus()}
                className="text-stone-400 hover:text-cyan-600 transition-colors"
             >
                <MessageSquareText size={26} />
             </button>
             <button 
                onClick={() => onShare && onShare(post)}
                className="text-stone-400 hover:text-cyan-600 transition-colors"
             >
                <Share2 size={26} />
             </button>
          </div>
        </div>

        <div className="font-bold text-sm mb-2 text-stone-800">
           {post.likes} <span className="font-normal text-stone-500">me gusta</span>
        </div>

        <div className="mb-4 text-sm leading-relaxed">
          <span className="font-bold mr-2 text-stone-800">{post.userName}</span>
          <span className="text-stone-600">{post.caption}</span>
        </div>
      </div>

      {/* COMMENTS SECTION (REDESIGNED) */}
      <div className="px-4 pb-4">
          {comments.length > 3 && !showAllComments && (
            <button 
              onClick={() => setShowAllComments(true)}
              className="text-stone-400 text-xs font-medium mb-3 hover:text-stone-600 transition-colors"
            >
              Ver los {comments.length} comentarios...
            </button>
          )}

          <div className="space-y-3 mb-4">
             {displayedComments.map((comment, idx) => (
                <div key={`${comment.id}-${idx}`} className="flex gap-2 group/comment animate-in fade-in slide-in-from-bottom-1 duration-300">
                   {/* Avatar pequeño para comentarios */}
                   {/* Para optimizar, en una app real deberíamos tener el avatar del autor del comentario en el objeto comment. 
                       Como placeholder usaremos una inicial coloreada si no tenemos la URL */}
                   <div className="w-6 h-6 rounded-full bg-stone-200 flex items-center justify-center text-[10px] font-bold text-stone-500 shrink-0 mt-0.5">
                      {comment.userName.charAt(0).toUpperCase()}
                   </div>
                   
                   <div className="bg-stone-50 px-3 py-2 rounded-2xl rounded-tl-none">
                      <p className="text-xs">
                         <span className="font-bold text-stone-800 mr-1">{comment.userName}</span>
                         <span className="text-stone-600">{comment.text}</span>
                      </p>
                   </div>
                </div>
             ))}
          </div>

          <div className="text-[10px] text-stone-400 uppercase tracking-wider mb-3">
             {new Date(post.timestamp).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}
          </div>

          {/* INPUT AREA */}
          <form onSubmit={handleCommentSubmit} className="relative flex items-center pt-2 border-t border-stone-100">
             <input 
                ref={commentInputRef}
                type="text" 
                placeholder="Añade un comentario..." 
                className="w-full text-sm outline-none bg-transparent placeholder-stone-400 text-stone-700 pr-10"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
             />
             <button 
               type="submit" 
               disabled={!commentText.trim() || isSubmittingComment}
               className="absolute right-0 text-cyan-600 font-bold text-xs hover:text-cyan-700 disabled:opacity-30 uppercase transition-all"
             >
               {isSubmittingComment ? <Loader2 size={16} className="animate-spin"/> : "Publicar"}
             </button>
          </form>
      </div>

    </div>
  );
};