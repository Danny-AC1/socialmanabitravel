import { ref, set, remove, update, get, push, child } from "firebase/database";
import { db } from "./firebase";
import { Post, Story, Destination, Suggestion, User, Chat, Message } from '../types';
import { EncryptionService } from "./encryptionService";

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

  updateStory: async (storyId: string, updates: Partial<Story>) => {
    await update(ref(db, `stories/${storyId}`), updates);
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

  markStoryViewed: async (storyId: string, user: User) => {
    const viewerData = {
      userId: user.id,
      userName: user.name,
      userAvatar: user.avatar,
      timestamp: Date.now()
    };
    await update(ref(db, `stories/${storyId}/viewers/${user.id}`), viewerData);
  },

  // --- SUGGESTIONS ---

  sendSuggestion: async (suggestion: Suggestion) => {
    await set(ref(db, `suggestions/${suggestion.id}`), suggestion);
  },

  deleteSuggestion: async (id: string) => {
    await remove(ref(db, `suggestions/${id}`));
  },

  // --- DESTINATIONS ---

  addDestination: async (destination: Destination) => {
    await set(ref(db, `destinations/${destination.id}`), destination);
  },

  deleteDestination: async (destinationId: string) => {
    await remove(ref(db, `destinations/${destinationId}`));
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

  // --- CHAT SYSTEM ---

  getChatId: (userId1: string, userId2: string) => {
    return [userId1, userId2].sort().join('_');
  },

  initiateChat: async (currentUserId: string, targetUserId: string) => {
    const chatId = StorageService.getChatId(currentUserId, targetUserId);
    const chatRef = ref(db, `chats/${chatId}`);
    
    const snapshot = await get(chatRef);
    if (!snapshot.exists()) {
      const newChat: Chat = {
        id: chatId,
        participants: [currentUserId, targetUserId],
        lastMessage: '',
        lastTimestamp: Date.now(),
        updatedAt: Date.now()
      };
      await set(chatRef, newChat);
    }
    return chatId;
  },

  sendMessage: async (
    chatId: string, 
    senderId: string, 
    text: string, 
    type: 'text' | 'image' | 'video' | 'audio' = 'text',
    mediaUrl?: string,
    replyTo?: Message['replyTo']
  ) => {
    // 1. Encriptar contenido
    const encryptedText = text ? EncryptionService.encrypt(text, chatId) : '';
    const encryptedMedia = mediaUrl ? EncryptionService.encrypt(mediaUrl, chatId) : null;

    // 2. Crear referencia
    const messageRef = push(ref(db, `chats/${chatId}/messages`));
    
    // 3. Construir objeto LIMPIO (sin undefined)
    // Firebase falla si pasamos propiedades con valor undefined
    const payload: any = {
      id: messageRef.key!,
      senderId,
      text: encryptedText,
      type,
      timestamp: Date.now(),
      isRead: false
    };

    // Solo agregamos estas propiedades si tienen valor real
    if (encryptedMedia) payload.mediaUrl = encryptedMedia;
    if (replyTo) payload.replyTo = replyTo;

    // 4. Guardar mensaje
    await set(messageRef, payload);

    // 5. Actualizar vista previa del chat
    let previewText = encryptedText;
    // Si es solo multimedia, mostramos descripción cifrada
    if (!text) {
        if (type === 'image') previewText = EncryptionService.encrypt('📷 Foto', chatId);
        else if (type === 'video') previewText = EncryptionService.encrypt('🎥 Video', chatId);
        else if (type === 'audio') previewText = EncryptionService.encrypt('🎤 Nota de voz', chatId);
    }

    await update(ref(db, `chats/${chatId}`), {
      lastMessage: previewText, 
      lastTimestamp: Date.now(),
      updatedAt: Date.now()
    });
  },

  markChatAsRead: async (chatId: string, currentUserId: string) => {
    // Obtener mensajes no leídos que NO sean míos
    const messagesRef = ref(db, `chats/${chatId}/messages`);
    const snapshot = await get(messagesRef);
    
    if (snapshot.exists()) {
      const updates: any = {};
      snapshot.forEach((childSnapshot) => {
        const msg = childSnapshot.val();
        if (!msg.isRead && msg.senderId !== currentUserId) {
          updates[`${childSnapshot.key}/isRead`] = true;
        }
      });
      
      if (Object.keys(updates).length > 0) {
        await update(messagesRef, updates);
      }
    }
  },

  // --- ADMIN FUNCTIONS ---

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