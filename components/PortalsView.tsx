
import React, { useState, useEffect, useRef } from 'react';
import { Clover, MessageSquareText, Share2, MapPin, Zap, Sparkles, Loader2, Play, Info, Volume2, Waves, ChevronLeft, Map as MapIcon, X, Maximize2 } from 'lucide-react';
import { Post, User } from '../types';
import { analyzeTravelImage, getPlaceLiveContext } from '../services/geminiService';

interface PortalsViewProps {
  posts: Post[];
  currentUser: User | null;
  onLike: (post: Post) => void;
  onComment: (postId: string) => void;
  onUserClick: (userId: string) => void;
}

export const PortalsView: React.FC<PortalsViewProps> = ({ posts, currentUser, onLike, onComment, onUserClick }) => {
  const [activePostIndex, setActivePostIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Detectar cual post está en vista para snapping manual o efectos
  const handleScroll = () => {
    if (!containerRef.current) return;
    const scrollPos = containerRef.current.scrollTop;
    const windowHeight = window.innerHeight;
    const index = Math.round(scrollPos / windowHeight);
    if (index !== activePostIndex && index >= 0 && index < posts.length) {
      setActivePostIndex(index);
    }
  };

  return (
    <div 
      ref={containerRef}
      onScroll={handleScroll}
      className="fixed inset-0 z-[140] bg-black overflow-y-scroll snap-y snap-mandatory no-scrollbar h-screen w-full"
    >
      {posts.length > 0 ? (
        posts.map((post, idx) => (
          <PortalItem 
            key={post.id} 
            post={post} 
            isActive={idx === activePostIndex} 
            currentUser={currentUser}
            onLike={() => onLike(post)}
            onComment={() => onComment(post.id)}
            onUserClick={() => onUserClick(post.userId)}
          />
        ))
      ) : (
        <div className="h-screen flex flex-col items-center justify-center text-white p-10 text-center">
            <Loader2 size={48} className="animate-spin text-manabi-400 mb-4" />
            <p className="font-black uppercase tracking-widest text-sm">Abriendo portales...</p>
        </div>
      )}
    </div>
  );
};

const PortalItem: React.FC<{ 
    post: Post; 
    isActive: boolean; 
    currentUser: User | null;
    onLike: () => void;
    onComment: () => void;
    onUserClick: () => void;
}> = ({ post, isActive, currentUser, onLike, onComment, onUserClick }) => {
    const [isCinematic, setIsCinematic] = useState(false);
    const [aiInfo, setAiInfo] = useState<{title: string, info: string, category: string} | null>(null);
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [liveData, setLiveData] = useState<any>(null);
    const cinematicTimeout = useRef<any>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    // Modo Cinemático: Desaparecer UI tras inactividad
    useEffect(() => {
        const resetTimeout = () => {
            setIsCinematic(false);
            if (cinematicTimeout.current) clearTimeout(cinematicTimeout.current);
            cinematicTimeout.current = setTimeout(() => {
                if (isActive) setIsCinematic(true);
            }, 4000);
        };

        if (isActive) {
            resetTimeout();
            window.addEventListener('mousemove', resetTimeout);
            window.addEventListener('touchstart', resetTimeout);
            
            // Cargar clima/contexto
            getPlaceLiveContext(post.location).then(setLiveData);

            if (post.mediaType === 'video') videoRef.current?.play();
        } else {
            setIsCinematic(false);
            if (post.mediaType === 'video') videoRef.current?.pause();
        }

        return () => {
            window.removeEventListener('mousemove', resetTimeout);
            window.removeEventListener('touchstart', resetTimeout);
            if (cinematicTimeout.current) clearTimeout(cinematicTimeout.current);
        };
    }, [isActive, post.location]);

    const handleExploreIA = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isAiLoading) return;
        setIsAiLoading(true);
        try {
            const result = await analyzeTravelImage(post.imageUrl);
            setAiInfo(result);
        } catch (err) {
            console.error("AI Error", err);
        } finally {
            setIsAiLoading(false);
        }
    };

    return (
        <div className="h-screen w-full snap-start relative overflow-hidden bg-black flex items-center justify-center">
            {/* BACKGROUND MEDIA */}
            <div className={`absolute inset-0 w-full h-full transition-transform duration-[10s] ease-linear ${isActive ? 'scale-110' : 'scale-100'}`}>
                {post.mediaType === 'video' ? (
                    <video 
                        ref={videoRef}
                        src={post.imageUrl} 
                        className="w-full h-full object-cover" 
                        muted loop playsInline 
                    />
                ) : (
                    <img src={post.imageUrl} className="w-full h-full object-cover" alt="Portal content" />
                )}
                {/* Vignette Overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80" />
            </div>

            {/* BOTÓN EXPLORAR IA (CENTRAL IZQUIERDA) */}
            <div className={`absolute left-4 top-1/2 -translate-y-1/2 z-50 transition-all duration-700 ${isCinematic ? 'opacity-0 -translate-x-10' : 'opacity-100'}`}>
                <button 
                    onClick={handleExploreIA}
                    className={`group relative p-4 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 text-white shadow-2xl flex flex-col items-center gap-2 transition-all active:scale-90 ${isAiLoading ? 'animate-pulse' : 'hover:bg-manabi-600/40'}`}
                >
                    {isAiLoading ? <Loader2 className="animate-spin" size={24} /> : <Zap size={24} className="group-hover:text-yellow-400 transition-colors" />}
                    <span className="text-[9px] font-black uppercase tracking-widest vertical-text">Explorar IA</span>
                </button>
            </div>

            {/* INFO PANEL (ABAJO) */}
            <div className={`absolute bottom-0 left-0 w-full p-6 pb-24 md:pb-10 transition-all duration-700 z-40 ${isCinematic ? 'opacity-0 translate-y-10' : 'opacity-100'}`}>
                <div className="max-w-2xl">
                    <div className="flex items-center gap-3 mb-4 cursor-pointer group w-fit" onClick={onUserClick}>
                        <img src={post.userAvatar} className="w-12 h-12 rounded-2xl border-2 border-white/20 shadow-lg object-cover group-hover:scale-110 transition-transform" />
                        <div>
                            <h3 className="text-white font-black text-lg drop-shadow-md">@{post.userName}</h3>
                            <div className="flex items-center gap-2">
                                <span className="bg-manabi-600 text-[10px] font-black px-2 py-0.5 rounded-full text-white uppercase">Siguiendo</span>
                                {liveData && (
                                    <div className="flex items-center gap-1 text-[10px] text-cyan-300 font-bold drop-shadow-md">
                                        <Volume2 size={12} className="animate-pulse" /> Ambiente Sincronizado
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 mb-3">
                        <div className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/10 flex items-center gap-2">
                            <MapPin size={14} className="text-manabi-400" />
                            <span className="text-white font-black text-xs uppercase tracking-wider">{post.location}</span>
                        </div>
                        {liveData && (
                            <div className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/5 flex items-center gap-2 animate-in fade-in zoom-in">
                                <span className="text-amber-400 font-black text-xs">{liveData.temp}°C</span>
                                <span className="text-white/60 text-[10px] font-bold uppercase">{liveData.status}</span>
                            </div>
                        )}
                    </div>

                    <p className="text-white/90 font-medium text-base leading-relaxed drop-shadow-md line-clamp-3">
                        {post.caption}
                    </p>
                </div>
            </div>

            {/* ACTION SIDEBAR (DERECHA) */}
            <div className={`absolute right-4 bottom-32 md:bottom-20 flex flex-col gap-6 items-center z-50 transition-all duration-700 ${isCinematic ? 'opacity-0 translate-x-10' : 'opacity-100'}`}>
                <div className="flex flex-col items-center gap-1 group">
                    <button onClick={onLike} className={`p-4 rounded-full backdrop-blur-xl transition-all active:scale-125 ${post.isLiked ? 'bg-red-500/80 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                        <Clover size={28} fill={post.isLiked ? "currentColor" : "none"} />
                    </button>
                    <span className="text-white text-[10px] font-black drop-shadow-md">{post.likes}</span>
                </div>

                <div className="flex flex-col items-center gap-1 group">
                    <button onClick={onComment} className="p-4 rounded-full bg-white/10 backdrop-blur-xl text-white hover:bg-white/20 transition-all active:scale-90">
                        <MessageSquareText size={28} />
                    </button>
                    <span className="text-white text-[10px] font-black drop-shadow-md">{post.comments?.length || 0}</span>
                </div>

                <button className="p-4 rounded-full bg-white/10 backdrop-blur-xl text-white hover:bg-white/20 transition-all active:scale-90">
                    <Share2 size={28} />
                </button>

                <div className="w-10 h-10 rounded-full border-4 border-white/10 overflow-hidden animate-[spin_6s_linear_infinite] shadow-2xl">
                    <img src={post.userAvatar} className="w-full h-full object-cover" />
                </div>
            </div>

            {/* IA EXPLORE OVERLAY */}
            {aiInfo && (
                <div className="absolute inset-0 z-[60] bg-black/60 backdrop-blur-md flex items-center justify-center p-8 animate-in fade-in zoom-in duration-300">
                    <div className="max-w-md w-full bg-white rounded-[2.5rem] overflow-hidden shadow-2xl relative">
                        <button onClick={() => setAiInfo(null)} className="absolute top-4 right-4 p-2 bg-stone-100 rounded-full text-stone-500"><X size={20}/></button>
                        <div className="bg-manabi-600 p-8 text-white">
                            <div className="flex items-center gap-2 mb-2 text-cyan-300">
                                <Sparkles size={16} />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em]">{aiInfo.category}</span>
                            </div>
                            <h4 className="text-2xl font-black leading-tight">{aiInfo.title}</h4>
                        </div>
                        <div className="p-8">
                            <p className="text-stone-600 leading-relaxed text-lg italic mb-6">"{aiInfo.info}"</p>
                            <button onClick={() => setAiInfo(null)} className="w-full bg-stone-900 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all">
                                Volver al Portal <ArrowRight size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* HINT ICON FOR SWIPE */}
            {isActive && !isCinematic && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/40 animate-bounce flex flex-col items-center gap-1">
                    <span className="text-[9px] font-black uppercase tracking-widest">Desliza</span>
                    <Play size={14} className="rotate-90" fill="currentColor" />
                </div>
            )}
        </div>
    );
};

const ArrowRight = ({ size, className }: { size: number, className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
);
