import React, { useState, useEffect, useRef } from 'react';
import { Map as MapIcon, Compass, UserCircle, Camera, Search, Grid, LogOut, ArrowRight, UserPlus, UserCheck, ChevronLeft, PlusCircle, Globe, Filter, Edit3, X } from 'lucide-react';
import { HeroSection } from './components/HeroSection';
import { PostCard } from './components/PostCard';
import { CreatePostModal } from './components/CreatePostModal';
import { EditPostModal } from './components/EditPostModal';
import { ChatBot } from './components/ChatBot';
import { StoryViewer } from './components/StoryViewer';
import { DestinationCard } from './components/DestinationCard';
import { TravelGuideModal } from './components/TravelGuideModal';
import { AddDestinationModal } from './components/AddDestinationModal';
import { AuthScreen } from './components/AuthScreen';
import { PostViewer } from './components/PostViewer';
import { ALL_DESTINATIONS as STATIC_DESTINATIONS } from './constants';
import { Post, Story, Destination, User, EcuadorRegion } from './types';
import { StorageService } from './services/storageService';
import { AuthService } from './services/authService';
import { resizeImage, isAdmin } from './utils';
import { db } from './services/firebase';
import { ref, onValue } from 'firebase/database';

type Tab = 'home' | 'explore' | 'search' | 'profile';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [destinations, setDestinations] = useState<Destination[]>(STATIC_DESTINATIONS);
  
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAddDestinationModalOpen, setIsAddDestinationModalOpen] = useState(false);
  
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [viewingPost, setViewingPost] = useState<Post | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingStoryIndex, setViewingStoryIndex] = useState<number | null>(null);
  const [viewingStoryList, setViewingStoryList] = useState<Story[]>([]);
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null);
  const [viewingProfileId, setViewingProfileId] = useState<string | null>(null);
  
  // Profile specific states
  const [viewingProfileImage, setViewingProfileImage] = useState<string | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState('');

  // Filtros de Exploración
  const [selectedRegion, setSelectedRegion] = useState<EcuadorRegion | 'Todas'>('Todas');
  const [selectedProvince, setSelectedProvince] = useState<string>('Todas');

  // ChatBot State Lifting
  const [chatOpen, setChatOpen] = useState(false);
  const [chatQuery, setChatQuery] = useState('');

  const profileInputRef = useRef<HTMLInputElement>(null);

  // 1. Cargar Sesión Local
  useEffect(() => {
    const session = AuthService.getSession();
    if (session) {
      setUser(session);
    }
  }, []);

  // 2. Conectar a Firebase
  useEffect(() => {
    const postsRef = ref(db, 'posts');
    const unsubscribePosts = onValue(postsRef, (snapshot) => {
      const data = snapshot.val();
      const loadedPosts: Post[] = data ? Object.values(data) : [];
      setPosts(loadedPosts.sort((a, b) => b.timestamp - a.timestamp));
    });

    const storiesRef = ref(db, 'stories');
    const unsubscribeStories = onValue(storiesRef, (snapshot) => {
      const data = snapshot.val();
      const loadedStories: Story[] = data ? Object.values(data) : [];
      setStories(loadedStories.sort((a, b) => b.timestamp - a.timestamp));
    });

    const usersRef = ref(db, 'users');
    const unsubscribeUsers = onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      const loadedUsers: User[] = data ? Object.values(data) : [];
      setAllUsers(loadedUsers);
    });

    const destinationsRef = ref(db, 'destinations');
    const unsubscribeDestinations = onValue(destinationsRef, (snapshot) => {
      const data = snapshot.val();
      const loadedDestinations: Destination[] = data ? Object.values(data) : [];
      
      const mergedDestinations = [...STATIC_DESTINATIONS];
      // FIX: Usamos "new Map()" (JavaScript nativo) en lugar de "new MapIcon()"
      const firebaseDestMap = new Map(loadedDestinations.map(d => [d.id, d]));
      
      for (let i = 0; i < mergedDestinations.length; i++) {
         const staticDest = mergedDestinations[i];
         if (firebaseDestMap.has(staticDest.id)) {
            mergedDestinations[i] = firebaseDestMap.get(staticDest.id)!;
            firebaseDestMap.delete(staticDest.id);
         }
      }

      const finalDestinations = [...mergedDestinations, ...Array.from(firebaseDestMap.values())];
      setDestinations(finalDestinations);
    });

    return () => {
      unsubscribePosts();
      unsubscribeStories();
      unsubscribeUsers();
      unsubscribeDestinations();
    };
  }, []);

  // Sync user updates
  useEffect(() => {
    if (user && allUsers.length > 0) {
      const updatedUser = allUsers.find(u => u.id === user.id);
      if (updatedUser && JSON.stringify(updatedUser) !== JSON.stringify(user)) {
         setUser(updatedUser);
         AuthService.setSession(updatedUser);
      }
    }
  }, [allUsers]);

  const handleLogout = () => {
    AuthService.logout();
    setUser(null);
  };

  const handleLike = async (id: string) => {
    const post = posts.find(p => p.id === id);
    if (post && user) await StorageService.toggleLikePost(post, user.id);
  };

  const handleLikeStory = async (id: string) => {
    const story = stories.find(s => s.id === id);
    if (story) await StorageService.toggleLikeStory(story);
  };

  const handleComment = async (id: string, text: string) => {
    if (!user) return;
    const post = posts.find(p => p.id === id);
    if (post) {
      const newComment = {
        id: Date.now().toString(),
        userId: user.id,
        userName: user.name,
        text,
        timestamp: Date.now()
      };
      const updatedComments = [...(post.comments || []), newComment];
      await StorageService.addComment(post.id, updatedComments);
    }
  };

  const handleShare = (text: string | Post) => {
      let content = "";
      if (typeof text === 'string') {
          content = text;
      } else {
          content = `¡Mira esta foto de ${text.userName} en ${text.location || 'Ecuador'}! 🌴`;
      }
      alert(`Compartiendo: "${content}"\n\n(Enlace copiado al portapapeles)`);
  };

  const handleCreateContent = async (image: string, caption: string, location: string, type: 'post' | 'story', mediaType: 'image' | 'video') => {
    if (!user) return;
    if (type === 'post') {
      const newPost: Post = {
        id: Date.now().toString(),
        userId: user.id,
        userName: user.name,
        userAvatar: user.avatar,
        location,
        imageUrl: image,
        mediaType: mediaType,
        caption,
        likes: 0,
        comments: [],
        timestamp: Date.now(),
        isLiked: false
      };
      await StorageService.savePost(newPost);
    } else {
      const newStory: Story = {
        id: `s_${Date.now()}`,
        userId: user.id,
        userName: user.name,
        userAvatar: user.avatar,
        imageUrl: image,
        mediaType: mediaType,
        timestamp: Date.now(),
        isViewed: false,
        caption: caption,
        location: location,
        likes: 0,
        isLiked: false
      };
      await StorageService.saveStory(newStory);
    }
    setActiveTab('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddDestination = async (data: any) => {
    if (!user) return;
    const newId = `ud_${Date.now()}`;
    const destination: Destination = {
      ...data,
      id: newId,
      isUserGenerated: true,
      createdBy: user.id,
      rating: 5,
      reviewsCount: 1,
      ratings: { [user.id]: 5 }
    };
    await StorageService.addDestination(destination);
  };

  const handleRateDestination = async (rating: number) => {
    if (!selectedDestination || !user) return;
    if (selectedDestination.ratings && selectedDestination.ratings[user.id]) {
       alert("Ya has calificado este lugar.");
       return;
    }
    await StorageService.rateDestination(
        selectedDestination.id, 
        user.id, 
        rating, 
        selectedDestination.rating || 5, 
        selectedDestination.reviewsCount || 0
    );
  };

  const handleAddPhotoToDestination = async (image: string) => {
    if (!selectedDestination || !user) return;
    await StorageService.addPhotoToDestinationGallery(
        selectedDestination.id,
        selectedDestination.gallery,
        image
    );
  };

  const handleChangeDestinationCover = async (image: string) => {
    if (!selectedDestination || !user) return;
    await StorageService.updateDestinationCover(selectedDestination.id, image);
  };
  
  const handleDeleteDestinationPhoto = async (photoUrl: string) => {
    if (!selectedDestination || !user) return;
    if (confirm("¿Eliminar esta foto de la galería?")) {
        await StorageService.removeDestinationPhoto(
            selectedDestination.id,
            selectedDestination.gallery,
            photoUrl
        );
    }
  };

  const handleEditPost = (post: Post) => setEditingPost(post);
  const handleUpdatePost = async (id: string, caption: string, location: string) => {
    await StorageService.updatePost(id, { caption, location });
    if (viewingPost && viewingPost.id === id) setViewingPost(prev => prev ? { ...prev, caption, location } : null);
  };
  const handleDeletePost = async (id: string) => {
    if (confirm("¿Estás seguro?")) {
      await StorageService.deletePost(id);
      if (viewingPost && viewingPost.id === id) setViewingPost(null);
    }
  };
  const handleDeleteStory = async (id: string) => await StorageService.deleteStory(id);
  const handleMarkStoryViewed = (id: string) => setStories(stories.map(s => s.id === id ? { ...s, isViewed: true } : s));
  const handleOpenGuide = (destinationName: string) => {
    const dest = destinations.find(d => d.name === destinationName);
    if (dest) setSelectedDestination(dest);
  };
  
  // New ChatBot Logic
  const handleAskAIFromGuide = (query: string) => {
    setChatQuery(query);
    setChatOpen(true);
  };

  const handleUserClick = (userId: string) => {
    setViewingProfileId(userId);
    setActiveTab('profile');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const handleViewPost = (post: Post) => setViewingPost(post);
  const handleFollowToggle = async (targetUserId: string) => {
    if (!user) return;
    await AuthService.toggleFollow(user.id, targetUserId);
  };
  const handleProfileImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files?.[0]) return;
    try {
      const newAvatar = await resizeImage(e.target.files[0], 500); 
      await AuthService.updateUserAvatar(user.id, newAvatar);
    } catch (err) { console.error(err); }
  };
  const handleUpdateName = async () => {
     if(user && newName.trim()) {
        await AuthService.updateUserName(user.id, newName);
        setIsEditingName(false);
     }
  };

  const openStories = (idx: number, storyList: Story[]) => {
    setViewingStoryList(storyList);
    setViewingStoryIndex(idx);
  };
  const activeStories = stories.filter(story => (Date.now() - story.timestamp) < 24 * 60 * 60 * 1000);

  // --- FILTER LOGIC FOR EXPLORE ---
  
  const getProvincesForRegion = (region: EcuadorRegion | 'Todas') => {
    if (region === 'Todas') return [];
    const destsInRegion = destinations.filter(d => d.region === region);
    const provinces = new Set(destsInRegion.map(d => d.province || ''));
    return Array.from(provinces).filter(p => p !== '');
  };

  const filteredExploreDestinations = destinations.filter(dest => {
    if (selectedRegion !== 'Todas' && dest.region !== selectedRegion) return false;
    if (selectedProvince !== 'Todas' && dest.province !== selectedProvince) return false;
    return true;
  });

  const availableProvinces = getProvincesForRegion(selectedRegion);

  if (!user) return <AuthScreen onLoginSuccess={setUser} />;
  
  // Basic Search Logic (SAFE MODE)
  const query = (searchQuery || '').toLowerCase();
  
  const filteredPosts = posts.filter(post => 
    (post.location || '').toLowerCase().includes(query) ||
    (post.caption || '').toLowerCase().includes(query) ||
    (post.userName || '').toLowerCase().includes(query)
  );
  const searchDestinations = destinations.filter(dest => 
    (dest.name || '').toLowerCase().includes(query) ||
    (dest.location || '').toLowerCase().includes(query)
  );

  const renderExplore = () => (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 mb-2">
        <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-stone-800 flex items-center gap-2">
                <Globe size={24} className="text-cyan-600" />
                Explora Ecuador
            </h2>
            <button 
              onClick={() => setIsAddDestinationModalOpen(true)}
              className="bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold py-2 px-3 rounded-full flex items-center gap-2 shadow-md transition-colors w-fit"
            >
              <PlusCircle size={16} /> Agregar
            </button>
        </div>
        
        {/* Region Filters */}
        <div className="flex space-x-2 overflow-x-auto no-scrollbar pb-2">
            {(['Todas', 'Costa', 'Sierra', 'Amazonía', 'Insular'] as const).map(region => (
               <button
                 key={region}
                 onClick={() => { setSelectedRegion(region); setSelectedProvince('Todas'); }}
                 className={`px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${
                    selectedRegion === region 
                    ? 'bg-cyan-600 text-white shadow-md' 
                    : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
                 }`}
               >
                 {region}
               </button>
            ))}
        </div>

        {/* Province Filters (Only if Region Selected) */}
        {selectedRegion !== 'Todas' && availableProvinces.length > 0 && (
            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                <Filter size={16} className="text-stone-400" />
                <select 
                   value={selectedProvince}
                   onChange={(e) => setSelectedProvince(e.target.value)}
                   className="bg-white border border-stone-200 text-stone-700 text-sm rounded-lg p-2 focus:ring-2 focus:ring-cyan-500 outline-none"
                >
                    <option value="Todas">Todas las provincias</option>
                    {availableProvinces.map(prov => (
                        <option key={prov} value={prov}>{prov}</option>
                    ))}
                </select>
            </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        {filteredExploreDestinations.length > 0 ? (
            filteredExploreDestinations.map(destination => (
                <DestinationCard 
                    key={destination.id} 
                    destination={destination} 
                    onClickGuide={handleOpenGuide}
                />
            ))
        ) : (
            <div className="text-center py-20 bg-white rounded-3xl border border-stone-100">
                <Compass size={48} className="mx-auto text-stone-300 mb-4" />
                <h3 className="text-lg font-bold text-stone-600">No hay destinos aquí aún</h3>
                <p className="text-stone-400">¿Conoces un lugar en {selectedRegion}? ¡Agrégalo!</p>
            </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-stone-50 pb-20 md:pb-10 font-sans">
      <nav className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-stone-200 px-4 py-3 shadow-sm">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => {setActiveTab('home'); setViewingProfileId(null); window.scrollTo(0,0)}}>
            <span className="text-2xl font-black text-cyan-700 tracking-tight">ECUADOR</span>
            <span className="text-2xl font-light text-stone-600">TRAVEL</span>
          </div>
          <div className="md:hidden">
            <button 
              onClick={() => { setActiveTab('profile'); setViewingProfileId(null); window.scrollTo(0,0); }} 
              className={`rounded-full overflow-hidden w-9 h-9 border-2 transition-all ${activeTab === 'profile' && !viewingProfileId ? 'border-cyan-600' : 'border-stone-200'}`}
            >
              <img src={user.avatar} alt="Perfil" className="w-full h-full object-cover" />
            </button>
          </div>
          <div className="hidden md:flex flex-1 max-w-md mx-8 relative">
            <input 
              type="text" 
              placeholder="Busca playas, volcanes, ciudades..."
              className="w-full bg-stone-100 border-transparent focus:bg-white border focus:border-cyan-300 rounded-full py-2 pl-10 pr-4 outline-none transition-all text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-3 top-2.5 text-stone-400" size={16} />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-600">
                <LogOut size={14} className="rotate-45" /> 
              </button>
            )}
          </div>
          <div className="hidden md:flex space-x-6 text-stone-500 font-medium items-center">
             <button onClick={() => setActiveTab('home')} className={`hover:text-cyan-700 transition-colors ${activeTab === 'home' ? 'text-cyan-700' : ''}`}>
                <MapIcon size={24} />
             </button>
             <button onClick={() => setActiveTab('explore')} className={`hover:text-cyan-700 transition-colors ${activeTab === 'explore' ? 'text-cyan-700' : ''}`}>
                <Compass size={24} />
             </button>
             <button 
               onClick={() => setIsCreateModalOpen(true)}
               className="flex items-center gap-2 bg-cyan-600 text-white px-4 py-2 rounded-full hover:bg-cyan-700 transition-colors shadow-md hover:shadow-lg font-semibold text-sm"
             >
               <Camera size={18} />
               <span>Publicar</span>
             </button>
             <button 
               onClick={() => { setActiveTab('profile'); setViewingProfileId(null); }} 
               className={`rounded-full overflow-hidden ring-2 ring-transparent hover:ring-cyan-400 transition-all ${activeTab === 'profile' && !viewingProfileId ? 'ring-cyan-600' : ''}`}
             >
               <img src={user.avatar} alt="Profile" className="w-9 h-9 object-cover" />
             </button>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 pt-6 px-4 md:px-0">
        <div className="md:col-span-2">
          
          {/* HOME TAB */}
          {activeTab === 'home' && (
            <>
              <div className="bg-white p-5 rounded-2xl border border-stone-100 shadow-sm overflow-x-auto no-scrollbar mb-6">
                <h4 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">Diarios de Viaje (24h)</h4>
                <div className="flex space-x-4">
                  <div className="flex flex-col items-center space-y-2 min-w-[72px] cursor-pointer group" onClick={() => setIsCreateModalOpen(true)}>
                    <div className="w-16 h-16 rounded-2xl border-2 border-stone-200 p-0.5 relative group-hover:border-cyan-400 transition-colors">
                      <img src={user.avatar} alt="You" className="w-full h-full rounded-xl object-cover opacity-90" />
                      <div className="absolute -bottom-2 -right-2 bg-cyan-600 text-white rounded-lg p-1 shadow-sm">
                        <Camera size={14} />
                      </div>
                    </div>
                    <span className="text-xs font-medium text-stone-600">Crear</span>
                  </div>
                  {activeStories.map((story, idx) => (
                    <div 
                      key={story.id} 
                      className="flex flex-col items-center space-y-2 min-w-[72px] cursor-pointer"
                      onClick={() => openStories(idx, activeStories)}
                    >
                      <div className={`w-16 h-16 rounded-2xl p-0.5 border-2 transition-all ${story.isViewed ? 'border-stone-200 grayscale-[0.5]' : 'border-cyan-500 shadow-md shadow-cyan-100'}`}>
                        <img src={story.userAvatar} alt={story.userName} className="w-full h-full rounded-xl object-cover border border-white" />
                      </div>
                      <span className="text-xs font-medium text-stone-700 truncate w-20 text-center">{story.userName}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {!searchQuery && (
                <HeroSection onGuideClick={() => handleOpenGuide('Parque Nacional Machalilla')} />
              )}
              
              <div className="space-y-6">
                {filteredPosts.length > 0 ? (
                  filteredPosts.map(post => (
                    <PostCard 
                      key={post.id} 
                      post={post} 
                      currentUserId={user.id}
                      onLike={handleLike} 
                      onComment={handleComment} 
                      onShare={handleShare}
                      onUserClick={handleUserClick}
                      onImageClick={handleViewPost}
                      onEdit={handleEditPost}
                      onDelete={handleDeletePost}
                    />
                  ))
                ) : (
                  <div className="text-center py-10 text-stone-400">
                    <p>No se encontraron publicaciones.</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* EXPLORE TAB */}
          {activeTab === 'explore' && renderExplore()}

          {/* SEARCH TAB */}
          {activeTab === 'search' && (
             <div className="space-y-4">
                <div className="relative">
                  <input 
                    type="text" 
                    autoFocus
                    placeholder="Buscar en todo Ecuador..."
                    className="w-full p-4 pl-12 rounded-xl shadow-sm border border-stone-200 outline-none focus:ring-2 focus:ring-cyan-500"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Search className="absolute left-4 top-4 text-stone-400" size={20} />
                </div>
                {searchQuery && (
                  <>
                     <div className="flex items-center justify-between mt-6">
                        <h3 className="font-bold text-stone-500 text-sm uppercase">Destinos</h3>
                        <span className="text-xs bg-stone-100 px-2 py-1 rounded-full text-stone-500">{searchDestinations.length}</span>
                     </div>
                     <div className="grid gap-3">
                        {searchDestinations.map(dest => (
                           <div key={dest.id} onClick={() => handleOpenGuide(dest.name)} className="bg-white p-3 rounded-xl border border-stone-100 flex items-center space-x-3 shadow-sm cursor-pointer hover:border-cyan-300">
                              <img src={dest.imageUrl} className="w-12 h-12 rounded-lg object-cover" alt={dest.name}/>
                              <div className="flex-1">
                                 <h4 className="font-bold text-stone-800 text-sm">{dest.name}</h4>
                                 <p className="text-xs text-stone-500 line-clamp-1">{dest.location}</p>
                              </div>
                           </div>
                        ))}
                     </div>
                  </>
                )}
             </div>
          )}

          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
             (() => {
                const targetId = viewingProfileId || user.id;
                const isMe = targetId === user.id;
                let targetUser = allUsers.find(u => u.id === targetId);
                if (!targetUser) targetUser = user;
                const userPosts = posts.filter(p => p.userId === targetUser!.id);
                const isFollowing = user.following?.includes(targetUser!.id);

                return (
                  <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-stone-100 min-h-[500px]">
                    <div className="h-32 bg-gradient-to-r from-cyan-500 to-blue-600 relative">
                       {!isMe && (
                         <button onClick={() => setViewingProfileId(null)} className="absolute top-4 left-4 bg-white/20 p-2 rounded-full text-white">
                           <ChevronLeft size={24} />
                         </button>
                       )}
                    </div>
                    <div className="px-6 pb-6 relative">
                      <div className="flex justify-between items-end -mt-12 mb-4">
                        <div 
                           className="w-24 h-24 rounded-full border-4 border-white shadow-md bg-white relative group overflow-hidden cursor-pointer" 
                           onClick={() => setViewingProfileImage(targetUser!.avatar)}
                        >
                          <img src={targetUser!.avatar} alt={targetUser!.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex gap-2 mb-1">
                           {isMe ? (
                             <div className="flex gap-2">
                                <button onClick={() => profileInputRef.current?.click()} className="text-xs text-cyan-700 bg-cyan-50 px-3 py-1.5 rounded-full font-bold flex gap-1 hover:bg-cyan-100 border border-cyan-100">
                                   <Camera size={14} /> Foto
                                </button>
                                <input type="file" ref={profileInputRef} hidden accept="image/*" onChange={handleProfileImageChange} />
                                <button onClick={handleLogout} className="text-xs text-stone-600 bg-stone-100 px-3 py-1.5 rounded-full font-bold flex gap-1"><LogOut size={12} /> Salir</button>
                             </div>
                           ) : (
                             <button onClick={() => handleFollowToggle(targetUser!.id)} className={`px-4 py-1.5 rounded-full font-bold text-xs ${isFollowing ? 'bg-stone-100' : 'bg-cyan-600 text-white'}`}>
                               {isFollowing ? 'Siguiendo' : 'Seguir'}
                             </button>
                           )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 mb-1">
                        {isMe && isEditingName ? (
                           <div className="flex gap-2 w-full max-w-xs">
                              <input 
                                 className="border rounded px-2 py-1 text-sm w-full" 
                                 value={newName} 
                                 onChange={e => setNewName(e.target.value)}
                                 placeholder={user.name}
                              />
                              <button onClick={handleUpdateName} className="text-green-600 text-xs font-bold">OK</button>
                              <button onClick={() => setIsEditingName(false)} className="text-red-500 text-xs">X</button>
                           </div>
                        ) : (
                           <>
                             <h2 className="text-2xl font-bold text-stone-800">{targetUser!.name}</h2>
                             {isMe && (
                                <button onClick={() => { setIsEditingName(true); setNewName(user.name); }} className="text-stone-400 hover:text-cyan-600">
                                   <Edit3 size={16} />
                                </button>
                             )}
                           </>
                        )}
                      </div>

                      <p className="text-stone-500 mb-4">{targetUser!.bio || 'Explorando Ecuador.'}</p>
                      
                      <div className="flex gap-4 mb-8 border-y border-stone-100 py-4 text-center">
                        <div><div className="font-bold text-lg">{userPosts.length}</div><div className="text-xs text-stone-400">Posts</div></div>
                        <div><div className="font-bold text-lg">{targetUser!.followers?.length || 0}</div><div className="text-xs text-stone-400">Seguidores</div></div>
                        <div><div className="font-bold text-lg">{targetUser!.following?.length || 0}</div><div className="text-xs text-stone-400">Siguiendo</div></div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-1">
                        {userPosts.map(post => (
                           <div key={post.id} className="aspect-square relative cursor-pointer bg-gray-100" onClick={() => handleViewPost(post)}>
                              {post.mediaType === 'video' ? (
                                <video src={post.imageUrl} className="w-full h-full object-cover" />
                              ) : (
                                <img src={post.imageUrl} className="w-full h-full object-cover" alt="" />
                              )}
                           </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
             })()
          )}
        </div>

        {/* SIDEBAR */}
        <div className="hidden md:block col-span-1 space-y-6">
          <div className="sticky top-24">
            <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-5 mb-6">
              <h3 className="font-bold text-stone-800 mb-4 text-sm uppercase tracking-wider flex items-center gap-2">
                <Compass size={16} className="text-cyan-600" />
                Sugerencias
              </h3>
              <div className="space-y-4">
                {destinations.slice(0, 3).map((place, i) => (
                  <div key={i} className="flex items-center space-x-3 cursor-pointer hover:bg-stone-50 p-2 rounded-xl transition-colors" onClick={() => handleOpenGuide(place.name)}>
                    <div className="w-14 h-14 rounded-xl bg-stone-200 overflow-hidden"><img src={place.imageUrl} className="w-full h-full object-cover" /></div>
                    <div><div className="font-bold text-stone-800 text-sm line-clamp-1">{place.name}</div><div className="text-xs text-stone-500 mt-0.5 line-clamp-1">{place.location}</div></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 w-full bg-white/95 backdrop-blur-md border-t border-stone-200 flex justify-around p-3 md:hidden z-30 pb-6 shadow-[0_-5px_15px_rgba(0,0,0,0.05)]">
        <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1 ${activeTab === 'home' ? 'text-cyan-700' : 'text-stone-400'}`}><MapIcon size={24} /></button>
        <button onClick={() => setActiveTab('search')} className={`flex flex-col items-center gap-1 ${activeTab === 'search' ? 'text-cyan-700' : 'text-stone-400'}`}><Search size={24} /></button>
        <button onClick={() => setIsCreateModalOpen(true)} className="text-white bg-cyan-600 rounded-2xl p-3 -mt-10 shadow-lg shadow-cyan-200 border-4 border-stone-50"><Camera size={26} /></button>
        <button onClick={() => setActiveTab('explore')} className={`flex flex-col items-center gap-1 ${activeTab === 'explore' ? 'text-cyan-700' : 'text-stone-400'}`}><Compass size={24} /></button>
        <button onClick={() => { setActiveTab('profile'); setViewingProfileId(null); }} className={`flex flex-col items-center gap-1 ${activeTab === 'profile' ? 'text-cyan-700' : 'text-stone-400'}`}><UserCircle size={24} /></button>
      </div>

      {/* Profile Image Lightbox */}
      {viewingProfileImage && (
         <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setViewingProfileImage(null)}>
            <img src={viewingProfileImage} className="max-w-full max-h-full rounded-full border-4 border-white shadow-2xl" alt="Profile" />
            <button className="absolute top-4 right-4 text-white p-2">
               <X size={32} />
            </button>
         </div>
      )}

      <CreatePostModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onSubmit={handleCreateContent} />
      <AddDestinationModal isOpen={isAddDestinationModalOpen} onClose={() => setIsAddDestinationModalOpen(false)} onSubmit={handleAddDestination} />
      <EditPostModal isOpen={!!editingPost} post={editingPost} onClose={() => setEditingPost(null)} onSave={handleUpdatePost} />
      {viewingPost && <PostViewer post={viewingPost} currentUserId={user.id} onClose={() => setViewingPost(null)} onLike={handleLike} onComment={handleComment} onShare={handleShare} onEdit={handleEditPost} onDelete={handleDeletePost} />}
      
      {/* Updated ChatBot Integration */}
      <ChatBot externalIsOpen={chatOpen} externalQuery={chatQuery} onCloseExternal={() => setChatOpen(false)} />
      
      {viewingStoryIndex !== null && <StoryViewer stories={viewingStoryList} initialStoryIndex={viewingStoryIndex} currentUserId={user.id} onClose={() => setViewingStoryIndex(null)} onMarkViewed={handleMarkStoryViewed} onDelete={handleDeleteStory} onLike={handleLikeStory} onShare={handleShare} />}
      
      {/* Updated TravelGuideModal */}
      {selectedDestination && (
          <TravelGuideModal 
              destination={selectedDestination} 
              onClose={() => setSelectedDestination(null)} 
              onAskAI={handleAskAIFromGuide} 
              onRate={handleRateDestination} 
              onAddPhoto={handleAddPhotoToDestination}
              onChangeCover={handleChangeDestinationCover}
              onDeletePhoto={handleDeleteDestinationPhoto}
              isAdminUser={isAdmin(user.email)}
          />
      )}
    </div>
  );
}

export default App;