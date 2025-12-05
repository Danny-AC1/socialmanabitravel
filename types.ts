export interface User {
  id: string;
  name: string;
  email: string; // Added for auth
  password?: string; // Added for auth (stored locally for simulation)
  avatar: string;
  bio?: string;
  followers: string[]; // Array of user IDs
  following: string[]; // Array of user IDs
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
  caption?: string; // Added
  location?: string; // Added
  likes?: number; // Added
  isLiked?: boolean; // Added
}

export interface Destination {
  id: string;
  name: string;
  location: string;
  description: string;
  fullDescription: string; // Detailed text for the guide
  imageUrl: string;
  gallery: string[]; // Array of additional image URLs
  highlights: string[]; // Bullet points of what to see
  travelTips: string[]; // Practical advice (bring water, cost, etc)
  category: 'Playa' | 'Naturaleza' | 'Cultura' | 'Aventura' | 'Gastronomía';
  rating: number;
  priceLevel?: string; // e.g. "Gratis", "$5 Entrada", "$$$ Tour"
}