import { ref, set, remove, update, get } from "firebase/database";
import { db } from "./firebase";
import { Post, Story, Destination } from '../types';

// NOTA: La lectura (GET) ahora se hace en App.tsx con listeners en tiempo real.
// Este servicio se encarga principalmente de las escrituras (WRITE).

export const StorageService = {
  
  savePost: async (post: Post) => {
    await set(ref(db, 'posts/' + post.id), post);
  },

  updatePost: async (postId: string, updates: Partial<Post>) => {
    await update(ref(db, `posts/${postId}`), updates);
  },

  deletePost: async (postId: string) => {
    await remove(ref(db, `posts/${postId}`));
  },

  toggleLikePost: async (post: Post, userId: string) => {
    const isLiked = post.isLiked;
    const newLikes = isLiked ? (post.likes - 1) : (post.likes + 1);
    
    await update(ref(db, `posts/${post.id}`), {
      likes: newLikes
    });
  },

  addComment: async (postId: string, comments: any[]) => {
    await update(ref(db, `posts/${postId}`), {
      comments: comments
    });
  },

  saveStory: async (story: Story) => {
    await set(ref(db, 'stories/' + story.id), story);
  },

  deleteStory: async (storyId: string) => {
    await remove(ref(db, `stories/${storyId}`));
  },

  toggleLikeStory: async (story: Story) => {
    const currentLikes = story.likes || 0;
    await update(ref(db, `stories/${story.id}`), {
      likes: currentLikes + 1
    });
  },

  markStoryViewed: async (storyId: string) => {
    // Placeholder para lógica futura de vistas
  },

  // --- DESTINATIONS ---

  addDestination: async (destination: Destination) => {
    await set(ref(db, `destinations/${destination.id}`), destination);
  },

  rateDestination: async (destinationId: string, userId: string, rating: number, currentRating: number, reviewCount: number = 0) => {
    await set(ref(db, `destinations/${destinationId}/ratings/${userId}`), rating);
    
    const newCount = (reviewCount || 0) + 1;
    const newAvg = ((currentRating * (reviewCount || 0)) + rating) / newCount;

    await update(ref(db, `destinations/${destinationId}`), {
      rating: newAvg,
      reviewsCount: newCount
    });
  },

  addPhotoToDestinationGallery: async (destinationId: string, currentGallery: string[], newImageUrl: string) => {
    const updatedGallery = [newImageUrl, ...(currentGallery || [])];
    await update(ref(db, `destinations/${destinationId}`), {
      gallery: updatedGallery
    });
  },

  // --- ADMIN FUNCTIONS ---
  // Estas son las funciones que faltaban y causaban el error en App.tsx

  updateDestinationCover: async (destinationId: string, newImageUrl: string) => {
    await update(ref(db, `destinations/${destinationId}`), {
      imageUrl: newImageUrl
    });
  },

  removeDestinationPhoto: async (destinationId: string, currentGallery: string[], photoUrlToRemove: string) => {
    const updatedGallery = currentGallery.filter(url => url !== photoUrlToRemove);
    await update(ref(db, `destinations/${destinationId}`), {
      gallery: updatedGallery
    });
  },
  
  clearAll: async () => {
    await set(ref(db), null);
    localStorage.clear();
    window.location.reload();
  }
};