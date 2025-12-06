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
  caption: string;
  likes: number;
  comments: Comment[];
  isLiked?: boolean;
  timestamp: number;
}

export interface Story {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  imageUrl: string;
  timestamp: number;
  isViewed: boolean;
  caption?: string;
  location?: string;
  likes?: number;
  isLiked?: boolean;
}

export type EcuadorRegion = 'Costa' | 'Sierra' | 'Amazonía' | 'Insular';

export interface Destination {
  id: string;
  name: string;
  location: string;
  region: EcuadorRegion; // Nuevo campo
  province: string;      // Nuevo campo
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