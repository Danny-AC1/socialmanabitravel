
import React, { useState, useEffect, useRef } from 'react';
import { Map as MapIcon, Compass, UserCircle, Camera, Search, Grid, LogOut, ArrowRight, UserPlus, UserCheck, ChevronLeft, PlusCircle, Globe, Filter, Edit3, X, MessageSquarePlus, Mail, MapPin, Plus, MessageCircle } from 'lucide-react';
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
import { ChatModal } from './components/ChatModal';
import { AuthScreen } from './components/AuthScreen';
import { PostViewer } from './components/PostViewer';
import { ALL_DESTINATIONS as STATIC_DESTINATIONS } from './constants';
import { Post, Story, Destination, User, EcuadorRegion, Suggestion, Chat } from './types';
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
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAddDestinationModalOpen, setIsAddDestinationModalOpen] = useState(false);
  const [isSuggestionsModalOpen, setIsSuggestionsModalOpen] = useState(false);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [initialChatId, setInitialChatId] = useState<string | null>(null);
  
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [editingStory, setEditingStory] = useState<Story | null>(null);
  const [viewingPost, setViewingPost] = useState<Post | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingStoryIndex, setViewingStoryIndex] = useState<number | null>(null);
  const [viewingStoryList, setViewingStoryList] = useState<Story[]>([]);
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null);
  const [viewingProfileId, setViewingProfileId] = useState<string | null>(null);
  
  const [viewingProfileImage, setViewingProfileImage] = useState<string | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState('');

  const [selectedRegion, setSelectedRegion] = useState<EcuadorRegion | 'Todas'>('Todas');
  const [selectedProvince, setSelectedProvince] = useState<string>('Todas');

  const [chatOpen, setChatOpen] = useState(false);
  const [chatQuery, setChatQuery] = useState('');

  const profileInputRef = useRef<HTMLInputElement>(null);

  // --- HISTORY MANAGEMENT ---
  const pushHistory = (state: any) => {
    window.history.pushState(state, '');
  };

  useEffect(() => {
    window.history.replaceState({ type: 'tab', tab: 'home' }, '');

    const handlePopState = (event: PopStateEvent) => {
      const state = event.state;
      if (isCreateModalOpen) setIsCreateModalOpen(false);
      else if (isAddDestinationModalOpen) setIsAddDestinationModalOpen(false);
      else if (isSuggestionsModalOpen) setIsSuggestionsModalOpen(false);
      else if (isChatModalOpen) setIsChatModalOpen(false);
      else if (viewingPost) setViewingPost(null);
      else if (viewingStoryIndex !== null) setViewingStoryIndex(null);
      else if (selectedDestination) setSelectedDestination(null);
      else if (viewingProfileImage) setViewingProfileImage(null);
      else if (editingPost) setEditingPost(null);
      else if (editingStory) setEditingStory(null);
      else if (chatOpen) setChatOpen(false);
      else if (viewingProfileId) setViewingProfileId(null);
      else if (state && state.type === 'tab') {
         setActiveTab(state.tab);
      } else {
         setActiveTab('home');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [
    isCreateModalOpen, isAddDestinationModalOpen, isSuggestionsModalOpen, isChatModalOpen, viewingPost, viewingStoryIndex, 
    selectedDestination, viewingProfileImage, editingPost, editingStory, chatOpen, viewingProfileId
  ]);

  const navigateToTab = (tab: Tab) => {
    setActiveTab(tab);
    if (tab !== 'profile') setViewingProfileId(null);
    window.scrollTo(0,0);
    pushHistory({ type: 'tab', tab });
  };

  const openModal = (setter: (val: boolean) => void) => {
    setter(true);
    pushHistory({ type: 'modal' });
  };

  const openDetail = (setter: (val: any) => void, val: any) => {
    setter(val);
    pushHistory({ type: 'detail' });
  };

  const handleOpenChat = async (targetUserId?: string) => {
    if (targetUserId && user) {
        const chatId = StorageService.getChatId(user.id, targetUserId);
        await StorageService.initiateChat(user.id, targetUserId);
        setInitialChatId(chatId);
    } else {
        setInitialChatId(null);
    }
    openModal(setIsChatModalOpen);
  };

  useEffect(() => {
    const session = AuthService.getSession();
    if (session) {
      setUser(session);
    }
  }, []);

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

    const suggestionsRef = ref(db, 'suggestions');
    const unsubscribeSuggestions = onValue(suggestionsRef, (snapshot) => {
      const data = snapshot.val();
      const loadedSuggestions: Suggestion[] = data ? Object.values(data) : [];
      setSuggestions(loadedSuggestions.sort((a, b) => b.timestamp - a.timestamp));
    });

    // --- GLOBAL CHAT LISTENER FOR UNREAD COUNT ---
    const chatsRef = ref(db, 'chats');
    const unsubscribeChats = onValue(chatsRef, (snapshot) => {
        if (!user) return;
        const data = snapshot.val();
        let totalUnread = 0;
        
        if (data) {
            const userChats = Object.values(data) as Chat[];
            userChats.forEach((chat: any) => {
                if (chat.participants && chat.participants.includes(user.id) && chat.messages) {
                    const messages = Object.values(chat.messages) as any[];
                    // Count messages where I am NOT the sender and isRead is false
                    const unread = messages.filter(m => m.senderId !== user.id && !m.isRead).length;
                    totalUnread += unread;
                }
            });
        }
        setUnreadMessagesCount(totalUnread);
    });

    return () => {
      unsubscribePosts();
      unsubscribeStories();
      unsubscribeUsers();
      unsubscribeDestinations();
      unsubscribeSuggestions();
      unsubscribeChats();
    };
  }, [user]); // Re-run if user changes

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

  const handleLike = async (id: string) => { const post = posts.find(p => p.id === id); if (post && user) await StorageService.toggleLikePost(post, user.id); };
  const handleLikeStory = async (id: string) => { const story = stories.find(s => s.id === id); if (story) await StorageService.toggleLikeStory(story); };
  const handleComment = async (id: string, text: string) => { if (!user) return; const post = posts.find(p => p.id === id); if (post) { const newComment = { id: Date.now().toString(), userId: user.id, userName: user.name, text, timestamp: Date.now() }; const updatedComments = [...(post.comments || []), newComment]; await StorageService.addComment(post.id, updatedComments); } };
  const handleShare = (text: string | Post) => { let content = ""; if (typeof text === 'string') { content = text; } else { content = `¡Mira esta foto de ${text.userName} en ${text.location || 'Ecuador'}! 🌴`; } alert(`Compartiendo: "${content}"\n\n(Enlace copiado al portapapeles)`); };
  const handleCreateContent = async (image: string, caption: string, location: string, type: 'post' | 'story', mediaType: 'image' | 'video') => { if (!user) return; if (type === 'post') { const newPost: Post = { id: Date.now().toString(), userId: user.id, userName: user.name, userAvatar: user.avatar, location, imageUrl: image, mediaType: mediaType, caption, likes: 0, comments: [], timestamp: Date.now(), isLiked: false }; await StorageService.savePost(newPost); } else { const newStory: Story = { id: `s_${Date.now()}`, userId: user.id, userName: user.name, userAvatar: user.avatar, imageUrl: image, mediaType: mediaType, timestamp: Date.now(), isViewed: false, caption: caption, location: location, likes: 0, isLiked: false }; await StorageService.saveStory(newStory); } setActiveTab('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const handleAddDestination = async (data: any) => { if (!user) return; const newId = `ud_${Date.now()}`; const destination: Destination = { ...data, id: newId, isUserGenerated: true, createdBy: user.id, rating: 5, reviewsCount: 1, ratings: { [user.id]: 5 } }; await StorageService.addDestination(destination); };
  const handleRateDestination = async (rating: number) => { if (!selectedDestination || !user) return; if (selectedDestination.ratings && selectedDestination.ratings[user.id]) { alert("Ya has calificado este lugar."); return; } await StorageService.rateDestination( selectedDestination.id, user.id, rating, selectedDestination.rating || 5, selectedDestination.reviewsCount || 0 ); };
  const handleAddPhotoToDestination = async (image: string) => { if (!selectedDestination || !user) return; await StorageService.addPhotoToDestinationGallery( selectedDestination.id, selectedDestination.gallery, image ); };
  const handleChangeDestinationCover = async (image: string) => { if (!selectedDestination || !user) return; await StorageService.updateDestinationCover(selectedDestination.id, image); };
  const handleDeleteDestinationPhoto = async (photoUrl: string) => { if (!selectedDestination || !user) return; if (confirm("¿Eliminar esta foto de la galería?")) { await StorageService.removeDestinationPhoto( selectedDestination.id, selectedDestination.gallery, photoUrl ); } };
  
  const handleDeleteDestination = async (id: string) => {
    await StorageService.deleteDestination(id);
    setSelectedDestination(null);
  };

  const handleEditPost = (post: Post) => openDetail(setEditingPost, post);
  const handleUpdatePost = async (id: string, caption: string, location: string) => { await StorageService.updatePost(id, { caption, location }); if (viewingPost && viewingPost.id === id) setViewingPost(prev => prev ? { ...prev, caption, location } : null); };
  const handleDeletePost = async (id: string) => { if (confirm("¿Estás seguro?")) { await StorageService.deletePost(id); if (viewingPost && viewingPost.id === id) setViewingPost(null); } };
  const handleEditStory = (story: Story) => { setViewingStoryIndex(null); openDetail(setEditingStory, story); };
  const handleUpdateStory = async (id: string, caption: string, location: string) => { await StorageService.updateStory(id, { caption, location }); };
  const handleDeleteStory = async (id: string) => await StorageService.deleteStory(id);
  const handleMarkStoryViewed = (id: string) => {
    if (user) {
        StorageService.markStoryViewed(id, user);
        setStories(stories.map(s => s.id === id ? { ...s, isViewed: true } : s));
    }
  };
  const handleOpenGuide = (destinationName: string) => { const dest = destinations.find(d => d.name === destinationName); if (dest) openDetail(setSelectedDestination, dest); };
  const handleAskAIFromGuide = (query: string) => { setChatQuery(query); openModal(setChatOpen); };
  const handleUserClick = (userId: string) => { setViewingProfileId(userId); setActiveTab('profile'); window.scrollTo({ top: 0, behavior: 'smooth' }); pushHistory({ type: 'profile', id: userId }); };
  const handleViewPost = (post: Post) => openDetail(setViewingPost, post);
  const handleFollowToggle = async (targetUserId: string) => { if (!user) return; await AuthService.toggleFollow(user.id, targetUserId); };
  const handleProfileImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => { if (!user || !e.target.files?.[0]) return; try { const newAvatar = await resizeImage(e.target.files[0], 500); await AuthService.updateUserAvatar(user.id, newAvatar); } catch (err) { console.error(err); } };
  const handleUpdateName = async () => { if(user && newName.trim()) { await AuthService.updateUserName(user.id, newName); setIsEditingName(false); } };
  const openStories = (idx: number, storyList: Story[]) => { setViewingStoryList(storyList); setViewingStoryIndex(idx); pushHistory({ type: 'story' }); };
  
  const activeStories = stories.filter(story => (Date.now() - story.timestamp) < 24 * 60 * 60 * 1000);
  const getProvincesForRegion = (region: EcuadorRegion | 'Todas') => { if (region === 'Todas') return []; const destsInRegion = destinations.filter(d => d.region === region); const provinces = new Set(destsInRegion.map(d => d.province || '')); return Array.from(provinces).filter(p => p !== ''); };
  const filteredExploreDestinations = destinations.filter(dest => { if (selectedRegion !== 'Todas' && dest.region !== selectedRegion) return false; if (selectedProvince !== 'Todas' && dest.province !== selectedProvince) return false; return true; });
  const availableProvinces = getProvincesForRegion(selectedRegion);

  if (!user) return <AuthScreen onLoginSuccess={setUser} />;
  
  const normalizeText = (text: string | undefined | null) => {
    return (text || '')
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  };

  const normalizedQuery = normalizeText(searchQuery).trim();
  
  const filteredPosts = posts.filter(post => 
    normalizeText(post.location).includes(normalizedQuery) || 
    normalizeText(post.caption).includes(normalizedQuery) || 
    normalizeText(post.userName).includes(normalizedQuery)
  );
  
  const searchDestinations = destinations.filter(dest => 
    normalizeText(dest.name).includes(normalizedQuery) || 
    normalizeText(dest.location).includes(normalizedQuery) ||
    normalizeText(dest.category).includes(normalizedQuery) ||
    normalizeText(dest.region).includes(normalizedQuery) || 
    normalizeText(dest.province).includes(normalizedQuery) 
  );

  const filteredUsers = allUsers.filter(u => 
    normalizeText(u.name).includes(normalizedQuery) || 
    normalizeText(u.bio).includes(normalizedQuery)
  );

  const isAdminUser = isAdmin(user.email);

  const renderExplore = () => (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 mb-2">
        <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-stone-800 flex items-center gap-2">
                <Globe size={24} className="text-cyan-600" />
                Explora Ecuador
            </h2>
            <button 
              onClick={() => openModal(setIsAddDestinationModalOpen)}
              className="bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold py-2 px-3 rounded-full flex items-center gap-2 shadow-md transition-colors w-fit"
            >
              <PlusCircle size={16} /> Agregar
            </button>
        </div>
        
        <div className="flex space-x-2 overflow-x-auto no-scrollbar pb-2">
            {(['Todas', 'Costa', 'Sierra', 'Amazonía', 'Insular'] as const).map(region => (
               <button key={region} onClick={() => { setSelectedRegion(region); setSelectedProvince('Todas'); }} className={`px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${selectedRegion === region ? 'bg-cyan-600 text-white shadow-md' : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'}`}>
                 {region}
               </button>
            ))}
        </div>

        {selectedRegion !== 'Todas' && availableProvinces.length > 0 && (
            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                <Filter size={16} className="text-stone-400" />
                <select value={selectedProvince} onChange={(e) => setSelectedProvince(e.target.value)} className="bg-white border border-stone-200 text-stone-700 text-sm rounded-lg p-2 focus:ring-2 focus:ring-cyan-500 outline-none">
                    <option value="Todas">Todas las provincias</option>
                    {availableProvinces.map(prov => ( <option key={prov} value={prov}>{prov}</option> ))}
                </select>
            </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        {filteredExploreDestinations.length > 0 ? (
            filteredExploreDestinations.map(destination => (
                <DestinationCard key={destination.id} destination={destination} onClickGuide={handleOpenGuide} />
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
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigateToTab('home')}>
            <span className="text-2xl font-black text-cyan-700 tracking-tight">ECUADOR</span>
            <span className="text-2xl font-light text-stone-600">TRAVEL</span>
          </div>
          <div className="md:hidden flex items-center gap-3">
             <button 
                onClick={() => handleOpenChat()}
                className="bg-white text-cyan-700 border border-stone-200 p-2 rounded-full relative"
             >
                <MessageCircle size={20} />
                {unreadMessagesCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold border border-white">
                        {unreadMessagesCount}
                    </span>
                )}
             </button>
             {isAdminUser && (
               <button 
                  onClick={() => openModal(setIsSuggestionsModalOpen)} 
                  className="bg-cyan-100 text-cyan-800 p-2 rounded-full relative"
               >
                  <Mail size={20} />
                  {suggestions.length > 0 && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>}
               </button>
             )}
            <button onClick={() => { navigateToTab('profile'); }} className={`rounded-full overflow-hidden w-9 h-9 border-2 transition-all ${activeTab === 'profile' && !viewingProfileId ? 'border-cyan-600' : 'border-stone-200'}`}>
              <img src={user.avatar} alt="Perfil" className="w-full h-full object-cover" />
            </button>
          </div>
          <div className="hidden md:flex flex-1 max-w-md mx-8 relative">
            <input 
              type="text" 
              placeholder="Busca personas, lugares, experiencias..." 
              className="w-full bg-stone-100 border-transparent focus:bg-white border focus:border-cyan-300 rounded-full py-2 pl-10 pr-4 outline-none transition-all text-sm" 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
            />
            <Search className="absolute left-3 top-2.5 text-stone-400" size={16} />
            {searchQuery && ( <button onClick={() => setSearchQuery('')} className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-600"> <LogOut size={14} className="rotate-45" /> </button> )}
          </div>
          <div className="hidden md:flex space-x-6 text-stone-500 font-medium items-center">
             <button onClick={() => navigateToTab('home')} className={`hover:text-cyan-700 transition-colors ${activeTab === 'home' ? 'text-cyan-700' : ''}`}><MapIcon size={24} /></button>
             <button onClick={() => navigateToTab('explore')} className={`hover:text-cyan-700 transition-colors ${activeTab === 'explore' ? 'text-cyan-700' : ''}`}><Compass size={24} /></button>
             
             {/* CHAT BUTTON DESKTOP */}
             <button 
                onClick={() => handleOpenChat()} 
                className="hover:text-cyan-700 transition-colors relative"
                title="Mensajes Privados"
             >
                <MessageCircle size={24} />
                {unreadMessagesCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold border-2 border-white">
                        {unreadMessagesCount}
                    </span>
                )}
             </button>

             {isAdminUser && (
                <button 
                  onClick={() => openModal(setIsSuggestionsModalOpen)} 
                  className="relative hover:text-cyan-700 transition-colors"
                  title="Buzón de Administración"
                >
                  <Mail size={24} />
                  {suggestions.length > 0 && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>}
                </button>
             )}

             <button onClick={() => openModal(setIsCreateModalOpen)} className="flex items-center gap-2 bg-cyan-600 text-white px-4 py-2 rounded-full hover:bg-cyan-700 transition-colors shadow-md hover:shadow-lg font-semibold text-sm"> <Camera size={18} /> <span>Publicar</span> </button>
             <button onClick={() => { navigateToTab('profile'); }} className={`rounded-full overflow-hidden ring-2 ring-transparent hover:ring-cyan-400 transition-all ${activeTab === 'profile' && !viewingProfileId ? 'ring-cyan-600' : ''}`}> <img src={user.avatar} alt="Profile" className="w-9 h-9 object-cover" /> </button>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 pt-6 px-4 md:px-0">
        <div className="md:col-span-2">
          {activeTab === 'home' && (
            <>
              {/* STORIES SECTION */}
              <div className="mb-6">
                 <h4 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3 pl-1">Historias (24h)</h4>
                 <div className="flex space-x-3 overflow-x-auto no-scrollbar pb-4">
                   
                   {/* CREATE STORY CARD */}
                   <div 
                      className="relative w-24 h-40 shrink-0 rounded-xl overflow-hidden cursor-pointer group shadow-sm transition-transform active:scale-95" 
                      onClick={() => openModal(setIsCreateModalOpen)}
                   >
                     <img src={user.avatar} alt="You" className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-700" />
                     <div className="absolute inset-0 bg-stone-900/20 group-hover:bg-stone-900/10 transition-colors" />
                     
                     <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-white text-cyan-600 rounded-full p-1 shadow-lg border-2 border-white/50">
                        <Plus size={16} strokeWidth={3} />
                     </div>
                     <div className="absolute bottom-9 left-0 w-full text-center text-white text-[10px] font-bold tracking-wide drop-shadow-md">
                        Crear
                     </div>
                   </div>

                   {/* STORY CARDS */}
                   {activeStories.map((story, idx) => {
                     const isViewed = story.isViewed;
                     return (
                        <div 
                           key={story.id} 
                           className={`relative w-24 h-40 shrink-0 rounded-xl overflow-hidden cursor-pointer group shadow-sm transition-transform active:scale-95 ring-2 ring-offset-2 ${isViewed ? 'ring-stone-200' : 'ring-cyan-500'}`}
                           onClick={() => openStories(idx, activeStories)}
                        >
                           {story.mediaType === 'video' ? (
                              <video src={story.imageUrl} className="w-full h-full object-cover" />
                           ) : (
                              <img src={story.imageUrl} alt={story.userName} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                           )}
                           
                           <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />
                           
                           <div className="absolute top-2 left-2 rounded-full border-2 border-cyan-500 w-8 h-8 overflow-hidden bg-white">
                              <img src={story.userAvatar} className="w-full h-full object-cover" />
                           </div>
                           
                           <span className="absolute bottom-2 left-2 right-2 text-white text-[10px] font-bold truncate drop-shadow-md">
                              {story.userName}
                           </span>
                        </div>
                     );
                   })}
                 </div>
              </div>
              
              {!searchQuery && ( <HeroSection onGuideClick={() => handleOpenGuide('Parque Nacional Machalilla')} /> )}
              
              <div className="space-y-6">
                {filteredPosts.length > 0 ? (
                  filteredPosts.map(post => (
                    <PostCard key={post.id} post={post} currentUserId={user.id} onLike={handleLike} onComment={handleComment} onShare={handleShare} onUserClick={handleUserClick} onImageClick={handleViewPost} onEdit={handleEditPost} onDelete={handleDeletePost} />
                  ))
                ) : (
                  <div className="text-center py-10 text-stone-400"> <p>No se encontraron publicaciones.</p> </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'explore' && renderExplore()}

          {activeTab === 'search' && (
             <div className="space-y-6">
                <div className="relative">
                  <input 
                    type="text" 
                    autoFocus 
                    placeholder="Buscar personas, lugares o posts..." 
                    className="w-full p-4 pl-12 rounded-xl shadow-sm border border-stone-200 outline-none focus:ring-2 focus:ring-cyan-500" 
                    value={searchQuery} 
                    onChange={(e) => setSearchQuery(e.target.value)} 
                  />
                  <Search className="absolute left-4 top-4 text-stone-400" size={20} />
                </div>
                
                {searchQuery ? (
                  <div className="space-y-8">
                     
                     {/* USERS SECTION */}
                     {filteredUsers.length > 0 && (
                       <div>
                          <h3 className="font-bold text-stone-600 text-sm uppercase mb-3 px-1">Personas</h3>
                          <div className="flex overflow-x-auto gap-3 pb-2 no-scrollbar">
                             {filteredUsers.map(u => (
                                <div 
                                  key={u.id} 
                                  onClick={() => handleUserClick(u.id)}
                                  className="min-w-[120px] bg-white p-3 rounded-xl border border-stone-100 flex flex-col items-center cursor-pointer hover:border-cyan-300 shadow-sm transition-all"
                                >
                                   <img src={u.avatar} className="w-12 h-12 rounded-full object-cover mb-2" alt={u.name} />
                                   <span className="text-xs font-bold text-stone-800 text-center line-clamp-1">{u.name}</span>
                                   <span className="text-[10px] text-stone-400 text-center">Ver Perfil</span>
                                </div>
                             ))}
                          </div>
                       </div>
                     )}

                     {/* DESTINATIONS SECTION */}
                     {searchDestinations.length > 0 && (
                       <div>
                          <div className="flex items-center justify-between mb-3 px-1">
                             <h3 className="font-bold text-stone-600 text-sm uppercase">Destinos</h3>
                             <span className="text-xs bg-stone-100 px-2 py-1 rounded-full text-stone-500">{searchDestinations.length}</span>
                          </div>
                          <div className="grid gap-3">
                             {searchDestinations.slice(0, 5).map(dest => (
                                <div key={dest.id} onClick={() => handleOpenGuide(dest.name)} className="bg-white p-3 rounded-xl border border-stone-100 flex items-center space-x-3 shadow-sm cursor-pointer hover:border-cyan-300 transition-colors">
                                   <img src={dest.imageUrl} className="w-12 h-12 rounded-lg object-cover" alt={dest.name}/>
                                   <div className="flex-1">
                                      <h4 className="font-bold text-stone-800 text-sm">{dest.name}</h4>
                                      <div className="flex items-center text-xs text-stone-500 mt-0.5">
                                         <MapPin size={10} className="mr-1" />
                                         {dest.location}
                                      </div>
                                   </div>
                                </div>
                             ))}
                          </div>
                       </div>
                     )}

                     {/* POSTS SECTION */}
                     {filteredPosts.length > 0 && (
                        <div>
                           <div className="flex items-center justify-between mb-3 px-1">
                              <h3 className="font-bold text-stone-600 text-sm uppercase">Publicaciones</h3>
                              <span className="text-xs bg-stone-100 px-2 py-1 rounded-full text-stone-500">{filteredPosts.length}</span>
                           </div>
                           <div className="grid grid-cols-3 gap-1">
                              {filteredPosts.map(post => (
                                 <div key={post.id} className="aspect-square relative cursor-pointer bg-gray-100 rounded-lg overflow-hidden" onClick={() => handleViewPost(post)}>
                                    {post.mediaType === 'video' ? (
                                      <video src={post.imageUrl} className="w-full h-full object-cover" />
                                    ) : (
                                      <img src={post.imageUrl} className="w-full h-full object-cover" alt="" />
                                    )}
                                 </div>
                              ))}
                           </div>
                        </div>
                     )}

                     {filteredUsers.length === 0 && searchDestinations.length === 0 && filteredPosts.length === 0 && (
                        <div className="text-center py-10 text-stone-400">
                           <Search size={48} className="mx-auto mb-2 opacity-20" />
                           <p>No encontramos resultados para "{searchQuery}"</p>
                        </div>
                     )}
                  </div>
                ) : (
                   <div className="text-center py-20 text-stone-300">
                      <Search size={64} className="mx-auto mb-4 opacity-20" />
                      <p>Escribe algo para comenzar a buscar.</p>
                   </div>
                )}
             </div>
          )}

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
                         <button onClick={() => { setViewingProfileId(null); setActiveTab('home'); }} className="absolute top-4 left-4 bg-white/20 p-2 rounded-full text-white"> <ChevronLeft size={24} /> </button>
                       )}
                    </div>
                    <div className="px-6 pb-6 relative">
                      <div className="flex justify-between items-end -mt-12 mb-4">
                        <div className="w-24 h-24 rounded-full border-4 border-white shadow-md bg-white relative group overflow-hidden cursor-pointer" onClick={() => openDetail(setViewingProfileImage, targetUser!.avatar)}>
                          <img src={targetUser!.avatar} alt={targetUser!.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex gap-2 mb-1">
                           {isMe ? (
                             <div className="flex gap-2">
                                <button onClick={() => profileInputRef.current?.click()} className="text-xs text-cyan-700 bg-cyan-50 px-3 py-1.5 rounded-full font-bold flex gap-1 hover:bg-cyan-100 border border-cyan-100"> <Camera size={14} /> Foto </button>
                                <input type="file" ref={profileInputRef} hidden accept="image/*" onChange={handleProfileImageChange} />
                                <button onClick={() => openModal(setIsSuggestionsModalOpen)} className="text-xs text-stone-600 bg-stone-100 px-3 py-1.5 rounded-full font-bold flex gap-1 border border-stone-200 hover:bg-stone-200"> <MessageSquarePlus size={14} /> Sugerencia </button>
                                <button onClick={handleLogout} className="text-xs text-stone-600 bg-stone-100 px-3 py-1.5 rounded-full font-bold flex gap-1"><LogOut size={12} /> Salir</button>
                             </div>
                           ) : (
                             <div className="flex gap-2">
                               <button 
                                  onClick={() => handleOpenChat(targetUser!.id)} 
                                  className="px-3 py-1.5 rounded-full font-bold text-xs bg-cyan-100 text-cyan-700 flex items-center gap-1 hover:bg-cyan-200"
                               >
                                  <MessageCircle size={14} /> Mensaje
                               </button>
                               <button onClick={() => handleFollowToggle(targetUser!.id)} className={`px-4 py-1.5 rounded-full font-bold text-xs ${isFollowing ? 'bg-stone-100' : 'bg-cyan-600 text-white'}`}> {isFollowing ? 'Siguiendo' : 'Seguir'} </button>
                             </div>
                           )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 mb-1">
                        {isMe && isEditingName ? (
                           <div className="flex gap-2 w-full max-w-xs">
                              <input className="border rounded px-2 py-1 text-sm w-full" value={newName} onChange={e => setNewName(e.target.value)} placeholder={user.name} />
                              <button onClick={handleUpdateName} className="text-green-600 text-xs font-bold">OK</button>
                              <button onClick={() => setIsEditingName(false)} className="text-red-500 text-xs">X</button>
                           </div>
                        ) : (
                           <>
                             <h2 className="text-2xl font-bold text-stone-800">{targetUser!.name}</h2>
                             {isMe && ( <button onClick={() => { setIsEditingName(true); setNewName(user.name); }} className="text-stone-400 hover:text-cyan-600"> <Edit3 size={16} /> </button> )}
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
                              {post.mediaType === 'video' ? ( <video src={post.imageUrl} className="w-full h-full object-cover" /> ) : ( <img src={post.imageUrl} className="w-full h-full object-cover" alt="" /> )}
                           </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
             })()
          )}
        </div>

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
        <button onClick={() => navigateToTab('home')} className={`flex flex-col items-center gap-1 ${activeTab === 'home' ? 'text-cyan-700' : 'text-stone-400'}`}><MapIcon size={24} /></button>
        <button onClick={() => navigateToTab('search')} className={`flex flex-col items-center gap-1 ${activeTab === 'search' ? 'text-cyan-700' : 'text-stone-400'}`}><Search size={24} /></button>
        <button onClick={() => openModal(setIsCreateModalOpen)} className="text-white bg-cyan-600 rounded-2xl p-3 -mt-10 shadow-lg shadow-cyan-200 border-4 border-stone-50"><Camera size={26} /></button>
        <button onClick={() => navigateToTab('explore')} className={`flex flex-col items-center gap-1 ${activeTab === 'explore' ? 'text-cyan-700' : 'text-stone-400'}`}><Compass size={24} /></button>
        <button onClick={() => { navigateToTab('profile'); }} className={`flex flex-col items-center gap-1 ${activeTab === 'profile' ? 'text-cyan-700' : 'text-stone-400'}`}><UserCircle size={24} /></button>
      </div>

      {viewingProfileImage && (
         <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setViewingProfileImage(null)}>
            <img src={viewingProfileImage} className="max-w-full max-h-full rounded-full border-4 border-white shadow-2xl" alt="Profile" />
            <button className="absolute top-4 right-4 text-white p-2"> <X size={32} /> </button>
         </div>
      )}

      <CreatePostModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onSubmit={handleCreateContent} />
      <AddDestinationModal isOpen={isAddDestinationModalOpen} onClose={() => setIsAddDestinationModalOpen(false)} onSubmit={handleAddDestination} existingDestinations={destinations} />
      <EditPostModal isOpen={!!editingPost} post={editingPost} onClose={() => setEditingPost(null)} onSave={handleUpdatePost} />
      <EditStoryModal isOpen={!!editingStory} story={editingStory} onClose={() => setEditingStory(null)} onSave={handleUpdateStory} />
      <SuggestionsModal isOpen={isSuggestionsModalOpen} onClose={() => setIsSuggestionsModalOpen(false)} currentUser={user} isAdmin={isAdminUser} suggestions={suggestions} />
      
      {/* CHAT MODAL */}
      <ChatModal 
        isOpen={isChatModalOpen} 
        onClose={() => setIsChatModalOpen(false)} 
        currentUser={user} 
        allUsers={allUsers}
        initialChatId={initialChatId} 
      />

      {viewingPost && <PostViewer post={viewingPost} currentUserId={user.id} onClose={() => setViewingPost(null)} onLike={handleLike} onComment={handleComment} onShare={handleShare} onEdit={handleEditPost} onDelete={handleDeletePost} />}
      
      <ChatBot externalIsOpen={chatOpen} externalQuery={chatQuery} onCloseExternal={() => setChatOpen(false)} />
      
      {viewingStoryIndex !== null && <StoryViewer stories={viewingStoryList} initialStoryIndex={viewingStoryIndex} currentUserId={user.id} onClose={() => setViewingStoryIndex(null)} onMarkViewed={handleMarkStoryViewed} onDelete={handleDeleteStory} onEdit={handleEditStory} onLike={handleLikeStory} onShare={handleShare} />}
      
      {selectedDestination && (
          <TravelGuideModal 
            destination={selectedDestination} 
            onClose={() => setSelectedDestination(null)} 
            onAskAI={handleAskAIFromGuide} 
            onRate={handleRateDestination} 
            onAddPhoto={handleAddPhotoToDestination} 
            onChangeCover={handleChangeDestinationCover} 
            onDeletePhoto={handleDeleteDestinationPhoto} 
            onDeleteDestination={handleDeleteDestination}
            isAdminUser={isAdmin(user.email)} 
          />
      )}
    </div>
  );
}

export default App;
