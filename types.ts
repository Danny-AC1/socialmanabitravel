
export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  unlockedAt?: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  avatar: string;
  bio?: string;
  followers: string[];
  following: string[];
  points?: number;
  badges?: Badge[];
  lastLogin?: number;
  completedChallenges?: Record<string, number>;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: number;
}

export interface Post {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  location: string;
  imageUrl: string; 
  mediaType?: 'image' | 'video'; 
  caption: string;
  likes: number;
  comments: Comment[];
  isLiked?: boolean;
  timestamp: number;
}

export interface StoryViewer {
  userId: string;
  userName: string;
  userAvatar: string;
  timestamp: number;
}

export interface Story {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  imageUrl: string; 
  mediaType?: 'image' | 'video'; 
  timestamp: number;
  isViewed: boolean;
  caption?: string;
  location?: string;
  likes?: number;
  isLiked?: boolean;
  viewers?: Record<string, StoryViewer>; 
}

export interface Suggestion {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  text: string;
  timestamp: number;
  isRead: boolean;
}

// --- CHAT TYPES ---

export interface ChatAISuggestion {
  type: 'guide' | 'weather' | 'search' | 'itinerary';
  label: string;
  query: string;
}

export interface Message {
  id: string;
  senderId: string;
  text: string; 
  type: 'text' | 'image' | 'video' | 'audio';
  mediaUrl?: string; 
  replyTo?: {
    id: string;
    text: string;
    senderName: string;
  } | null;
  timestamp: number;
  isRead: boolean;
  
  // AI Metadata
  translation?: string;
  transcription?: string;
  aiMetadata?: {
    entities?: string[]; // Lugares o fechas detectados
    sentiment?: string;
  };
}

export interface Chat {
  id: string; 
  participants: string[];
  lastMessage: string;
  lastTimestamp: number;
  updatedAt: number;
  unreadCount?: number;
  aiContextSummary?: string; // Último resumen de IA
}

export interface Notification {
  id: string;
  userId: string;
  type: 'like' | 'comment' | 'follow' | 'system' | 'like_post' | 'new_post' | 'new_story';
  senderId?: string;
  senderName?: string;
  senderAvatar?: string;
  postId?: string;
  postImage?: string;
  text?: string;
  timestamp: number;
  isRead: boolean;
}

export type EcuadorRegion = 'Costa' | 'Sierra' | 'Amazonía' | 'Insular';

export interface Destination {
  id: string;
  name: string;
  location: string;
  region: EcuadorRegion;
  province: string;
  description: string;
  fullDescription: string;
  imageUrl: string;
  gallery: string[];
  highlights: string[];
  travelTips: string[];
  category: 'Playa' | 'Naturaleza' | 'Cultura' | 'Aventura' | 'Gastronomía' | 'Montaña' | 'Selva';
  rating: number; 
  priceLevel?: string;
  isUserGenerated?: boolean;
  createdBy?: string; 
  ratings?: Record<string, number>; 
  reviewsCount?: number;
  isFeatured?: boolean;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface ItineraryDay {
  morning: string;
  afternoon: string;
  night: string;
}

export interface Itinerary {
  title: string;
  duration: string;
  budget: string;
  days: ItineraryDay[];
}

export type ChallengeType = 'photo' | 'trivia' | 'checkin';

export interface Challenge {
  id: string;
  title: string;
  description: string;
  type: ChallengeType;
  points: number;
  icon: string;
  actionLabel: string;
  question?: string;
  options?: string[];
  correctAnswer?: number;
}

export interface TravelTemplate {
  id: string;
  groupId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  title: string;
  description: string; 
  duration: string; 
  budget: string; 
  timestamp: number;
  likes: number;
  likedBy?: Record<string, boolean>;
}

export interface TravelGroup {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  adminId: string; 
  createdAt: number;
  isPrivate: boolean; 
  members: Record<string, boolean>; 
  templates?: Record<string, TravelTemplate>; 
}
