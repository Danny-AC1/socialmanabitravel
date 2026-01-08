
import React, { useState, useRef, useEffect } from 'react';
import { Clover, MessageSquareText, Share2, MapPin, MoreVertical, Edit2, Trash2, Play, Wand2, CloudSun, Clock, Zap, Volume2, Sparkles, Loader2, Info } from 'lucide-react';
import { Post } from '../types';
import { getPlaceLiveContext, analyzeTravelImage } from '../services/geminiService';

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
  const [isLikeAnimating, setIsLikeAnimating] = useState(false);
  
  // LIVE FEATURES STATES
  const [liveContext, setLiveContext] = useState<{placeName: string, weather: string, temp: string, status: string} | null>(null);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<{title: string, info: string, category: string} | null>(null);
  const [isSoundEnabled, setIsSoundEnabled] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const isOwner = post.userId === currentUserId;
  const comments = post.comments || [];

  // Obtener contexto "vivo" (clima/hora) al montar el post
  useEffect(() => {
    const fetchContext = async () => {
        if (post.location) {
            const context = await getPlaceLiveContext(post.location);
            if (context) setLiveContext(context);
        }
    };
    fetchContext();
  }, [post.location]);

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
    if (!post.isLiked) {
        setIsLikeAnimating(true);
        setTimeout(() => setIsLikeAnimating(false), 1000);
    }
  };

  const handleAiExplore = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isAiAnalyzing) return;
    
    setIsAiAnalyzing(true);
    try {
        const result = await analyzeTravelImage(post.imageUrl);
        setAiAnalysis(result);
        setTimeout(() => setAiAnalysis(null), 8000); // Ocultar después de unos segundos
    } catch (err) {
        console.error("AI Analysis failed", err);
    } finally {
        setIsAiAnalyzing(false);
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
    <div 
        className="bg-white border border-stone-100 rounded-[2.5rem] shadow-sm mb-10 overflow-hidden hover:shadow-xl transition-all duration-500 group/card"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
    >
      
      <style>{`
        @keyframes lucky-burst-1 { 0% { transform: translate(0,0) scale(0.5); opacity: 1; } 100% { transform: translate(-30px, -40px) rotate(-20deg) scale(0); opacity: 0; } }
        @keyframes lucky-burst-2 { 0% { transform: translate(0,0) scale(0.5); opacity: 1; } 100% { transform: translate(30px, -40px) rotate(20deg) scale(0); opacity: 0; } }
        @keyframes lucky-burst-3 { 0% { transform: translate(0,0) scale(0.5); opacity: 1; } 100% { transform: translate(-45px, 0px) rotate(-40deg) scale(0); opacity: 0; } }
        @keyframes lucky-burst-4 { 0% { transform: translate(0,0) scale(0.5); opacity: 1; } 100% { transform: translate(45px, 0px) rotate(40deg) scale(0); opacity: 0; } }
        
        .particle-1 { animation: lucky-burst-1 0.9s cubic-bezier(0.19, 1, 0.22, 1) forwards; }
        .particle-2 { animation: lucky-burst-2 0.9s cubic-bezier(0.19, 1, 0.22, 1) forwards; }
        .particle-3 { animation: lucky-burst-3 0.9s cubic-bezier(0.19, 1, 0.22, 1) forwards; }
        .particle-4 { animation: lucky-burst-4 0.9s cubic-bezier(0.19, 1, 0.22, 1) forwards; }

        @keyframes pulse-ring {
            0% { transform: scale(0.8); opacity: 0.5; }
            100% { transform: scale(1.5); opacity: 0; }
        }
        .ai-pulse-ring { animation: pulse-ring 2s infinite; }
      `}</style>

      {/* HEADER CON CONTEXTO VIVO */}
      <div className="flex items-center justify-between p-5 relative">
        <div 
          className="flex items-center space-x-3 cursor-pointer group"
          onClick={() => onUserClick(post.userId)}
        >
          <div className="relative">
              <img src={post.userAvatar} alt={post.userName} className="w-11 h-11 rounded-2xl object-cover ring-2 ring-stone-50 group-hover:ring-manabi-400 transition-all shadow-sm" />
              <div className="absolute -bottom-1 -right-1 bg-green-500 w-3 h-3 rounded-full border-2 border-white"></div>
          </div>
          <div>
            <h3 className="font-black text-sm text-slate-800 group-hover:text-manabi-600 transition-colors leading-tight">{post.userName}</h3>
            {post.location && (
              <div className="flex items-center text-[10px] text-manabi-600 font-black uppercase tracking-widest mt-0.5">
                <MapPin size={10} className="mr-0.5" />
                {post.location}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
            {/* WIDGET DE CLIMA VIVO */}
            {liveContext && (
                <div className="hidden sm:flex items-center gap-2 bg-stone-50 px-3 py-1.5 rounded-2xl border border-stone-100 animate-in fade-in zoom-in duration-500">
                    <CloudSun size={14} className="text-amber-500" />
                    <div className="leading-none">
                        <span className="block text-[10px] font-black text-slate-700">{liveContext.temp}°C</span>
                        <span className="text-[8px] font-bold text-stone-400 uppercase tracking-tighter">{liveContext.status}</span>
                    </div>
                </div>
            )}

            {isOwner && (
            <div className="relative" ref={menuRef}>
                <button 
                onClick={() => setShowMenu(!showMenu)}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                <MoreVertical size={20} />
                </button>
                
                {showMenu && (
                <div className="absolute right-0 top-10 bg-white border border-gray-100 shadow-xl rounded-2xl w-36 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-200">
                    <button 
                    onClick={() => { setShowMenu(false); onEdit(post); }}
                    className="w-full text-left px-4 py-3 text-xs font-black uppercase text-slate-700 hover:bg-stone-50 flex items-center gap-2 border-b border-gray-50"
                    >
                    <Edit2 size={14} /> Editar
                    </button>
                    <button 
                    onClick={() => { setShowMenu(false); onDelete(post.id); }}
                    className="w-full text-left px-4 py-3 text-xs font-black uppercase text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                    <Trash2 size={14} /> Eliminar
                    </button>
                </div>
                )}
            </div>
            )}
        </div>
      </div>

      {/* CONTENEDOR MULTIMEDIA "VIVO" */}
      <div 
        className="relative w-full bg-stone-100 cursor-pointer overflow-hidden group/media aspect-[4/5] sm:aspect-square md:aspect-video"
        onClick={() => onImageClick && onImageClick(post)}
        onMouseEnter={() => { if(post.mediaType === 'video') videoRef.current?.play(); }}
        onMouseLeave={() => { if(post.mediaType === 'video') { videoRef.current?.pause(); videoRef.current!.currentTime = 0; } }}
      >
        {/* Efecto Ken Burns (Solo para imágenes) */}
        <div className={`absolute inset-0 w-full h-full transition-all duration-1000 ${post.mediaType !== 'video' ? 'animate-ken-burns' : ''}`}>
             {post.mediaType === 'video' ? (
                <video 
                    ref={videoRef}
                    src={post.imageUrl} 
                    className="w-full h-full object-cover" 
                    muted 
                    loop 
                    playsInline
                />
            ) : (
                <img 
                    src={post.imageUrl} 
                    alt="Post content" 
                    className="w-full h-full object-cover" 
                    loading="lazy" 
                />
            )}
        </div>

        {/* OVERLAYS VIVOS */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 pointer-events-none" />

        {/* BOTÓN EXPLORAR IA */}
        <div className="absolute top-4 left-4 z-40">
            <button 
                onClick={handleAiExplore}
                className={`relative p-3 rounded-2xl glass-post text-white transition-all flex items-center gap-2 group/ai ${isAiAnalyzing ? 'scale-110' : 'hover:scale-105 active:scale-95'}`}
            >
                {isAiAnalyzing ? (
                    <Loader2 size={18} className="animate-spin text-cyan-400" />
                ) : (
                    <Zap size={18} className={`${isAiAnalyzing ? 'animate-pulse' : 'group-hover/ai:text-cyan-400'}`} fill={isAiAnalyzing ? "currentColor" : "none"} />
                )}
                <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">Explorar IA</span>
                
                {!isAiAnalyzing && !aiAnalysis && (
                    <div className="absolute inset-0 rounded-2xl border-2 border-cyan-400/50 ai-pulse-ring pointer-events-none"></div>
                )}
            </button>
        </div>

        {/* INDICADOR DE SONIDO (Simulado) */}
        {isHovered && (
            <div className="absolute bottom-4 left-4 glass-post rounded-xl px-3 py-1.5 flex items-center gap-2 animate-in slide-in-from-bottom-2">
                <div className="flex gap-0.5 items-end h-3">
                    <div className="w-0.5 bg-white animate-[bounce_1s_infinite]"></div>
                    <div className="w-0.5 bg-white animate-[bounce_1.2s_infinite]"></div>
                    <div className="w-0.5 bg-white animate-[bounce_0.8s_infinite]"></div>
                </div>
                <span className="text-[8px] font-black text-white uppercase tracking-tighter">Sincronizando Ambiente...</span>
            </div>
        )}

        {/* ETIQUETAS DE ANÁLISIS IA (FLOTANTES) */}
        {aiAnalysis && (
            <div className="absolute inset-0 flex items-center justify-center p-6 z-30">
                <div className="glass-post p-5 rounded-3xl border border-cyan-400/30 text-white max-w-xs animate-in zoom-in-90 duration-300">
                    <div className="flex items-center gap-2 mb-2 text-cyan-400">
                        <Sparkles size={16} />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">{aiAnalysis.category}</span>
                    </div>
                    <h4 className="font-black text-lg leading-tight mb-2">{aiAnalysis.title}</h4>
                    <p className="text-xs font-medium text-white/80 leading-relaxed italic">"{aiAnalysis.info}"</p>
                </div>
            </div>
        )}

        {/* Badge de Video */}
        {post.mediaType === 'video' && (
            <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md p-2 rounded-xl text-white">
                <Play size={16} fill="currentColor" />
            </div>
        )}
      </div>

      {/* ACCIONES Y CONTENIDO SOCIAL */}
      <div className="p-6 pb-2">
        <div className="flex items-center justify-between mb-5">
            <div className="flex items-center space-x-6">
                <button 
                    onClick={handleLikeClick}
                    className={`relative transition-all flex items-center gap-2 group/like ${post.isLiked ? 'text-manabi-600' : 'text-slate-400 hover:text-manabi-600'}`}
                >
                    {/* Partículas de Suerte */}
                    {isLikeAnimating && (
                      <>
                        <Clover size={14} className="absolute inset-0 m-auto text-manabi-500 particle-1" fill="currentColor" />
                        <Clover size={14} className="absolute inset-0 m-auto text-manabi-500 particle-2" fill="currentColor" />
                        <Clover size={12} className="absolute inset-0 m-auto text-cyan-400 particle-3" fill="currentColor" />
                        <Clover size={12} className="absolute inset-0 m-auto text-cyan-400 particle-4" fill="currentColor" />
                      </>
                    )}
                    
                    <div className={`p-2.5 rounded-full transition-all ${post.isLiked ? 'bg-manabi-50 shadow-inner' : 'bg-stone-50 group-hover/like:bg-manabi-50'}`}>
                        <Clover 
                            size={24} 
                            className={`transition-transform z-10 relative ${isLikeAnimating ? 'scale-125' : 'active:scale-90 group-hover/like:scale-110'}`} 
                            fill={post.isLiked ? "currentColor" : "none"} 
                        />
                    </div>
                    <span className="text-sm font-black tracking-tight">{post.likes}</span>
                </button>

                <button 
                    onClick={() => setShowComments(!showComments)}
                    className="flex items-center gap-2 text-slate-400 hover:text-manabi-600 transition-all group/comm"
                >
                    <div className="p-2.5 rounded-full bg-stone-50 group-hover/comm:bg-manabi-50 transition-colors">
                        <MessageSquareText size={24} />
                    </div>
                    <span className="text-sm font-black tracking-tight">{comments.length}</span>
                </button>
            </div>
            
            <button 
                onClick={() => onShare && onShare(post)}
                className="p-2.5 rounded-full bg-stone-50 text-slate-400 hover:text-manabi-600 hover:bg-manabi-50 transition-all hover:scale-110"
            >
                <Share2 size={24} />
            </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-slate-700 leading-relaxed">
            <span className="font-black text-slate-900 mr-2">{post.userName}</span>
            {post.caption}
          </p>
        </div>

        {comments.length > 0 && (
          <button 
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1.5 text-stone-400 text-[11px] font-black uppercase tracking-widest mb-4 hover:text-manabi-600 transition-colors"
          >
            {showComments ? 'Ocultar bitácora' : `Ver ${comments.length} opiniones de viajeros`}
          </button>
        )}

        {showComments && (
          <div className="space-y-4 mb-6 max-h-52 overflow-y-auto no-scrollbar bg-stone-50/50 p-4 rounded-[1.5rem] border border-stone-100 animate-in slide-in-from-top-2">
            {comments.map((comment) => (
              <div key={comment.id} className="flex items-start space-x-3 group">
                <div className="w-7 h-7 rounded-lg bg-manabi-100 flex items-center justify-center text-manabi-700 font-black text-[10px] shrink-0">
                    {comment.userName.charAt(0)}
                </div>
                <div className="flex-1">
                    <span className="font-black text-slate-800 text-[11px] mr-2">{comment.userName}</span>
                    <p className="text-slate-600 text-xs leading-relaxed">{comment.text}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 text-stone-300 text-[9px] font-black uppercase tracking-[0.2em] mb-4">
          <Clock size={10} /> Publicado hoy en tiempo real
        </div>
      </div>

      <form onSubmit={handleCommentSubmit} className="border-t border-stone-50 p-4 flex items-center bg-stone-50/20">
        <input 
          type="text" 
          placeholder="Escribe tu opinión viajera..." 
          className="flex-1 text-xs font-bold outline-none px-4 py-2.5 bg-white rounded-2xl border border-stone-100 focus:border-manabi-300 transition-all placeholder-stone-400"
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
        />
        <button 
          type="submit" 
          disabled={!commentText.trim()}
          className="ml-2 bg-manabi-600 text-white p-2.5 rounded-xl shadow-md hover:bg-manabi-700 disabled:opacity-30 disabled:grayscale transition-all active:scale-90"
        >
          <Zap size={16} fill="currentColor" />
        </button>
      </form>
    </div>
  );
};
