import React, { useState, useEffect, useRef } from 'react';
import { Map, Binoculars, UserCircle, Camera, Search, MapPin, Grid, LogOut, Trash2, ArrowRight, UserPlus, UserCheck, ChevronLeft, Upload, Users, Info, X } from 'lucide-react';
import { HeroSection } from './components/HeroSection';
import { PostCard } from './components/PostCard';
import { CreatePostModal } from './components/CreatePostModal';
import { EditPostModal } from './components/EditPostModal';
import { ChatBot } from './components/ChatBot';
import { StoryViewer } from './components/StoryViewer';
import { DestinationCard } from './components/DestinationCard';
import { TravelGuideModal } from './components/TravelGuideModal';
import { AuthScreen } from './components/AuthScreen';
import { PostViewer } from './components/PostViewer';
import { ALL_DESTINATIONS } from './constants';
import { Post, Story, Destination, User } from './types';
import { StorageService } from './services/storageService';
import { AuthService } from './services/authService';
import { resizeImage } from './utils';

type Tab = 'home' | 'explore' | 'search' | 'profile';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]); // State for user search
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  
  // Edit State
  const [editingPost, setEditingPost] = useState<Post | null>(null);

  // View Post State
  const [viewingPost, setViewingPost] = useState<Post | null>(null);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  
  // Story Viewing State
  const [viewingStoryIndex, setViewingStoryIndex] = useState<number | null>(null);
  const [viewingStoryList, setViewingStoryList] = useState<Story[]>([]);

  // Guide State
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null);

  // Profile Viewing State (for viewing other users)
  const [viewingProfileId, setViewingProfileId] = useState<string | null>(null);

  // Ref for profile image upload
  const profileInputRef = useRef<HTMLInputElement>(null);

  // Load initial data and session
  useEffect(() => {
    // Check for active session
    const session = AuthService.getSession();
    if (session) {
      setUser(session);
    } else {
      // If no session (first visit potentially), check if we've shown welcome modal
      const hasSeenWelcome = localStorage.getItem('manabi_welcome_seen');
      if (!hasSeenWelcome) {
        setShowWelcomeModal(true);
      }
    }
    
    setPosts(StorageService.getPosts());
    setStories(StorageService.getStories());
    setAllUsers(AuthService.getUsers()); // Load all users for search
  }, []);

  // Save data on changes
  useEffect(() => {
    if (posts.length > 0) StorageService.savePosts(posts);
  }, [posts]);

  useEffect(() => {
    if (stories.length > 0) StorageService.saveStories(stories);
  }, [stories]);

  const handleLogout = () => {
    AuthService.logout();
    setUser(null);
  };

  const handleCloseWelcome = () => {
    setShowWelcomeModal(false);
    localStorage.setItem('manabi_welcome_seen', 'true');
  };

  // Actions
  const handleLike = (id: string) => {
    setPosts(prevPosts => {
        const updatedPosts = prevPosts.map(post => {
            if (post.id === id) {
              return {
                ...post,
                likes: post.isLiked ? post.likes - 1 : post.likes + 1,
                isLiked: !post.isLiked
              };
            }
            return post;
        });
        
        // Also update if we are viewing this specific post
        if (viewingPost && viewingPost.id === id) {
            const current = updatedPosts.find(p => p.id === id);
            if (current) setViewingPost(current);
        }
        
        return updatedPosts;
    });
  };

  const handleLikeStory = (id: string) => {
    setStories(stories.map(story => {
      if (story.id === id) {
        const currentLikes = story.likes || 0;
        return {
          ...story,
          likes: story.isLiked ? currentLikes - 1 : currentLikes + 1,
          isLiked: !story.isLiked
        };
      }
      return story;
    }));
  };

  const handleComment = (id: string, text: string) => {
    if (!user) return;
    setPosts(prevPosts => {
        const updatedPosts = prevPosts.map(post => {
          if (post.id === id) {
            return {
              ...post,
              comments: [
                ...post.comments,
                {
                  id: Date.now().toString(),
                  userId: user.id,
                  userName: user.name,
                  text,
                  timestamp: Date.now()
                }
              ]
            };
          }
          return post;
        });
        
        // Update view if active
        if (viewingPost && viewingPost.id === id) {
            const current = updatedPosts.find(p => p.id === id);
            if (current) setViewingPost(current);
        }
        
        return updatedPosts;
    });
  };

  const handleShare = (text: string | Post) => {
      let content = "";
      if (typeof text === 'string') {
          content = text;
      } else {
          content = `¡Mira esta foto de ${text.userName} en ${text.location || 'Manabí'}! 🌴`;
      }
      
      // Simulate share
      alert(`Compartiendo: "${content}"\n\n(Enlace copiado al portapapeles)`);
  };

  const handleCreateContent = (image: string, caption: string, location: string, type: 'post' | 'story') => {
    if (!user) return;
    
    if (type === 'post') {
      const newPost: Post = {
        id: Date.now().toString(),
        userId: user.id,
        userName: user.name,
        userAvatar: user.avatar,
        location,
        imageUrl: image,
        caption,
        likes: 0,
        comments: [],
        timestamp: Date.now(),
        isLiked: false
      };
      setPosts([newPost, ...posts]);
    } else {
      const newStory: Story = {
        id: `s_${Date.now()}`,
        userId: user.id,
        userName: user.name,
        userAvatar: user.avatar,
        imageUrl: image,
        timestamp: Date.now(),
        isViewed: false,
        caption: caption,
        location: location,
        likes: 0,
        isLiked: false
      };
      setStories([newStory, ...stories]);
    }
    
    setActiveTab('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Editing and Deleting Posts
  const handleEditPost = (post: Post) => {
    setEditingPost(post);
  };

  const handleUpdatePost = (id: string, caption: string, location: string) => {
    setPosts(posts.map(p => p.id === id ? { ...p, caption, location } : p));
    if (viewingPost && viewingPost.id === id) {
        setViewingPost(prev => prev ? { ...prev, caption, location } : null);
    }
  };

  const handleDeletePost = (id: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar esta publicación?")) {
      setPosts(posts.filter(p => p.id !== id));
      if (viewingPost && viewingPost.id === id) setViewingPost(null);
    }
  };

  const handleDeleteStory = (id: string) => {
    setStories(stories.filter(s => s.id !== id));
  };

  const handleMarkStoryViewed = (id: string) => {
    setStories(stories.map(s => s.id === id ? { ...s, isViewed: true } : s));
  };

  const handleResetData = () => {
    if(confirm('¿Reiniciar todos los datos de la app?')) {
      StorageService.clearAll();
      handleLogout();
    }
  };

  const handleOpenGuide = (destinationName: string) => {
    const dest = ALL_DESTINATIONS.find(d => d.name === destinationName);
    if (dest) {
      setSelectedDestination(dest);
    }
  };

  const handleAskAIFromGuide = (query: string) => {
    alert("Función simulada: El Chatbot se abriría con: " + query);
  };

  const handleUserClick = (userId: string) => {
    setViewingProfileId(userId);
    setActiveTab('profile');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewPost = (post: Post) => {
      setViewingPost(post);
  };

  const handleFollowToggle = (targetUserId: string) => {
    if (!user) return;
    try {
      const { currentUser: updatedUser } = AuthService.toggleFollow(user.id, targetUserId);
      setUser(updatedUser);
      // Update the allUsers list to reflect follower count changes immediately in search
      setAllUsers(AuthService.getUsers());
    } catch (error) {
      console.error(error);
    }
  };

  const handleProfileImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files?.[0]) return;
    
    const file = e.target.files[0];
    
    try {
      // Resize before saving to localStorage
      const newAvatar = await resizeImage(file, 500); // 500px is enough for avatar
      
      const updatedUser = AuthService.updateUserAvatar(user.id, newAvatar);
      setUser(updatedUser);
      
      // Also update posts by this user in local state so changes reflect immediately
      setPosts(posts.map(p => p.userId === user.id ? { ...p, userAvatar: newAvatar } : p));
      setStories(stories.map(s => s.userId === user.id ? { ...s, userAvatar: newAvatar } : s));
      setAllUsers(AuthService.getUsers()); // Update list
    } catch (err) {
      console.error("Error updating avatar", err);
      alert("Hubo un problema procesando la imagen. Intenta con una más pequeña.");
    }
  };

  // Story Viewing Logic
  const openStories = (idx: number, storyList: Story[]) => {
    setViewingStoryList(storyList);
    setViewingStoryIndex(idx);
  };

  // Filter Active Stories (24h rule)
  const activeStories = stories.filter(story => {
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;
    return (Date.now() - story.timestamp) < ONE_DAY_MS;
  });

  // Welcome Modal
  if (showWelcomeModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-cyan-900/90 backdrop-blur-md p-6">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl text-center space-y-6">
          <div className="mx-auto w-20 h-20 bg-cyan-100 rounded-full flex items-center justify-center text-cyan-600 mb-4">
            <Map size={40} />
          </div>
          <h1 className="text-2xl font-black text-gray-800">¡Bienvenido a Manabí Travel!</h1>
          <p className="text-gray-600 leading-relaxed">
            Esta es una <strong>versión de demostración</strong>. Puedes crear tu perfil, subir historias y explorar la guía turística.
          </p>
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-xs text-amber-800 text-left flex items-start gap-2">
            <Info size={16} className="shrink-0 mt-0.5" />
            <p>
              Tus fotos y datos se guardan en <strong>este dispositivo</strong>. Si compartes el enlace, tus amigos verán la app vacía para que ellos creen su propia aventura.
            </p>
          </div>
          <button 
            onClick={handleCloseWelcome}
            className="w-full bg-cyan-600 text-white font-bold py-3 rounded-xl hover:bg-cyan-700 transition-colors"
          >
            Comenzar Aventura
          </button>
        </div>
      </div>
    );
  }

  // If not logged in, show Auth Screen
  if (!user) {
    return <AuthScreen onLoginSuccess={setUser} />;
  }

  // SEARCH LOGIC
  const query = searchQuery.toLowerCase();

  const filteredPosts = posts.filter(post => 
    post.location.toLowerCase().includes(query) ||
    post.caption.toLowerCase().includes(query) ||
    post.userName.toLowerCase().includes(query)
  );

  const filteredDestinations = ALL_DESTINATIONS.filter(dest => 
    dest.name.toLowerCase().includes(query) ||
    dest.location.toLowerCase().includes(query) ||
    dest.description.toLowerCase().includes(query) ||
    dest.category.toLowerCase().includes(query)
  );

  const filteredUsers = allUsers.filter(u => 
    u.name.toLowerCase().includes(query) ||
    (u.bio && u.bio.toLowerCase().includes(query))
  );

  // Views
  const renderHome = () => (
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

          {activeStories.length === 0 ? (
            <div className="flex items-center text-xs text-stone-400 italic px-2">
              No hay historias recientes
            </div>
          ) : (
            activeStories.map((story, idx) => (
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
            ))
          )}
        </div>
      </div>

      {!searchQuery && (
        <HeroSection onGuideClick={() => handleOpenGuide('Parque Nacional Machalilla')} />
      )}

      <div className="space-y-6">
        {searchQuery && (filteredDestinations.length > 0 || filteredUsers.length > 0) && (
          <div className="mb-4 space-y-4">
             {/* Quick Search Results in Home */}
             {filteredUsers.length > 0 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
                   {filteredUsers.slice(0, 5).map(u => (
                      <div key={u.id} onClick={() => handleUserClick(u.id)} className="shrink-0 flex items-center gap-2 bg-white p-2 pr-4 rounded-full border shadow-sm cursor-pointer hover:border-cyan-300">
                         <img src={u.avatar} className="w-8 h-8 rounded-full" alt="" />
                         <span className="text-sm font-bold text-gray-700">{u.name}</span>
                      </div>
                   ))}
                </div>
             )}

             {filteredDestinations.length > 0 && (
                <div className="grid gap-3">
                    {filteredDestinations.slice(0, 2).map(dest => (
                      <div 
                        key={dest.id} 
                        onClick={() => handleOpenGuide(dest.name)}
                        className="bg-white p-3 rounded-2xl border border-stone-100 shadow-sm flex items-center gap-4 cursor-pointer hover:border-cyan-400 hover:shadow-md transition-all"
                      >
                          <img src={dest.imageUrl} className="w-16 h-16 rounded-xl object-cover" alt={dest.name}/>
                          <div className="flex-1">
                              <h4 className="font-bold text-stone-800">{dest.name}</h4>
                              <div className="flex items-center text-xs text-stone-500 mt-1">
                                <MapPin size={10} className="mr-1"/>
                                {dest.location}
                              </div>
                          </div>
                          <div className="bg-cyan-50 p-2 rounded-full text-cyan-600">
                            <ArrowRight size={16} />
                          </div>
                      </div>
                    ))}
                </div>
             )}
          </div>
        )}

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
            <Search size={48} className="mx-auto mb-2 opacity-20" />
            <p>No se encontraron resultados{searchQuery ? ' con ese término' : ''}.</p>
          </div>
        )}
      </div>
    </>
  );

  const renderExplore = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-bold text-stone-800 flex items-center gap-2">
            <Binoculars size={24} className="text-cyan-600" />
            Guía de Destinos
        </h2>
        <span className="text-xs font-bold text-cyan-600 bg-cyan-50 px-2 py-1 rounded-lg">
            {filteredDestinations.length} Lugares
        </span>
      </div>
      
      {searchQuery && (
         <div className="bg-cyan-50 text-cyan-800 px-4 py-2 rounded-lg text-sm mb-4">
           Resultados de búsqueda para: <strong>"{searchQuery}"</strong>
         </div>
      )}
      
      <div className="grid grid-cols-1 gap-6">
        {filteredDestinations.length > 0 ? (
            filteredDestinations.map(destination => (
                <DestinationCard 
                    key={destination.id} 
                    destination={destination} 
                    onClickGuide={handleOpenGuide}
                />
            ))
        ) : (
            <div className="text-center py-20 bg-white rounded-3xl border border-stone-100">
                <Binoculars size={48} className="mx-auto text-stone-300 mb-4" />
                <h3 className="text-lg font-bold text-stone-600">Sin resultados</h3>
                <p className="text-stone-400">No encontramos destinos con ese nombre.</p>
                <button onClick={() => setSearchQuery('')} className="mt-4 text-cyan-600 font-bold text-sm hover:underline">
                    Ver todos los destinos
                </button>
            </div>
        )}
      </div>
    </div>
  );

  const renderProfile = () => {
    // If viewingProfileId is set, fetch that user, otherwise fetch current user
    const targetId = viewingProfileId || user.id;
    const isMe = targetId === user.id;

    // In a real app we'd fetch from API. Here we assume we might need to look up in storage or just use existing data for 'me'
    // For simplicity, let's grab user from Auth service logic
    let targetUser = isMe ? user : AuthService.getUserById(targetId);
    
    // Fallback if not found (shouldn't happen with valid IDs)
    if (!targetUser) targetUser = user;

    const userPosts = posts.filter(p => p.userId === targetUser.id);
    const isFollowing = user.following.includes(targetUser.id);

    return (
      <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-stone-100 min-h-[500px] animate-in slide-in-from-right duration-300">
        <div className="h-32 bg-gradient-to-r from-cyan-500 to-blue-600 relative">
           <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
           {!isMe && (
             <button 
               onClick={() => setViewingProfileId(null)}
               className="absolute top-4 left-4 bg-white/20 hover:bg-white/40 text-white p-2 rounded-full backdrop-blur-md transition-colors"
             >
               <ChevronLeft size={24} />
             </button>
           )}
        </div>
        
        <div className="px-6 pb-6 relative">
          <div className="flex justify-between items-end -mt-12 mb-4">
            <div 
              className={`w-24 h-24 rounded-full border-4 border-white shadow-md bg-white relative group overflow-hidden ${isMe ? 'cursor-pointer' : ''}`}
              onClick={() => isMe && profileInputRef.current?.click()}
            >
              <img src={targetUser.avatar} alt={targetUser.name} className="w-full h-full object-cover" />
              {isMe && (
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera size={24} className="text-white" />
                </div>
              )}
              {isMe && (
                <input 
                  type="file" 
                  ref={profileInputRef} 
                  hidden 
                  accept="image/*"
                  onChange={handleProfileImageChange}
                />
              )}
            </div>
            
            <div className="flex gap-2 mb-1">
               {isMe ? (
                 <>
                   <button onClick={handleLogout} className="text-xs text-stone-600 hover:text-stone-800 flex items-center gap-1 bg-stone-100 px-3 py-1.5 rounded-full font-bold">
                      <LogOut size={12} /> Salir
                   </button>
                   <button onClick={handleResetData} className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1 bg-red-50 px-3 py-1.5 rounded-full">
                      <Trash2 size={12} />
                   </button>
                 </>
               ) : (
                 <button 
                   onClick={() => handleFollowToggle(targetUser!.id)}
                   className={`flex items-center gap-1 px-4 py-1.5 rounded-full font-bold text-xs transition-all ${
                     isFollowing 
                       ? 'bg-stone-100 text-stone-600 border border-stone-200' 
                       : 'bg-cyan-600 text-white hover:bg-cyan-700 shadow-md shadow-cyan-200'
                   }`}
                 >
                   {isFollowing ? (
                     <><UserCheck size={14} /> Siguiendo</>
                   ) : (
                     <><UserPlus size={14} /> Seguir</>
                   )}
                 </button>
               )}
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-stone-800">{targetUser.name}</h2>
          <p className="text-stone-500 mb-4">{targetUser.bio || 'Explorando las maravillas de Manabí.'}</p>
          
          <div className="flex gap-4 mb-8 border-y border-stone-100 py-4">
            <div className="text-center">
              <div className="font-bold text-lg text-stone-800">{userPosts.length}</div>
              <div className="text-xs text-stone-400 uppercase tracking-wide">Postales</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-lg text-stone-800">{targetUser.followers?.length || 0}</div>
              <div className="text-xs text-stone-400 uppercase tracking-wide">Seguidores</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-lg text-stone-800">{targetUser.following?.length || 0}</div>
              <div className="text-xs text-stone-400 uppercase tracking-wide">Siguiendo</div>
            </div>
          </div>

          <h3 className="font-bold text-stone-700 mb-3 flex items-center gap-2">
            <Grid size={18} /> {isMe ? 'Mis Aventuras' : `Aventuras de ${targetUser.name.split(' ')[0]}`}
          </h3>
          
          {userPosts.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {userPosts.map(post => (
                 <div 
                  key={post.id} 
                  className="rounded-xl overflow-hidden aspect-square relative group cursor-pointer"
                  onClick={() => handleViewPost(post)}
                 >
                    <img src={post.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                       <p className="text-white text-xs truncate">{post.location}</p>
                    </div>
                 </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 bg-stone-50 rounded-xl">
              <p className="text-stone-400 text-sm">Sin aventuras compartidas aún.</p>
              {isMe && <button onClick={() => setIsCreateModalOpen(true)} className="mt-2 text-cyan-600 font-bold text-sm">¡Empieza ahora!</button>}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-stone-50 pb-20 md:pb-10 font-sans">
      {/* Top Navbar */}
      <nav className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-stone-200 px-4 py-3 shadow-sm">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => {setActiveTab('home'); setViewingProfileId(null); window.scrollTo(0,0)}}>
            <span className="text-2xl font-black text-cyan-700 tracking-tight">MANABÍ</span>
            <span className="text-2xl font-light text-stone-600">TRAVEL</span>
          </div>
          
          {/* Mobile Profile Icon (Top Right) */}
          <div className="md:hidden">
            <button 
              onClick={() => { setActiveTab('profile'); setViewingProfileId(null); window.scrollTo(0,0); }} 
              className={`rounded-full overflow-hidden w-9 h-9 border-2 transition-all ${activeTab === 'profile' && !viewingProfileId ? 'border-cyan-600' : 'border-stone-200'}`}
            >
              <img src={user.avatar} alt="Perfil" className="w-full h-full object-cover" />
            </button>
          </div>

          {/* Desktop Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-8 relative">
            <input 
              type="text" 
              placeholder="Buscar personas, playas, lugares..."
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

          {/* Desktop Nav Actions */}
          <div className="hidden md:flex space-x-6 text-stone-500 font-medium items-center">
             <button onClick={() => setActiveTab('home')} className={`hover:text-cyan-700 transition-colors ${activeTab === 'home' ? 'text-cyan-700' : ''}`}>
                <Map size={24} />
             </button>
             <button onClick={() => setActiveTab('explore')} className={`hover:text-cyan-700 transition-colors ${activeTab === 'explore' ? 'text-cyan-700' : ''}`}>
                <Binoculars size={24} />
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

      {/* Main Layout */}
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 pt-6 px-4 md:px-0">
        
        {/* Main Content Column */}
        <div className="md:col-span-2">
          {activeTab === 'home' && renderHome()}
          {activeTab === 'search' && (
             <div className="space-y-4">
                <div className="relative">
                  <input 
                    type="text" 
                    autoFocus
                    placeholder="Buscar en Manabí..."
                    className="w-full p-4 pl-12 rounded-xl shadow-sm border border-stone-200 outline-none focus:ring-2 focus:ring-cyan-500"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Search className="absolute left-4 top-4 text-stone-400" size={20} />
                </div>
                
                {searchQuery && (
                  <>
                     {/* Users Search Results */}
                     <div className="flex items-center justify-between mt-2">
                        <h3 className="font-bold text-stone-500 text-sm uppercase flex items-center gap-2">
                          <Users size={14} /> Comunidad
                        </h3>
                        <span className="text-xs bg-stone-100 px-2 py-1 rounded-full text-stone-500">{filteredUsers.length}</span>
                     </div>
                     
                     <div className="grid gap-3">
                        {filteredUsers.map(u => (
                           <div key={u.id} onClick={() => handleUserClick(u.id)} className="bg-white p-3 rounded-xl border border-stone-100 flex items-center space-x-3 shadow-sm active:scale-95 transition-transform cursor-pointer hover:border-cyan-300">
                              <img src={u.avatar} className="w-12 h-12 rounded-full object-cover" alt={u.name}/>
                              <div className="flex-1">
                                 <h4 className="font-bold text-stone-800 text-sm flex items-center gap-1">
                                    {u.name} {u.id === user.id && <span className="text-[10px] bg-cyan-100 text-cyan-700 px-1 rounded">(Tú)</span>}
                                 </h4>
                                 <p className="text-xs text-stone-500 line-clamp-1">{u.bio}</p>
                              </div>
                              <button className="text-cyan-600 bg-cyan-50 p-2 rounded-full">
                                <ArrowRight size={16} />
                              </button>
                           </div>
                        ))}
                        {filteredUsers.length === 0 && (
                          <div className="text-sm text-stone-400 italic p-2">No hay usuarios con ese nombre.</div>
                        )}
                     </div>

                     <div className="flex items-center justify-between mt-6">
                        <h3 className="font-bold text-stone-500 text-sm uppercase">Destinos</h3>
                        <span className="text-xs bg-stone-100 px-2 py-1 rounded-full text-stone-500">{filteredDestinations.length}</span>
                     </div>
                     
                     <div className="grid gap-3">
                        {filteredDestinations.map(dest => (
                           <div key={dest.id} onClick={() => handleOpenGuide(dest.name)} className="bg-white p-3 rounded-xl border border-stone-100 flex items-center space-x-3 shadow-sm active:scale-95 transition-transform hover:border-cyan-300 cursor-pointer">
                              <img src={dest.imageUrl} className="w-12 h-12 rounded-lg object-cover" alt={dest.name}/>
                              <div className="flex-1">
                                 <h4 className="font-bold text-stone-800 text-sm">{dest.name}</h4>
                                 <p className="text-xs text-stone-500 line-clamp-1">{dest.location}</p>
                              </div>
                           </div>
                        ))}
                        {filteredDestinations.length === 0 && (
                          <div className="text-sm text-stone-400 italic p-2">No hay destinos con ese nombre.</div>
                        )}
                     </div>

                     <div className="flex items-center justify-between mt-6">
                        <h3 className="font-bold text-stone-500 text-sm uppercase">Publicaciones</h3>
                        <span className="text-xs bg-stone-100 px-2 py-1 rounded-full text-stone-500">{filteredPosts.length}</span>
                     </div>
                  </>
                )}
                
                {filteredPosts.map(post => (
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
                ))}
             </div>
          )}
          {activeTab === 'explore' && renderExplore()}
          {activeTab === 'profile' && renderProfile()}
        </div>

        {/* Right Sidebar - Desktop Only */}
        <div className="hidden md:block col-span-1 space-y-6">
          <div className="sticky top-24">
            {/* Suggested Places Widget */}
            <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-5 mb-6">
              <h3 className="font-bold text-stone-800 mb-4 text-sm uppercase tracking-wider flex items-center gap-2">
                <Binoculars size={16} className="text-cyan-600" />
                Joyas Ocultas
              </h3>
              <div className="space-y-4">
                {ALL_DESTINATIONS.filter(d => ['d6', 'd9', 'd10'].includes(d.id)).map((place, i) => (
                  <div key={i} 
                    className="flex items-center space-x-3 cursor-pointer hover:bg-stone-50 p-2 rounded-xl transition-colors group"
                    onClick={() => handleOpenGuide(place.name)}
                  >
                    <div className="w-14 h-14 rounded-xl bg-stone-200 overflow-hidden shadow-sm group-hover:shadow-md transition-all">
                      <img src={place.imageUrl} className="w-full h-full object-cover" alt={place.name} />
                    </div>
                    <div>
                      <div className="font-bold text-stone-800 text-sm line-clamp-1">{place.name}</div>
                      <div className="text-xs text-stone-500 mt-0.5 line-clamp-1">{place.location}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-xs text-stone-400 leading-relaxed px-2 text-center">
              Hecho con ♥ para Manabí. <br/>
              © 2024 Manabí Travel Network.
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 w-full bg-white/95 backdrop-blur-md border-t border-stone-200 flex justify-around p-3 md:hidden z-30 pb-6 shadow-[0_-5px_15px_rgba(0,0,0,0.05)]">
        <button 
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center gap-1 ${activeTab === 'home' ? 'text-cyan-700' : 'text-stone-400'}`}
        >
          <Map size={24} strokeWidth={activeTab === 'home' ? 2.5 : 2} />
        </button>
        
        <button 
          onClick={() => setActiveTab('search')}
          className={`flex flex-col items-center gap-1 ${activeTab === 'search' ? 'text-cyan-700' : 'text-stone-400'}`}
        >
          <Search size={24} strokeWidth={activeTab === 'search' ? 2.5 : 2} />
        </button>

        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="text-white bg-cyan-600 rounded-2xl p-3 -mt-10 shadow-lg shadow-cyan-200 border-4 border-stone-50 active:scale-95 transition-transform"
        >
          <Camera size={26} />
        </button>

        <button 
          onClick={() => setActiveTab('explore')}
          className={`flex flex-col items-center gap-1 ${activeTab === 'explore' ? 'text-cyan-700' : 'text-stone-400'}`}
        >
          <Binoculars size={24} strokeWidth={activeTab === 'explore' ? 2.5 : 2} />
        </button>

        <button 
          onClick={() => { setActiveTab('profile'); setViewingProfileId(null); }}
          className={`flex flex-col items-center gap-1 ${activeTab === 'profile' ? 'text-cyan-700' : 'text-stone-400'}`}
        >
          <UserCircle size={24} strokeWidth={activeTab === 'profile' ? 2.5 : 2} />
        </button>
      </div>

      {/* Overlays */}
      <CreatePostModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        onSubmit={handleCreateContent} 
      />
      
      <EditPostModal
        isOpen={!!editingPost}
        post={editingPost}
        onClose={() => setEditingPost(null)}
        onSave={handleUpdatePost}
      />
      
      {viewingPost && (
        <PostViewer 
          post={viewingPost}
          currentUserId={user.id}
          onClose={() => setViewingPost(null)}
          onLike={handleLike}
          onComment={handleComment}
          onShare={handleShare}
          onEdit={handleEditPost}
          onDelete={handleDeletePost}
        />
      )}

      <ChatBot />

      {viewingStoryIndex !== null && (
        <StoryViewer 
          stories={viewingStoryList}
          initialStoryIndex={viewingStoryIndex}
          currentUserId={user.id}
          onClose={() => setViewingStoryIndex(null)}
          onMarkViewed={handleMarkStoryViewed}
          onDelete={handleDeleteStory}
          onLike={handleLikeStory}
          onShare={handleShare}
        />
      )}

      {selectedDestination && (
        <TravelGuideModal
          destination={selectedDestination}
          onClose={() => setSelectedDestination(null)}
          onAskAI={handleAskAIFromGuide}
        />
      )}
    </div>
  );
}

export default App;