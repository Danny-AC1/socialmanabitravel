
import React, { useState, useEffect, useRef } from 'react';
import { Map as MapIcon, Compass, Camera, Search, LogOut, ChevronLeft, PlusCircle, Globe, Filter, Edit3, X, Lightbulb, MapPin, Plus, MessageCircle, Users, Bell, LayoutGrid, Award, Home, Sparkles, Trophy, CheckCircle, Navigation, Lock, Unlock, Hotel, Stethoscope, ShoppingBag, Utensils } from 'lucide-react';
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
import { LifeMap } from './components/LifeMap';
import { WhatsNewModal } from './components/WhatsNewModal'; 
import { TravelGroupsModal } from './components/TravelGroupsModal';
import { ALL_DESTINATIONS as STATIC_DESTINATIONS, APP_VERSION } from './constants';
import { Post, Story, Destination, User, EcuadorRegion, Suggestion, Chat, Notification, Challenge, TravelGroup } from './types';
import { StorageService } from './services/storageService';
import { AuthService } from './services/authService';
import { resizeImage, isAdmin, getUserLevel, getNextLevel, BADGES, POINT_VALUES, getDailyChallenge, calculateDistance } from './utils';
import { findNearbyPlaces } from './services/geminiService';
import { db } from './services/firebase';
import { ref, onValue } from 'firebase/database';
import { Helmet } from 'react-helmet-async';

type Tab = 'home' | 'explore' | 'search' | 'profile';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [destinations, setDestinations] = useState<Destination[]>(STATIC_DESTINATIONS);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [travelGroups, setTravelGroups] = useState<TravelGroup[]>([]);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  
  // LOCATION & NEARBY
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);

  // SOCIAL STATES
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [followListType, setFollowListType] = useState<'followers' | 'following' | null>(null);
  const [profileSubTab, setProfileSubTab] = useState<'posts' | 'contributions' | 'badges' | 'map' | 'groups'>('posts');

  // CHALLENGE STATE
  const [dailyChallenge, setDailyChallenge] = useState<Challenge | null>(null);
  const [activeChallengeId, setActiveChallengeId] = useState<string | null>(null); 

  // NEARBY FEATURE
  const [isNearbyModalOpen, setIsNearbyModalOpen] = useState(false);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [nearbyData, setNearbyData] = useState<{text: string, places: any[]} | null>(null);

  // EXTERNAL SEARCH STATE (Search Tab)
  const [externalSearchResults, setExternalSearchResults] = useState<any[]>([]);
  const [isSearchingExternal, setIsSearchingExternal] = useState(false);

  // PERSISTENCIA DE PESTAÑA: Inicializar leyendo localStorage
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('current_tab');
      if (saved === 'home' || saved === 'explore' || saved === 'search' || saved === 'profile') {
        return saved;
      }
    }
    return 'home';
  });

  // Guardar pestaña al cambiar
  useEffect(() => {
    if (activeTab) {
      localStorage.setItem('current_tab', activeTab);
    }
  }, [activeTab]);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAddDestinationModalOpen, setIsAddDestinationModalOpen] = useState(false);
  const [isSuggestionsModalOpen, setIsSuggestionsModalOpen] = useState(false);
  const [isAdminUsersModalOpen, setIsAdminUsersModalOpen] = useState(false);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isWhatsNewOpen, setIsWhatsNewOpen] = useState(false);
  const [isItineraryModalOpen, setIsItineraryModalOpen] = useState(false);
  const [isTravelGroupsOpen, setIsTravelGroupsOpen] = useState(false); 
  const [initialChatId, setInitialChatId] = useState<string | null>(null);
  const [initialGroupId, setInitialGroupId] = useState<string | null>(null);
  
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

  const getPageTitle = () => {
      switch(activeTab) {
          case 'home': return 'Inicio | Ecuador Travel';
          case 'explore': return 'Explora Destinos | Ecuador Travel';
          case 'search': return 'Buscar | Ecuador Travel';
          case 'profile': return 'Mi Perfil | Ecuador Travel';
          default: return 'Ecuador Travel';
      }
  };

  // --- HISTORY MANAGEMENT ---
  const pushHistory = (state: any) => {
    window.history.pushState(state, '');
  };

  useEffect(() => {
    window.history.replaceState({ type: 'tab', tab: activeTab }, '');

    const handlePopState = (event: PopStateEvent) => {
      const state = event.state;
      if (isCreateModalOpen) setIsCreateModalOpen(false);
      else if (isAddDestinationModalOpen) setIsAddDestinationModalOpen(false);
      else if (isSuggestionsModalOpen) setIsSuggestionsModalOpen(false);
      else if (isAdminUsersModalOpen) setIsAdminUsersModalOpen(false);
      else if (isChatModalOpen) setIsChatModalOpen(false);
      else if (isNotificationsOpen) setIsNotificationsOpen(false);
      else if (isItineraryModalOpen) setIsItineraryModalOpen(false);
      else if (isTravelGroupsOpen) setIsTravelGroupsOpen(false); 
      else if (isNearbyModalOpen) setIsNearbyModalOpen(false);
      else if (isWhatsNewOpen) setIsWhatsNewOpen(false);
      else if (followListType) setFollowListType(null);
      else if (viewingPost) setViewingPost(null);
      else if (viewingStoryIndex !== null) setViewingStoryIndex(null);
      else if (selectedDestination) setSelectedDestination(null);
      else if (viewingProfileImage) setViewingProfileImage(null);
      else if (editingPost) setEditingPost(null);
      else if (editingStory) setEditingStory(null);
      else if (chatOpen) setChatOpen(false);
      else if (viewingProfileId) setViewingProfileId(null);
      else if (isOnboardingOpen) setIsOnboardingOpen(false);
      else if (state && state.type === 'tab') {
         setActiveTab(state.tab);
      } else {
         setActiveTab('home');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [
    isCreateModalOpen, isAddDestinationModalOpen, isSuggestionsModalOpen, isAdminUsersModalOpen, isChatModalOpen, isNotificationsOpen, isItineraryModalOpen, isNearbyModalOpen, isWhatsNewOpen, isTravelGroupsOpen, followListType, viewingPost, viewingStoryIndex, 
    selectedDestination, viewingProfileImage, editingPost, editingStory, chatOpen, viewingProfileId, isOnboardingOpen
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

  const handleTutorialClose = () => {
    setIsOnboardingOpen(false);
    if (user) {
        localStorage.setItem(`tutorial_seen_${user.id}`, 'true');
    }
  };

  const handleWhatsNewClose = () => {
    setIsWhatsNewOpen(false);
    localStorage.setItem('app_version', APP_VERSION);
  };

  // CHECK DAILY LOGIN AND SESSION AND CHALLENGE
  useEffect(() => {
    const session = AuthService.getSession();
    if (session) {
      setUser(session);
      
      const hasSeenTutorial = localStorage.getItem(`tutorial_seen_${session.id}`);
      const lastVersion = localStorage.getItem('app_version');
      
      if (!hasSeenTutorial) {
          setTimeout(() => setIsOnboardingOpen(true), 1000);
      } else if (lastVersion !== APP_VERSION) {
          setTimeout(() => setIsWhatsNewOpen(true), 1500);
      }

      StorageService.checkDailyLogin(session.id).then(received => {
         if (received) console.log("Daily Login Points Awarded!");
      });
      setDailyChallenge(getDailyChallenge());

      if (navigator.geolocation) {
         navigator.geolocation.getCurrentPosition(
            (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            (err) => console.log("Ubicación no disponible para ordenar destinos", err)
         );
      }
    }
  }, []);

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

  const performNearbySearch = async (query: string) => {
      // Si no hay ubicación, usamos el centro de Ecuador o Quito como fallback
      // para permitir búsquedas genéricas de lugares.
      const searchLat = userLocation?.lat || -1.8312; // Default lat
      const searchLng = userLocation?.lng || -78.1834; // Default lng

      setIsSearchingExternal(true);
      setExternalSearchResults([]);
      try {
          const result = await findNearbyPlaces(searchLat, searchLng, query);
          setExternalSearchResults(result.places || []);
      } catch (error) {
          console.error("Error searching external", error);
      } finally {
          setIsSearchingExternal(false);
      }
  };

  const handleQuickSearch = (term: string) => {
      setSearchQuery(term);
      if (activeTab !== 'search') {
          navigateToTab('search');
      }
      performNearbySearch(term);
  };

  const handleNearbySearch = () => {
    if (!navigator.geolocation) {
        alert("Tu navegador no soporta geolocalización.");
        return;
    }
    
    openModal(setIsNearbyModalOpen);
    setNearbyLoading(true);
    setNearbyData(null);

    navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        
        // 1. Buscar destinos internos cercanos primero
        // AUMENTADO EL RADIO A 150KM para asegurar resultados si está lejos
        const internalNearby = destinations
            .filter(d => d.coordinates)
            .map(d => {
                const dist = calculateDistance(latitude, longitude, d.coordinates!.latitude, d.coordinates!.longitude);
                return { ...d, dist };
            })
            .filter(d => d.dist <= 150) 
            .sort((a, b) => a.dist - b.dist)
            .map(d => ({
                name: d.name,
                category: 'TURISMO',
                isOpen: true, 
                rating: d.rating,
                address: d.location,
                description: `A ${d.dist.toFixed(1)} km - ${d.category}`,
                mapLink: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(d.name + " " + d.location)}`,
                isInternal: true 
            }));

        try {
            // 2. Buscar lugares externos con IA
            const aiResult = await findNearbyPlaces(latitude, longitude);
            
            // 3. Fusionar resultados (Internos primero)
            const combinedPlaces = [...internalNearby, ...(aiResult.places || [])];
            
            // Si después de todo no hay nada, mostrar mensaje pero mantener el modal
            if (combinedPlaces.length === 0) {
                 setNearbyData({ 
                    text: "No se encontraron lugares en este momento. Intenta buscar por categoría específica.", 
                    places: [] 
                });
            } else {
                setNearbyData({ 
                    text: "Resultados encontrados", 
                    places: combinedPlaces 
                });
            }
        } catch (error: any) {
            // Si falla la IA, al menos mostramos los internos si existen
            setNearbyData({ 
                text: internalNearby.length > 0 ? "Mostrando destinos de la app (Conexión limitada)" : "Error de conexión. Intenta de nuevo.", 
                places: internalNearby 
            });
        } finally {
            setNearbyLoading(false);
        }
    }, (error) => {
        setNearbyLoading(false);
        setNearbyData({ text: "No pudimos obtener tu ubicación. Por favor activa el GPS.", places: [] });
    }, {
        enableHighAccuracy: true
    });
  };

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

    const groupsRef = ref(db, 'travelGroups');
    const unsubscribeGroups = onValue(groupsRef, (snapshot) => {
      const data = snapshot.val();
      const loadedGroups: TravelGroup[] = data ? Object.values(data) : [];
      setTravelGroups(loadedGroups.sort((a, b) => b.createdAt - a.createdAt));
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
                    const unread = messages.filter(m => m.senderId !== user.id && !m.isRead).length;
                    totalUnread += unread;
                }
            });
        }
        setUnreadMessagesCount(totalUnread);
    });

    let unsubscribeNotifs = () => {};
    if (user) {
        const notifRef = ref(db, `notifications/${user.id}`);
        unsubscribeNotifs = onValue(notifRef, (snapshot) => {
            const data = snapshot.val();
            const loadedNotifs: Notification[] = data ? Object.values(data) : [];
            setNotifications(loadedNotifs.sort((a, b) => b.timestamp - a.timestamp));
        });
    }

    return () => {
      unsubscribePosts();
      unsubscribeStories();
      unsubscribeUsers();
      unsubscribeGroups();
      unsubscribeDestinations();
      unsubscribeSuggestions();
      unsubscribeChats();
      unsubscribeNotifs();
    };
  }, [user?.id]);

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
  
  const handleShare = async (text: string | Post) => { 
      let content = ""; 
      if (typeof text === 'string') { content = text; } 
      else { content = `¡Mira esta foto de ${text.userName} en ${text.location || 'Ecuador'}! 🌴`; } 
      
      alert(`Compartiendo: "${content}"\n\n(Enlace copiado al portapapeles)`); 
      
      if(user) await StorageService.awardPoints(user.id, POINT_VALUES.SHARE, 'share');
  };

  const handleCreateContent = async (image: string, caption: string, location: string, type: 'post' | 'story', mediaType: 'image' | 'video') => { 
    if (!user) return; 
    
    if (activeChallengeId && type === 'post') {
        const challenge = dailyChallenge;
        if (challenge && challenge.id === activeChallengeId && challenge.type === 'photo') {
             await StorageService.completeChallenge(user.id, challenge.id, challenge.points);
             setActiveChallengeId(null);
        }
    }

    if (type === 'post') { 
        const newPost: Post = { id: Date.now().toString(), userId: user.id, userName: user.name, userAvatar: user.avatar, location, imageUrl: image, mediaType: mediaType, caption, likes: 0, comments: [], timestamp: Date.now(), isLiked: false }; 
        await StorageService.savePost(newPost); 
    } else { 
        const newStory: Story = { id: `s_${Date.now()}`, userId: user.id, userName: user.name, userAvatar: user.avatar, imageUrl: image, mediaType: mediaType, timestamp: Date.now(), isViewed: false, caption: caption, location: location, likes: 0, isLiked: false }; 
        await StorageService.saveStory(newStory); 
    } 
    setActiveTab('home'); 
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
  };
  
  const handleAddDestination = async (data: any) => { if (!user) return; const newId = `ud_${Date.now()}`; const destination: Destination = { ...data, id: newId, isUserGenerated: true, createdBy: user.id, rating: 5, reviewsCount: 1, ratings: { [user.id]: 5 } }; await StorageService.addDestination(destination); };
  const handleRateDestination = async (rating: number) => { if (!selectedDestination || !user) return; if (selectedDestination.ratings && selectedDestination.ratings[user.id]) { alert("Ya has calificado este lugar."); return; } await StorageService.rateDestination( selectedDestination.id, user.id, rating, selectedDestination.rating || 5, selectedDestination.reviewsCount || 0 ); };
  
  const handleAddPhotoToDestination = async (image: string) => { 
      if (!selectedDestination || !user) return; 
      
      // Actualización Optimista: Actualizar UI inmediatamente
      const newGallery = [image, ...(selectedDestination.gallery || [])];
      const updatedDest = { ...selectedDestination, gallery: newGallery };
      
      setSelectedDestination(updatedDest);
      setDestinations(prev => prev.map(d => d.id === updatedDest.id ? updatedDest : d));

      // Guardar en Backend
      await StorageService.addPhotoToDestinationGallery(
          selectedDestination.id,
          selectedDestination.gallery,
          image,
          user.id
      ); 
  };
  
  const handleChangeDestinationCover = async (image: string) => { if (!selectedDestination || !user) return; await StorageService.updateDestinationCover(selectedDestination.id, image); };
  
  const handleDeleteDestinationPhoto = async (photoUrl: string) => { 
      if (!selectedDestination || !user) return; 
      if (confirm("¿Eliminar esta foto de la galería?")) { 
          // Actualización Optimista para eliminar
          const newGallery = (selectedDestination.gallery || []).filter(img => img !== photoUrl);
          const updatedDest = { ...selectedDestination, gallery: newGallery };
          
          setSelectedDestination(updatedDest);
          setDestinations(prev => prev.map(d => d.id === updatedDest.id ? updatedDest : d));

          await StorageService.removeDestinationPhoto( selectedDestination.id, selectedDestination.gallery, photoUrl ); 
      } 
  };
  
  const handleDeleteDestination = async (id: string) => { await StorageService.deleteDestination(id); setSelectedDestination(null); };

  const handleToggleFeatured = async (id: string, isFeatured: boolean) => {
      if (isFeatured) {
          const currentlyFeatured = destinations.filter(d => d.isFeatured);
          for (const d of currentlyFeatured) {
              if (d.id !== id) await StorageService.updateDestinationStatus(d.id, { isFeatured: false });
          }
      }
      await StorageService.updateDestinationStatus(id, { isFeatured });
      if (selectedDestination && selectedDestination.id === id) {
          setSelectedDestination({ ...selectedDestination, isFeatured });
      }
  };

  const handleEditPost = (post: Post) => openDetail(setEditingPost, post);
  const handleUpdatePost = async (id: string, caption: string, location: string) => { await StorageService.updatePost(id, { caption, location }); if (viewingPost && viewingPost.id === id) setViewingPost(prev => prev ? { ...prev, caption, location } : null); };
  const handleDeletePost = async (id: string) => { if (confirm("¿Estás seguro?")) { await StorageService.deletePost(id); if (viewingPost && viewingPost.id === id) setViewingPost(null); } };
  const handleEditStory = (story: Story) => { setViewingStoryIndex(null); openDetail(setEditingStory, story); };
  const handleUpdateStory = async (id: string, caption: string, location: string) => { await StorageService.updateStory(id, { caption, location }); };
  const handleDeleteStory = async (id: string) => await StorageService.deleteStory(id);
  const handleMarkStoryViewed = (id: string) => { if (user) { StorageService.markStoryViewed(id, user); setStories(stories.map(s => s.id === id ? { ...s, isViewed: true } : s)); } };
  
  const handleOpenGuide = (destinationName: string) => { 
      const dest = destinations.find(d => d.name === destinationName) || destinations.find(d => d.name.includes(destinationName));
      if (dest) openDetail(setSelectedDestination, dest); 
  };
  
  // CHALLENGE HANDLERS
  const handleParticipateChallenge = (challenge: Challenge) => {
    setActiveChallengeId(challenge.id);
    if (challenge.type === 'photo') {
        setIsCreateModalOpen(true);
    } 
  };

  const handleTriviaAnswer = (challenge: Challenge, answerIdx: number) => {
    if (challenge.correctAnswer === answerIdx) {
        if (user) StorageService.completeChallenge(user.id, challenge.id, challenge.points);
        return true;
    }
    return false;
  };

  const handleOpenGroup = (groupId: string) => {
    setInitialGroupId(groupId);
    openModal(setIsTravelGroupsOpen);
  };

  const handleAskAIFromGuide = (query: string) => { setChatQuery(query); openModal(setChatOpen); };
  const handleUserClick = (userId: string) => { setViewingProfileId(userId); setActiveTab('profile'); window.scrollTo({ top: 0, behavior: 'smooth' }); pushHistory({ type: 'profile', id: userId }); };
  const handleViewPost = (post: Post) => openDetail(setViewingPost, post);
  const handleFollowToggle = async (targetUserId: string) => { if (!user) return; await AuthService.toggleFollow(user.id, targetUserId); };
  const handleProfileImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => { if (!user || !e.target.files?.[0]) return; try { const newAvatar = await resizeImage(e.target.files[0], 500); await AuthService.updateUserAvatar(user.id, newAvatar); } catch (err) { console.error(err); } };
  const handleUpdateName = async () => { if(user && newName.trim()) { await AuthService.updateUserName(user.id, newName); setIsEditingName(false); } };
  const openStories = (idx: number, storyList: Story[]) => { setViewingStoryList(storyList); setViewingStoryIndex(idx); pushHistory({ type: 'story' }); };
  
  const activeStories = (stories || []).filter(story => (Date.now() - story.timestamp) < 24 * 60 * 60 * 1000);
  const unreadNotifsCount = notifications.filter(n => !n.isRead).length;

  const normalizeText = (text: string | undefined | null) => { return (text || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); };
  const normalizedQuery = normalizeText(searchQuery).trim();
  
  const filteredPosts = (posts || []).filter(post => normalizeText(post.location).includes(normalizedQuery) || normalizeText(post.caption).includes(normalizedQuery) || normalizeText(post.userName).includes(normalizedQuery));
  const searchDestinations = (destinations || []).filter(dest => normalizeText(dest.name).includes(normalizedQuery) || normalizeText(dest.location).includes(normalizedQuery) || normalizeText(dest.category).includes(normalizedQuery));
  const filteredUsers = (allUsers || []).filter(u => normalizeText(u.name).includes(normalizedQuery) || normalizeText(u.bio).includes(normalizedQuery));
  const searchGroups = (travelGroups || []).filter(g => (normalizeText(g.name).includes(normalizedQuery) || normalizeText(g.description).includes(normalizedQuery)) && (!g.isPrivate || (g.members && g.members[user?.id || ''])));
  
  const isAdminUser = user ? isAdmin(user.email) : false;
  const featuredDestination = destinations.find(d => d.isFeatured) || (destinations.length > 0 ? destinations[0] : null);

  // Unread Suggestions Count (Admin Only)
  const unreadSuggestionsCount = suggestions.filter(s => !s.isRead).length;

  if (!user) return <AuthScreen onLoginSuccess={setUser} />;

  const getProvincesForRegion = (region: EcuadorRegion | 'Todas') => {
    if (region === 'Todas') return [];
    const destsInRegion = (destinations || []).filter(d => d.region === region);
    const provinces = new Set(destsInRegion.map(d => d.province || ''));
    return Array.from(provinces).filter(p => p !== '');
  };

  const filteredExploreDestinations = (destinations || []).filter(dest => {
    if (selectedRegion !== 'Todas' && dest.region !== selectedRegion) return false;
    if (selectedProvince !== 'Todas' && dest.province !== selectedProvince) return false;
    return true;
  });

  const availableProvinces = getProvincesForRegion(selectedRegion);

  const getRecommendedDestinations = () => {
      if (userLocation) {
          return [...destinations]
              .sort((a, b) => {
                  const distA = a.coordinates 
                    ? calculateDistance(userLocation.lat, userLocation.lng, a.coordinates.latitude, a.coordinates.longitude)
                    : 99999;
                  const distB = b.coordinates 
                    ? calculateDistance(userLocation.lat, userLocation.lng, b.coordinates.latitude, b.coordinates.longitude)
                    : 99999;
                  return distA - distB;
              })
              .slice(0, 3);
      }
      return destinations.slice(0, 3);
  };

  const recommendedDestinations = getRecommendedDestinations();

  return (
    <div className="min-h-screen bg-stone-50 pb-20 md:pb-24 font-sans">
      
      <Helmet>
        <title>{getPageTitle()}</title>
        <meta name="description" content="Descubre Ecuador con nuestra guía turística inteligente." />
      </Helmet>

      {/* TOP NAVBAR */}
      <nav className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-stone-200 px-4 py-3 shadow-sm">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigateToTab('home')}>
            <span className="text-2xl font-black text-cyan-700 tracking-tight">ECUADOR</span>
            <span className="text-2xl font-light text-stone-600">TRAVEL</span>
          </div>
          
          <div className="hidden md:flex flex-1 max-w-md mx-8 relative">
            <input 
                type="text" 
                placeholder="Buscar lugares, personas, comida..." 
                className="w-full bg-stone-100 border-transparent focus:bg-white border focus:border-cyan-300 rounded-full py-2 pl-10 pr-4 outline-none transition-all text-sm" 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                onKeyDown={(e) => {
                    if (e.key === 'Enter') handleQuickSearch(searchQuery);
                }}
            />
            <Search className="absolute left-3 top-2.5 text-stone-400" size={16} />
          </div>

          <div className="hidden md:flex space-x-6 text-stone-500 font-medium items-center">
             <button onClick={() => navigateToTab('home')} className={`hover:text-cyan-700 transition-colors ${activeTab === 'home' ? 'text-cyan-700' : ''}`}><MapIcon size={24} /></button>
             <button onClick={() => navigateToTab('explore')} className={`hover:text-cyan-700 transition-colors ${activeTab === 'explore' ? 'text-cyan-700' : ''}`}><Compass size={24} /></button>
             <button onClick={() => handleOpenChat()} className="hover:text-cyan-700 transition-colors relative">
                <MessageCircle size={24} />
                {unreadMessagesCount > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold border-2 border-white">{unreadMessagesCount}</span>}
             </button>
             <button onClick={() => openModal(setIsNotificationsOpen)} className="hover:text-cyan-700 transition-colors relative">
                <Bell size={24} />
                {unreadNotifsCount > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold border-2 border-white">{unreadNotifsCount}</span>}
             </button>
             {isAdminUser && (
                <>
                   <button onClick={() => openModal(setIsAdminUsersModalOpen)} className="hover:text-cyan-700 transition-colors"><Users size={24} /></button>
               </>
             )}
             <button onClick={() => openModal(setIsSuggestionsModalOpen)} className="relative hover:text-cyan-700 transition-colors">
                 <Lightbulb size={24} />
                 {isAdminUser && unreadSuggestionsCount > 0 && (
                     <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold border-2 border-white">
                         {unreadSuggestionsCount}
                     </span>
                 )}
             </button>
             <button onClick={() => openModal(setIsCreateModalOpen)} className="flex items-center gap-2 bg-cyan-600 text-white px-4 py-2 rounded-full hover:bg-cyan-700 transition-colors shadow-md hover:shadow-lg font-semibold text-sm"> <Camera size={18} /> <span>Publicar</span> </button>
             <button onClick={() => { navigateToTab('profile'); }} className={`rounded-full overflow-hidden ring-2 ring-transparent hover:ring-cyan-400 transition-all ${activeTab === 'profile' && !viewingProfileId ? 'ring-cyan-600' : ''}`}> <img src={user.avatar} alt="Profile" className="w-9 h-9 object-cover" /> </button>
          </div>

          <div className="flex md:hidden items-center gap-4 text-stone-600">
             {isAdminUser && (
                 <>
                    <button onClick={() => openModal(setIsAdminUsersModalOpen)} className="text-cyan-600"><Users size={22} /></button>
                 </>
             )}
             <button onClick={() => openModal(setIsSuggestionsModalOpen)} className="text-cyan-600 relative">
                 <Lightbulb size={22} />
                 {isAdminUser && unreadSuggestionsCount > 0 && (
                     <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-3 h-3 rounded-full border border-white"></span>
                 )}
             </button>
             <button onClick={() => handleOpenChat()} className="relative">
                <MessageCircle size={24} />
                {unreadMessagesCount > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-3 h-3 rounded-full border border-white"></span>}
             </button>
             <button onClick={() => openModal(setIsNotificationsOpen)} className="relative">
                <Bell size={24} />
                {unreadNotifsCount > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-3 h-3 rounded-full border border-white"></span>}
             </button>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto pt-4 px-4 md:px-0">
        
        <OnboardingModal isOpen={isOnboardingOpen} onClose={handleTutorialClose} userName={user.name} />
        <WhatsNewModal isOpen={isWhatsNewOpen} onClose={handleWhatsNewClose} />
        <NotificationsModal isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} notifications={notifications} currentUserId={user.id} />
        <SuggestionsModal isOpen={isSuggestionsModalOpen} onClose={() => setIsSuggestionsModalOpen(false)} currentUser={user} isAdmin={isAdminUser} suggestions={suggestions} />
        <AdminUsersModal isOpen={isAdminUsersModalOpen} onClose={() => setIsAdminUsersModalOpen(false)} users={allUsers} />
        <ChatModal isOpen={isChatModalOpen} onClose={() => setIsChatModalOpen(false)} currentUser={user} allUsers={allUsers} initialChatId={initialChatId} />
        <ItineraryGeneratorModal isOpen={isItineraryModalOpen} onClose={() => setIsItineraryModalOpen(false)} />
        <NearbyModal isOpen={isNearbyModalOpen} onClose={() => setIsNearbyModalOpen(false)} isLoading={nearbyLoading} data={nearbyData} />
        <TravelGroupsModal isOpen={isTravelGroupsOpen} onClose={() => setIsTravelGroupsOpen(false)} currentUser={user} allUsers={allUsers} initialGroupId={initialGroupId} />
        
        {followListType && (
            <FollowListModal 
                isOpen={!!followListType}
                onClose={() => setFollowListType(null)}
                title={followListType === 'followers' ? 'Seguidores' : 'Siguiendo'}
                users={allUsers.filter(u => followListType === 'followers' 
                    ? (viewingProfileId ? allUsers.find(target=>target.id===viewingProfileId)?.followers : user.followers)?.includes(u.id)
                    : (viewingProfileId ? allUsers.find(target=>target.id===viewingProfileId)?.following : user.following)?.includes(u.id)
                )}
                onUserClick={handleUserClick}
            />
        )}
        
        {/* CONTENIDO PRINCIPAL */}
        {activeTab === 'home' && (
            <div>
               <div className="mb-6 flex space-x-3 overflow-x-auto no-scrollbar pb-4 pt-2">
                   <div className="relative w-20 h-32 md:w-24 md:h-40 shrink-0 rounded-xl overflow-hidden cursor-pointer group shadow-sm transition-transform active:scale-95" onClick={() => openModal(setIsCreateModalOpen)}>
                     <img src={user.avatar} alt="You" className="w-full h-full object-cover opacity-60" />
                     <div className="absolute inset-0 bg-stone-900/20" />
                     <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-white text-cyan-600 rounded-full p-1"><Plus size={16} strokeWidth={3} /></div>
                     <div className="absolute bottom-8 md:bottom-9 left-0 w-full text-center text-white text-[10px] font-bold">Crear</div>
                   </div>
                   {activeStories.map((story, idx) => (
                      <div key={story.id} className={`relative w-20 h-32 md:w-24 md:h-40 shrink-0 rounded-xl overflow-hidden cursor-pointer ring-2 ${story.isViewed ? 'ring-stone-200' : 'ring-cyan-500'}`} onClick={() => openStories(idx, activeStories)}>
                         <img src={story.imageUrl} className="w-full h-full object-cover" />
                         <span className="absolute bottom-2 left-2 text-white text-[10px] font-bold truncate w-16">{story.userName}</span>
                      </div>
                   ))}
               </div>
               
               <div className="grid md:grid-cols-3 gap-8">
                  <div className="md:col-span-2 space-y-6">
                     
                     {/* CHALLENGE CARD */}
                     {dailyChallenge && !searchQuery && (
                         <ChallengeCard 
                            challenge={dailyChallenge}
                            isCompleted={!!(user.completedChallenges && user.completedChallenges[dailyChallenge.id])}
                            onParticipate={handleParticipateChallenge}
                            onTriviaAnswer={handleTriviaAnswer}
                         />
                     )}

                     {!searchQuery && (
                        <HeroSection 
                            destination={featuredDestination}
                            onGuideClick={(name) => handleOpenGuide(name)} 
                        />
                     )}
                     
                     {filteredPosts.length > 0 ? (
                        filteredPosts.map(post => <PostCard key={post.id} post={post} currentUserId={user.id} onLike={handleLike} onComment={handleComment} onShare={handleShare} onUserClick={handleUserClick} onImageClick={handleViewPost} onEdit={handleEditPost} onDelete={handleDeletePost} />)
                     ) : (
                        <div className="text-center py-20 text-stone-400 bg-white rounded-3xl border border-stone-100"> 
                           <Camera size={48} className="mx-auto text-stone-300 mb-4" />
                           <h3 className="font-bold text-lg text-stone-500">No hay publicaciones</h3>
                           <p className="text-sm">¡Sé el primero en compartir algo!</p>
                        </div>
                     )}
                  </div>
                  
                  <div className="hidden md:block col-span-1 space-y-6">
                     <div className="sticky top-24">
                        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-5 mb-6">
                           <h3 className="font-bold text-stone-800 mb-3 text-sm uppercase flex items-center gap-2">
                              {userLocation ? <MapIcon size={16} className="text-emerald-600" /> : <Compass size={16} className="text-cyan-600" />}
                              {userLocation ? 'Lugares Cerca de Ti' : 'Lugares Recomendados'}
                           </h3>
                           <div className="space-y-3">
                              {recommendedDestinations.map(d => (
                                 <div key={d.id} onClick={() => handleOpenGuide(d.name)} className="flex items-center gap-3 p-2 hover:bg-stone-50 rounded-xl cursor-pointer transition-colors">
                                    <img src={d.imageUrl} className="w-12 h-12 rounded-lg object-cover" />
                                    <div className="flex-1 min-w-0">
                                       <p className="font-bold text-xs text-stone-800 truncate">{d.name}</p>
                                       <p className="text-[10px] text-stone-400 truncate">{d.location}</p>
                                       {userLocation && d.coordinates && (
                                           <span className="text-[9px] text-emerald-600 font-bold block mt-0.5">
                                               A {calculateDistance(userLocation.lat, userLocation.lng, d.coordinates.latitude, d.coordinates.longitude).toFixed(1)} km
                                           </span>
                                       )}
                                    </div>
                                 </div>
                              ))}
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
        )}

        {/* --- EXPLORE TAB --- */}
        {activeTab === 'explore' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
                <div className="md:col-span-2 flex flex-col gap-4 mb-4 sticky top-[60px] md:top-[76px] z-20 bg-stone-50/95 backdrop-blur-md py-4 -mx-4 px-4 md:mx-0 md:px-0 border-b border-stone-200/50 shadow-sm transition-all">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-stone-800 flex items-center gap-2"> <Globe size={24} className="text-cyan-600" /> Explora Ecuador </h2>
                        <div className="flex gap-2 flex-wrap justify-end">
                          <button onClick={handleNearbySearch} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 px-3 rounded-full flex items-center gap-2 shadow-md transition-colors w-fit animate-in fade-in slide-in-from-right-2">
                              <Navigation size={16} /> ¿Qué hay cerca?
                          </button>
                          <button onClick={() => openModal(setIsItineraryModalOpen)} className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold py-2 px-3 rounded-full flex items-center gap-2 shadow-md transition-colors w-fit animate-in fade-in slide-in-from-right-4">
                              <Sparkles size={16} /> Planificar Viaje
                          </button>
                          <button onClick={() => openModal(setIsAddDestinationModalOpen)} className="bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold py-2 px-3 rounded-full flex items-center gap-2 shadow-md transition-colors w-fit"> <PlusCircle size={16} /> Agregar Destino </button>
                        </div>
                    </div>
                    <div className="flex space-x-2 overflow-x-auto no-scrollbar pb-2">
                        {(['Todas', 'Costa', 'Sierra', 'Amazonía', 'Insular'] as const).map(region => (
                        <button key={region} onClick={() => { setSelectedRegion(region); setSelectedProvince('Todas'); }} className={`px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${selectedRegion === region ? 'bg-cyan-600 text-white shadow-md' : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'}`}> {region} </button>
                        ))}
                    </div>
                    {selectedRegion !== 'Todas' && (availableProvinces || []).length > 0 && (
                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                            <Filter size={16} className="text-stone-400" />
                            <select value={selectedProvince} onChange={(e) => setSelectedProvince(e.target.value)} className="bg-white border border-stone-200 text-stone-700 text-sm rounded-lg p-2 focus:ring-2 focus:ring-cyan-500 outline-none"> <option value="Todas">Todas las provincias</option> {availableProvinces.map(prov => ( <option key={prov} value={prov}>{prov}</option> ))} </select>
                        </div>
                    )}
                </div>

                {(filteredExploreDestinations || []).length > 0 ? (
                    filteredExploreDestinations.map(d => <DestinationCard key={d.id} destination={d} onClickGuide={handleOpenGuide} />)
                ) : (
                    <div className="md:col-span-2 text-center py-20 bg-white rounded-3xl border border-stone-100">
                        <Compass size={48} className="mx-auto text-stone-300 mb-4" />
                        <h3 className="text-lg font-bold text-stone-600">No hay destinos aquí aún</h3>
                        <p className="text-stone-400">Intenta cambiar los filtros.</p>
                    </div>
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
                const isFollowing = (user.following || []).includes(targetUser!.id);
                const userContributions = destinations.filter(d => d.createdBy === targetUser!.id);
                
                // Grupos creados por el usuario
                const userCreatedGroups = travelGroups.filter(g => g.adminId === targetUser!.id);
                // Si visito perfil ajeno, solo veo los grupos PÚBLICOS
                const visibleGroups = isMe 
                    ? userCreatedGroups 
                    : userCreatedGroups.filter(g => !g.isPrivate);

                const totalPoints = targetUser.points || 0;
                const currentLevel = getUserLevel(totalPoints);
                const nextLevel = getNextLevel(totalPoints);
                const progressPercent = nextLevel 
                  ? ((totalPoints - currentLevel.minPoints) / (nextLevel.minPoints - currentLevel.minPoints)) * 100 
                  : 100;
                
                const userBadges = targetUser.badges || [];

                return (
                  <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-stone-100 min-h-[500px] pb-20">
                    <div className="h-32 bg-gradient-to-r from-cyan-500 to-blue-600 relative">
                       {!isMe && <button onClick={() => { setViewingProfileId(null); setActiveTab('home'); }} className="absolute top-4 left-4 bg-white/20 p-2 rounded-full text-white"> <ChevronLeft size={24} /> </button>}
                    </div>
                    <div className="px-6 pb-6 relative">
                      <div className="flex justify-between items-end -mt-12 mb-4">
                        <div className="w-24 h-24 rounded-full border-4 border-white shadow-md bg-white relative overflow-hidden" onClick={() => openDetail(setViewingProfileImage, targetUser!.avatar)}>
                          <img src={targetUser!.avatar} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex gap-2 mb-1">
                           {isMe ? (
                             <>
                                <button onClick={() => profileInputRef.current?.click()} className="text-xs text-cyan-700 bg-cyan-50 px-3 py-1.5 rounded-full font-bold"> <Camera size={14} className="mr-1 inline" /> Foto </button>
                                <input type="file" ref={profileInputRef} hidden accept="image/*" onChange={handleProfileImageChange} />
                                <button onClick={handleLogout} className="text-xs text-stone-600 bg-stone-100 px-3 py-1.5 rounded-full font-bold"><LogOut size={12} className="mr-1 inline" /> Salir</button>
                             </>
                           ) : (
                             <button onClick={() => handleFollowToggle(targetUser!.id)} className={`px-4 py-1.5 rounded-full font-bold text-xs ${isFollowing ? 'bg-stone-100' : 'bg-cyan-600 text-white'}`}> {isFollowing ? 'Siguiendo' : 'Seguir'} </button>
                           )}
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <h2 className="text-2xl font-bold text-stone-800 flex items-center gap-2">
                            {targetUser!.name} 
                            {isMe && <Edit3 size={16} className="text-stone-400 cursor-pointer" onClick={() => { setIsEditingName(true); setNewName(user.name); }} />}
                        </h2>
                        {isMe && isEditingName && (
                            <div className="flex gap-2 my-2">
                                <input className="border rounded px-2 py-1 text-sm" value={newName} onChange={e => setNewName(e.target.value)} />
                                <button onClick={handleUpdateName} className="text-green-600 text-xs font-bold">OK</button>
                            </div>
                        )}
                        <p className="text-stone-500 mb-2">{targetUser!.bio}</p>

                        <div className="bg-stone-50 rounded-xl p-3 border border-stone-100 mb-2">
                            <div className="flex justify-between items-center mb-1">
                                <span className={`text-xs font-black uppercase tracking-wider flex items-center gap-1 ${currentLevel.color}`}>
                                    {currentLevel.icon} {currentLevel.name}
                                </span>
                                <span className="text-[10px] text-stone-400 font-bold">{totalPoints} XP</span>
                            </div>
                            <div className="h-2 w-full bg-stone-200 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-cyan-400 to-blue-500" style={{ width: `${progressPercent}%` }}></div>
                            </div>
                            {nextLevel ? (
                                <p className="text-[10px] text-stone-400 mt-1 text-right">
                                    Faltan {nextLevel.minPoints - totalPoints} XP para {nextLevel.name}
                                </p>
                            ) : (
                                <p className="text-[10px] text-amber-500 mt-1 text-right font-bold">¡Nivel Máximo!</p>
                            )}
                        </div>

                        {/* Botón para abrir modal de gestión de grupos */}
                        {isMe && (
                             <button 
                                onClick={() => openModal(setIsTravelGroupsOpen)}
                                className="w-full mt-3 bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-colors animate-in fade-in slide-in-from-top-2"
                             >
                                <Users size={18} /> Mis Grupos de Viaje
                             </button>
                        )}
                      </div>
                      
                      <div className="flex gap-6 mb-6 border-y border-stone-100 py-4 text-center">
                        <div><div className="font-bold text-lg">{userPosts.length}</div><div className="text-xs text-stone-400">Posts</div></div>
                        <div onClick={() => { setFollowListType('followers'); openModal(() => {}); }} className="cursor-pointer hover:opacity-70"><div className="font-bold text-lg">{(targetUser!.followers || []).length}</div><div className="text-xs text-stone-400">Seguidores</div></div>
                        <div onClick={() => { setFollowListType('following'); openModal(() => {}); }} className="cursor-pointer hover:opacity-70"><div className="font-bold text-lg">{(targetUser!.following || []).length}</div><div className="text-xs text-stone-400">Siguiendo</div></div>
                      </div>
                      
                      <div className="flex gap-4 border-b border-stone-100 mb-4 overflow-x-auto no-scrollbar">
                          <button 
                            onClick={() => setProfileSubTab('posts')}
                            className={`pb-2 text-sm font-bold flex items-center gap-2 whitespace-nowrap ${profileSubTab === 'posts' ? 'border-b-2 border-cyan-600 text-cyan-700' : 'text-stone-400'}`}
                          >
                              <LayoutGrid size={16} /> Mis Fotos
                          </button>
                          <button 
                            onClick={() => setProfileSubTab('groups')}
                            className={`pb-2 text-sm font-bold flex items-center gap-2 whitespace-nowrap ${profileSubTab === 'groups' ? 'border-b-2 border-cyan-600 text-cyan-700' : 'text-stone-400'}`}
                          >
                              <Users size={16} /> Grupos ({visibleGroups.length})
                          </button>
                          <button 
                            onClick={() => setProfileSubTab('contributions')}
                            className={`pb-2 text-sm font-bold flex items-center gap-2 whitespace-nowrap ${profileSubTab === 'contributions' ? 'border-b-2 border-cyan-600 text-cyan-700' : 'text-stone-400'}`}
                          >
                              <Award size={16} /> Aportes
                          </button>
                          <button 
                            onClick={() => setProfileSubTab('badges')}
                            className={`pb-2 text-sm font-bold flex items-center gap-2 whitespace-nowrap ${profileSubTab === 'badges' ? 'border-b-2 border-cyan-600 text-cyan-700' : 'text-stone-400'}`}
                          >
                              <Trophy size={16} /> Insignias
                          </button>
                          {isMe && (
                            <button 
                                onClick={() => setProfileSubTab('map')}
                                className={`pb-2 text-sm font-bold flex items-center gap-2 whitespace-nowrap ${profileSubTab === 'map' ? 'border-b-2 border-cyan-600 text-cyan-700' : 'text-stone-400'}`}
                            >
                                <MapIcon size={16} /> Mapa de Vida
                            </button>
                          )}
                      </div>
                      
                      {profileSubTab === 'posts' && (
                          <div className="grid grid-cols-3 gap-1">
                            {userPosts.length > 0 ? (
                                userPosts.map(post => (
                                <div key={post.id} className="aspect-square relative cursor-pointer bg-gray-100" onClick={() => handleViewPost(post)}>
                                    {post.mediaType === 'video' ? <video src={post.imageUrl} className="w-full h-full object-cover" /> : <img src={post.imageUrl} className="w-full h-full object-cover" />}
                                </div>
                                ))
                            ) : (
                                <div className="col-span-3 py-10 text-center text-stone-400 text-sm">No hay publicaciones.</div>
                            )}
                          </div>
                      )}

                      {profileSubTab === 'groups' && (
                          <div className="space-y-3">
                              {visibleGroups.length > 0 ? (
                                  visibleGroups.map(group => (
                                      <div key={group.id} onClick={() => handleOpenGroup(group.id)} className="flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-stone-50 bg-white">
                                          <img src={group.imageUrl} className="w-16 h-16 rounded-lg object-cover" />
                                          <div className="flex-1">
                                              <div className="flex justify-between items-start">
                                                 <h4 className="font-bold text-stone-800 text-sm">{group.name}</h4>
                                                 {group.isPrivate && <Lock size={12} className="text-stone-400"/>}
                                              </div>
                                              <p className="text-xs text-stone-500 line-clamp-1">{group.description}</p>
                                              <span className="text-[10px] text-stone-400 font-bold mt-1 block">
                                                  {(group.members ? Object.keys(group.members).length : 0)} miembros
                                              </span>
                                          </div>
                                      </div>
                                  ))
                              ) : (
                                  <div className="py-10 text-center text-stone-400 text-sm bg-stone-50 rounded-xl border border-dashed">
                                      {isMe ? 'No has creado ningún grupo aún.' : 'Este usuario no tiene grupos públicos.'}
                                  </div>
                              )}
                          </div>
                      )}

                      {profileSubTab === 'contributions' && (
                          <div className="space-y-3">
                              {userContributions.length > 0 ? (
                                  userContributions.map(dest => (
                                      <div key={dest.id} onClick={() => handleOpenGuide(dest.name)} className="flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-stone-50">
                                          <img src={dest.imageUrl} className="w-16 h-16 rounded-lg object-cover" />
                                          <div>
                                              <h4 className="font-bold text-stone-800 text-sm">{dest.name}</h4>
                                              <span className="text-xs text-stone-500 flex items-center gap-1"><MapPin size={10} /> {dest.location}</span>
                                          </div>
                                      </div>
                                  ))
                              ) : (
                                  <div className="py-10 text-center text-stone-400 text-sm">
                                      Aún no has agregado destinos turísticos a la guía.
                                  </div>
                              )}
                          </div>
                      )}

                      {profileSubTab === 'badges' && (
                          <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
                             {BADGES.map((badge) => {
                                 const isUnlocked = userBadges.some(b => b.id === badge.id);
                                 return (
                                     <div key={badge.id} className={`flex flex-col items-center text-center p-3 rounded-xl border ${isUnlocked ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-100 opacity-60 grayscale'}`}>
                                         <div className="text-3xl mb-2">{badge.icon}</div>
                                         <h4 className={`text-xs font-bold mb-1 ${isUnlocked ? 'text-gray-800' : 'text-gray-400'}`}>{badge.name}</h4>
                                         <p className="text-[9px] text-gray-500 leading-tight">{badge.description}</p>
                                         {isUnlocked && <CheckCircle className="text-green-500 mt-2" size={12} />}
                                     </div>
                                 );
                             })}
                          </div>
                      )}

                      {profileSubTab === 'map' && (
                          <div className="animate-in fade-in zoom-in duration-300">
                             <div className="bg-cyan-50 p-3 rounded-xl mb-4 text-xs text-cyan-800 flex items-center gap-2 border border-cyan-100">
                                <MapIcon size={16} />
                                <p>Este mapa se genera automáticamente con las ubicaciones de tus fotos.</p>
                             </div>
                             <LifeMap posts={userPosts} />
                          </div>
                      )}

                    </div>
                  </div>
                );
             })()
          )}
          
          {activeTab === 'search' && (
             <div className="space-y-6 pb-20">
                <div className="space-y-3">
                    <div className="relative">
                      <input 
                        type="text" 
                        autoFocus 
                        placeholder="Buscar personas, lugares, hoteles, comida..." 
                        className="w-full p-4 pl-12 rounded-xl shadow-sm border border-stone-200 outline-none focus:ring-2 focus:ring-cyan-500" 
                        value={searchQuery} 
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => {
                            if(e.key === 'Enter') handleQuickSearch(searchQuery);
                        }}
                      />
                      <Search className="absolute left-4 top-4 text-stone-400" size={20} />
                      {searchQuery && (
                          <button onClick={() => handleQuickSearch(searchQuery)} className="absolute right-3 top-2.5 bg-cyan-600 text-white p-1.5 rounded-lg text-xs font-bold shadow-sm hover:bg-cyan-700 transition-colors">
                              Buscar
                          </button>
                      )}
                    </div>

                    {/* Quick Filters / Categorías Cercanas */}
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                        <button onClick={() => handleQuickSearch('Hoteles')} className="flex items-center gap-1.5 px-3 py-2 bg-white border border-stone-200 rounded-full text-xs font-bold text-stone-600 hover:bg-cyan-50 hover:text-cyan-700 hover:border-cyan-200 transition-colors whitespace-nowrap shadow-sm">
                            <Hotel size={14} className="text-indigo-500"/> Hoteles
                        </button>
                        <button onClick={() => handleQuickSearch('Restaurantes')} className="flex items-center gap-1.5 px-3 py-2 bg-white border border-stone-200 rounded-full text-xs font-bold text-stone-600 hover:bg-cyan-50 hover:text-cyan-700 hover:border-cyan-200 transition-colors whitespace-nowrap shadow-sm">
                            <Utensils size={14} className="text-orange-500"/> Restaurantes
                        </button>
                        <button onClick={() => handleQuickSearch('Hospitales')} className="flex items-center gap-1.5 px-3 py-2 bg-white border border-stone-200 rounded-full text-xs font-bold text-stone-600 hover:bg-cyan-50 hover:text-cyan-700 hover:border-cyan-200 transition-colors whitespace-nowrap shadow-sm">
                            <Stethoscope size={14} className="text-red-500"/> Salud
                        </button>
                        <button onClick={() => handleQuickSearch('Tiendas')} className="flex items-center gap-1.5 px-3 py-2 bg-white border border-stone-200 rounded-full text-xs font-bold text-stone-600 hover:bg-cyan-50 hover:text-cyan-700 hover:border-cyan-200 transition-colors whitespace-nowrap shadow-sm">
                            <ShoppingBag size={14} className="text-purple-500"/> Tiendas
                        </button>
                        <button onClick={() => handleQuickSearch('Farmacias')} className="flex items-center gap-1.5 px-3 py-2 bg-white border border-stone-200 rounded-full text-xs font-bold text-stone-600 hover:bg-cyan-50 hover:text-cyan-700 hover:border-cyan-200 transition-colors whitespace-nowrap shadow-sm">
                            <Plus size={14} className="text-green-500"/> Farmacias
                        </button>
                    </div>
                </div>

                {searchQuery ? (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                     
                     {/* External Search Results (Google Maps Grounding) */}
                     {isSearchingExternal ? (
                         <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 text-center">
                             <div className="animate-spin text-cyan-600 mx-auto mb-2 w-fit"><Compass size={24}/></div>
                             <p className="text-stone-500 text-sm font-bold">Buscando "{searchQuery}" en todo Ecuador...</p>
                         </div>
                     ) : externalSearchResults.length > 0 && (
                         <div>
                             <div className="flex items-center justify-between mb-3 px-1">
                                 <h3 className="font-bold text-stone-600 text-sm uppercase flex items-center gap-2">
                                     <MapPin size={16} className="text-emerald-600"/> Resultados de Google Maps
                                 </h3>
                                 <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-bold">Externo</span>
                             </div>
                             <div className="grid gap-3">
                                 {externalSearchResults.map((place, idx) => (
                                     <div key={idx} className="bg-white p-4 rounded-xl border border-stone-100 hover:border-emerald-300 shadow-sm transition-all group relative">
                                         <div className="flex justify-between items-start">
                                             <div>
                                                 <h4 className="font-bold text-stone-800 text-sm group-hover:text-emerald-700">{place.name}</h4>
                                                 <p className="text-xs text-stone-500 mt-1">{place.address}</p>
                                                 <div className="flex items-center gap-2 mt-2">
                                                     {place.isOpen && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold">ABIERTO</span>}
                                                     {place.rating && <span className="text-[10px] flex items-center gap-0.5 font-bold text-amber-500"><Award size={10}/> {place.rating}</span>}
                                                 </div>
                                             </div>
                                             <a href={place.mapLink} target="_blank" rel="noopener noreferrer" className="bg-stone-100 hover:bg-emerald-600 hover:text-white text-stone-600 p-2 rounded-full transition-colors">
                                                 <Navigation size={16} />
                                             </a>
                                         </div>
                                     </div>
                                 ))}
                             </div>
                         </div>
                     )}

                     {filteredUsers.length > 0 && (
                       <div>
                          <h3 className="font-bold text-stone-600 text-sm uppercase mb-3 px-1">Personas</h3>
                          <div className="flex overflow-x-auto gap-3 pb-2 no-scrollbar">
                             {filteredUsers.map(u => (
                                <div key={u.id} onClick={() => handleUserClick(u.id)} className="min-w-[120px] bg-white p-3 rounded-xl border border-stone-100 flex flex-col items-center cursor-pointer hover:border-cyan-300 shadow-sm transition-all">
                                   <img src={u.avatar} className="w-12 h-12 rounded-full object-cover mb-2" alt={u.name} />
                                   <span className="text-xs font-bold text-stone-800 text-center line-clamp-1">{u.name}</span>
                                   <span className="text-[10px] text-stone-400 text-center">Ver Perfil</span>
                                </div>
                             ))}
                          </div>
                       </div>
                     )}

                     {searchGroups.length > 0 && (
                        <div>
                           <div className="flex items-center justify-between mb-3 px-1"> <h3 className="font-bold text-stone-600 text-sm uppercase">Grupos de Viaje</h3> <span className="text-xs bg-stone-100 px-2 py-1 rounded-full text-stone-500">{searchGroups.length}</span> </div>
                           <div className="grid gap-3">
                              {searchGroups.map(group => (
                                 <div key={group.id} onClick={() => handleOpenGroup(group.id)} className="bg-white p-3 rounded-xl border border-stone-100 flex items-center space-x-3 shadow-sm cursor-pointer hover:border-cyan-300 transition-colors">
                                    <img src={group.imageUrl} className="w-12 h-12 rounded-lg object-cover" alt={group.name}/>
                                    <div className="flex-1"> 
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-bold text-stone-800 text-sm">{group.name}</h4>
                                            {group.isPrivate && <Lock size={12} className="text-stone-400"/>}
                                        </div>
                                        <p className="text-xs text-stone-500 line-clamp-1">{group.description}</p>
                                    </div>
                                 </div>
                              ))}
                           </div>
                        </div>
                     )}

                     {searchDestinations.length > 0 && (
                       <div>
                          <div className="flex items-center justify-between mb-3 px-1"> <h3 className="font-bold text-stone-600 text-sm uppercase">Destinos</h3> <span className="text-xs bg-stone-100 px-2 py-1 rounded-full text-stone-500">{searchDestinations.length}</span> </div>
                          <div className="grid gap-3">
                             {searchDestinations.slice(0, 5).map(dest => (
                                <div key={dest.id} onClick={() => handleOpenGuide(dest.name)} className="bg-white p-3 rounded-xl border border-stone-100 flex items-center space-x-3 shadow-sm cursor-pointer hover:border-cyan-300 transition-colors">
                                   <img src={dest.imageUrl} className="w-12 h-12 rounded-lg object-cover" alt={dest.name}/>
                                   <div className="flex-1"> <h4 className="font-bold text-stone-800 text-sm">{dest.name}</h4> <div className="flex items-center text-xs text-stone-500 mt-0.5"> <MapPin size={10} className="mr-1" /> {dest.location} </div> </div>
                                </div>
                             ))}
                          </div>
                       </div>
                     )}
                     {filteredPosts.length > 0 && (
                        <div>
                           <div className="flex items-center justify-between mb-3 px-1"> <h3 className="font-bold text-stone-600 text-sm uppercase">Publicaciones</h3> <span className="text-xs bg-stone-100 px-2 py-1 rounded-full text-stone-500">{filteredPosts.length}</span> </div>
                           <div className="grid grid-cols-3 gap-1">
                              {filteredPosts.map(post => (
                                 <div key={post.id} className="aspect-square relative cursor-pointer bg-gray-100 rounded-lg overflow-hidden" onClick={() => handleViewPost(post)}>
                                    {post.mediaType === 'video' ? <video src={post.imageUrl} className="w-full h-full object-cover" /> : <img src={post.imageUrl} className="w-full h-full object-cover" alt="" />}
                                 </div>
                              ))}
                           </div>
                        </div>
                     )}
                  </div>
                ) : (
                   <div className="text-center py-20 text-stone-300"> <Search size={64} className="mx-auto mb-4 opacity-20" /> <p>Escribe algo o usa los filtros rápidos.</p> </div>
                )}
             </div>
          )}
      </div>

      {/* MOBILE BOTTOM NAVIGATION (Fixed) */}
      <div className="fixed bottom-0 w-full bg-white border-t border-stone-200 flex justify-around items-center p-3 md:hidden z-50 pb-safe">
        <button onClick={() => navigateToTab('home')} className={`flex flex-col items-center gap-0.5 transition-colors ${activeTab === 'home' ? 'text-cyan-600' : 'text-stone-400'}`}>
           <Home size={24} strokeWidth={activeTab === 'home' ? 2.5 : 2} />
           <span className="text-[10px] font-medium">Inicio</span>
        </button>
        <button onClick={() => navigateToTab('explore')} className={`flex flex-col items-center gap-0.5 transition-colors ${activeTab === 'explore' ? 'text-cyan-600' : 'text-stone-400'}`}>
           <Compass size={24} strokeWidth={activeTab === 'explore' ? 2.5 : 2} />
           <span className="text-[10px] font-medium">Explorar</span>
        </button>
        
        {/* Floating Create Button */}
        <button 
           onClick={() => openModal(setIsCreateModalOpen)} 
           className="relative -top-5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-full p-4 shadow-lg shadow-cyan-200 border-4 border-stone-50 active:scale-95 transition-transform"
        >
           <Plus size={28} strokeWidth={3} />
        </button>

        <button onClick={() => navigateToTab('search')} className={`flex flex-col items-center gap-0.5 transition-colors ${activeTab === 'search' ? 'text-cyan-600' : 'text-stone-400'}`}>
           <Search size={24} strokeWidth={activeTab === 'search' ? 2.5 : 2} />
           <span className="text-[10px] font-medium">Buscar</span>
        </button>
        <button onClick={() => { navigateToTab('profile'); }} className={`flex flex-col items-center gap-0.5 transition-colors ${activeTab === 'profile' ? 'text-cyan-600' : 'text-stone-400'}`}>
           <div className={`relative rounded-full overflow-hidden w-7 h-7 ring-2 transition-all ${activeTab === 'profile' && !viewingProfileId ? 'ring-cyan-600 ring-offset-2' : 'ring-transparent'}`}>
              <img src={user.avatar} alt="Perfil" className="w-full h-full object-cover" />
           </div>
           <span className="text-[10px] font-medium">Perfil</span>
        </button>
      </div>

      {/* OTHER MODALS */}
      {viewingProfileImage && <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setViewingProfileImage(null)}> <img src={viewingProfileImage} className="max-w-full max-h-full rounded-full shadow-2xl" /> <button className="absolute top-4 right-4 text-white p-2"> <X size={32} /> </button> </div>}
      
      <CreatePostModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onSubmit={handleCreateContent} />
      <AddDestinationModal isOpen={isAddDestinationModalOpen} onClose={() => setIsAddDestinationModalOpen(false)} onSubmit={handleAddDestination} existingDestinations={destinations} />
      <EditPostModal isOpen={!!editingPost} post={editingPost} onClose={() => setEditingPost(null)} onSave={handleUpdatePost} />
      <EditStoryModal isOpen={!!editingStory} story={editingStory} onClose={() => setEditingStory(null)} onSave={handleUpdateStory} />
      {viewingPost && <PostViewer post={viewingPost} currentUserId={user.id} onClose={() => setViewingPost(null)} onLike={handleLike} onComment={handleComment} onShare={handleShare} onEdit={handleEditPost} onDelete={handleDeletePost} />}
      <ChatBot externalIsOpen={chatOpen} externalQuery={chatQuery} onCloseExternal={() => setChatOpen(false)} />
      {viewingStoryIndex !== null && <StoryViewer stories={viewingStoryList} initialStoryIndex={viewingStoryIndex} currentUserId={user.id} onClose={() => setViewingStoryIndex(null)} onMarkViewed={handleMarkStoryViewed} onDelete={handleDeleteStory} onEdit={handleEditStory} onLike={handleLikeStory} onShare={handleShare} />}
      {selectedDestination && <TravelGuideModal destination={selectedDestination} onClose={() => setSelectedDestination(null)} onAskAI={handleAskAIFromGuide} onRate={handleRateDestination} onAddPhoto={handleAddPhotoToDestination} onChangeCover={handleChangeDestinationCover} onDeletePhoto={handleDeleteDestinationPhoto} onDeleteDestination={handleDeleteDestination} onToggleFeatured={handleToggleFeatured} isAdminUser={isAdminUser} />}
    </div>
  );
}

export default App;
