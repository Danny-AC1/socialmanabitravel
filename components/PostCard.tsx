
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
  const [isLikeAnimating, setIsLikeAnimating] = useState(false); // Estado para la animación
  const menuRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const isOwner = post.userId === currentUserId;
  const comments = post.comments || [];

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (commentText.trim()) {
      onComment(post.id, commentText);
      setCommentText('');
      setShowComments(true);
    }
  };

  const handleLikeClick = () => {
    onLike(post.id);
    if (!post.isLiked) { // Solo animar si se está dando like (no quitando)
        setIsLikeAnimating(true);
        setTimeout(() => setIsLikeAnimating(false), 1000);
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
      
      {/* Estilos para la animación de partículas */}
      <style>{`
        @keyframes float-out-1 { 0% { transform: translate(0,0) scale(0.5); opacity: 1; } 100% { transform: translate(-20px, -30px) scale(0); opacity: 0; } }
        @keyframes float-out-2 { 0% { transform: translate(0,0) scale(0.5); opacity: 1; } 100% { transform: translate(20px, -30px) scale(0); opacity: 0; } }
        @keyframes float-out-3 { 0% { transform: translate(0,0) scale(0.5); opacity: 1; } 100% { transform: translate(-30px, 0px) scale(0); opacity: 0; } }
        @keyframes float-out-4 { 0% { transform: translate(0,0) scale(0.5); opacity: 1; } 100% { transform: translate(30px, 0px) scale(0); opacity: 0; } }
        @keyframes float-out-5 { 0% { transform: translate(0,0) scale(0.5); opacity: 1; } 100% { transform: translate(-15px, 20px) scale(0); opacity: 0; } }
        @keyframes float-out-6 { 0% { transform: translate(0,0) scale(0.5); opacity: 1; } 100% { transform: translate(15px, 20px) scale(0); opacity: 0; } }
        
        .clover-particle-1 { animation: float-out-1 0.8s ease-out forwards; }
        .clover-particle-2 { animation: float-out-2 0.8s ease-out forwards; }
        .clover-particle-3 { animation: float-out-3 0.8s ease-out forwards; }
        .clover-particle-4 { animation: float-out-4 0.8s ease-out forwards; }
        .clover-particle-5 { animation: float-out-5 0.8s ease-out forwards; }
        .clover-particle-6 { animation: float-out-6 0.8s ease-out forwards; }

        @keyframes pop-clover {
            0% { transform: scale(1); }
            50% { transform: scale(1.4); }
            100% { transform: scale(1); }
        }
        .pop-animation { animation: pop-clover 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
      `}</style>

      <div className="flex items-center justify-between p-4 relative">
        <div 
          className="flex items-center space-x-3 cursor-pointer group"
          onClick={() => onUserClick(post.userId)}
        >
          <img src={post.userAvatar} alt={post.userName} className="w-10 h-10 rounded-xl object-cover ring-2 ring-stone-50 group-hover:ring-cyan-200 transition-all" />
          <div>
            <h3 className="font-bold text-sm text-gray-800 group-hover:text-cyan-700 transition-colors">{post.userName}</h3>
            {post.location && (
              <div className="flex items-center text-xs text-cyan-600 font-medium bg-cyan-50 px-2 py-0.5 rounded-full w-fit mt-0.5">
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
              className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <MoreVertical size={20} />
            </button>
            
            {showMenu && (
              <div className="absolute right-0 top-10 bg-white border border-gray-100 shadow-xl rounded-xl w-36 py-1 z-10 animate-in fade-in zoom-in-95 duration-100">
                <button 
                  onClick={() => { setShowMenu(false); onEdit(post); }}
                  className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 border-b border-gray-50"
                >
                  <Edit2 size={14} /> Editar
                </button>
                <button 
                  onClick={() => { setShowMenu(false); onDelete(post.id); }}
                  className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <Trash2 size={14} /> Eliminar
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* VISUALIZACIÓN DE IMAGEN OPTIMIZADA */}
      <div 
        className="relative w-full bg-stone-100 cursor-pointer overflow-hidden group"
        onClick={() => onImageClick && onImageClick(post)}
        onMouseEnter={() => { if(post.mediaType === 'video') videoRef.current?.play(); }}
        onMouseLeave={() => { if(post.mediaType === 'video') { videoRef.current?.pause(); videoRef.current!.currentTime = 0; } }}
      >
        {/* Capa de fondo desenfocado (Ambient Blur) */}
        <div 
            className="absolute inset-0 bg-cover bg-center blur-2xl opacity-50 scale-110 pointer-events-none"
            style={{ backgroundImage: `url(${post.imageUrl})` }}
        />

        {/* Contenedor principal de la imagen/video */}
        <div className="relative w-full flex items-center justify-center bg-black/5 min-h-[300px] max-h-[600px] backdrop-blur-sm">
            {post.mediaType === 'video' ? (
            <>
                <video 
                    ref={videoRef}
                    src={post.imageUrl} 
                    className="max-w-full max-h-[600px] w-auto h-auto object-contain shadow-sm" 
                    muted 
                    loop 
                    playsInline
                />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/40 rounded-full p-4 group-hover:opacity-0 transition-opacity backdrop-blur-md border border-white/20">
                    <Play size={32} className="text-white fill-white ml-1" />
                </div>
                <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md text-white text-xs px-2 py-1 rounded flex items-center gap-1 border border-white/10">
                    <Play size={10} fill="currentColor" /> Video
                </div>
            </>
            ) : (
            <img 
                src={post.imageUrl} 
                alt="Post content" 
                className="max-w-full max-h-[600px] w-auto h-auto object-contain transition-transform duration-500 group-hover:scale-[1.01] shadow-sm relative z-10" 
                loading="lazy" 
            />
            )}
        </div>
        
        {/* Overlay "Ver detalle" */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center pointer-events-none z-20">
            <span className="opacity-0 group-hover:opacity-100 text-white font-bold bg-black/60 px-4 py-2 rounded-full backdrop-blur-md transition-all transform translate-y-4 group-hover:translate-y-0 text-sm border border-white/20 shadow-lg">
                Ver completa
            </span>
        </div>
      </div>

      <div className="p-4 pb-2">
        <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-6">
                <button 
                    onClick={handleLikeClick}
                    className={`relative transition-colors flex items-center gap-1 group/like ${post.isLiked ? 'text-green-600' : 'text-gray-400 hover:text-green-600'}`}
                >
                    {/* Partículas animadas */}
                    {isLikeAnimating && (
                      <>
                        <Clover size={14} className="absolute inset-0 m-auto text-green-500 clover-particle-1" fill="currentColor" />
                        <Clover size={14} className="absolute inset-0 m-auto text-green-500 clover-particle-2" fill="currentColor" />
                        <Clover size={12} className="absolute inset-0 m-auto text-green-400 clover-particle-3" fill="currentColor" />
                        <Clover size={12} className="absolute inset-0 m-auto text-green-400 clover-particle-4" fill="currentColor" />
                        <Clover size={10} className="absolute inset-0 m-auto text-green-300 clover-particle-5" fill="currentColor" />
                        <Clover size={10} className="absolute inset-0 m-auto text-green-300 clover-particle-6" fill="currentColor" />
                      </>
                    )}
                    
                    {/* Icono Principal */}
                    <Clover 
                        size={26} 
                        className={`transition-transform z-10 relative ${isLikeAnimating ? 'pop-animation' : 'active:scale-90 group-hover/like:scale-110'}`} 
                        fill={post.isLiked ? "currentColor" : "none"} 
                    />
                </button>
                <button 
                    onClick={() => setShowComments(!showComments)}
                    className="text-gray-400 hover:text-cyan-600 transition-colors hover:scale-110 transform"
                >
                    <MessageSquareText size={26} />
                </button>
            </div>
            
            <button 
                onClick={() => onShare && onShare(post)}
                className="text-gray-400 hover:text-cyan-600 transition-colors hover:scale-110 transform"
            >
                <Share2 size={26} />
            </button>
        </div>

        <div className="font-bold text-sm mb-2 text-gray-800 flex items-center gap-1">
            <div className="bg-green-100 p-1 rounded-full"><Clover size={12} className="text-green-600" fill="currentColor"/></div>
            {post.likes} <span className="font-normal text-gray-500">suertes</span>
        </div>

        <div className="mb-3">
          <span className="font-bold text-sm mr-2 text-gray-900">{post.userName}</span>
          <span className="text-sm text-gray-700 leading-relaxed">{post.caption}</span>
        </div>

        {comments.length > 0 && (
          <button 
            onClick={() => setShowComments(!showComments)}
            className="text-gray-400 text-xs font-medium mb-3 hover:text-gray-600"
          >
            {showComments ? 'Ocultar opiniones' : `Ver las ${comments.length} opiniones...`}
          </button>
        )}

        {showComments && (
          <div className="space-y-3 mb-4 max-h-40 overflow-y-auto no-scrollbar bg-stone-50 p-3 rounded-xl border border-stone-100">
            {comments.map((comment) => (
              <div key={comment.id} className="flex items-start space-x-2 text-sm group">
                <span className="font-bold text-gray-800 min-w-max text-xs">{comment.userName}</span>
                <span className="text-gray-600 text-xs leading-relaxed">{comment.text}</span>
              </div>
            ))}
          </div>
        )}

        <div className="text-gray-300 text-[10px] uppercase tracking-wider font-bold mt-2">
          Hace un momento
        </div>
      </div>

      <form onSubmit={handleCommentSubmit} className="border-t border-stone-100 p-3 flex items-center bg-stone-50/50">
        <input 
          type="text" 
          placeholder="Agrega un comentario..." 
          className="flex-1 text-sm outline-none px-3 py-2 bg-transparent placeholder-gray-400"
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
        />
        <button 
          type="submit" 
          disabled={!commentText.trim()}
          className="text-cyan-600 font-bold text-xs disabled:opacity-30 uppercase tracking-wide hover:text-cyan-700 px-2 transition-opacity"
        >
          Publicar
        </button>
      </form>
    </div>
  );
};
