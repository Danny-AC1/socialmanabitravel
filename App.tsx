
import React, { useState, useEffect, useRef } from 'react';
import { Map as MapIcon, Compass, Camera, Search, LogOut, ChevronLeft, PlusCircle, Globe, Filter, Edit3, X, Lightbulb, MapPin, Plus, MessageCircle, Users, Bell, LayoutGrid, Award, Home, Sparkles, Trophy, CheckCircle, Navigation, Lock, User as UserIcon, AlertTriangle } from 'lucide-react';
import { HeroSection } from './components/HeroSection';
import { PostCard } from './components/PostCard';
import { CreatePostModal } from './components/CreatePostModal';
import { EditPostModal } from './components/EditPostModal';
import { EditStoryModal } from './components/EditStoryModal';
import { ChatBot } from './components/ChatBot';
import { StoryViewer } from './components/StoryViewer';
import { DestinationCard } from './components/DestinationCard';
import { TravelGuideModal } from './components/TravelGuideModal';
import { AddDestinationModal } from './components/AddDestinationModal';
import { SuggestionsModal } from './components/SuggestionsModal';
import { AdminUsersModal } from './components/AdminUsersModal';
import { ChatModal } from './components/ChatModal';
import { AuthScreen } from './components/AuthScreen';
import { PostViewer } from './components/PostViewer';
import { OnboardingModal } from './components/OnboardingModal';
import { NotificationsModal } from './components/NotificationsModal';
import { FollowListModal } from './components/FollowListModal';
import { ItineraryGeneratorModal } from './components/ItineraryGeneratorModal';
import { ChallengeCard } from './components/ChallengeCard';
import { NearbyModal } from './components/NearbyModal';
import { WhatsNewModal } from './components/WhatsNewModal'; 
import { TravelGroupsModal } from './components/TravelGroupsModal';
import { ALL_DESTINATIONS as STATIC_DESTINATIONS, APP_VERSION } from './constants';
import { Post, Story, Destination, User, EcuadorRegion, Suggestion, Chat, Notification, Challenge, TravelGroup } from './types';
import { StorageService } from './services/storageService';
import { AuthService } from './services/authService';
import { isAdmin, getDailyChallenge } from './utils';
import { findNearbyPlaces as findNearbyPlacesService } from './services/geminiService';
import { db, isFirebaseConfigured } from './services/firebase';
import { ref, onValue } from 'firebase/database';
import { Helmet } from 'react-helmet-async';

type Tab = 'home' | 'explore' | 'search' | 'profile';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [destinations, setDestinations] = useState<Destination[]>(STATIC_DESTINATIONS);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isNearbyModalOpen, setIsNearbyModalOpen] = useState(false);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [nearbyData, setNearbyData] = useState<{text: string, places: any[]} | null>(null);

  const [activeTab, setActiveTab] = useState<Tab>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('current_tab');
      if (saved === 'home' || saved === 'explore' || saved === 'search' || saved === 'profile') {
        return saved;
      }
    }
    return 'home';
  });

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null);
  const [viewingStoryIndex, setViewingStoryIndex] = useState<number | null>(null);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [viewingPost, setViewingPost] = useState<Post | null>(null);
  const [chatQuery, setChatQuery] = useState('');

  // Helper para verificar si el usuario puede realizar acciones
  const requireAuth = (action: () => void) => {
    if (!user) {
      setIsAuthOpen(true);
    } else {
      action();
    }
  };

  useEffect(() => {
    localStorage.setItem('current_tab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    const session = AuthService.getSession();
    if (session) {
      setUser(session);
    }
  }, []);

  // Firebase Realtime Listeners
  useEffect(() => {
    const postsRef = ref(db, 'posts');
    const unsubscribePosts = onValue(postsRef, (snapshot) => {
      const data = snapshot.val();
      const loadedPosts: Post[] = data ? Object.values(data) : [];
      setPosts(loadedPosts.sort((a, b) => b.timestamp - a.timestamp));
    });

    const destinationsRef = ref(db, 'destinations');
    const unsubscribeDestinations = onValue(destinationsRef, (snapshot) => {
      const data = snapshot.val();
      const loadedDestinations: Destination[] = data ? Object.values(data) : [];
      const mergedDestinations = [...STATIC_DESTINATIONS];
      const firebaseDestMap = new Map(loadedDestinations.map(d => [d.id, d]));
      for (let i = 0; i < mergedDestinations.length; i++) {
         if (firebaseDestMap.has(mergedDestinations[i].id)) {
            mergedDestinations[i] = firebaseDestMap.get(mergedDestinations[i].id)!;
            firebaseDestMap.delete(mergedDestinations[i].id);
         }
      }
      setDestinations([...mergedDestinations, ...Array.from(firebaseDestMap.values())]);
    });

    const storiesRef = ref(db, 'stories');
    const unsubscribeStories = onValue(storiesRef, (snapshot) => {
      const data = snapshot.val();
      const loadedStories: Story[] = data ? Object.values(data) : [];
      setStories(loadedStories.sort((a, b) => b.timestamp - a.timestamp));
    });

    return () => {
      unsubscribePosts();
      unsubscribeDestinations();
      unsubscribeStories();
    };
  }, []);

  const handleLogout = () => {
    AuthService.logout();
    setUser(null);
    setActiveTab('home');
  };

  const handleLike = (id: string) => requireAuth(async () => { 
    try {
      const post = posts.find(p => p.id === id); 
      if (post && user) await StorageService.toggleLikePost(post, user.id); 
    } catch (e) {
      alert("Error al conectar con la base de datos.");
    }
  });

  const handleComment = (id: string, text: string) => requireAuth(async () => { 
    if (!user) return; 
    try {
      const post = posts.find(p => p.id === id); 
      if (post) { 
        const newComment = { id: Date.now().toString(), userId: user.id, userName: user.name, text, timestamp: Date.now() }; 
        const updatedComments = [...(post.comments || []), newComment]; 
        await StorageService.addComment(post.id, updatedComments); 
      } 
    } catch (e) {
      alert("No se pudo publicar el comentario.");
    }
  });

  const handleEditPost = (post: Post) => requireAuth(() => {
    setEditingPost(post);
  });

  const handleSaveEditPost = async (id: string, caption: string, location: string) => {
    try {
      await StorageService.updatePost(id, { caption, location });
      setEditingPost(null);
    } catch (e) {
      alert("Error al guardar cambios.");
    }
  };

  const handleDeletePost = (id: string) => requireAuth(async () => {
    if (confirm("¿Estás seguro de que quieres eliminar esta publicación?")) {
      try {
        await StorageService.deletePost(id);
      } catch (e) {
        alert("Error al eliminar.");
      }
    }
  });

  const handleSharePost = (post: Post) => {
    if (navigator.share) {
      navigator.share({
        title: 'Manabí Travel',
        text: post.caption,
        url: window.location.href,
      }).catch(console.error);
    } else {
      alert("Enlace copiado al portapapeles: " + window.location.href);
    }
  };

  const handleCreateContent = (image: string, caption: string, location: string, type: 'post' | 'story', mediaType: 'image' | 'video') => requireAuth(async () => {
    if (!user) return; 
    if (!isFirebaseConfigured) {
      alert("⚠️ ERROR DE CONFIGURACIÓN:\nLa base de datos no está conectada. Los cambios no se guardarán permanentemente.\n\nPor favor, contacta al administrador.");
      return;
    }
    
    try {
      if (type === 'post') { 
          const newPost: Post = { id: Date.now().toString(), userId: user.id, userName: user.name, userAvatar: user.avatar, location, imageUrl: image, mediaType: mediaType, caption, likes: 0, comments: [], timestamp: Date.now() }; 
          await StorageService.savePost(newPost); 
      } else { 
          const newStory: Story = { id: `s_${Date.now()}`, userId: user.id, userName: user.name, userAvatar: user.avatar, imageUrl: image, mediaType: mediaType, timestamp: Date.now(), isViewed: false, caption: caption, location: location, likes: 0 }; 
          await StorageService.saveStory(newStory); 
      } 
      setActiveTab('home'); 
      alert("¡Publicado con éxito! 🎉");
    } catch (error: any) {
      console.error("Upload error:", error);
      alert("Error al subir contenido: " + (error.message || "Verifica tu conexión"));
    }
  });

  const handleNearbySearch = () => {
    setIsNearbyModalOpen(true);
    setNearbyLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
          const { latitude, longitude } = position.coords;
          const aiResult = await findNearbyPlacesService(latitude, longitude);
          setNearbyData({ text: "Resultados en Manabí", places: aiResult.places || [] });
          setNearbyLoading(false);
      }, () => {
          setNearbyLoading(false);
          setNearbyData({ text: "Error de ubicación", places: [] });
      });
    }
  };

  const navigateToTab = (tab: Tab) => {
    setActiveTab(tab);
    window.scrollTo(0,0);
  };

  const featuredDestination = destinations.find(d => d.isFeatured) || destinations[0];
  const activeStories = stories.filter(story => (Date.now() - story.timestamp) < 24 * 60 * 60 * 1000);

  return (
    <div className="min-h-screen bg-stone-50 pb-20 md:pb-24 font-sans">
      <Helmet>
        <title>{activeTab === 'home' ? 'Manabí Travel' : 'Explora Manabí'}</title>
      </Helmet>

      {/* BANNER DE ERROR DE FIREBASE */}
      {!isFirebaseConfigured && (
        <div className="bg-amber-500 text-white text-[10px] md:text-xs py-1.5 px-4 text-center font-bold flex items-center justify-center gap-2 sticky top-0 z-[100] shadow-md animate-pulse">
          <AlertTriangle size={14} />
          MODO DEMOSTRACIÓN: Base de datos no conectada. No se guardarán las publicaciones.
        </div>
      )}

      {/* TOP NAVBAR */}
      <nav className={`${!isFirebaseConfigured ? 'top-8 md:top-7' : 'top-0'} sticky z-30 bg-white/95 backdrop-blur-md border-b border-stone-200 px-4 py-3 shadow-sm transition-all`}>
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigateToTab('home')}>
            <span className="text-2xl font-black text-manabi-600 tracking-tight">MANABÍ</span>
            <span className="text-2xl font-light text-stone-600">TRAVEL</span>
          </div>
          
          <div className="flex items-center gap-4">
            {!user ? (
              <button 
                onClick={() => setIsAuthOpen(true)}
                className="bg-manabi-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-md hover:bg-manabi-700 transition-all"
              >
                Iniciar Sesión
              </button>
            ) : (
              <div className="flex items-center gap-4">
                <button onClick={() => setIsNotificationsOpen(true)} className="relative text-stone-500">
                  <Bell size={24} />
                  {notifications.filter(n => !n.isRead).length > 0 && <span className="absolute -top-1 -right-1 bg-red-500 w-2 h-2 rounded-full border border-white"></span>}
                </button>
                <img 
                  src={user.avatar} 
                  className="w-9 h-9 rounded-full object-cover border-2 border-manabi-500 cursor-pointer" 
                  onClick={() => navigateToTab('profile')}
                />
              </div>
            )}
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto pt-4 px-4 md:px-0">
        {/* MODALS */}
        <AuthScreen 
          isOpen={isAuthOpen} 
          onClose={() => setIsAuthOpen(false)} 
          onLoginSuccess={(u) => { setUser(u); setIsAuthOpen(false); }} 
        />
        <CreatePostModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onSubmit={handleCreateContent} />
        <NearbyModal isOpen={isNearbyModalOpen} onClose={() => setIsNearbyModalOpen(false)} isLoading={nearbyLoading} data={nearbyData} />
        <EditPostModal isOpen={!!editingPost} post={editingPost} onClose={() => setEditingPost(null)} onSave={handleSaveEditPost} />
        {viewingPost && <PostViewer post={viewingPost} currentUserId={user?.id || 'guest'} onClose={() => setViewingPost(null)} onLike={handleLike} onComment={handleComment} onShare={handleSharePost} onEdit={handleEditPost} onDelete={handleDeletePost} />}
        
        {/* HOME VIEW */}
        {activeTab === 'home' && (
          <div className="animate-in fade-in duration-500">
            <div className="mb-6 flex space-x-3 overflow-x-auto no-scrollbar pb-4 pt-2">
                <div 
                  className="relative w-20 h-32 md:w-24 md:h-40 shrink-0 rounded-xl overflow-hidden cursor-pointer bg-stone-200 group"
                  onClick={() => requireAuth(() => setIsCreateModalOpen(true))}
                >
                  <img src={user?.avatar || 'https://api.dicebear.com/7.x/adventurer/svg?seed=guest'} className="w-full h-full object-cover opacity-40" />
                  <div className="absolute inset-0 flex items-center justify-center text-manabi-600"><Plus size={32} /></div>
                  <div className="absolute bottom-2 w-full text-center text-[10px] font-bold text-stone-600">Crear</div>
                </div>
                {activeStories.map((story, idx) => (
                   <div key={story.id} className="relative w-20 h-32 md:w-24 md:h-40 shrink-0 rounded-xl overflow-hidden ring-2 ring-manabi-500 cursor-pointer" onClick={() => setViewingStoryIndex(idx)}>
                      <img src={story.imageUrl} className="w-full h-full object-cover" />
                      <span className="absolute bottom-2 left-2 text-white text-[10px] font-bold truncate">{story.userName}</span>
                   </div>
                ))}
            </div>

            <HeroSection 
              destination={featuredDestination} 
              onGuideClick={(name) => setSelectedDestination(destinations.find(d => d.name === name) || null)} 
            />

            <div className="space-y-8 mt-8">
              {posts.map(post => (
                <PostCard 
                  key={post.id} 
                  post={post} 
                  currentUserId={user?.id || 'guest'} 
                  onLike={() => handleLike(post.id)} 
                  onComment={(text) => handleComment(post.id, text)}
                  onUserClick={(uid) => console.log("Profile view", uid)}
                  onImageClick={(p) => setViewingPost(p)}
                  onEdit={handleEditPost}
                  onDelete={handleDeletePost}
                  onShare={handleSharePost}
                />
              ))}
            </div>
          </div>
        )}

        {/* EXPLORE VIEW */}
        {activeTab === 'explore' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-10 animate-in slide-in-from-bottom-4">
            <div className="md:col-span-2 flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-stone-800">Destinos en Manabí</h2>
              <button onClick={handleNearbySearch} className="bg-manabi-600 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2">
                <Navigation size={16} /> Ver Mapa
              </button>
            </div>
            {destinations.map(d => (
              <DestinationCard 
                key={d.id} 
                destination={d} 
                onClickGuide={() => setSelectedDestination(d)} 
              />
            ))}
          </div>
        )}

        {/* PROFILE VIEW */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-3xl p-8 shadow-sm text-center animate-in fade-in">
            {!user ? (
              <div className="py-12">
                <div className="w-24 h-24 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <UserIcon size={48} className="text-stone-300" />
                </div>
                <h2 className="text-2xl font-bold text-stone-800 mb-2">Únete a Manabí Travel</h2>
                <p className="text-stone-500 mb-8 max-w-xs mx-auto">Inicia sesión para compartir tus fotos y conectar con otros viajeros.</p>
                <button 
                  onClick={() => setIsAuthOpen(true)}
                  className="bg-manabi-600 text-white px-8 py-3 rounded-full font-bold shadow-lg hover:bg-manabi-700 transition-all"
                >
                  Entrar / Registrarse
                </button>
              </div>
            ) : (
              <div>
                <div className="flex flex-col items-center">
                  <img src={user.avatar} className="w-24 h-24 rounded-full border-4 border-manabi-100 object-cover mb-4" />
                  <h2 className="text-2xl font-bold">{user.name}</h2>
                  <p className="text-stone-500">{user.bio}</p>
                  <button onClick={handleLogout} className="mt-8 text-red-500 font-bold flex items-center gap-2">
                    <LogOut size={18} /> Cerrar Sesión
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* BOTTOM NAVIGATION */}
      <div className="fixed bottom-0 w-full bg-white border-t border-stone-200 flex justify-around items-center p-3 md:hidden z-50">
        <button onClick={() => navigateToTab('home')} className={`flex flex-col items-center gap-0.5 ${activeTab === 'home' ? 'text-manabi-600' : 'text-stone-400'}`}>
           <Home size={24} />
           <span className="text-[10px] font-medium">Inicio</span>
        </button>
        <button onClick={() => navigateToTab('explore')} className={`flex flex-col items-center gap-0.5 ${activeTab === 'explore' ? 'text-manabi-600' : 'text-stone-400'}`}>
           <Compass size={24} />
           <span className="text-[10px] font-medium">Explorar</span>
        </button>
        <button onClick={() => requireAuth(() => setIsCreateModalOpen(true))} className="relative -top-4 bg-manabi-600 text-white rounded-full p-4 shadow-lg border-4 border-white">
           <Camera size={28} />
        </button>
        <button onClick={() => navigateToTab('search')} className={`flex flex-col items-center gap-0.5 ${activeTab === 'search' ? 'text-manabi-600' : 'text-stone-400'}`}>
           <Search size={24} />
           <span className="text-[10px] font-medium">Buscar</span>
        </button>
        <button onClick={() => navigateToTab('profile')} className={`flex flex-col items-center gap-0.5 ${activeTab === 'profile' ? 'text-manabi-600' : 'text-stone-400'}`}>
           <UserIcon size={24} />
           <span className="text-[10px] font-medium">Perfil</span>
        </button>
      </div>

      <ChatBot externalIsOpen={chatQuery !== ''} externalQuery={chatQuery} onCloseExternal={() => setChatQuery('')} />
      {selectedDestination && <TravelGuideModal destination={selectedDestination} onClose={() => setSelectedDestination(null)} onAskAI={setChatQuery} onRate={() => {}} onAddPhoto={() => {}} isAdminUser={false} />}
      {viewingStoryIndex !== null && <StoryViewer stories={activeStories} initialStoryIndex={viewingStoryIndex} currentUserId={user?.id || 'guest'} onClose={() => setViewingStoryIndex(null)} onMarkViewed={() => {}} onDelete={() => {}} onLike={() => {}} />}
      {isNotificationsOpen && user && <NotificationsModal isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} notifications={notifications} currentUserId={user.id} />}
    </div>
  );
}
