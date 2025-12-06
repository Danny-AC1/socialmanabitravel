import React, { useState, useRef, useEffect } from 'react';
import { Clover, MessageSquareText, Share2, MapPin, MoreVertical, Edit2, Trash2, Play } from 'lucide-react';
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
  const [showComments, setShowComments] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const isOwner = post.userId === currentUserId;

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (commentText.trim()) {
      onComment(post.id, commentText);
      setCommentText('');
      setShowComments(true);
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
    <div className="bg-white border rounded-xl shadow-sm mb-6 overflow-hidden">
      <div className="flex items-center justify-between p-4 relative">
        <div 
          className="flex items-center space-x-3 cursor-pointer group"
          onClick={() => onUserClick(post.userId)}
        >
          <img src={post.userAvatar} alt={post.userName} className="w-10 h-10 rounded-xl object-cover ring-2 ring-gray-100 group-hover:ring-cyan-200 transition-all" />
          <div>
            <h3 className="font-semibold text-sm text-gray-800 group-hover:text-cyan-700 transition-colors">{post.userName}</h3>
            {post.location && (
              <div className="flex items-center text-xs text-cyan-600 font-medium">
                <MapPin size={12} className="mr-1" />
                {post.location}
              </div>
            )}
          </div>
        </div>
        
        {isOwner && (
          <div className="relative" ref={menuRef}>
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <MoreVertical size={20} />
            </button>
            
            {showMenu && (
              <div className="absolute right-0 top-8 bg-white border border-gray-100 shadow-xl rounded-xl w-32 py-1 z-10 animate-in fade-in zoom-in-95 duration-100">
                <button 
                  onClick={() => { setShowMenu(false); onEdit(post); }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <Edit2 size={14} /> Editar
                </button>
                <button 
                  onClick={() => { setShowMenu(false); onDelete(post.id); }}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <Trash2 size={14} /> Eliminar
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div 
        className="relative aspect-square md:aspect-[4/3] bg-black cursor-pointer overflow-hidden group"
        onClick={() => onImageClick && onImageClick(post)}
        onMouseEnter={() => { if(post.mediaType === 'video') videoRef.current?.play(); }}
        onMouseLeave={() => { if(post.mediaType === 'video') { videoRef.current?.pause(); videoRef.current!.currentTime = 0; } }}
      >
        {post.mediaType === 'video' ? (
           <>
              <video 
                ref={videoRef}
                src={post.imageUrl} 
                className="w-full h-full object-contain" 
                muted 
                loop 
                playsInline
              />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/40 rounded-full p-4 group-hover:opacity-0 transition-opacity">
                 <Play size={32} className="text-white fill-white ml-1" />
              </div>
              <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                 <Play size={10} fill="currentColor" /> Video
              </div>
           </>
        ) : (
           <img 
            src={post.imageUrl} 
            alt="Post content" 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
            loading="lazy" 
          />
        )}
        
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center pointer-events-none">
            <span className="opacity-0 group-hover:opacity-100 text-white font-bold bg-black/40 px-4 py-2 rounded-full backdrop-blur-sm transition-opacity">
                Ver detalle
            </span>
        </div>
      </div>

      <div className="p-4 pb-2">
        <div className="flex items-center space-x-6 mb-3">
          <button 
            onClick={() => onLike(post.id)}
            className={`transition-all active:scale-110 flex items-center space-x-1 ${post.isLiked ? 'text-green-600' : 'text-gray-500 hover:text-green-600'}`}
          >
            <Clover size={24} fill={post.isLiked ? "currentColor" : "none"} />
          </button>
          <button 
            onClick={() => setShowComments(!showComments)}
            className="text-gray-500 hover:text-cyan-600 transition-colors"
          >
            <MessageSquareText size={24} />
          </button>
          <button 
            onClick={() => onShare && onShare(post)}
            className="text-gray-500 hover:text-cyan-600 transition-colors ml-auto"
          >
            <Share2 size={24} />
          </button>
        </div>

        <div className="font-semibold text-sm mb-2 text-gray-700">{post.likes} Tréboles de suerte</div>

        <div className="mb-2">
          <span className="font-semibold text-sm mr-2 text-gray-800">{post.userName}</span>
          <span className="text-sm text-gray-600 leading-relaxed">{post.caption}</span>
        </div>

        {post.comments.length > 0 && (
          <button 
            onClick={() => setShowComments(!showComments)}
            className="text-gray-400 text-sm mb-2 hover:text-gray-600"
          >
            {showComments ? 'Ocultar opiniones' : `Ver las ${post.comments.length} opiniones`}
          </button>
        )}

        {showComments && (
          <div className="space-y-3 mb-3 max-h-40 overflow-y-auto no-scrollbar bg-gray-50 p-3 rounded-lg">
            {post.comments.map((comment) => (
              <div key={comment.id} className="flex items-start space-x-2 text-sm">
                <span className="font-semibold text-gray-700 min-w-max">{comment.userName}</span>
                <span className="text-gray-600">{comment.text}</span>
              </div>
            ))}
          </div>
        )}

        <div className="text-gray-400 text-[10px] uppercase tracking-wide mt-2">
          Hace un momento
        </div>
      </div>

      <form onSubmit={handleCommentSubmit} className="border-t p-3 flex items-center bg-gray-50">
        <input 
          type="text" 
          placeholder="Escribe una opinión..." 
          className="flex-1 text-sm outline-none px-3 py-1 bg-transparent"
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
        />
        <button 
          type="submit" 
          disabled={!commentText.trim()}
          className="text-cyan-600 font-bold text-sm disabled:opacity-50 uppercase tracking-wide"
        >
          Enviar
        </button>
      </form>
    </div>
  );
};