
import React, { useState, useEffect, useRef } from 'react';
import { Map as MapIcon, Compass, Camera, Search, LogOut, ChevronLeft, PlusCircle, Globe, Filter, Edit3, X, Lightbulb, MapPin, Plus, MessageCircle, Users, Bell, LayoutGrid, Award, Home, Sparkles, Trophy, CheckCircle, Navigation, Lock, User as UserIcon, AlertTriangle, ShieldAlert, Zap, Calendar } from 'lucide-react';
import { HeroSection } from './components/HeroSection';
import { PostCard } from './components/PostCard';
import { CreatePostModal } from './components/CreatePostModal';
import { EditPostModal } from './components/EditPostModal';
import { ChatBot } from './components/ChatBot';
import { StoryViewer } from './components/StoryViewer';
import { DestinationCard } from './components/DestinationCard';
import { TravelGuideModal } from './components/TravelGuideModal';
import { SuggestionsModal } from './components/SuggestionsModal';
import { ChatModal } from './components/ChatModal';
import { AuthScreen } from './components/AuthScreen';
import { PostViewer } from './components/PostViewer';
import { NotificationsModal } from './components/NotificationsModal';
import { ChallengeCard } from './components/ChallengeCard';
import { NearbyModal } from './components/NearbyModal';
import { TravelGroupsModal } from './components/TravelGroupsModal';
import { AdminUsersModal } from './components/AdminUsersModal';
import { AddDestinationModal } from './components/AddDestinationModal';
import { ItineraryGeneratorModal } from './components/ItineraryGeneratorModal';
import { ALL_DESTINATIONS as STATIC_DESTINATIONS, APP_VERSION } from './constants';
import { Post, Story, Destination, User, Notification, Challenge, Suggestion, EcuadorRegion } from './types';
import { StorageService } from './services/storageService';
import { AuthService } from './services/authService';
import { getDailyChallenge, isAdmin } from './utils';
import { db } from './services/firebase';
import { ref, onValue } from 'firebase/database';
import { Helmet } from 'react-helmet-async';

type Tab = 'home' | 'explore' | 'search' | 'profile';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [allUsersList, setAllUsersList] = useState<User[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [destinations, setDestinations] = useState<Destination[]>(STATIC_DESTINATIONS);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // Modal States
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isNearbyModalOpen, setIsNearbyModalOpen] = useState(false);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isGroupsOpen, setIsGroupsOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAdminUsersOpen, setIsAdminUsersOpen] = useState(false);
  const [isAddDestModalOpen, setIsAddDestModalOpen] = useState(false);
  const [isItineraryOpen, setIsItineraryOpen] = useState(false);
  
  // Tab & Filters
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [filterRegion, setFilterRegion] = useState<EcuadorRegion | 'Todas'>('Todas');
  const [filterProvince, setFilterProvince] = useState<string>('Todas');

  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null);
  const [viewingStoryIndex, setViewingStoryIndex] = useState<number | null>(null);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [viewingPost, setViewingPost] = useState<Post | null>(null);
  const [chatQuery, setChatQuery] = useState('');
  
  const dailyChallenge = getDailyChallenge();
  const isChallengeCompleted = user ? !!(user.completedChallenges && user.completedChallenges[dailyChallenge.id]) : false;
  const userIsAdmin = isAdmin(user?.email);

  const provincesByRegion: Record<EcuadorRegion, string[]> = {
    'Costa': ['Manabí', 'Guayas', 'Santa Elena', 'El Oro', 'Esmeraldas', 'Los Ríos', 'Santo Domingo'],
    'Sierra': ['Pichincha', 'Azuay', 'Loja', 'Imbabura', 'Tungurahua', 'Cotopaxi', 'Chimborazo', 'Cañar', 'Carchi', 'Bolívar'],
    'Amazonía': ['Napo', 'Pastaza', 'Orellana', 'Sucumbíos', 'Morona Santiago', 'Zamora Chinchipe'],
    'Insular': ['Galápagos']
  };

  const requireAuth = (action: () => void) => {
    if (!user) setIsAuthOpen(true);
    else action();
  };

  useEffect(() => {
    const session = AuthService.getSession();
    if (session) setUser(session);
  }, []);

  useEffect(() => {
    const postsRef = ref(db, 'posts');
    onValue(postsRef, (snapshot) => {
      const data = snapshot.val();
      const loadedPosts: Post[] = data ? Object.values(data) : [];
      setPosts(loadedPosts.sort((a, b) => b.timestamp - a.timestamp));
    });

    const storiesRef = ref(db, 'stories');
    onValue(storiesRef, (snapshot) => {
      const data = snapshot.val();
      const loadedStories: Story[] = data ? Object.values(data) : [];
      setStories(loadedStories.sort((a, b) => b.timestamp - a.timestamp));
    });

    const destRef = ref(db, 'destinations');
    onValue(destRef, (snapshot) => {
        const data = snapshot.val();
        const loadedDestinations: Destination[] = data ? Object.values(data) : [];
        const merged = [...STATIC_DESTINATIONS];
        loadedDestinations.forEach(ld => {
            if (!merged.find(m => m.id === ld.id)) merged.push(ld);
        });
        setDestinations(merged);
    });

    if (userIsAdmin) {
      const usersRef = ref(db, 'users');
      onValue(usersRef, (snapshot) => {
        const data = snapshot.val();
        setAllUsersList(data ? Object.values(data) : []);
      });
      const sugRef = ref(db, 'suggestions');
      onValue(sugRef, (snapshot) => {
        const data = snapshot.val();
        setSuggestions(data ? Object.values(data) : []);
      });
    }
  }, [userIsAdmin]);

  const handleCreateContent = (image: string, caption: string, location: string, type: 'post' | 'story', mediaType: 'image' | 'video') => requireAuth(async () => {
    try {
      if (type === 'post') {
        const newPost: Post = { id: Date.now().toString(), userId: user!.id, userName: user!.name, userAvatar: user!.avatar, location, imageUrl: image, mediaType, caption, likes: 0, comments: [], timestamp: Date.now() };
        await StorageService.savePost(newPost);
      } else {
        const newStory: Story = { id: `s_${Date.now()}`, userId: user!.id, userName: user!.name, userAvatar: user!.avatar, imageUrl: image, mediaType, timestamp: Date.now(), isViewed: false, caption, location, likes: 0 };
        await StorageService.saveStory(newStory);
      }
      alert("¡Publicado con éxito!");
    } catch (e: any) {
      alert("Error al subir.");
    }
  });

  const featuredDestination = destinations.find(d => d.isFeatured) || destinations[0];
  const activeStories = stories.filter(story => (Date.now() - story.timestamp) < 24 * 60 * 60 * 1000);
  const unreadSuggestions = suggestions.filter(s => !s.isRead).length;

  // Filtrado de Destinos
  const filteredDestinations = destinations.filter(d => {
      const regionMatch = filterRegion === 'Todas' || d.region === filterRegion;
      const provinceMatch = filterProvince === 'Todas' || d.province === filterProvince;
      return regionMatch && provinceMatch;
  });

  return (
    <div className="min-h-screen bg-stone-50 font-sans">
      <Helmet>
        <title>Explora | Ecuador Travel</title>
      </Helmet>

      {/* HEADER */}
      <nav className="sticky top-0 z-[100] bg-white border-b border-stone-100 shadow-sm px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 cursor-pointer" onClick={() => setActiveTab('home')}>
              <span className="text-lg md:text-xl font-black text-manabi-600 tracking-tighter">ECUADOR</span>
              <span className="text-lg md:text-xl font-light text-stone-400">TRAVEL</span>
            </div>
            <div className="hidden lg:flex items-center bg-stone-100 rounded-full px-4 py-2 w-80">
              <Search size={18} className="text-stone-400 mr-2" />
              <input type="text" placeholder="Buscar en la app..." className="bg-transparent outline-none text-sm w-full" />
            </div>
          </div>

          <div className="flex items-center gap-1 md:gap-5">
            <div className="flex items-center gap-1 md:gap-4 text-stone-500">
               <button onClick={() => requireAuth(() => setIsNotificationsOpen(true))} className="p-2 hover:bg-stone-50 rounded-full transition-colors relative">
                 <Bell size={22} />
                 {notifications.length > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>}
               </button>
               <button onClick={() => requireAuth(() => setIsChatOpen(true))} className="p-2 hover:bg-stone-50 rounded-full transition-colors"><MessageCircle size={22} /></button>
               <button onClick={() => setIsSuggestionsOpen(true)} className="p-2 hover:bg-stone-50 rounded-full transition-colors relative">
                 <Lightbulb size={22} />
                 {userIsAdmin && unreadSuggestions > 0 && (
                   <span className="absolute top-0 right-0 bg-red-500 text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-bold">{unreadSuggestions}</span>
                 )}
               </button>
               {userIsAdmin && (
                 <button onClick={() => setIsAdminUsersOpen(true)} className="p-2 bg-manabi-50 text-manabi-600 rounded-full"><Users size={22} /></button>
               )}
            </div>
            <button onClick={() => requireAuth(() => setIsCreateModalOpen(true))} className="hidden md:flex bg-manabi-600 text-white px-5 py-2 rounded-xl font-bold text-sm shadow-md hover:bg-manabi-700 transition-all items-center gap-2"><Camera size={18} /> Publicar</button>
            {user && <img src={user.avatar} className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-manabi-500 cursor-pointer object-cover" onClick={() => setActiveTab('profile')} />}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-8 pb-24 md:pb-6">
        <div className="lg:col-span-8">
          {activeTab === 'explore' ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 space-y-8">
               
               {/* BOTONES DE ACCIÓN EXPLORAR */}
               <div className="grid grid-cols-3 gap-3">
                  <button 
                    onClick={() => setIsNearbyModalOpen(true)}
                    className="flex flex-col items-center justify-center p-4 bg-white rounded-3xl border border-stone-100 shadow-sm hover:shadow-md transition-all group"
                  >
                    <div className="bg-emerald-100 p-3 rounded-2xl mb-2 text-emerald-600 group-hover:scale-110 transition-transform relative">
                        <Zap size={24} fill="currentColor" className="animate-pulse" />
                    </div>
                    <span className="text-[10px] md:text-xs font-black text-stone-700 uppercase">Radar Local</span>
                  </button>

                  <button 
                    onClick={() => setIsItineraryOpen(true)}
                    className="flex flex-col items-center justify-center p-4 bg-white rounded-3xl border border-stone-100 shadow-sm hover:shadow-md transition-all group"
                  >
                    <div className="bg-blue-100 p-3 rounded-2xl mb-2 text-blue-600 group-hover:scale-110 transition-transform">
                        <Calendar size={24} fill="currentColor" />
                    </div>
                    <span className="text-[10px] md:text-xs font-black text-stone-700 uppercase">Planificar</span>
                  </button>

                  <button 
                    onClick={() => requireAuth(() => setIsAddDestModalOpen(true))}
                    className="flex flex-col items-center justify-center p-4 bg-white rounded-3xl border border-stone-100 shadow-sm hover:shadow-md transition-all group"
                  >
                    <div className="bg-purple-100 p-3 rounded-2xl mb-2 text-purple-600 group-hover:scale-110 transition-transform">
                        <Plus size={24} strokeWidth={3} />
                    </div>
                    <span className="text-[10px] md:text-xs font-black text-stone-700 uppercase">Añadir</span>
                  </button>
               </div>

               {/* FILTROS DE DESTINOS */}
               <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-100 space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Filter className="text-manabi-600" size={18} />
                    <h3 className="font-bold text-stone-800 uppercase text-xs tracking-widest">Filtrar Aventuras</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-stone-400 uppercase ml-1">Región</label>
                        <select 
                            className="w-full bg-stone-50 p-3 rounded-xl border border-stone-200 text-sm font-bold outline-none focus:ring-2 focus:ring-manabi-500"
                            value={filterRegion}
                            onChange={(e) => {
                                setFilterRegion(e.target.value as any);
                                setFilterProvince('Todas');
                            }}
                        >
                            <option value="Todas">Ecuador Continental e Insular</option>
                            <option value="Costa">La Costa (Playas)</option>
                            <option value="Sierra">La Sierra (Montañas)</option>
                            <option value="Amazonía">Amazonía (Selva)</option>
                            <option value="Insular">Galápagos</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-stone-400 uppercase ml-1">Provincia</label>
                        <select 
                            className="w-full bg-stone-50 p-3 rounded-xl border border-stone-200 text-sm font-bold outline-none focus:ring-2 focus:ring-manabi-500"
                            value={filterProvince}
                            onChange={(e) => setFilterProvince(e.target.value)}
                        >
                            <option value="Todas">Todas las provincias</option>
                            {filterRegion !== 'Todas' && provincesByRegion[filterRegion as EcuadorRegion].map(p => (
                                <option key={p} value={p}>{p}</option>
                            ))}
                        </select>
                    </div>
                  </div>
               </div>

               {/* LISTADO DE RESULTADOS */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredDestinations.map(d => (
                    <DestinationCard 
                        key={d.id} 
                        destination={d} 
                        onClickGuide={() => setSelectedDestination(d)} 
                    />
                  ))}
                  {filteredDestinations.length === 0 && (
                      <div className="col-span-full py-20 text-center">
                          <MapPin size={48} className="mx-auto mb-2 text-stone-200" />
                          <p className="text-stone-400 font-bold italic">No hay destinos cargados con estos filtros aún.</p>
                      </div>
                  )}
               </div>
            </div>
          ) : activeTab === 'search' ? (
            <div className="animate-in fade-in slide-in-from-bottom-4">
                <h2 className="text-2xl font-black text-stone-800 mb-6 flex items-center gap-2">
                    <Search className="text-manabi-600" /> Buscar
                </h2>
                <div className="bg-white p-4 rounded-2xl shadow-sm mb-6 border border-stone-100 flex items-center">
                    <Search size={20} className="text-stone-400 mr-3" />
                    <input type="text" placeholder="¿Qué quieres buscar hoy?" className="w-full outline-none text-lg" />
                </div>
            </div>
          ) : activeTab === 'profile' ? (
             <div className="animate-in fade-in slide-in-from-bottom-4">
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-stone-100 text-center mb-8">
                  <img src={user?.avatar} className="w-32 h-32 rounded-full mx-auto border-4 border-manabi-500 mb-4 object-cover" />
                  <h2 className="text-2xl font-black text-stone-800">{user?.name}</h2>
                  <p className="text-stone-400 mb-4 italic">"{user?.bio}"</p>
                  <div className="flex justify-center gap-8 border-t border-stone-50 pt-6">
                     <div><span className="block font-black text-xl">{user?.points || 0}</span><span className="text-xs text-stone-400 uppercase font-bold">XP</span></div>
                     <div><span className="block font-black text-xl">{posts.filter(p => p.userId === user?.id).length}</span><span className="text-xs text-stone-400 uppercase font-bold">Posts</span></div>
                  </div>
               </div>
             </div>
          ) : (
            <>
              {/* FEED INICIAL */}
              <div className="flex gap-4 overflow-x-auto no-scrollbar mb-8 pb-2">
                <div className="relative w-24 h-36 md:w-28 md:h-44 shrink-0 rounded-2xl overflow-hidden cursor-pointer bg-stone-200" onClick={() => requireAuth(() => setIsCreateModalOpen(true))}>
                  <img src={user?.avatar || 'https://api.dicebear.com/7.x/adventurer/svg?seed=guest'} className="w-full h-full object-cover opacity-60" />
                  <div className="absolute inset-0 bg-black/20 flex flex-col items-center justify-center text-white">
                    <div className="bg-manabi-600 rounded-full p-1 border-2 border-white mb-1"><Plus size={16} /></div>
                    <span className="text-[10px] font-bold">Crear</span>
                  </div>
                </div>
                {activeStories.map((story, idx) => (
                  <div key={story.id} className="relative w-24 h-36 md:w-28 md:h-44 shrink-0 rounded-2xl overflow-hidden cursor-pointer ring-2 ring-manabi-500 ring-offset-2" onClick={() => setViewingStoryIndex(idx)}>
                    <img src={story.imageUrl} className="w-full h-full object-cover" />
                    <span className="absolute bottom-2 left-2 text-white text-[10px] font-bold truncate pr-2">{story.userName}</span>
                  </div>
                ))}
              </div>
              <ChallengeCard challenge={dailyChallenge} isCompleted={isChallengeCompleted} onParticipate={() => setIsCreateModalOpen(true)} />
              <div className="space-y-8">
                <HeroSection destination={featuredDestination} onGuideClick={(name) => setSelectedDestination(destinations.find(d => d.name === name) || null)} />
                {posts.map(post => (
                  <PostCard 
                    key={post.id} post={post} currentUserId={user?.id || 'guest'}
                    onLike={() => StorageService.toggleLikePost(post, user?.id || 'guest')}
                    onComment={(t) => StorageService.addComment(post.id, [...(post.comments || []), {id: Date.now().toString(), userId: user!.id, userName: user!.name, text: t, timestamp: Date.now()}])}
                    onUserClick={() => {}} onImageClick={(p) => setViewingPost(p)}
                    onEdit={setEditingPost} onDelete={(id) => StorageService.deletePost(id)}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* SIDEBAR DESKTOP */}
        <div className="hidden lg:block lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100 sticky top-24">
             <div className="flex items-center gap-2 mb-4">
                <Trophy className="text-manabi-600" size={20} />
                <h3 className="font-bold text-gray-800 uppercase text-xs tracking-widest">Descubrimientos Recientes</h3>
             </div>
             <div className="space-y-4">
                {destinations.slice(0, 4).map(dest => (
                  <div key={dest.id} className="flex gap-3 group cursor-pointer" onClick={() => setSelectedDestination(dest)}>
                     <img src={dest.imageUrl} className="w-16 h-16 rounded-xl object-cover" />
                     <div className="flex-1">
                        <h4 className="font-bold text-sm text-gray-800 group-hover:text-manabi-600 transition-colors">{dest.name}</h4>
                        <p className="text-[10px] text-stone-400 flex items-center gap-1"><MapPin size={10} /> {dest.province}</p>
                     </div>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </main>

      {/* BOTTOM NAV */}
      <div className="fixed bottom-0 w-full bg-white border-t border-stone-100 flex justify-around items-center p-2.5 md:hidden z-[150] shadow-2xl">
        <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1 ${activeTab === 'home' ? 'text-manabi-600' : 'text-stone-400'}`}><Home size={22} /><span className="text-[10px] font-bold">Inicio</span></button>
        <button onClick={() => setActiveTab('explore')} className={`flex flex-col items-center gap-1 ${activeTab === 'explore' ? 'text-manabi-600' : 'text-stone-400'}`}><Compass size={22} /><span className="text-[10px] font-bold">Explorar</span></button>
        <button onClick={() => requireAuth(() => setIsCreateModalOpen(true))} className="relative -top-5 bg-manabi-600 text-white rounded-2xl p-4 shadow-xl border-4 border-white transition-transform active:scale-90"><Camera size={26} /></button>
        <button onClick={() => setActiveTab('search')} className={`flex flex-col items-center gap-1 ${activeTab === 'search' ? 'text-manabi-600' : 'text-stone-400'}`}><Search size={22} /><span className="text-[10px] font-bold">Buscar</span></button>
        <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center gap-1 ${activeTab === 'profile' ? 'text-manabi-600' : 'text-stone-400'}`}><UserIcon size={22} /><span className="text-[10px] font-bold">Perfil</span></button>
      </div>

      {/* ALL MODALS */}
      <AuthScreen isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} onLoginSuccess={(u) => { setUser(u); setIsAuthOpen(false); }} />
      <CreatePostModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onSubmit={handleCreateContent} />
      <NearbyModal isOpen={isNearbyModalOpen} onClose={() => setIsNearbyModalOpen(false)} isLoading={false} data={null} />
      <SuggestionsModal isOpen={isSuggestionsOpen} onClose={() => setIsSuggestionsOpen(false)} currentUser={user || {id:'guest'} as any} isAdmin={userIsAdmin} suggestions={suggestions} />
      <ChatModal isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} currentUser={user || {id:'guest'} as any} allUsers={allUsersList} />
      <AddDestinationModal isOpen={isAddDestModalOpen} onClose={() => setIsAddDestModalOpen(false)} onSubmit={(d) => StorageService.addDestination({ ...d, id: `dest_${Date.now()}`, createdBy: user?.id })} existingDestinations={destinations} />
      <ItineraryGeneratorModal isOpen={isItineraryOpen} onClose={() => setIsItineraryOpen(false)} />
      {selectedDestination && <TravelGuideModal destination={selectedDestination} onClose={() => setSelectedDestination(null)} onAskAI={setChatQuery} onRate={() => {}} onAddPhoto={() => {}} isAdminUser={userIsAdmin} />}
      {viewingStoryIndex !== null && <StoryViewer stories={activeStories} initialStoryIndex={viewingStoryIndex} currentUserId={user?.id || 'guest'} onClose={() => setViewingStoryIndex(null)} onMarkViewed={() => {}} onDelete={() => {}} onLike={() => {}} />}
      {isNotificationsOpen && user && <NotificationsModal isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} notifications={notifications} currentUserId={user.id} />}
      {viewingPost && <PostViewer post={viewingPost} currentUserId={user?.id || 'guest'} onClose={() => setViewingPost(null)} onLike={() => {}} onComment={() => {}} onShare={() => {}} onEdit={() => {}} onDelete={() => {}} />}
      {isAdminUsersOpen && <AdminUsersModal isOpen={isAdminUsersOpen} onClose={() => setIsAdminUsersOpen(false)} users={allUsersList} />}
      <ChatBot externalIsOpen={chatQuery !== ''} externalQuery={chatQuery} onCloseExternal={() => setChatQuery('')} />
    </div>
  );
}
