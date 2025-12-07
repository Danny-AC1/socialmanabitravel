import React, { useState, useRef, useEffect } from 'react';
import { X, Clover, MessageSquareText, Share2, MoreVertical, Edit2, Trash2, MapPin, Send } from 'lucide-react';
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
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isOwner = post.userId === currentUserId;
  const comments = post.comments || []; // Defensive check

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (commentText.trim()) {
      onComment(post.id, commentText);
      setCommentText('');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm animate-in fade-in duration-200">
      <button 
        onClick={onClose} 
        className="absolute top-4 left-4 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors z-50"
      >
        <X size={32} />
      </button>

      <div className="flex flex-col md:flex-row w-full h-full md:max-w-6xl md:max-h-[90vh] md:rounded-xl overflow-hidden bg-black md:bg-white">
        
        <div className="flex-1 bg-black flex items-center justify-center relative">
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
        </div>

        <div className="w-full md:w-[400px] bg-white flex flex-col h-[40vh] md:h-full border-l border-gray-100">
          
          <div className="p-4 border-b flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-3">
              <img src={post.userAvatar} alt={post.userName} className="w-10 h-10 rounded-full object-cover border border-gray-100" />
              <div>
                <h3 className="font-bold text-sm text-gray-800">{post.userName}</h3>
                {post.location && (
                  <div className="flex items-center text-xs text-cyan-600">
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
                  className="text-gray-500 hover:text-cyan-600 p-2 rounded-full hover:bg-gray-100"
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

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="flex gap-3">
               <img src={post.userAvatar} alt="User" className="w-8 h-8 rounded-full object-cover mt-1" />
               <div className="text-sm">
                  <span className="font-bold text-gray-800 mr-2">{post.userName}</span>
                  <span className="text-gray-600 leading-relaxed">{post.caption}</span>
                  <div className="text-xs text-gray-400 mt-1">Hace un momento</div>
               </div>
            </div>

            <div className="h-px bg-gray-100 my-2" />

            {comments.length === 0 ? (
               <div className="text-center py-10 text-gray-400 text-sm">
                  Sé el primero en opinar.
               </div>
            ) : (
               comments.map(comment => (
                  <div key={comment.id} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-700 font-bold text-xs shrink-0">
                        {comment.userName.charAt(0)}
                    </div>
                    <div className="text-sm">
                        <span className="font-bold text-gray-800 mr-2">{comment.userName}</span>
                        <span className="text-gray-600">{comment.text}</span>
                    </div>
                  </div>
               ))
            )}
          </div>

          <div className="border-t bg-gray-50 p-4 space-y-3 shrink-0">
            <div className="flex items-center justify-between">
               <div className="flex items-center space-x-4">
                  <button 
                    onClick={() => onLike(post.id)}
                    className={`transition-all active:scale-125 ${post.isLiked ? 'text-green-600' : 'text-gray-400 hover:text-green-600'}`}
                  >
                    <Clover size={28} fill={post.isLiked ? "currentColor" : "none"} />
                  </button>
                  <button className="text-gray-400 hover:text-cyan-600">
                    <MessageSquareText size={28} />
                  </button>
                  <button onClick={() => onShare(post)} className="text-gray-400 hover:text-cyan-600">
                    <Share2 size={28} />
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
                  className="w-full bg-white border border-gray-200 rounded-full py-2 pl-4 pr-10 text-sm outline-none focus:border-cyan-400"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
               />
               <button 
                 disabled={!commentText.trim()}
                 type="submit"
                 className="absolute right-2 top-2 text-cyan-600 hover:text-cyan-700 disabled:opacity-50"
               >
                 <Send size={18} />
               </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
};