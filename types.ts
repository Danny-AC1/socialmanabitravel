
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
}

// --- LANGUAGE TYPE ---
export type Language = 'es' | 'en';

// --- RESERVATION TYPES ---

export type ReservationType = 'hotel' | 'restaurant';

export interface ReservationItem {
  id: string;
  title: string;
  description: string;
  price: number;
  imageUrl: string;
  gallery?: string[]; // Para habitaciones
}

export interface ReservationOffer {
  id: string;
  destinationId: string; // Vínculo con destino
  destinationName: string;
  type: ReservationType;
  businessName: string;
  businessAddress: string;
  businessPhone: string; // Para WhatsApp
  bankDetails: string; // Datos de cuenta para transferencia
  items: ReservationItem[];
  createdAt: number;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface Booking {
  id: string;
  userId: string;
  userName: string;
  offerId: string;
  businessName: string;
  offerType: ReservationType;
  itemId: string;
  itemTitle: string;
  price: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  proofUrl: string; // Base64 del comprobante
  timestamp: number;
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
  gallery?: string[]; // Nueva propiedad para múltiples imágenes
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
}

export interface Chat {
  id: string; 
  participants: string[];
  name?: string; 
  isGroup?: boolean; 
  lastMessage: string;
  lastTimestamp: number;
  updatedAt: number;
  unreadCount?: number; 
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
export type Tab = 'home' | 'portals' | 'explore' | 'search' | 'profile';

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
  chatId?: string; 
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  points: number;
  icon: string;
  type: 'trivia' | 'post' | 'visit' | 'share';
  actionLabel: string;
  question?: string;
  options?: string[];
}
