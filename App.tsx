
import React, { useState, useEffect, useRef, useMemo } from 'react';
// Added Bed and Utensils icons to the imports
import { Map as MapIcon, Compass, Camera, Search, LogOut, ChevronLeft, PlusCircle, Globe, Filter, Edit3, X, Lightbulb, MapPin, Plus, MessageCircle, Users, Bell, LayoutGrid, Award, Home, Sparkles, Trophy, CheckCircle, Navigation, Lock, User as UserIcon, AlertTriangle, ShieldAlert, Zap, Calendar, Settings, ChevronRight, Star, UserPlus, UserCheck, Play, Palmtree, Mountain, Tent, Waves, ChevronDown, ChevronUp, PlaySquare, Layout, Loader2, CreditCard, Bed, Utensils, Languages } from 'lucide-react';
import { HeroSection } from './components/HeroSection';
import { PostCard } from './components/PostCard';
import { CreatePostModal } from './components/CreatePostModal';
import { EditPostModal } from './components/EditPostModal';
import { EditStoryModal } from './components/EditStoryModal';
import { ChatBot } from './components/ChatBot';
import { StoryViewer } from './components/StoryViewer';
import { DestinationCard } from './components/DestinationCard';
import { TravelGuideModal } from './components/TravelGuideModal';
import { SuggestionsModal } from './components/SuggestionsModal';
import { ChatModal } from './components/ChatModal';
import { AuthScreen } from './components/AuthScreen';
import { PostViewer } from './components/PostViewer';
import { NotificationsModal } from './components/NotificationsModal';
import { NearbyModal } from './components/NearbyModal';
import { TravelGroupsModal } from './components/TravelGroupsModal';
import { AdminUsersModal } from './components/AdminUsersModal';
import { AddDestinationModal } from './components/AddDestinationModal';
import { ItineraryGeneratorModal } from './components/ItineraryGeneratorModal';
import { LifeMap } from './components/LifeMap';
import { PortalsView } from './components/PortalsView';
import { ManageReservationsModal } from './components/ManageReservationsModal';
import { BookingModal } from './components/BookingModal';
import { OnboardingModal } from './components/OnboardingModal'; 
import { ALL_DESTINATIONS as STATIC_DESTINATIONS, APP_VERSION, TRANSLATIONS } from './constants';
import { Post, Story, Destination, User, Notification, Suggestion, EcuadorRegion, Badge, TravelGroup, Tab, ReservationOffer, Booking, Language } from './types';
import { StorageService } from './services/storageService';
import { AuthService } from './services/authService';
import { isAdmin, getUserLevel, getNextLevel, BADGES, calculateDistance } from './utils';
import { db } from './services/firebase';
import { ref, onValue } from '@firebase/database';
import { Helmet } from 'react-helmet-async';
import { searchNearbyExternalPlaces } from './services/geminiService';

type ProfileSubTab = 'grid' | 'badges' | 'map' | 'bookings';
type SearchCategory = 'all' | 'destinations' | 'users' | 'groups';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false); 
  
  // LÓGICA DE IDIOMA
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('app_language') as Language) || 'es';
  });
  
  const t = TRANSLATIONS[language];

  const toggleLanguage = () => {
    const nextLang = language === 'es' ? 'en' : 'es';
    setLanguage(nextLang);
    localStorage.setItem('app_language', nextLang);
  };

  const [rawPosts, setRawPosts] = useState<Post[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  
  const [stories, setStories] = useState<Story[]>([]);
  const [allUsersList, setAllUsersList] = useState<User[]>([]);
  const [travelGroups, setTravelGroups] = useState<TravelGroup[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [destinations, setDestinations] = useState<Destination[]>(STATIC_DESTINATIONS);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [userBookings, setUserBookings] = useState<Booking[]>([]);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  
  // Modal States
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isNearbyModalOpen, setIsNearbyModalOpen] = useState(false);
  const [nearbyData, setNearbyData] = useState<any>(null);
  const [isNearbyLoading, setIsNearbyLoading] = useState(false);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isGroupsOpen, setIsGroupsOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAdminUsersOpen, setIsAdminUsersOpen] = useState(false);
  const [isAddDestModalOpen, setIsAddDestModalOpen] = useState(false);
  const [isItineraryOpen, setIsItineraryOpen] = useState(false);
  const [isAdminReservationsOpen, setIsAdminReservationsOpen] = useState(false);
  const [selectedOfferToBook, setSelectedOfferToBook] = useState<ReservationOffer | null>(null);
  
  // Tab & Filters
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [profileSubTab, setProfileSubTab] = useState<ProfileSubTab>('grid');
  const [filterRegion, setFilterRegion] = useState<EcuadorRegion | 'Todas'>('Todas');
  const [filterProvince, setFilterProvince] = useState<string>('Todas');

  const [collapsedRegions, setCollapsedRegions] = useState<Record<string, boolean>>({});

  // Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [searchCategory, setSearchCategory] = useState<SearchCategory>('all');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [initialChatId, setInitialChatId] = useState<string | null>(null);

  const [viewingUserId, setViewingUserId] = useState<string | null>(null);

  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null);
  const [viewingStoryIndex, setViewingStoryIndex] = useState<number | null>(null);
  const [viewingStoriesSubset, setViewingStoriesSubset] = useState<Story[]>([]);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [editingStory, setEditingStory] = useState<Story | null>(null);
  const [viewingPost, setViewingPost] = useState<Post | null>(null);
  const [chatQuery, setChatQuery] = useState('');
  
  const userIsAdmin = isAdmin(user?.email);

  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  useEffect(() => {
    if (rawPosts.length === 0) {
      setPosts([]);
      return;
    }
    const sorted = [...rawPosts].sort((a, b) => b.timestamp - a.timestamp);
    let personalized: Post[] = [];
    if (user && user.following && user.following.length > 0) {
      const followingPosts = sorted.filter(p => user.following.includes(p.userId) || p.userId === user.id);
      const otherPosts = sorted.filter(p => !user.following.includes(p.userId) && p.userId !== user.id);
      personalized = [...shuffleArray(followingPosts), ...shuffleArray(otherPosts.slice(0, 30)), ...otherPosts.slice(30)];
    } else {
      const recentPool = sorted.slice(0, 50);
      const olderPool = sorted.slice(50);
      personalized = [...shuffleArray(recentPool), ...olderPool];
    }
    setPosts(personalized);
  }, [rawPosts, user?.id, user?.following]);

  const requireAuth = (action: () => void) => {
    if (!user) setIsAuthOpen(true);
    else action();
  };

  const handleScanRadar = () => {
    if (!navigator.geolocation) {
        alert("Tu navegador no soporta geolocalización.");
        return;
    }

    setIsNearbyModalOpen(true);
    setIsNearbyLoading(true);
    setNearbyData(null);

    navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude, longitude } = pos.coords;
        
        try {
            // 1. Filtrar destinos internos a menos de 20km
            const RADAR_RADIUS_KM = 20;
            const internalResults = destinations
                .filter(d => d.coordinates)
                .map(d => ({
                    ...d,
                    distance: calculateDistance(latitude, longitude, d.coordinates!.latitude, d.coordinates!.longitude)
                }))
                .filter(d => d.distance <= RADAR_RADIUS_KM)
                .map(d => ({
                    name: d.name,
                    category: 'TURISMO' as const,
                    isOpen: true,
                    rating: d.rating,
                    address: d.location,
                    description: d.description,
                    mapLink: `https://www.google.com/maps/search/?api=1&query=${d.coordinates!.latitude},${d.coordinates!.longitude}`,
                    isInternal: true
                }));

            // 2. Consultar lugares externos con Gemini Maps Grounding
            const externalResults = await searchNearbyExternalPlaces(latitude, longitude);

            // 3. Mezclar y mostrar
            setNearbyData({ places: [...internalResults, ...externalResults] });
        } catch (err) {
            console.error("Radar scan failed:", err);
            alert("Error al escanear la zona. Asegúrate de tener conexión.");
        } finally {
            setIsNearbyLoading(false);
        }
    }, (err) => {
        setIsNearbyLoading(false);
        setIsNearbyModalOpen(false);
        alert("Permiso de geolocalización denegado. Es necesario para el radar.");
    });
  };

  const handleShare = async (title: string, text: string) => {
    const shareData = { title, text, url: window.location.origin };
    try {
      if (navigator.share) await navigator.share(shareData);
      else {
        await navigator.clipboard.writeText(`${text} - ${window.location.origin}`);
        alert(language === 'es' ? "¡Link copiado al portapapeles!" : "Link copied to clipboard!");
      }
    } catch (err) { console.log("Error al compartir:", err); }
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
    setCollapsedRegions(prev => ({ ...prev, [region]: !prev[region] }));
  };

  useEffect(() => {
    const handlePopState = () => { if (selectedDestination) setSelectedDestination(null); };
    if (selectedDestination) {
      window.history.pushState({ modal: 'destination' }, '');
      window.addEventListener('popstate', handlePopState);
    }
    return () => window.removeEventListener('popstate', handlePopState);
  }, [selectedDestination]);

  const closeDestination = () => {
    if (window.history.state?.modal === 'destination') window.history.back();
    else setSelectedDestination(null);
  };

  useEffect(() => {
    const session = AuthService.getSession();
    if (session) {
      setUser(session);
      const hasSeen = localStorage.getItem(`onboarding_seen_${session.id}`);
      if (!hasSeen) {
        setIsOnboardingOpen(true);
      }
    }
  }, []);

  const handleCloseOnboarding = () => {
    if (user) {
      localStorage.setItem(`onboarding_seen_${user.id}`, 'true');
    }
    setIsOnboardingOpen(false);
  };

  useEffect(() => {
    const postsRef = ref(db, 'posts');
    onValue(postsRef, (snapshot) => {
      const data = snapshot.val();
      const loadedPosts: Post[] = data ? Object.values(data) : [];
      setRawPosts(loadedPosts);
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

    if (user) {
        const booksRef = ref(db, 'bookings');
        onValue(booksRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const all = Object.values(data) as Booking[];
                setUserBookings(all.filter(b => b.userId === user.id).sort((a,b) => b.timestamp - a.timestamp));
            }
        });
    }

    if (userIsAdmin) {
      const sugRef = ref(db, 'suggestions');
      onValue(sugRef, (snapshot) => {
        const data = snapshot.val();
        setSuggestions(data ? Object.values(data) : []);
      });
    }
  }, [userIsAdmin, selectedDestination?.id, user?.id]);

  useEffect(() => {
    if (!user) { setUnreadMessagesCount(0); return; }
    const chatsRef = ref(db, 'chats');
    return onValue(chatsRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) { setUnreadMessagesCount(0); return; }
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

  const handleCreateContent = (image: string, caption: string, locationOrName: string, type: 'post' | 'story' | 'group', mediaType: 'image' | 'video', extraData?: any) => requireAuth(async () => {
    try {
      if (type === 'post') {
        const newPost: Post = { 
            id: Date.now().toString(), 
            userId: user!.id, 
            userName: user!.name, 
            userAvatar: user!.avatar, 
            location: locationOrName, 
            imageUrl: image, 
            gallery: extraData?.gallery || [],
            mediaType, 
            caption, 
            likes: 0, 
            comments: [], 
            timestamp: Date.now() 
        };
        await StorageService.savePost(newPost);
      } else if (type === 'story') {
        const newStory: Story = { id: `s_${Date.now()}`, userId: user!.id, userName: user!.name, userAvatar: user!.avatar, imageUrl: image, mediaType, timestamp: Date.now(), isViewed: false, caption, location: locationOrName, likes: 0 };
        await StorageService.saveStory(newStory);
      } else if (type === 'group') {
        const groupData = { id: `tg_${Date.now()}`, name: extraData.name, description: caption, imageUrl: image, adminId: user!.id, createdAt: Date.now(), isPrivate: extraData.isPrivate };
        await StorageService.createTravelGroup(groupData, extraData.createChat);
      }
      alert(language === 'es' ? "¡Realizado con éxito!" : "Success!");
    } catch (e: any) { alert(language === 'es' ? "Error al procesar la solicitud." : "Error processing request."); }
  });

  const handleLogout = () => { AuthService.logout(); setUser(null); setActiveTab('home'); setViewingUserId(null); };

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
  const groupedStories = activeStories.reduce((acc, story) => {
    if (!acc[story.userId]) acc[story.userId] = [];
    acc[story.userId].push(story);
    return acc;
  }, {} as Record<string, Story[]>);
  const uniqueStoryUsers = Object.keys(groupedStories);

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
    destinations: searchTerm.trim() ? destinations.filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase()) || d.location.toLowerCase().includes(searchTerm.toLowerCase()) || d.province.toLowerCase().includes(searchTerm.toLowerCase()) || d.category.toLowerCase().includes(searchTerm.toLowerCase())) : [],
    users: searchTerm.trim() ? allUsersList.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase())) : [],
    groups: searchTerm.trim() ? travelGroups.filter(g => (!g.isPrivate || (user && g.members && g.members[user.id])) && (g.name.toLowerCase().includes(searchTerm.toLowerCase()) || g.description.toLowerCase().includes(searchTerm.toLowerCase()))) : []
  };

  return (
    <div className="min-h-screen bg-stone-50 font-sans">
      <Helmet><title>Explora | Ecuador Travel</title></Helmet>

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
                {/* SELECTOR DE IDIOMA */}
                <button 
                  onClick={toggleLanguage} 
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-100 hover:bg-manabi-50 hover:text-manabi-600 transition-all border border-transparent hover:border-manabi-200"
                  title={language === 'es' ? "Switch to English" : "Cambiar a Español"}
                >
                  <Languages size={18} />
                  <span className="text-[10px] font-black uppercase tracking-widest">{language}</span>
                </button>
                
                <button onClick={() => requireAuth(() => setIsNotificationsOpen(true))} className="p-2 hover:bg-stone-50 rounded-full transition-colors relative">
                    <Bell size={22} />
                    {notifications.length > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>}
                </button>
                <button onClick={() => requireAuth(() => { setIsChatOpen(true); setInitialChatId(null); })} className="p-2 hover:bg-stone-50 rounded-full transition-colors relative">
                    <MessageCircle size={22} />
                    {unreadMessagesCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white px-1">{unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}</span>
                    )}
                </button>
                {userIsAdmin && (
                    <>
                        <button onClick={() => setIsAdminReservationsOpen(true)} className="p-2 bg-amber-50 text-amber-600 rounded-full"><CreditCard size={22} /></button>
                        <button onClick={() => setIsAdminUsersOpen(true)} className="p-2 bg-manabi-50 text-manabi-600 rounded-full"><Users size={22} /></button>
                    </>
                )}
                </div>
                <button onClick={() => requireAuth(() => setIsCreateModalOpen(true))} className="hidden md:flex bg-manabi-600 text-white px-5 py-2 rounded-xl font-bold text-sm shadow-md hover:bg-manabi-700 transition-all items-center gap-2"><Camera size={18} /> {t.nav.publish}</button>
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
                onShare={(p) => handleShare(`Mira este portal de @${p.userName} en ${p.location}`, p.caption)}
              />
          ) : activeTab === 'explore' ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 space-y-8">
               <div className="grid grid-cols-3 gap-3">
                  <button onClick={handleScanRadar} className="flex flex-col items-center justify-center p-4 bg-white rounded-3xl border border-stone-100 shadow-sm hover:shadow-md transition-all group">
                    <div className="bg-emerald-100 p-3 rounded-2xl mb-2 text-emerald-600 group-hover:scale-110 transition-transform relative"><Zap size={24} fill="currentColor" className="animate-pulse" /></div>
                    <span className="text-[10px] md:text-xs font-black text-stone-700 uppercase">{t.explore.radar}</span>
                  </button>
                  <button onClick={() => setIsItineraryOpen(true)} className="flex flex-col items-center justify-center p-4 bg-white rounded-3xl border border-stone-100 shadow-sm hover:shadow-md transition-all group">
                    <div className="bg-blue-100 p-3 rounded-2xl mb-2 text-blue-600 group-hover:scale-110 transition-transform"><Calendar size={24} fill="currentColor" /></div>
                    <span className="text-[10px] md:text-xs font-black text-stone-700 uppercase">{t.explore.plan}</span>
                  </button>
                  <button onClick={() => requireAuth(() => setIsAddDestModalOpen(true))} className="flex flex-col items-center justify-center p-4 bg-white rounded-3xl border border-stone-100 shadow-sm hover:shadow-md transition-all group">
                    <div className="bg-purple-100 p-3 rounded-2xl mb-2 text-purple-600 group-hover:scale-110 transition-transform"><Plus size={24} strokeWidth={3} /></div>
                    <span className="text-[10px] md:text-xs font-black text-stone-700 uppercase">{t.explore.add}</span>
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
                        <div onClick={() => toggleRegionCollapse(region)} className="flex items-center justify-between border-b border-stone-200 pb-4 cursor-pointer group/header">
                          <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-2xl bg-gradient-to-br ${getRegionColor(region)} text-white shadow-lg group-hover/header:scale-105 transition-transform`}>{getRegionIcon(region)}</div>
                            <div>
                              <h2 className="text-2xl font-black text-stone-800 tracking-tight">{region}</h2>
                              <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">{regionDestinations.length} {t.explore.places}</p>
                            </div>
                          </div>
                          <div className="bg-stone-100 p-2 rounded-full text-stone-400 group-hover/header:bg-stone-200 group-hover/header:text-stone-600 transition-all">{isCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}</div>
                        </div>
                        {!isCollapsed && (
                          <div className="space-y-10 animate-in fade-in slide-in-from-top-2 duration-300">
                            {provincesInRegion.filter(p => filterProvince === 'Todas' || p === filterProvince).map(province => {
                              const provinceDestinations = regionDestinations.filter(d => d.province === province);
                              if (provinceDestinations.length === 0) return null;
                              return (
                                <div key={province} className="space-y-4">
                                  <div className="flex items-center gap-2"><div className="h-4 w-1 bg-stone-300 rounded-full"></div><h3 className="font-black text-stone-600 uppercase text-xs tracking-[0.2em]">{province}</h3></div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{provinceDestinations.map(d => (<DestinationCard key={d.id} destination={d} onClickGuide={() => setSelectedDestination(d)} />))}</div>
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
                    <h2 className="text-2xl font-black text-stone-800 mb-6 flex items-center gap-2"><Search className="text-manabi-600" size={28} /> {t.search.title}</h2>
                    <div className="relative bg-stone-50 rounded-2xl h-14 flex items-center px-5 focus-within:ring-2 focus-within:ring-manabi-500/20 focus-within:bg-white transition-all border border-transparent focus-within:border-stone-200">
                        <Search size={22} className="text-stone-400 mr-3" />
                        <input type="text" placeholder={t.search.placeholder} className="w-full bg-transparent outline-none text-lg font-medium text-stone-700 placeholder-stone-400" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} autoFocus />
                        {searchTerm && (<button onClick={() => setSearchTerm('')} className="text-stone-400 hover:text-stone-600"><X size={20} /></button>)}
                    </div>
                    <div className="flex gap-2 mt-6 overflow-x-auto no-scrollbar">
                        {[{ id: 'all', label: t.search.all, icon: <Globe size={14}/> }, { id: 'destinations', label: t.search.destinations, icon: <MapPin size={14}/> }, { id: 'groups', label: t.search.communities, icon: <Users size={14}/> }, { id: 'users', label: t.search.travelers, icon: <UserIcon size={14}/> }].map(cat => (
                            <button key={cat.id} onClick={() => setSearchCategory(cat.id as SearchCategory)} className={`px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2 border transition-all ${searchCategory === cat.id ? 'bg-manabi-600 text-white border-manabi-600 shadow-md scale-105' : 'bg-white text-stone-500 border-stone-200 hover:border-manabi-300'}`}>{cat.icon} {cat.label}</button>
                        ))}
                    </div>
                </div>
                <div className="space-y-8">
                    {(searchCategory === 'all' || searchCategory === 'destinations') && searchResults.destinations.length > 0 && (
                        <div>
                            <h3 className="text-xs font-black text-stone-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2"><MapPin size={14} /> {t.search.placesFound} ({searchResults.destinations.length})</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {searchResults.destinations.map(d => (
                                    <div key={d.id} onClick={() => setSelectedDestination(d)} className="bg-white p-3 rounded-3xl border border-stone-100 shadow-sm hover:shadow-md transition-all flex gap-4 cursor-pointer group">
                                        <img src={d.imageUrl} className="w-24 h-24 rounded-2xl object-cover group-hover:scale-105 transition-transform" />
                                        <div className="flex-1 py-1">
                                            <div className="flex justify-between items-start"><h4 className="font-bold text-stone-800 leading-tight group-hover:text-manabi-600 transition-colors">{d.name}</h4><span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded-lg border border-amber-100"><Star size={10} fill="currentColor" /> {d.rating}</span></div>
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
                             <h3 className="text-xs font-black text-stone-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2"><Users size={14} /> {t.search.groupsFound} ({searchResults.groups.length})</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {searchResults.groups.map(g => (
                                    <div key={g.id} onClick={() => handleGroupClick(g.id)} className="bg-white p-3 rounded-2xl border border-stone-100 shadow-sm hover:border-manabi-200 transition-all flex items-center gap-4 cursor-pointer">
                                        <div className="relative">
                                            <img src={g.imageUrl} className="w-14 h-14 rounded-xl object-cover" />
                                            {g.isPrivate && <div className="absolute -top-1 -right-1 bg-stone-800 text-white p-1 rounded-md"><Lock size={10}/></div>}
                                        </div>
                                        <div className="flex-1 min-w-0"><h4 className="font-bold text-stone-800 text-sm truncate">{g.name}</h4><p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider line-clamp-1">{g.description}</p></div>
                                        <ChevronRight size={16} className="text-stone-300" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {(searchCategory === 'all' || searchCategory === 'users') && searchResults.users.length > 0 && (
                        <div className="animate-in fade-in duration-500">
                             <h3 className="text-xs font-black text-stone-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2"><UserIcon size={14} /> {t.search.usersFound} ({searchResults.users.length})</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {searchResults.users.map(u => (
                                    <div key={u.id} onClick={() => handleUserClick(u.id)} className="bg-white p-3 rounded-2xl border border-stone-100 shadow-sm hover:border-manabi-200 transition-all flex items-center gap-4 cursor-pointer">
                                        <img src={u.avatar} className="w-12 h-12 rounded-full object-cover" />
                                        <div className="flex-1 min-w-0"><h4 className="font-bold text-stone-800 text-sm truncate">{u.name}</h4><p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">{getUserLevel(u.points).name}</p></div>
                                        <ChevronRight size={16} className="text-stone-300" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {searchTerm && searchResults.destinations.length === 0 && searchResults.users.length === 0 && searchResults.groups.length === 0 && (
                        <div className="py-20 text-center text-stone-400 flex flex-col items-center gap-4"><div className="bg-stone-100 p-6 rounded-full"><Search size={48} className="opacity-20" /></div><div><p className="font-bold text-lg text-stone-600">{t.search.empty}</p></div></div>
                    )}
                    {!searchTerm && (
                         <div className="py-20 text-center text-stone-300 flex flex-col items-center gap-4"><Sparkles size={48} className="opacity-10" /><p className="text-sm font-black uppercase tracking-widest">{t.search.intro}</p></div>
                    )}
                </div>
            </div>
          ) : activeTab === 'profile' ? (
             <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6">
                {!isOwnProfile && (<button onClick={() => { setViewingUserId(null); setActiveTab('home'); }} className="flex items-center gap-2 text-stone-500 font-bold text-sm hover:text-manabi-600 transition-colors"><ChevronLeft size={20} /> {t.explore.add}</button>)}
                <div className="bg-white rounded-3xl shadow-sm border border-stone-100 overflow-hidden">
                  <div className="h-24 bg-gradient-to-r from-manabi-500 to-cyan-600"></div>
                  <div className="px-8 pb-8 -mt-12 text-center">
                    <img src={targetUser?.avatar} className="w-24 h-24 rounded-3xl mx-auto border-4 border-white mb-4 object-cover shadow-lg" />
                    <h2 className="text-2xl font-black text-stone-800 flex items-center justify-center gap-2">{targetUser?.name}{!isOwnProfile && targetUser && (<button onClick={() => handleToggleFollow(targetUser.id)} className={`p-2 rounded-full transition-all ${isFollowing ? 'bg-green-100 text-green-600' : 'bg-manabi-100 text-manabi-600 hover:bg-manabi-600 hover:text-white'}`}>{isFollowing ? <UserCheck size={18} /> : <UserPlus size={18} />}</button>)}</h2>
                    <p className="text-stone-400 mb-6 text-sm font-medium">"{targetUser?.bio || t.profile.bio}"</p>
                    <div className="max-w-md mx-auto bg-stone-50 p-4 rounded-2xl border border-stone-100 mb-6 text-left">
                        <div className="flex justify-between items-center mb-2"><span className={`text-xs font-black uppercase tracking-widest ${userLevel.color} flex items-center gap-1`}>{userLevel.icon} {userLevel.name}</span><span className="text-xs font-bold text-stone-400">{targetUser?.points || 0} XP</span></div>
                        <div className="h-2 bg-stone-200 rounded-full overflow-hidden"><div className="h-full bg-manabi-500 transition-all duration-1000" style={{ width: `${progressToNext}%` }}></div></div>
                    </div>
                    <div className="flex justify-center gap-8 border-t border-stone-50 pt-6"><div className="text-center"><span className="block font-black text-xl text-stone-800">{targetUser?.points || 0}</span><span className="text-[10px] text-stone-400 uppercase font-black tracking-widest">{t.profile.points}</span></div><div className="w-px h-10 bg-stone-100"></div><div className="text-center"><span className="block font-black text-xl text-stone-800">{targetPosts.length}</span><span className="text-[10px] text-stone-400 uppercase font-black tracking-widest">{t.profile.posts}</span></div><div className="w-px h-10 bg-stone-100"></div><div className="text-center"><span className="block font-black text-xl text-stone-800">{targetUser?.followers?.length || 0}</span><span className="text-[10px] text-stone-400 uppercase font-black tracking-widest">{t.profile.followers}</span></div></div>
                  </div>
               </div>
               {isOwnProfile && (
                 <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <button onClick={() => setIsGroupsOpen(true)} className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm hover:shadow-md transition-all flex flex-col items-center gap-3 text-center group"><div className="bg-cyan-50 text-cyan-600 p-4 rounded-2xl group-hover:scale-110 transition-transform"><Users size={28} /></div><span className="block text-sm font-black text-stone-800 leading-none">{t.profile.groups}</span></button>
                    <button onClick={() => setIsItineraryOpen(true)} className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm hover:shadow-md transition-all flex flex-col items-center gap-3 text-center group"><div className="bg-blue-50 text-blue-600 p-4 rounded-2xl group-hover:scale-110 transition-transform"><Calendar size={28} /></div><span className="block text-sm font-black text-stone-800 leading-none">{t.profile.aiTrips}</span></button>
                    <button onClick={() => setIsSuggestionsOpen(true)} className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm hover:shadow-md transition-all flex flex-col items-center gap-3 text-center group"><div className="bg-amber-50 text-amber-600 p-4 rounded-2xl group-hover:scale-110 transition-transform"><Lightbulb size={28} /></div><span className="block text-sm font-black text-stone-800 leading-none">{t.profile.suggest}</span></button>
                 </div>
               )}
               <div className="bg-white rounded-3xl shadow-sm border border-stone-100 overflow-hidden">
                 <div className="flex border-b border-stone-50">
                    <button onClick={() => setProfileSubTab('grid')} className={`flex-1 py-4 text-xs font-black uppercase tracking-widest flex justify-center items-center gap-2 transition-all ${profileSubTab === 'grid' ? 'text-manabi-600 bg-manabi-50/30' : 'text-stone-400 hover:text-stone-600'}`}><LayoutGrid size={16} /> {t.profile.memories}</button>
                    <button onClick={() => setProfileSubTab('badges')} className={`flex-1 py-4 text-xs font-black uppercase tracking-widest flex justify-center items-center gap-2 transition-all ${profileSubTab === 'badges' ? 'text-manabi-600 bg-manabi-50/30' : 'text-stone-400 hover:text-stone-600'}`}><Trophy size={16} /> {t.profile.achievements}</button>
                    <button onClick={() => setProfileSubTab('map')} className={`flex-1 py-4 text-xs font-black uppercase tracking-widest flex justify-center items-center gap-2 transition-all ${profileSubTab === 'map' ? 'text-manabi-600 bg-manabi-50/30' : 'text-stone-400 hover:text-stone-600'}`}><MapIcon size={16} /> {t.profile.path}</button>
                    {isOwnProfile && <button onClick={() => setProfileSubTab('bookings')} className={`flex-1 py-4 text-xs font-black uppercase tracking-widest flex justify-center items-center gap-2 transition-all ${profileSubTab === 'bookings' ? 'text-manabi-600 bg-manabi-50/30' : 'text-stone-400 hover:text-stone-600'}`}><CreditCard size={16} /> {t.profile.bookings}</button>}
                 </div>
                 <div className="p-1 min-h-[300px]">
                    {profileSubTab === 'grid' && (
                      <div className="grid grid-cols-3 gap-1 animate-in fade-in duration-300">
                         {targetPosts.map(post => (<div key={post.id} className="aspect-square relative cursor-pointer group overflow-hidden bg-stone-100" onClick={() => setViewingPost(post)}><img src={post.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" /><div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><span className="text-white text-xs font-bold flex items-center gap-1"><Star size={12} fill="currentColor" /> {post.likes}</span></div>{post.mediaType === 'video' && (<div className="absolute top-2 right-2 text-white bg-black/40 p-1 rounded-md backdrop-blur-md"><Play size={10} fill="currentColor" /></div>)}</div>))}
                         {targetPosts.length === 0 && (<div className="col-span-3 py-20 text-center text-stone-400 flex flex-col items-center gap-2"><Camera size={48} className="opacity-10" /><p className="text-sm font-bold italic"> {language === 'es' ? 'No hay publicaciones compartidas todavía.' : 'No posts shared yet.'}</p></div>)}
                      </div>
                    )}
                    {profileSubTab === 'badges' && (<div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-300">{BADGES.map((badge: Badge) => { const isUnlocked = targetUser?.badges?.some(b => b.id === badge.id); return (<div key={badge.id} className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${isUnlocked ? 'bg-white border-manabi-100 shadow-sm' : 'bg-stone-50 border-stone-200 opacity-40 grayscale'}`}><div className="text-4xl">{badge.icon}</div><div><h4 className="font-bold text-stone-800 text-sm">{badge.name}</h4><p className="text-[10px] text-stone-500 leading-tight">{badge.description}</p>{isUnlocked && <span className="inline-block mt-1 text-[9px] font-black text-manabi-600 bg-manabi-50 px-1.5 py-0.5 rounded uppercase">{language === 'es' ? 'Desbloqueado' : 'Unlocked'}</span>}</div></div>); })}</div>)}
                    {profileSubTab === 'map' && (<div className="p-2 animate-in fade-in duration-300"><LifeMap posts={targetPosts} /></div>)}
                    {profileSubTab === 'bookings' && (
                        <div className="p-4 space-y-3 animate-in fade-in">
                            {userBookings.map(b => (
                                <div key={b.id} className="bg-white p-4 rounded-2xl border border-stone-100 shadow-sm flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-xl ${b.offerType === 'hotel' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                                            {b.offerType === 'hotel' ? <Bed size={18} /> : <Utensils size={18} />}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-stone-800 text-sm">{b.itemTitle}</h4>
                                            <p className="text-[10px] text-stone-400 font-bold uppercase tracking-tight">{b.businessName}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-black text-manabi-600">${b.price}</p>
                                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase ${b.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{b.status === 'confirmed' ? (language === 'es' ? 'Confirmado' : 'Confirmed') : (language === 'es' ? 'Pendiente' : 'Pending')}</span>
                                    </div>
                                </div>
                            ))}
                            {userBookings.length === 0 && (
                                <div className="py-20 text-center text-stone-300 flex flex-col items-center">
                                    <CreditCard size={48} className="opacity-10 mb-2" />
                                    <p className="text-xs font-black uppercase tracking-widest">{language === 'es' ? 'No has realizado reservas todavía' : 'No bookings made yet'}</p>
                                </div>
                            )}
                        </div>
                    )}
                 </div>
               </div>
               {isOwnProfile && (<button onClick={handleLogout} className="w-full bg-red-50 text-red-600 font-bold py-4 rounded-3xl hover:bg-red-100 transition-colors flex items-center justify-center gap-2 mb-10"><LogOut size={20} /> {t.profile.logout}</button>)}
             </div>
          ) : (
            <>
              <div className="flex gap-4 overflow-x-auto no-scrollbar mb-8 pb-2">
                <div className="relative w-24 h-36 md:w-28 md:h-44 shrink-0 rounded-2xl overflow-hidden cursor-pointer bg-stone-200" onClick={() => requireAuth(() => setIsCreateModalOpen(true))}><img src={user?.avatar || 'https://api.dicebear.com/7.x/adventurer/svg?seed=guest'} className="w-full h-full object-cover opacity-60" /><div className="absolute inset-0 bg-black/20 flex flex-col items-center justify-center text-white"><div className="bg-manabi-600 rounded-full p-1 border-2 border-white mb-1"><Plus size={16} /></div><span className="text-[10px] font-bold">{t.home.create}</span></div></div>
                {uniqueStoryUsers.map((userId) => { const userStories = groupedStories[userId]; const lastStory = userStories[userStories.length - 1]; return (<div key={userId} className="relative w-24 h-36 md:w-28 md:h-44 shrink-0 rounded-2xl overflow-hidden cursor-pointer ring-2 ring-manabi-500 ring-offset-2" onClick={() => { setViewingStoriesSubset(userStories); setViewingStoryIndex(0); }}><img src={lastStory.imageUrl} className="w-full h-full object-cover" /><div className="absolute inset-0 bg-black/20"></div><img src={lastStory.userAvatar} className="absolute top-2 left-2 w-8 h-8 rounded-lg border-2 border-white object-cover" /><span className="absolute bottom-2 left-2 text-white text-[10px] font-bold truncate pr-2">{lastStory.userName}</span></div>); })}
              </div>
              <div className="space-y-8">
                <HeroSection 
                  destination={featuredDestination} 
                  onGuideClick={(name) => setSelectedDestination(destinations.find(d => d.name === name) || null)} 
                  language={language}
                />

                {posts.length === 0 && rawPosts.length > 0 && (
                  <div className="py-20 text-center"><Loader2 size={32} className="animate-spin text-manabi-500 mx-auto" /><p className="text-stone-400 mt-2">{language === 'es' ? 'Cargando tu feed personalizado...' : 'Loading your custom feed...'}</p></div>
                )}
                
                {posts.map(post => (<PostCard key={post.id} post={post} language={language} currentUserId={user?.id || 'guest'} onLike={() => StorageService.toggleLikePost(post, user?.id || 'guest')} onComment={(id, t) => StorageService.addComment(id, [...(post.comments || []), {id: Date.now().toString(), userId: user!.id, userName: user!.name, text: t, timestamp: Date.now()}])} onUserClick={handleUserClick} onImageClick={(p) => setViewingPost(p)} onEdit={setEditingPost} onDelete={(id) => StorageService.deletePost(id)} onShare={(p) => handleShare(`Mira esta publicación de @${p.userName} en ${p.location}`, p.caption)} />))}
              </div>
            </>
          )}
        </div>
        {activeTab !== 'portals' && (<div className="hidden lg:block lg:col-span-4 space-y-6"><div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100 sticky top-24"><div className="flex items-center gap-2 mb-4"><Trophy className="text-manabi-600" size={20} /><h3 className="font-bold text-gray-800 uppercase text-xs tracking-widest">{t.home.recommended}</h3></div><div className="space-y-4">{destinations.slice(0, 4).map(dest => (<div key={dest.id} className="flex gap-3 group cursor-pointer" onClick={() => setSelectedDestination(dest)}><img src={dest.imageUrl} className="w-16 h-16 rounded-xl object-cover" /><div className="flex-1"><h4 className="font-bold text-sm text-gray-800 group-hover:text-manabi-600 transition-colors">{dest.name}</h4><p className="text-[10px] text-stone-400 flex items-center gap-1"><MapPin size={10} /> {dest.province}</p></div></div>))}</div></div></div>)}
      </main>
      <div className="fixed bottom-0 w-full bg-white border-t border-stone-100 flex justify-around items-center p-2.5 md:hidden z-[150] shadow-2xl">
        <button onClick={() => { setViewingUserId(null); setActiveTab(activeTab === 'portals' ? 'home' : 'portals'); }} className={`flex flex-col items-center gap-1 ${activeTab === 'home' || activeTab === 'portals' ? 'text-manabi-600' : 'text-stone-400'}`}>{activeTab === 'portals' ? <Layout size={22} /> : <PlaySquare size={22} />}<span className="text-[10px] font-bold">{activeTab === 'portals' ? t.nav.home : t.nav.portals}</span></button>
        <button onClick={() => { setViewingUserId(null); setActiveTab('explore'); }} className={`flex flex-col items-center gap-1 ${activeTab === 'explore' ? 'text-manabi-600' : 'text-stone-400'}`}><Compass size={22} /><span className="text-[10px] font-bold">{t.nav.explore}</span></button>
        <button onClick={() => requireAuth(() => setIsCreateModalOpen(true))} className="relative -top-5 bg-manabi-600 text-white rounded-2xl p-4 shadow-xl border-4 border-white transition-transform active:scale-90"><Camera size={26} /></button>
        <button onClick={() => { setViewingUserId(null); setActiveTab('search'); }} className={`flex flex-col items-center gap-1 ${activeTab === 'search' ? 'text-manabi-600' : 'text-stone-400'}`}>{activeTab === 'search' ? <Search size={22} /> : <Search size={22} />}<span className="text-[10px] font-bold">{t.nav.search}</span></button>
        <button onClick={() => { setViewingUserId(null); setActiveTab('profile'); setProfileSubTab('grid'); }} className={`flex flex-col items-center gap-1 ${activeTab === 'profile' && !viewingUserId ? 'text-manabi-600' : 'text-stone-400'}`}>{user ? (<img src={user.avatar} className={`w-6 h-6 rounded-full object-cover transition-all ${activeTab === 'profile' && !viewingUserId ? 'ring-2 ring-manabi-600 ring-offset-1 scale-110' : 'opacity-70'}`} />) : (<UserIcon size={22} />)}<span className="text-[10px] font-bold">{t.nav.profile}</span></button>
      </div>
      <AuthScreen isOpen={isAuthOpen} language={language} onClose={() => setIsAuthOpen(false)} onLoginSuccess={(u) => { setUser(u); setIsAuthOpen(false); }} />
      <CreatePostModal isOpen={isCreateModalOpen} language={language} onClose={() => setIsCreateModalOpen(false)} onSubmit={handleCreateContent} />
      <NearbyModal isOpen={isNearbyModalOpen} onClose={() => setIsNearbyModalOpen(false)} isLoading={isNearbyLoading} language={language} data={nearbyData} />
      <SuggestionsModal isOpen={isSuggestionsOpen} onClose={() => setIsSuggestionsOpen(false)} currentUser={user || {id:'guest'} as any} isAdmin={userIsAdmin} suggestions={suggestions} />
      <ChatModal isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} currentUser={user || {id:'guest'} as any} allUsers={allUsersList} initialChatId={null} />
      <AddDestinationModal isOpen={isAddDestModalOpen} onClose={() => setIsAddDestModalOpen(false)} onSubmit={(d) => StorageService.addDestination({ ...d, id: `dest_${Date.now()}`, createdBy: user?.id })} existingDestinations={destinations} />
      <ItineraryGeneratorModal isOpen={isItineraryOpen} onClose={() => setIsItineraryOpen(false)} />
      <TravelGroupsModal isOpen={isGroupsOpen} onClose={() => { setIsGroupsOpen(false); setSelectedGroupId(null); }} currentUser={user || {id:'guest'} as any} allUsers={allUsersList} initialGroupId={selectedGroupId} onOpenChat={handleOpenLinkedChat} />
      {selectedDestination && (<TravelGuideModal destination={selectedDestination} onClose={closeDestination} onAskAI={setChatQuery} onRate={() => {}} onAddPhoto={(img) => StorageService.addPhotoToDestinationGallery(selectedDestination.id, selectedDestination.gallery || [], img, user?.id)} isAdminUser={userIsAdmin} onChangeCover={(img) => handleChangeDestinationCover(selectedDestination.id, img)} onDeletePhoto={(url) => handleRemoveDestinationPhoto(selectedDestination.id, url)} onDeleteDestination={() => handleDeleteDestination(selectedDestination.id)} onToggleFeatured={(id, isFeatured) => handleUpdateDestination(id, { isFeatured })} onUpdateDestination={handleUpdateDestination} onOpenBooking={(off) => setSelectedOfferToBook(off)} />)}
      {viewingStoryIndex !== null && viewingStoriesSubset.length > 0 && (<StoryViewer stories={viewingStoriesSubset} initialStoryIndex={viewingStoryIndex} currentUserId={user?.id || 'guest'} onClose={() => { setViewingStoryIndex(null); setViewingStoriesSubset([]); }} onMarkViewed={(id) => StorageService.markStoryViewed(id, user!)} onDelete={(id) => StorageService.deleteStory(id)} onEdit={(s) => setEditingStory(s)} onLike={(id) => StorageService.toggleLikeStory(stories.find(s => s.id === id)!)} onShare={(text) => handleShare("Mira esta historia en Ecuador Travel", text)} />)}
      {isNotificationsOpen && user && <NotificationsModal isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} notifications={notifications} currentUserId={user.id} />}
      {viewingPost && (<PostViewer post={viewingPost} currentUserId={user?.id || 'guest'} onClose={() => setViewingPost(null)} onLike={(id) => StorageService.toggleLikePost(viewingPost, user?.id || 'guest')} onComment={(id, text) => StorageService.addComment(id, [...(viewingPost.comments || []), {id: Date.now().toString(), userId: user!.id, userName: user!.name, text, timestamp: Date.now()}])} onShare={(p) => handleShare(`Mira esta publicación de @${p.userName} en ${p.location}`, p.caption)} onEdit={(p) => setEditingPost(p)} onDelete={(id) => StorageService.deletePost(id)} />)}
      {isAdminUsersOpen && <AdminUsersModal isOpen={isAdminUsersOpen} onClose={() => setIsAdminUsersOpen(false)} users={allUsersList} />}
      {editingPost && <EditPostModal isOpen={!!editingPost} post={editingPost} onClose={() => setEditingPost(null)} onSave={(id, cap, loc) => StorageService.updatePost(id, { caption: cap, location: loc })} />}
      {editingStory && <EditStoryModal isOpen={!!editingStory} story={editingStory} onClose={() => setEditingStory(null)} onSave={(id, cap, loc) => StorageService.updateStory(id, { caption: cap, location: loc })} />}
      {activeTab !== 'portals' && (<ChatBot externalIsOpen={chatQuery !== ''} externalQuery={chatQuery} language={language} onCloseExternal={() => setChatQuery('')} />)}
      <OnboardingModal isOpen={isOnboardingOpen} onClose={handleCloseOnboarding} userName={user?.name || t.profile.guest} language={language} />
      
      {/* NUEVOS MODALES DE RESERVA */}
      <ManageReservationsModal isOpen={isAdminReservationsOpen} onClose={() => setIsAdminReservationsOpen(false)} destinations={destinations} />
      {selectedOfferToBook && user && (
          <BookingModal 
            isOpen={!!selectedOfferToBook} 
            onClose={() => setSelectedOfferToBook(null)} 
            offer={selectedOfferToBook} 
            user={user} 
          />
      )}
    </div>
  );
}
