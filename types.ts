
export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  avatar: string;
  bio?: string;
  followers: string[];
  following: string[];
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

export interface Message {
  id: string;
  senderId: string;
  text: string; // Texto cifrado (o vacío si es solo media)
  type: 'text' | 'image' | 'video' | 'audio';
  mediaUrl?: string; // URL/Base64 cifrada del archivo
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
  lastMessage: string;
  lastTimestamp: number;
  updatedAt: number;
  unreadCount?: number; // Calculado en cliente
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
}
