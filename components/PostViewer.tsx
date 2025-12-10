
import React, { useState, useRef, useEffect } from 'react';
import { X, Clover, MessageSquareText, Share2, MoreVertical, Edit2, Trash2, MapPin, Send, Eye, EyeOff, Download } from 'lucide-react';
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
  const [isImmersive, setIsImmersive] = useState(false); // Estado para ocultar/mostrar comentarios
  
  const menuRef = useRef<HTMLDivElement>(null);
  const isOwner = post.userId === currentUserId;
  const comments = post.comments || []; 

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (commentText.trim()) {
      onComment(post.id, commentText);
      setCommentText('');
    }
  };

  const handleDownload = (e: React.MouseEvent) => {
      e.stopPropagation();
      const ext = post.mediaType === 'video' ? 'mp4' : 'jpg';
      downloadMedia(post.imageUrl, `ecuador-travel-${post.id}.${ext}`);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black animate-in fade-in duration-300">
      
      {/* Close Button (Fades out in immersive mode slightly but stays accessible) */}
      <button 
        onClick={onClose} 
        className={`absolute top-4 left-4 text-white/70 hover:text-white p-2 rounded-full hover:bg-black/20 transition-all z-[60] ${isImmersive ? 'opacity-50' : 'opacity-100'}`}
      >
        <X size={32} />
      </button>

      {/* --- IMAGE CONTAINER (ALWAYS FULL SCREEN BEHIND UI) --- */}
      <div 
        className="absolute inset-0 flex items-center justify-center bg-black cursor-pointer"
        onClick={() => setIsImmersive(!isImmersive)}
      >
          {post.mediaType === 'video' ? (
             <video 
               src={post.imageUrl} 
               className="max-w-full max-h-full w-full h-full object-contain transition-transform duration-500" 
               controls={isImmersive} // Show native controls only when immersive to avoid UI conflict
               autoPlay
               playsInline
             />
          ) : (
             <img 
               src={post.imageUrl} 
               alt="Full size" 
               className="max-w-full max-h-full w-full h-full object-contain transition-transform duration-500" 
             />
          )}

          {/* Hint for user */}
          <div className={`absolute bottom-10 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-3 py-1 rounded-full backdrop-blur-md transition-opacity duration-500 pointer-events-none ${isImmersive ? 'opacity-0' : 'opacity-100 delay-1000'}`}>
             Toca la imagen para ver pantalla completa
          </div>
      </div>

      {/* --- SIDEBAR / COMMENTS SECTION (OVERLAY) --- */}
      <div 
        className={`
            absolute 
            md:right-4 md:top-4 md:bottom-4 md:w-[400px] md:h-auto md:rounded-2xl
            bottom-0 left-0 right-0 h-[50vh] rounded-t-3xl
            bg-white/95 backdrop-blur-xl shadow-2xl 
            flex flex-col border border-white/20
            transition-all duration-500 ease-in-out z-50 overflow-hidden
            ${isImmersive 
                ? 'opacity-0 translate-y-20 md:translate-x-20 pointer-events-none' 
                : 'opacity-100 translate-y-0 md:translate-x-0'
            }
        `}
      >
          
          {/* Header */}
          <div className="p-4 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white/50">
            <div className="flex items-center space-x-3">
              <img src={post.userAvatar} alt={post.userName} className="w-10 h-10 rounded-full object-cover border border-white shadow-sm" />
              <div>
                <h3 className="font-bold text-sm text-gray-900">{post.userName}</h3>
                {post.location && (
                  <div className="flex items-center text-xs text-cyan-700 font-medium">
                    <MapPin size={10} className="mr-1" />
                    {post.location}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1">
                {/* Toggle Visibility Button */}
                <button 
                    onClick={() => setIsImmersive(true)}
                    className="p-2 text-gray-400 hover:text-cyan-600 rounded-full hover:bg-black/5 md:hidden"
                    title="Ocultar detalles"
                >
                    <EyeOff size={20} />
                </button>

                {isOwner && (
                <div className="relative" ref={menuRef}>
                    <button 
                    onClick={() => setShowMenu(!showMenu)}
                    className="text-gray-500 hover:text-cyan-600 p-2 rounded-full hover:bg-black/5"
                    >
                    <MoreVertical size={20} />
                    </button>
                    {showMenu && (
                    <div className="absolute right-0 top-10 bg-white border border-gray-100 shadow-xl rounded-xl w-32 py-1 z-20">
                        <button 
                        onClick={() => { setShowMenu(false); onClose(); onEdit(post); }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                        >
                        <Edit2 size={14} /> Editar
                        </button>
                        <button 
                        onClick={() => { setShowMenu(false); onClose(); onDelete(post.id); }}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                        >
                        <Trash2 size={14} /> Eliminar
                        </button>
                    </div>
                    )}
                </div>
                )}
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white/40">
            <div className="flex gap-3">
               <img src={post.userAvatar} alt="User" className="w-8 h-8 rounded-full object-cover mt-1" />
               <div className="text-sm">
                  <span className="font-bold text-gray-900 mr-2">{post.userName}</span>
                  <span className="text-gray-700 leading-relaxed">{post.caption}</span>
                  <div className="text-xs text-gray-400 mt-1">Hace un momento</div>
               </div>
            </div>

            <div className="h-px bg-gray-200/50 my-2" />

            {comments.length === 0 ? (
               <div className="text-center py-8 text-gray-400 text-sm">
                  Sé el primero en opinar.
               </div>
            ) : (
               comments.map(comment => (
                  <div key={comment.id} className="flex gap-3 animate-in fade-in slide-in-from-bottom-2">
                    <div className="w-8 h-8 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-700 font-bold text-xs shrink-0 border border-cyan-200">
                        {comment.userName.charAt(0)}
                    </div>
                    <div className="text-sm bg-white/60 p-2 rounded-r-xl rounded-bl-xl">
                        <span className="font-bold text-gray-900 mr-2 block text-xs">{comment.userName}</span>
                        <span className="text-gray-700">{comment.text}</span>
                    </div>
                  </div>
               ))
            )}
          </div>

          {/* Footer Actions */}
          <div className="border-t border-gray-100 bg-white/80 backdrop-blur p-4 space-y-3 shrink-0">
            <div className="flex items-center justify-between">
               <div className="flex items-center space-x-4">
                  <button 
                    onClick={() => onLike(post.id)}
                    className={`transition-all active:scale-125 ${post.isLiked ? 'text-green-600' : 'text-gray-400 hover:text-green-600'}`}
                  >
                    <Clover size={28} fill={post.isLiked ? "currentColor" : "none"} />
                  </button>
                  <button className="text-gray-400 hover:text-cyan-600 transition-colors">
                    <MessageSquareText size={28} />
                  </button>
                  <button onClick={() => onShare(post)} className="text-gray-400 hover:text-cyan-600 transition-colors">
                    <Share2 size={28} />
                  </button>
                  <button onClick={handleDownload} className="text-gray-400 hover:text-cyan-600 transition-colors" title="Descargar">
                    <Download size={28} />
                  </button>
               </div>
               <div className="font-bold text-sm text-gray-800">
                  {post.likes} me gusta
               </div>
            </div>

            <form onSubmit={handleCommentSubmit} className="relative">
               <input 
                  type="text" 
                  placeholder="Agrega un comentario..." 
                  className="w-full bg-gray-50 border border-gray-200 rounded-full py-2.5 pl-4 pr-10 text-sm outline-none focus:border-cyan-400 focus:bg-white transition-colors shadow-inner"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
               />
               <button 
                 disabled={!commentText.trim()}
                 type="submit"
                 className="absolute right-2 top-2 text-cyan-600 hover:text-cyan-700 disabled:opacity-50 p-1 hover:bg-cyan-50 rounded-full transition-colors"
               >
                 <Send size={18} />
               </button>
            </form>
          </div>

      </div>
    </div>
  );
};
