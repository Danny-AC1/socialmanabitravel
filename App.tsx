
import React, { useState, useEffect, useRef } from 'react';
import { Map as MapIcon, Compass, Camera, Search, LogOut, ChevronLeft, PlusCircle, Globe, Filter, Edit3, X, Lightbulb, MapPin, Plus, MessageCircle, Users, Bell, LayoutGrid, Award, Home, Sparkles, Trophy, CheckCircle, Navigation, Lock, User as UserIcon, AlertTriangle, ShieldAlert } from 'lucide-react';
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
import { ALL_DESTINATIONS as STATIC_DESTINATIONS, APP_VERSION } from './constants';
import { Post, Story, Destination, User, Notification, Challenge } from './types';
import { StorageService } from './services/storageService';
import { AuthService } from './services/authService';
import { getDailyChallenge } from './utils';
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
  
  // Modal States
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isNearbyModalOpen, setIsNearbyModalOpen] = useState(false);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isGroupsOpen, setIsGroupsOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [nearbyData, setNearbyData] = useState<{text: string, places: any[]} | null>(null);

  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null);
  const [viewingStoryIndex, setViewingStoryIndex] = useState<number | null>(null);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [viewingPost, setViewingPost] = useState<Post | null>(null);
  const [chatQuery, setChatQuery] = useState('');
  
  const dailyChallenge = getDailyChallenge();
  const isChallengeCompleted = user ? !!(user.completedChallenges && user.completedChallenges[dailyChallenge.id]) : false;

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

    const destinationsRef = ref(db, 'destinations');
    onValue(destinationsRef, (snapshot) => {
      const data = snapshot.val();
      const loadedDestinations: Destination[] = data ? Object.values(data) : [];
      const merged = [...STATIC_DESTINATIONS];
      loadedDestinations.forEach(ld => {
        if (!merged.find(m => m.id === ld.id)) merged.push(ld);
      });
      setDestinations(merged);
    });

    const storiesRef = ref(db, 'stories');
    onValue(storiesRef, (snapshot) => {
      const data = snapshot.val();
      const loadedStories: Story[] = data ? Object.values(data) : [];
      setStories(loadedStories.sort((a, b) => b.timestamp - a.timestamp));
    });
  }, []);

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
      alert("Error al subir. Verifica tus reglas de Firebase.");
    }
  });

  const handleChallengeParticipate = (challenge: Challenge) => requireAuth(() => {
    if (challenge.type === 'photo') setIsCreateModalOpen(true);
  });

  const handleTriviaAnswer = (challenge: Challenge, idx: number) => {
    if (!user) { setIsAuthOpen(true); return false; }
    if (idx === challenge.correctAnswer) {
      StorageService.completeChallenge(user.id, challenge.id, challenge.points);
      alert(`¡Correcto! +${challenge.points} XP`);
      return true;
    }
    return false;
  };

  const featuredDestination = destinations.find(d => d.isFeatured) || destinations[0];
  const activeStories = stories.filter(story => (Date.now() - story.timestamp) < 24 * 60 * 60 * 1000);

  return (
    <div className="min-h-screen bg-stone-50 font-sans">
      <Helmet>
        <title>Inicio | Ecuador Travel</title>
      </Helmet>

      {/* DESKTOP HEADER (Exactly like capture) */}
      <nav className="sticky top-0 z-[100] bg-white border-b border-stone-100 shadow-sm px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-1 cursor-pointer" onClick={() => setActiveTab('home')}>
              <span className="text-xl font-black text-manabi-600 tracking-tighter">ECUADOR</span>
              <span className="text-xl font-light text-stone-400">TRAVEL</span>
            </div>
            
            <div className="hidden lg:flex items-center bg-stone-100 rounded-full px-4 py-2 w-80">
              <Search size={18} className="text-stone-400 mr-2" />
              <input type="text" placeholder="Buscar en la app..." className="bg-transparent outline-none text-sm w-full" />
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-5">
            <div className="flex items-center gap-1 md:gap-4 text-stone-500 mr-2 border-r pr-5 border-stone-100">
               <button onClick={() => setIsNearbyModalOpen(true)} className="p-2 hover:bg-stone-50 rounded-full transition-colors"><MapIcon size={22} /></button>
               <button onClick={() => setActiveTab('explore')} className="p-2 hover:bg-stone-50 rounded-full transition-colors"><Compass size={22} /></button>
               <button onClick={() => requireAuth(() => setIsChatOpen(true))} className="p-2 hover:bg-stone-50 rounded-full transition-colors"><MessageCircle size={22} /></button>
               <button onClick={() => requireAuth(() => setIsNotificationsOpen(true))} className="p-2 hover:bg-stone-50 rounded-full transition-colors relative">
                 <Bell size={22} />
                 {notifications.length > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>}
               </button>
               <button onClick={() => requireAuth(() => setIsGroupsOpen(true))} className="p-2 hover:bg-stone-50 rounded-full transition-colors"><Users size={22} /></button>
               <button onClick={() => setIsSuggestionsOpen(true)} className="p-2 hover:bg-stone-50 rounded-full transition-colors"><Lightbulb size={22} /></button>
            </div>
            
            <button 
              onClick={() => requireAuth(() => setIsCreateModalOpen(true))}
              className="bg-manabi-600 text-white px-5 py-2 rounded-xl font-bold text-sm shadow-md hover:bg-manabi-700 transition-all flex items-center gap-2"
            >
              <Camera size={18} /> Publicar
            </button>
            
            {user && (
              <img 
                src={user.avatar} 
                className="w-10 h-10 rounded-full border-2 border-manabi-500 cursor-pointer object-cover" 
                onClick={() => setActiveTab('profile')}
              />
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* MAIN FEED (Left/Center) */}
        <div className="lg:col-span-8">
          
          {/* STORIES (Rounded square style like capture) */}
          <div className="flex gap-4 overflow-x-auto no-scrollbar mb-8 pb-2">
            <div 
              className="relative w-24 h-36 md:w-28 md:h-44 shrink-0 rounded-2xl overflow-hidden cursor-pointer group shadow-sm bg-stone-200"
              onClick={() => requireAuth(() => setIsCreateModalOpen(true))}
            >
              <img src={user?.avatar || 'https://api.dicebear.com/7.x/adventurer/svg?seed=guest'} className="w-full h-full object-cover opacity-60" />
              <div className="absolute inset-0 bg-black/20 flex flex-col items-center justify-center text-white">
                <div className="bg-manabi-600 rounded-full p-1 border-2 border-white mb-1"><Plus size={16} /></div>
                <span className="text-[10px] font-bold">Crear</span>
              </div>
            </div>
            {activeStories.map((story, idx) => (
              <div key={story.id} className="relative w-24 h-36 md:w-28 md:h-44 shrink-0 rounded-2xl overflow-hidden cursor-pointer ring-2 ring-manabi-500 ring-offset-2" onClick={() => setViewingStoryIndex(idx)}>
                <img src={story.imageUrl} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <span className="absolute bottom-2 left-2 text-white text-[10px] font-bold truncate pr-2">{story.userName}</span>
              </div>
            ))}
          </div>

          {/* DAILY CHALLENGE (Violet card like capture) */}
          <ChallengeCard 
            challenge={dailyChallenge} 
            isCompleted={isChallengeCompleted} 
            onParticipate={handleChallengeParticipate}
            onTriviaAnswer={handleTriviaAnswer}
          />

          {/* POSTS FEED */}
          <div className="space-y-8">
            <HeroSection 
              destination={featuredDestination} 
              onGuideClick={(name) => setSelectedDestination(destinations.find(d => d.name === name) || null)} 
            />
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
        </div>

        {/* SIDEBAR (Right side like capture) */}
        <div className="hidden lg:block lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100">
             <div className="flex items-center gap-2 mb-4">
                <Compass className="text-manabi-600" size={20} />
                <h3 className="font-bold text-gray-800 uppercase text-xs tracking-widest">Lugares Recomendados</h3>
             </div>
             <div className="space-y-4">
                {destinations.slice(0, 4).map(dest => (
                  <div key={dest.id} className="flex gap-3 group cursor-pointer" onClick={() => setSelectedDestination(dest)}>
                     <img src={dest.imageUrl} className="w-16 h-16 rounded-xl object-cover" />
                     <div className="flex-1">
                        <h4 className="font-bold text-sm text-gray-800 group-hover:text-manabi-600 transition-colors">{dest.name}</h4>
                        <p className="text-[10px] text-stone-400 flex items-center gap-1"><MapPin size={10} /> {dest.location}</p>
                        <div className="flex items-center gap-1 mt-1">
                           <Trophy size={10} className="text-yellow-500" />
                           <span className="text-[10px] font-bold text-stone-500">{dest.rating} Rating</span>
                        </div>
                     </div>
                  </div>
                ))}
             </div>
          </div>

          {/* CHAT BUBBLE TRIGGER (Bottom right float) */}
          <div className="fixed bottom-6 right-6 z-50">
             <button 
              onClick={() => requireAuth(() => setIsChatOpen(true))}
              className="bg-manabi-600 text-white p-4 rounded-2xl shadow-2xl hover:bg-manabi-700 transition-all hover:scale-110 active:scale-95 border-4 border-white"
             >
               <MessageCircle size={28} />
             </button>
          </div>
        </div>
      </main>

      {/* ALL MODALS */}
      <AuthScreen isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} onLoginSuccess={(u) => { setUser(u); setIsAuthOpen(false); }} />
      <CreatePostModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onSubmit={handleCreateContent} />
      <NearbyModal isOpen={isNearbyModalOpen} onClose={() => setIsNearbyModalOpen(false)} isLoading={nearbyLoading} data={nearbyData} />
      <SuggestionsModal isOpen={isSuggestionsOpen} onClose={() => setIsSuggestionsOpen(false)} currentUser={user || {id:'guest'} as any} isAdmin={false} />
      <ChatModal isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} currentUser={user || {id:'guest'} as any} allUsers={[]} />
      <TravelGroupsModal isOpen={isGroupsOpen} onClose={() => setIsGroupsOpen(false)} currentUser={user || {id:'guest'} as any} allUsers={[]} />
      {selectedDestination && <TravelGuideModal destination={selectedDestination} onClose={() => setSelectedDestination(null)} onAskAI={setChatQuery} onRate={() => {}} onAddPhoto={() => {}} isAdminUser={false} />}
      {viewingStoryIndex !== null && <StoryViewer stories={activeStories} initialStoryIndex={viewingStoryIndex} currentUserId={user?.id || 'guest'} onClose={() => setViewingStoryIndex(null)} onMarkViewed={() => {}} onDelete={() => {}} onLike={() => {}} />}
      {isNotificationsOpen && user && <NotificationsModal isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} notifications={notifications} currentUserId={user.id} />}
      {viewingPost && <PostViewer post={viewingPost} currentUserId={user?.id || 'guest'} onClose={() => setViewingPost(null)} onLike={() => {}} onComment={() => {}} onShare={() => {}} onEdit={() => {}} onDelete={() => {}} />}
      <ChatBot externalIsOpen={chatQuery !== ''} externalQuery={chatQuery} onCloseExternal={() => setChatQuery('')} />
    </div>
  );
}
