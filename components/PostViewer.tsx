import React, { useState, useRef, useEffect } from 'react';
import { X, Clover, MessageSquareText, Share2, MoreVertical, Edit2, Trash2, MapPin, Send, Loader2 } from 'lucide-react';
import { Post } from '../types';

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);
  
  const isOwner = post.userId === currentUserId;
  const comments = post.comments || []; 

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (commentText.trim()) {
      setIsSubmitting(true);
      await new Promise(resolve => setTimeout(resolve, 300));
      onComment(post.id, commentText);
      setCommentText('');
      setIsSubmitting(false);
    }
  };

  // Auto-scroll to bottom of comments when new one added
  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments.length]);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md animate-in fade-in duration-300">
      <button 
        onClick={onClose} 
        className="absolute top-4 left-4 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors z-50"
      >
        <X size={32} />
      </button>

      <div className="flex flex-col md:flex-row w-full h-full md:max-w-6xl md:max-h-[90vh] md:rounded-2xl overflow-hidden bg-black md:bg-white shadow-2xl">
        
        {/* MEDIA AREA */}
        <div className="flex-1 bg-black flex items-center justify-center relative group">
          {post.mediaType === 'video' ? (
             <video 
               src={post.imageUrl} 
               className="max-w-full max-h-full object-contain" 
               controls
               autoPlay
             />
          ) : (
             <img 
               src={post.imageUrl} 
               alt="Full size" 
               className="max-w-full max-h-full object-contain" 
             />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/40 opacity-0 group-hover:opacity-100 transition-opacity md:hidden pointer-events-none" />
        </div>

        {/* INFO & COMMENTS SIDEBAR */}
        <div className="w-full md:w-[400px] bg-white flex flex-col h-[45vh] md:h-full border-l border-gray-100 absolute bottom-0 md:relative rounded-t-3xl md:rounded-none z-40 transition-transform duration-300 transform translate-y-0">
          
          {/* Header */}
          <div className="p-4 border-b flex items-center justify-between shrink-0 bg-white md:rounded-none rounded-t-3xl">
            <div className="flex items-center space-x-3">
              <img src={post.userAvatar} alt={post.userName} className="w-10 h-10 rounded-full object-cover border border-gray-100 ring-2 ring-transparent hover:ring-cyan-400 transition-all cursor-pointer" />
              <div>
                <h3 className="font-bold text-sm text-gray-800">{post.userName}</h3>
                {post.location && (
                  <div className="flex items-center text-xs text-cyan-600 font-medium">
                    <MapPin size={10} className="mr-1" />
                    {post.location}
                  </div>
                )}
              </div>
            </div>

            {isOwner && (
              <div className="relative" ref={menuRef}>
                <button 
                  onClick={() => setShowMenu(!showMenu)}
                  className="text-gray-400 hover:text-stone-600 p-2 rounded-full hover:bg-gray-50 transition-colors"
                >
                  <MoreVertical size={20} />
                </button>
                {showMenu && (
                  <div className="absolute right-0 top-10 bg-white border border-gray-100 shadow-xl rounded-xl w-36 py-1 z-50 animate-in zoom-in-95 duration-150">
                    <button 
                      onClick={() => { setShowMenu(false); onClose(); onEdit(post); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Edit2 size={14} /> Editar
                    </button>
                    <button 
                      onClick={() => { setShowMenu(false); onClose(); onDelete(post.id); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 flex items-center gap-2"
                    >
                      <Trash2 size={14} /> Eliminar
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Comments List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
            {/* Caption */}
            <div className="flex gap-3">
               <img src={post.userAvatar} alt="User" className="w-8 h-8 rounded-full object-cover mt-1 border border-gray-200" />
               <div className="text-sm">
                  <span className="font-bold text-gray-900 mr-2">{post.userName}</span>
                  <span className="text-gray-700 leading-relaxed">{post.caption}</span>
                  <div className="text-xs text-gray-400 mt-1 font-medium">{new Date(post.timestamp).toLocaleDateString(undefined, {month:'short', day:'numeric'})}</div>
               </div>
            </div>

            <div className="h-px bg-gray-100 my-2" />

            {comments.length === 0 ? (
               <div className="flex flex-col items-center justify-center py-10 text-gray-400 space-y-2">
                  <MessageSquareText size={32} className="opacity-20" />
                  <p className="text-sm font-medium">Aún no hay comentarios.</p>
                  <p className="text-xs">Inicia la conversación.</p>
               </div>
            ) : (
               comments.map((comment, idx) => (
                  <div key={`${comment.id}-${idx}`} className="flex gap-3 group animate-in slide-in-from-bottom-2 duration-500">
                    <div className="w-8 h-8 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-700 font-bold text-xs shrink-0 mt-1">
                        {comment.userName.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-sm flex-1">
                        <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm">
                            <span className="font-bold text-gray-900 mr-1 block text-xs mb-0.5">{comment.userName}</span>
                            <span className="text-gray-700 leading-snug">{comment.text}</span>
                        </div>
                        {/* <div className="text-[10px] text-gray-400 mt-1 ml-2 font-medium">Responder</div> */}
                    </div>
                  </div>
               ))
            )}
            <div ref={commentsEndRef} />
          </div>

          {/* Actions & Input */}
          <div className="border-t bg-white p-4 space-y-3 shrink-0 z-10">
            <div className="flex items-center justify-between">
               <div className="flex items-center space-x-4">
                  <button 
                    onClick={() => onLike(post.id)}
                    className={`transition-all active:scale-125 ${post.isLiked ? 'text-green-500' : 'text-gray-400 hover:text-green-500'}`}
                  >
                    <Clover size={28} strokeWidth={post.isLiked ? 2.5 : 2} />
                  </button>
                  <button className="text-gray-400 hover:text-cyan-600 transition-colors">
                    <MessageSquareText size={28} />
                  </button>
                  <button onClick={() => onShare(post)} className="text-gray-400 hover:text-cyan-600 transition-colors">
                    <Share2 size={28} />
                  </button>
               </div>
               <div className="font-bold text-sm text-gray-800">
                  {post.likes} Me gusta
               </div>
            </div>

            <form onSubmit={handleCommentSubmit} className="relative flex items-center">
               <input 
                  type="text" 
                  placeholder="Agrega un comentario..." 
                  className="w-full bg-gray-50 border border-transparent focus:bg-white focus:border-cyan-300 rounded-full py-3 pl-4 pr-12 text-sm outline-none transition-all"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
               />
               <button 
                 disabled={!commentText.trim() || isSubmitting}
                 type="submit"
                 className="absolute right-2 p-1.5 rounded-full text-cyan-600 hover:bg-cyan-50 hover:text-cyan-700 disabled:opacity-50 transition-colors"
               >
                 {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
               </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
};