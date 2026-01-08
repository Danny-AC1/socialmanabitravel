
import React, { useState, useEffect, useRef } from 'react';
import { Map as MapIcon, Compass, Camera, Search, LogOut, ChevronLeft, PlusCircle, Globe, Filter, Edit3, X, Lightbulb, MapPin, Plus, MessageCircle, Users, Bell, LayoutGrid, Award, Home, Sparkles, Trophy, CheckCircle, Navigation, Lock, User as UserIcon, AlertTriangle, ShieldAlert, Zap, Calendar, Settings, ChevronRight, Star, UserPlus, UserCheck, Play, Palmtree, Mountain, Tent, Waves, ChevronDown, ChevronUp, PlaySquare, Layout } from 'lucide-react';
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
import { LifeMap } from './components/LifeMap';
import { PortalsView } from './components/PortalsView';
import { ALL_DESTINATIONS as STATIC_DESTINATIONS, APP_VERSION } from './constants';
import { Post, Story, Destination, User, Notification, Challenge, Suggestion, EcuadorRegion, Badge, TravelGroup, Tab } from './types';
import { StorageService } from './services/storageService';
import { AuthService } from './services/authService';
import { getDailyChallenge, isAdmin, getUserLevel, getNextLevel, BADGES } from './utils';
import { db } from './services/firebase';
import { onValue, ref } from 'firebase/database';
import { Helmet } from 'react-helmet-async';

type ProfileSubTab = 'grid' | 'badges' | 'map';
type SearchCategory = 'all' | 'destinations' | 'users' | 'groups';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [allUsersList, setAllUsersList] = useState<User[]>([]);
  const [travelGroups, setTravelGroups] = useState<TravelGroup[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [destinations, setDestinations] = useState<Destination[]>(STATIC_DESTINATIONS);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  
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
  const [profileSubTab, setProfileSubTab] = useState<ProfileSubTab>('grid');
  const [filterRegion, setFilterRegion] = useState<EcuadorRegion | 'Todas'>('Todas');
  const [filterProvince, setFilterProvince] = useState<string>('Todas');

  // Accordion state for Explore
  const [collapsedRegions, setCollapsedRegions] = useState<Record<string, boolean>>({});

  // Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [searchCategory, setSearchCategory] = useState<SearchCategory>('all');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [initialChatId, setInitialChatId] = useState<string | null>(null);

  // Perfil de otros usuarios
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);

  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null);
  const [viewingStoryIndex, setViewingStoryIndex] = useState<number | null>(null);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [viewingPost, setViewingPost] = useState<Post | null>(null);
  const [chatQuery, setChatQuery] = useState('');
  
  const dailyChallenge = getDailyChallenge();
  const isChallengeCompleted = user ? !!(user.completedChallenges && user.completedChallenges[dailyChallenge.id]) : false;
  const userIsAdmin = isAdmin(user?.email);

  const requireAuth = (action: () => void) => {
    if (!user) setIsAuthOpen(true);
    else action();
  };

  const handleUserClick = (userId: string) => {
    setViewingUserId(userId);
    setActiveTab('profile');
    setProfileSubTab('grid');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGroupClick = (groupId: string) => {
    setSelectedGroupId(groupId);
    setIsGroupsOpen(true);
  };

  const handleOpenLinkedChat = (chatId: string) => {
      setInitialChatId(chatId);
      setIsChatOpen(true);
  };

  const toggleRegionCollapse = (region: string) => {
    setCollapsedRegions(prev => ({
      ...prev,
      [region]: !prev[region]
    }));
  };

  useEffect(() => {
    const handlePopState = () => {
      if (selectedDestination) {
        setSelectedDestination(null);
      }
    };

    if (selectedDestination) {
      window.history.pushState({ modal: 'destination' }, '');
      window.addEventListener('popstate', handlePopState);
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [selectedDestination]);

  const closeDestination = () => {
    if (window.history.state?.modal === 'destination') {
      window.history.back();
    } else {
      setSelectedDestination(null);
    }
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
            const idx = merged.findIndex(m => m.id === ld.id);
            if (idx !== -1) merged[idx] = ld;
            else merged.push(ld);
        });
        setDestinations(merged);
        
        if (selectedDestination) {
          const updated = merged.find(d => d.id === selectedDestination.id);
          if (updated) setSelectedDestination(updated);
        }
    });

    const usersRef = ref(db, 'users');
    onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      setAllUsersList(data ? Object.values(data) : []);
    });

    const groupsRef = ref(db, 'travelGroups');
    onValue(groupsRef, (snapshot) => {
      const data = snapshot.val();
      setTravelGroups(data ? Object.values(data) : []);
    });

    if (userIsAdmin) {
      const sugRef = ref(db, 'suggestions');
      onValue(sugRef, (snapshot) => {
        const data = snapshot.val();
        setSuggestions(data ? Object.values(data) : []);
      });
    }
  }, [userIsAdmin, selectedDestination?.id]);

  useEffect(() => {
    if (!user) {
      setUnreadMessagesCount(0);
      return;
    }

    const chatsRef = ref(db, 'chats');
    return onValue(chatsRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setUnreadMessagesCount(0);
        return;
      }

      let totalUnread = 0;
      Object.values(data).forEach((chat: any) => {
        if (chat.participants?.includes(user.id)) {
          const messages = chat.messages ? Object.values(chat.messages) : [];
          const unreadInChat = messages.filter((m: any) => !m.isRead && m.senderId !== user.id).length;
          totalUnread += unreadInChat;
        }
      });
      setUnreadMessagesCount(totalUnread);
    });
  }, [user?.id]);

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

  const handleLogout = () => {
      AuthService.logout();
      setUser(null);
      setActiveTab('home');
      setViewingUserId(null);
  };

  const handleToggleFollow = async (targetId: string) => requireAuth(async () => {
    await AuthService.toggleFollow(user!.id, targetId);
    const updatedUser = await AuthService.getUserById(user!.id);
    if (updatedUser) setUser(updatedUser);
  });

  const handleUpdateDestination = async (id: string, updates: Partial<Destination>) => {
    if (!userIsAdmin) return;
    await StorageService.updateDestinationStatus(id, updates);
  };

  const handleDeleteDestination = async (id: string) => {
    if (!userIsAdmin) return;
    await StorageService.deleteDestination(id);
    setSelectedDestination(null);
  };

  const handleChangeDestinationCover = async (id: string, imageUrl: string) => {
    if (!userIsAdmin) return;
    await StorageService.updateDestinationCover(id, imageUrl);
  };

  const handleRemoveDestinationPhoto = async (id: string, photoUrl: string) => {
    if (!userIsAdmin || !selectedDestination) return;
    await StorageService.removeDestinationPhoto(id, selectedDestination.gallery || [], photoUrl);
  };

  const featuredDestination = destinations.find(d => d.isFeatured) || destinations[0];
  const activeStories = stories.filter(story => (Date.now() - story.timestamp) < 24 * 60 * 60 * 1000);

  const REGIONS: EcuadorRegion[] = ['Costa', 'Sierra', 'Amazonía', 'Insular'];
  
  const getRegionIcon = (region: EcuadorRegion) => {
    switch(region) {
      case 'Costa': return <Palmtree className="text-amber-500" size={24} />;
      case 'Sierra': return <Mountain className="text-blue-500" size={24} />;
      case 'Amazonía': return <Tent className="text-emerald-500" size={24} />;
      case 'Insular': return <Waves className="text-cyan-500" size={24} />;
    }
  };

  const getRegionColor = (region: EcuadorRegion) => {
    switch(region) {
      case 'Costa': return 'from-amber-500 to-orange-600';
      case 'Sierra': return 'from-blue-500 to-indigo-600';
      case 'Amazonía': return 'from-emerald-500 to-teal-600';
      case 'Insular': return 'from-cyan-500 to-blue-600';
    }
  };

  const targetUser = viewingUserId ? allUsersList.find(u => u.id === viewingUserId) : user;
  const isOwnProfile = !viewingUserId || viewingUserId === user?.id;
  const targetPosts = posts.filter(p => p.userId === targetUser?.id);
  const isFollowing = user && targetUser && user.following && user.following.includes(targetUser.id);

  const userLevel = getUserLevel(targetUser?.points);
  const nextLevel = getNextLevel(targetUser?.points);
  const progressToNext = nextLevel 
    ? Math.min(100, Math.max(0, ((targetUser?.points || 0) - userLevel.minPoints) / (nextLevel.minPoints - userLevel.minPoints) * 100))
    : 100;

  const searchResults = {
    destinations: searchTerm.trim() ? destinations.filter(d => 
        d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        d.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.province.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.category.toLowerCase().includes(searchTerm.toLowerCase())
    ) : [],
    users: searchTerm.trim() ? allUsersList.filter(u => 
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    ) : [],
    groups: searchTerm.trim() ? travelGroups.filter(g => 
        (!g.isPrivate || (user && g.members && g.members[user.id])) && (
            g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            g.description.toLowerCase().includes(searchTerm.toLowerCase())
        )
    ) : []
  };

  return (
    <div className="min-h-screen bg-stone-50 font-sans">
      <Helmet>
        <title>Explora | Ecuador Travel</title>
      </Helmet>

      {activeTab !== 'portals' && (
        <nav className="sticky top-0 z-[100] bg-white border-b border-stone-100 shadow-sm px-4 py-2">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 cursor-pointer" onClick={() => { setActiveTab('home'); setViewingUserId(null); }}>
                <span className="text-lg md:text-xl font-black text-manabi-600 tracking-tighter">ECUADOR</span>
                <span className="text-lg md:text-xl font-light text-stone-400">TRAVEL</span>
                </div>
            </div>

            <div className="flex items-center gap-1 md:gap-5">
                <div className="flex items-center gap-1 md:gap-4 text-stone-500">
                <button onClick={() => requireAuth(() => setIsNotificationsOpen(true))} className="p-2 hover:bg-stone-50 rounded-full transition-colors relative">
                    <Bell size={22} />
                    {notifications.length > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>}
                </button>
                <button onClick={() => requireAuth(() => { setIsChatOpen(true); setInitialChatId(null); })} className="p-2 hover:bg-stone-50 rounded-full transition-colors relative">
                    <MessageCircle size={22} />
                    {unreadMessagesCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white px-1">
                        {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
                    </span>
                    )}
                </button>
                {userIsAdmin && (
                    <button onClick={() => setIsAdminUsersOpen(true)} className="p-2 bg-manabi-50 text-manabi-600 rounded-full"><Users size={22} /></button>
                )}
                </div>
                <button onClick={() => requireAuth(() => setIsCreateModalOpen(true))} className="hidden md:flex bg-manabi-600 text-white px-5 py-2 rounded-xl font-bold text-sm shadow-md hover:bg-manabi-700 transition-all items-center gap-2"><Camera size={18} /> Publicar</button>
                {user && <img src={user.avatar} className="hidden md:block w-10 h-10 rounded-full border-2 border-manabi-500 cursor-pointer object-cover" onClick={() => { setViewingUserId(null); setActiveTab('profile'); setProfileSubTab('grid'); }} />}
            </div>
            </div>
        </nav>
      )}

      <main className={`max-w-7xl mx-auto px-4 py-6 ${activeTab === 'portals' ? 'p-0 max-w-full' : 'grid grid-cols-1 lg:grid-cols-12 gap-8 pb-24 md:pb-6'}`}>
        <div className={activeTab === 'portals' ? 'w-full' : 'lg:col-span-8'}>
          {activeTab === 'portals' ? (
              <PortalsView 
                posts={posts} 
                currentUser={user} 
                onLike={(p) => StorageService.toggleLikePost(p, user?.id || 'guest')} 
                onComment={(id) => setViewingPost(posts.find(p => p.id === id) || null)} 
                onUserClick={handleUserClick} 
              />
          ) : activeTab === 'explore' ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 space-y-8">
               <div className="grid grid-cols-3 gap-3">
                  <button onClick={() => setIsNearbyModalOpen(true)} className="flex flex-col items-center justify-center p-4 bg-white rounded-3xl border border-stone-100 shadow-sm hover:shadow-md transition-all group">
                    <div className="bg-emerald-100 p-3 rounded-2xl mb-2 text-emerald-600 group-hover:scale-110 transition-transform relative"><Zap size={24} fill="currentColor" className="animate-pulse" /></div>
                    <span className="text-[10px] md:text-xs font-black text-stone-700 uppercase">Radar Local</span>
                  </button>
                  <button onClick={() => setIsItineraryOpen(true)} className="flex flex-col items-center justify-center p-4 bg-white rounded-3xl border border-stone-100 shadow-sm hover:shadow-md transition-all group">
                    <div className="bg-blue-100 p-3 rounded-2xl mb-2 text-blue-600 group-hover:scale-110 transition-transform"><Calendar size={24} fill="currentColor" /></div>
                    <span className="text-[10px] md:text-xs font-black text-stone-700 uppercase">Planificar</span>
                  </button>
                  <button onClick={() => requireAuth(() => setIsAddDestModalOpen(true))} className="flex flex-col items-center justify-center p-4 bg-white rounded-3xl border border-stone-100 shadow-sm hover:shadow-md transition-all group">
                    <div className="bg-purple-100 p-3 rounded-2xl mb-2 text-purple-600 group-hover:scale-110 transition-transform"><Plus size={24} strokeWidth={3} /></div>
                    <span className="text-[10px] md:text-xs font-black text-stone-700 uppercase">Añadir</span>
                  </button>
               </div>

               <div className="space-y-12">
                  {REGIONS.filter(region => filterRegion === 'Todas' || region === filterRegion).map(region => {
                    const regionDestinations = destinations.filter(d => d.region === region);
                    if (regionDestinations.length === 0) return null;

                    const isCollapsed = collapsedRegions[region];
                    const provincesInRegion = Array.from(new Set(regionDestinations.map(d => d.province)));

                    return (
                      <div key={region} className="space-y-6">
                        <div 
                          onClick={() => toggleRegionCollapse(region)}
                          className="flex items-center justify-between border-b border-stone-200 pb-4 cursor-pointer group/header"
                        >
                          <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-2xl bg-gradient-to-br ${getRegionColor(region)} text-white shadow-lg group-hover/header:scale-105 transition-transform`}>
                                {getRegionIcon(region)}
                            </div>
                            <div>
                              <h2 className="text-2xl font-black text-stone-800 tracking-tight">{region}</h2>
                              <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">{regionDestinations.length} lugares por descubrir</p>
                            </div>
                          </div>
                          <div className="bg-stone-100 p-2 rounded-full text-stone-400 group-hover/header:bg-stone-200 group-hover/header:text-stone-600 transition-all">
                             {isCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                          </div>
                        </div>

                        {!isCollapsed && (
                          <div className="space-y-10 animate-in fade-in slide-in-from-top-2 duration-300">
                            {provincesInRegion.filter(p => filterProvince === 'Todas' || p === filterProvince).map(province => {
                              const provinceDestinations = regionDestinations.filter(d => d.province === province);
                              if (provinceDestinations.length === 0) return null;

                              return (
                                <div key={province} className="space-y-4">
                                  <div className="flex items-center gap-2">
                                    <div className="h-4 w-1 bg-stone-300 rounded-full"></div>
                                    <h3 className="font-black text-stone-600 uppercase text-xs tracking-[0.2em]">{province}</h3>
                                  </div>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {provinceDestinations.map(d => (
                                      <DestinationCard key={d.id} destination={d} onClickGuide={() => setSelectedDestination(d)} />
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
               </div>
            </div>
          ) : activeTab === 'search' ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6">
                <div className="bg-white p-4 md:p-6 rounded-[2.5rem] shadow-sm border border-stone-100">
                    <h2 className="text-2xl font-black text-stone-800 mb-6 flex items-center gap-2">
                        <Search className="text-manabi-600" size={28} /> Descubrir
                    </h2>
                    
                    <div className="relative bg-stone-50 rounded-2xl h-14 flex items-center px-5 focus-within:ring-2 focus-within:ring-manabi-500/20 focus-within:bg-white transition-all border border-transparent focus-within:border-stone-200">
                        <Search size={22} className="text-stone-400 mr-3" />
                        <input 
                            type="text" 
                            placeholder="Buscar destinos, provincias, grupos o personas..." 
                            className="w-full bg-transparent outline-none text-lg font-medium text-stone-700 placeholder-stone-400"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            autoFocus
                        />
                        {searchTerm && (
                            <button onClick={() => setSearchTerm('')} className="text-stone-400 hover:text-stone-600">
                                <X size={20} />
                            </button>
                        )}
                    </div>

                    <div className="flex gap-2 mt-6 overflow-x-auto no-scrollbar">
                        {[
                            { id: 'all', label: 'Todo', icon: <Globe size={14}/> },
                            { id: 'destinations', label: 'Destinos', icon: <MapPin size={14}/> },
                            { id: 'groups', label: 'Comunidades', icon: <Users size={14}/> },
                            { id: 'users', label: 'Viajeros', icon: <UserIcon size={14}/> }
                        ].map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setSearchCategory(cat.id as SearchCategory)}
                                className={`px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2 border transition-all ${searchCategory === cat.id ? 'bg-manabi-600 text-white border-manabi-600 shadow-md scale-105' : 'bg-white text-stone-500 border-stone-200 hover:border-manabi-300'}`}
                            >
                                {cat.icon} {cat.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-8">
                    {(searchCategory === 'all' || searchCategory === 'destinations') && searchResults.destinations.length > 0 && (
                        <div>
                            <h3 className="text-xs font-black text-stone-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                <MapPin size={14} /> Lugares Encontrados ({searchResults.destinations.length})
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {searchResults.destinations.map(d => (
                                    <div 
                                        key={d.id} 
                                        onClick={() => setSelectedDestination(d)}
                                        className="bg-white p-3 rounded-3xl border border-stone-100 shadow-sm hover:shadow-md transition-all flex gap-4 cursor-pointer group"
                                    >
                                        <img src={d.imageUrl} className="w-24 h-24 rounded-2xl object-cover group-hover:scale-105 transition-transform" />
                                        <div className="flex-1 py-1">
                                            <div className="flex justify-between items-start">
                                                <h4 className="font-bold text-stone-800 leading-tight group-hover:text-manabi-600 transition-colors">{d.name}</h4>
                                                <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded-lg border border-amber-100">
                                                    <Star size={10} fill="currentColor" /> {d.rating}
                                                </span>
                                            </div>
                                            <p className="text-xs text-stone-400 mt-1 flex items-center gap-1"><MapPin size={10} /> {d.location}</p>
                                            <span className="inline-block mt-3 text-[9px] font-black text-manabi-600 bg-manabi-50 px-2 py-0.5 rounded uppercase">{d.category}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {(searchCategory === 'all' || searchCategory === 'groups') && searchResults.groups.length > 0 && (
                        <div className="animate-in fade-in duration-500">
                             <h3 className="text-xs font-black text-stone-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                <Users size={14} /> Grupos de Viaje ({searchResults.groups.length})
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {searchResults.groups.map(g => (
                                    <div 
                                        key={g.id} 
                                        onClick={() => handleGroupClick(g.id)}
                                        className="bg-white p-3 rounded-2xl border border-stone-100 shadow-sm hover:border-manabi-200 transition-all flex items-center gap-4 cursor-pointer"
                                    >
                                        <div className="relative">
                                            <img src={g.imageUrl} className="w-14 h-14 rounded-xl object-cover" />
                                            {g.isPrivate && <div className="absolute -top-1 -right-1 bg-stone-800 text-white p-1 rounded-md"><Lock size={10}/></div>}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-stone-800 text-sm truncate">{g.name}</h4>
                                            <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider line-clamp-1">{g.description}</p>
                                        </div>
                                        <ChevronRight size={16} className="text-stone-300" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {(searchCategory === 'all' || searchCategory === 'users') && searchResults.users.length > 0 && (
                        <div className="animate-in fade-in duration-500">
                             <h3 className="text-xs font-black text-stone-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                <UserIcon size={14} /> Viajeros Encontrados ({searchResults.users.length})
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {searchResults.users.map(u => (
                                    <div 
                                        key={u.id} 
                                        onClick={() => handleUserClick(u.id)}
                                        className="bg-white p-3 rounded-2xl border border-stone-100 shadow-sm hover:border-manabi-200 transition-all flex items-center gap-4 cursor-pointer"
                                    >
                                        <img src={u.avatar} className="w-12 h-12 rounded-xl object-cover" />
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-stone-800 text-sm truncate">{u.name}</h4>
                                            <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">{getUserLevel(u.points).name}</p>
                                        </div>
                                        <ChevronRight size={16} className="text-stone-300" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {searchTerm && searchResults.destinations.length === 0 && searchResults.users.length === 0 && searchResults.groups.length === 0 && (
                        <div className="py-20 text-center text-stone-400 flex flex-col items-center gap-4">
                            <div className="bg-stone-100 p-6 rounded-full">
                                <Search size={48} className="opacity-20" />
                            </div>
                            <div>
                                <p className="font-bold text-lg text-stone-600">No encontramos resultados</p>
                                <p className="text-sm">Intenta con otras palabras clave o categorías.</p>
                            </div>
                        </div>
                    )}

                    {!searchTerm && (
                         <div className="py-20 text-center text-stone-300 flex flex-col items-center gap-4">
                            <Sparkles size={48} className="opacity-10" />
                            <p className="text-sm font-black uppercase tracking-widest">Escribe algo para empezar a descubrir Ecuador</p>
                         </div>
                    )}
                </div>
            </div>
          ) : activeTab === 'profile' ? (
             <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6">
                {!isOwnProfile && (
                  <button onClick={() => { setViewingUserId(null); setActiveTab('home'); }} className="flex items-center gap-2 text-stone-500 font-bold text-sm hover:text-manabi-600 transition-colors">
                    <ChevronLeft size={20} /> Volver al Explorador
                  </button>
                )}

                <div className="bg-white rounded-3xl shadow-sm border border-stone-100 overflow-hidden">
                  <div className="h-24 bg-gradient-to-r from-manabi-500 to-cyan-600"></div>
                  <div className="px-8 pb-8 -mt-12 text-center">
                    <img src={targetUser?.avatar} className="w-24 h-24 rounded-3xl mx-auto border-4 border-white mb-4 object-cover shadow-lg" />
                    <h2 className="text-2xl font-black text-stone-800 flex items-center justify-center gap-2">
                        {targetUser?.name}
                        {!isOwnProfile && targetUser && (
                           <button 
                             onClick={() => handleToggleFollow(targetUser.id)}
                             className={`p-2 rounded-full transition-all ${isFollowing ? 'bg-green-100 text-green-600' : 'bg-manabi-100 text-manabi-600 hover:bg-manabi-600 hover:text-white'}`}
                           >
                             {isFollowing ? <UserCheck size={18} /> : <UserPlus size={18} />}
                           </button>
                        )}
                    </h2>
                    <p className="text-stone-400 mb-6 text-sm font-medium">"{targetUser?.bio || 'Explorando las maravillas de Ecuador 🇪🇨'}"</p>
                    
                    <div className="max-w-md mx-auto bg-stone-50 p-4 rounded-2xl border border-stone-100 mb-6 text-left">
                        <div className="flex justify-between items-center mb-2">
                            <span className={`text-xs font-black uppercase tracking-widest ${userLevel.color} flex items-center gap-1`}>
                                {userLevel.icon} {userLevel.name}
                            </span>
                            <span className="text-xs font-bold text-stone-400">{targetUser?.points || 0} XP</span>
                        </div>
                        <div className="h-2 bg-stone-200 rounded-full overflow-hidden">
                            <div className="h-full bg-manabi-500 transition-all duration-1000" style={{ width: `${progressToNext}%` }}></div>
                        </div>
                    </div>

                    <div className="flex justify-center gap-8 border-t border-stone-50 pt-6">
                       <div className="text-center">
                          <span className="block font-black text-xl text-stone-800">{targetUser?.points || 0}</span>
                          <span className="text-[10px] text-stone-400 uppercase font-black tracking-widest">Puntos</span>
                       </div>
                       <div className="w-px h-10 bg-stone-100"></div>
                       <div className="text-center">
                          <span className="block font-black text-xl text-stone-800">{targetPosts.length}</span>
                          <span className="text-[10px] text-stone-400 uppercase font-black tracking-widest">Publicaciones</span>
                       </div>
                       <div className="w-px h-10 bg-stone-100"></div>
                       <div className="text-center">
                          <span className="block font-black text-xl text-stone-800">{targetUser?.followers?.length || 0}</span>
                          <span className="text-[10px] text-stone-400 uppercase font-black tracking-widest">Seguidores</span>
                       </div>
                    </div>
                  </div>
               </div>

               {isOwnProfile && (
                 <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <button onClick={() => setIsGroupsOpen(true)} className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm hover:shadow-md transition-all flex flex-col items-center gap-3 text-center group">
                        <div className="bg-cyan-50 text-cyan-600 p-4 rounded-2xl group-hover:scale-110 transition-transform"><Users size={28} /></div>
                        <span className="block text-sm font-black text-stone-800 leading-none">Grupos</span>
                    </button>
                    <button onClick={() => setIsItineraryOpen(true)} className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm hover:shadow-md transition-all flex flex-col items-center gap-3 text-center group">
                        <div className="bg-blue-50 text-blue-600 p-4 rounded-2xl group-hover:scale-110 transition-transform"><Calendar size={28} /></div>
                        <span className="block text-sm font-black text-stone-800 leading-none">Planificar Viaje</span>
                    </button>
                    <button onClick={() => setIsSuggestionsOpen(true)} className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm hover:shadow-md transition-all flex flex-col items-center gap-3 text-center group">
                        <div className="bg-amber-50 text-amber-600 p-4 rounded-2xl group-hover:scale-110 transition-transform"><Lightbulb size={28} /></div>
                        <span className="block text-sm font-black text-stone-800 leading-none">Sugerir</span>
                    </button>
                 </div>
               )}

               <div className="bg-white rounded-3xl shadow-sm border border-stone-100 overflow-hidden">
                 <div className="flex border-b border-stone-50">
                    <button 
                      onClick={() => setProfileSubTab('grid')}
                      className={`flex-1 py-4 text-xs font-black uppercase tracking-widest flex justify-center items-center gap-2 transition-all ${profileSubTab === 'grid' ? 'text-manabi-600 bg-manabi-50/30' : 'text-stone-400 hover:text-stone-600'}`}
                    >
                      <LayoutGrid size={16} /> Memorias
                    </button>
                    <button 
                      onClick={() => setProfileSubTab('badges')}
                      className={`flex-1 py-4 text-xs font-black uppercase tracking-widest flex justify-center items-center gap-2 transition-all ${profileSubTab === 'badges' ? 'text-manabi-600 bg-manabi-50/30' : 'text-stone-400 hover:text-stone-600'}`}
                    >
                      <Trophy size={16} /> Logros
                    </button>
                    <button 
                      onClick={() => setProfileSubTab('map')}
                      className={`flex-1 py-4 text-xs font-black uppercase tracking-widest flex justify-center items-center gap-2 transition-all ${profileSubTab === 'map' ? 'text-manabi-600 bg-manabi-50/30' : 'text-stone-400 hover:text-stone-600'}`}
                    >
                      <MapIcon size={16} /> Trayectoria
                    </button>
                 </div>
                 
                 <div className="p-1 min-h-[300px]">
                    {profileSubTab === 'grid' && (
                      <div className="grid grid-cols-3 gap-1 animate-in fade-in duration-300">
                         {targetPosts.map(post => (
                           <div 
                             key={post.id} 
                             className="aspect-square relative cursor-pointer group overflow-hidden bg-stone-100"
                             onClick={() => setViewingPost(post)}
                           >
                              <img src={post.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                 <span className="text-white text-xs font-bold flex items-center gap-1">
                                     <Star size={12} fill="currentColor" /> {post.likes}
                                 </span>
                              </div>
                              {post.mediaType === 'video' && (
                                <div className="absolute top-2 right-2 text-white bg-black/40 p-1 rounded-md backdrop-blur-md">
                                  <Play size={10} fill="currentColor" />
                                </div>
                              )}
                           </div>
                         ))}
                         {targetPosts.length === 0 && (
                           <div className="col-span-3 py-20 text-center text-stone-400 flex flex-col items-center gap-2">
                             <Camera size={48} className="opacity-10" />
                             <p className="text-sm font-bold italic">No hay publicaciones compartidas todavía.</p>
                           </div>
                         )}
                      </div>
                    )}

                    {profileSubTab === 'badges' && (
                      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-300">
                         {BADGES.map((badge: Badge) => {
                            const isUnlocked = targetUser?.badges?.some(b => b.id === badge.id);
                            return (
                               <div key={badge.id} className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${isUnlocked ? 'bg-white border-manabi-100 shadow-sm' : 'bg-stone-50 border-stone-200 opacity-40 grayscale'}`}>
                                  <div className="text-4xl">{badge.icon}</div>
                                  <div>
                                     <h4 className="font-bold text-stone-800 text-sm">{badge.name}</h4>
                                     <p className="text-[10px] text-stone-500 leading-tight">{badge.description}</p>
                                     {isUnlocked && <span className="inline-block mt-1 text-[9px] font-black text-manabi-600 bg-manabi-50 px-1.5 py-0.5 rounded uppercase">Desbloqueado</span>}
                                  </div>
                               </div>
                            );
                         })}
                      </div>
                    )}

                    {profileSubTab === 'map' && (
                       <div className="p-2 animate-in fade-in duration-300">
                          <LifeMap posts={targetPosts} />
                       </div>
                    )}
                 </div>
               </div>

               {isOwnProfile && (
                 <button onClick={handleLogout} className="w-full bg-red-50 text-red-600 font-bold py-4 rounded-3xl hover:bg-red-100 transition-colors flex items-center justify-center gap-2 mb-10">
                   <LogOut size={20} /> Cerrar Sesión
                 </button>
               )}
             </div>
          ) : (
            <>
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
                    onUserClick={handleUserClick} onImageClick={(p) => setViewingPost(p)}
                    onEdit={setEditingPost} onDelete={(id) => StorageService.deletePost(id)}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {activeTab !== 'portals' && (
            <div className="hidden lg:block lg:col-span-4 space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100 sticky top-24">
                <div className="flex items-center gap-2 mb-4">
                    <Trophy className="text-manabi-600" size={20} />
                    <h3 className="font-bold text-gray-800 uppercase text-xs tracking-widest">Recomendados</h3>
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
        )}
      </main>

      {/* PANEL INFERIOR DINÁMICO REORDENADO */}
      <div className="fixed bottom-0 w-full bg-white border-t border-stone-100 flex justify-around items-center p-2.5 md:hidden z-[150] shadow-2xl">
        {/* Slot 1: Alternador dinámico Inicio <-> Portales */}
        <button 
          onClick={() => {
            setViewingUserId(null);
            setActiveTab(activeTab === 'portals' ? 'home' : 'portals');
          }} 
          className={`flex flex-col items-center gap-1 ${activeTab === 'home' || activeTab === 'portals' ? 'text-manabi-600' : 'text-stone-400'}`}
        >
          {activeTab === 'portals' ? <Layout size={22} /> : <PlaySquare size={22} />}
          <span className="text-[10px] font-bold">{activeTab === 'portals' ? 'Muro' : 'Portales'}</span>
        </button>

        {/* Slot 2: Explorar */}
        <button 
          onClick={() => { setViewingUserId(null); setActiveTab('explore'); }} 
          className={`flex flex-col items-center gap-1 ${activeTab === 'explore' ? 'text-manabi-600' : 'text-stone-400'}`}
        >
          <Compass size={22} />
          <span className="text-[10px] font-bold">Explorar</span>
        </button>

        {/* Slot 3: Cámara (Crear) */}
        <button onClick={() => requireAuth(() => setIsCreateModalOpen(true))} className="relative -top-5 bg-manabi-600 text-white rounded-2xl p-4 shadow-xl border-4 border-white transition-transform active:scale-90">
          <Camera size={26} />
        </button>

        {/* Slot 4: Buscar */}
        <button 
          onClick={() => { setViewingUserId(null); setActiveTab('search'); }} 
          className={`flex flex-col items-center gap-1 ${activeTab === 'search' ? 'text-manabi-600' : 'text-stone-400'}`}
        >
          <Search size={22} />
          <span className="text-[10px] font-bold">Buscar</span>
        </button>

        {/* Slot 5: Perfil */}
        <button onClick={() => { setViewingUserId(null); setActiveTab('profile'); setProfileSubTab('grid'); }} className={`flex flex-col items-center gap-1 ${activeTab === 'profile' && !viewingUserId ? 'text-manabi-600' : 'text-stone-400'}`}>
          {user ? (
            <img 
              src={user.avatar} 
              className={`w-6 h-6 rounded-full object-cover transition-all ${activeTab === 'profile' && !viewingUserId ? 'ring-2 ring-manabi-600 ring-offset-1 scale-110' : 'opacity-70'}`} 
            />
          ) : (
            <UserIcon size={22} />
          )}
          <span className="text-[10px] font-bold">Perfil</span>
        </button>
      </div>

      <AuthScreen isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} onLoginSuccess={(u) => { setUser(u); setIsAuthOpen(false); }} />
      <CreatePostModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onSubmit={handleCreateContent} />
      <NearbyModal isOpen={isNearbyModalOpen} onClose={() => setIsNearbyModalOpen(false)} isLoading={false} data={null} />
      <SuggestionsModal isOpen={isSuggestionsOpen} onClose={() => setIsSuggestionsOpen(false)} currentUser={user || {id:'guest'} as any} isAdmin={userIsAdmin} suggestions={suggestions} />
      <ChatModal isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} currentUser={user || {id:'guest'} as any} allUsers={allUsersList} initialChatId={null} />
      <AddDestinationModal isOpen={isAddDestModalOpen} onClose={() => setIsAddDestModalOpen(false)} onSubmit={(d) => StorageService.addDestination({ ...d, id: `dest_${Date.now()}`, createdBy: user?.id })} existingDestinations={destinations} />
      <ItineraryGeneratorModal isOpen={isItineraryOpen} onClose={() => setIsItineraryOpen(false)} />
      <TravelGroupsModal 
        isOpen={isGroupsOpen} 
        onClose={() => { setIsGroupsOpen(false); setSelectedGroupId(null); }} 
        currentUser={user || {id:'guest'} as any} 
        allUsers={allUsersList} 
        initialGroupId={selectedGroupId}
        onOpenChat={handleOpenLinkedChat}
      />
      
      {selectedDestination && (
        <TravelGuideModal 
          destination={selectedDestination} 
          onClose={closeDestination} 
          onAskAI={setChatQuery} 
          onRate={() => {}} 
          onAddPhoto={(img) => StorageService.addPhotoToDestinationGallery(selectedDestination.id, selectedDestination.gallery || [], img, user?.id)} 
          isAdminUser={userIsAdmin} 
          onChangeCover={(img) => handleChangeDestinationCover(selectedDestination.id, img)}
          onDeletePhoto={(url) => handleRemoveDestinationPhoto(selectedDestination.id, url)}
          onDeleteDestination={() => handleDeleteDestination(selectedDestination.id)}
          onToggleFeatured={(id, isFeatured) => handleUpdateDestination(id, { isFeatured })}
          onUpdateDestination={handleUpdateDestination}
        />
      )}

      {viewingStoryIndex !== null && <StoryViewer stories={activeStories} initialStoryIndex={viewingStoryIndex} currentUserId={user?.id || 'guest'} onClose={() => setViewingStoryIndex(null)} onMarkViewed={() => {}} onDelete={() => {}} onLike={() => {}} />}
      {isNotificationsOpen && user && <NotificationsModal isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} notifications={notifications} currentUserId={user.id} />}
      {viewingPost && <PostViewer post={viewingPost} currentUserId={user?.id || 'guest'} onClose={() => setViewingPost(null)} onLike={() => {}} onComment={() => {}} onShare={() => {}} onEdit={() => {}} onDelete={() => {}} />}
      {isAdminUsersOpen && <AdminUsersModal isOpen={isAdminUsersOpen} onClose={() => setIsAdminUsersOpen(false)} users={allUsersList} />}
      <ChatBot externalIsOpen={chatQuery !== ''} externalQuery={chatQuery} onCloseExternal={() => setChatQuery('')} />
    </div>
  );
}
