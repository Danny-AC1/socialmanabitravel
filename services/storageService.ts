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
    // Esta lógica es simplificada. En una app real usaríamos una subcolección de likes.
    // Aquí confiamos en el contador del cliente por ahora, pero lo ideal es transaccional.
    const isLiked = post.isLiked; // Nota: isLiked es local al usuario en esta implementación simple
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
    // Simplificación para demo
    await update(ref(db, `stories/${story.id}`), {
      likes: currentLikes + 1
    });
  },

  markStoryViewed: async (storyId: string) => {
    // En una app real, esto se guardaría en una tabla 'user_views'. 
    // Para esta demo, no modificamos la DB global al ver, solo localmente en App.tsx.
  },

  // --- DESTINATIONS ---

  addDestination: async (destination: Destination) => {
    await set(ref(db, `destinations/${destination.id}`), destination);
  },

  rateDestination: async (destinationId: string, userId: string, rating: number, currentRating: number, reviewCount: number = 0) => {
    // Save the individual user rating
    await set(ref(db, `destinations/${destinationId}/ratings/${userId}`), rating);
    
    // Calculate simple new average (approximated for no-backend solution)
    // Formula: NewAvg = ((OldAvg * Count) + NewRating) / (Count + 1)
    // NOTE: This assumes this is a new vote. In a real app, cloud functions calculate this.
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
  
  clearAll: async () => {
    // Peligroso: Borra toda la DB. Solo para desarrollo.
    await set(ref(db), null);
    localStorage.clear();
    window.location.reload();
  }
};