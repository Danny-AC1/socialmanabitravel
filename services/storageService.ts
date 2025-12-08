import { ref, set, remove, update, get, push } from "firebase/database";
import { db } from "./firebase";
import { Post, Story, Destination, Suggestion, User, Chat, Message, Notification } from '../types';
import { EncryptionService } from "./encryptionService";
import { AuthService } from "./authService";
import { ALL_DESTINATIONS } from '../constants'; // Importar datos estáticos para migración

export const StorageService = {
  
  savePost: async (post: Post) => {
    await set(ref(db, 'posts/' + post.id), post);
    await StorageService.notifyFollowers(post.userId, post.userName, post.userAvatar, 'new_post', post.id);
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
    await update(ref(db, `posts/${post.id}`), { likes: newLikes });
    if (!isLiked && post.userId !== userId) {
        const sender = await AuthService.getUserById(userId);
        if (sender) {
            await StorageService.createNotification({
                recipientId: post.userId,
                senderId: userId,
                senderName: sender.name,
                senderAvatar: sender.avatar,
                type: 'like_post',
                targetId: post.id
            });
        }
    }
  },

  addComment: async (postId: string, comments: any[]) => {
    await update(ref(db, `posts/${postId}`), { comments: comments });
    const lastComment = comments[comments.length - 1];
    const postSnapshot = await get(ref(db, `posts/${postId}`));
    if (postSnapshot.exists()) {
        const post = postSnapshot.val() as Post;
        if (post.userId !== lastComment.userId) {
            await StorageService.createNotification({
                recipientId: post.userId,
                senderId: lastComment.userId,
                senderName: lastComment.userName,
                senderAvatar: await AuthService.getUserById(lastComment.userId).then(u => u?.avatar || ''),
                type: 'comment',
                targetId: postId,
                preview: lastComment.text
            });
        }
    }
  },

  saveStory: async (story: Story) => {
    await set(ref(db, 'stories/' + story.id), story);
    await StorageService.notifyFollowers(story.userId, story.userName, story.userAvatar, 'new_story', story.id);
  },

  updateStory: async (storyId: string, updates: Partial<Story>) => {
    await update(ref(db, `stories/${storyId}`), updates);
  },

  deleteStory: async (storyId: string) => {
    await remove(ref(db, `stories/${storyId}`));
  },

  toggleLikeStory: async (story: Story) => {
    const currentLikes = story.likes || 0;
    await update(ref(db, `stories/${story.id}`), { likes: currentLikes + 1 });
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

  createNotification: async (data: { recipientId: string, senderId: string, senderName: string, senderAvatar: string, type: Notification['type'], targetId?: string, preview?: string }) => {
      const notifId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const notification: Notification = {
          id: notifId,
          ...data,
          timestamp: Date.now(),
          isRead: false
      };
      await set(ref(db, `notifications/${data.recipientId}/${notifId}`), notification);
  },

  notifyFollowers: async (senderId: string, senderName: string, senderAvatar: string, type: Notification['type'], targetId: string) => {
    try {
        const user = await AuthService.getUserById(senderId);
        if (!user || !user.followers) return;

        const notificationsUpdates: any = {};
        user.followers.forEach(followerId => {
            const notifId = `notif_${Date.now()}_${followerId}`;
            const notification: Notification = {
                id: notifId,
                recipientId: followerId,
                senderId,
                senderName,
                senderAvatar,
                type,
                targetId,
                timestamp: Date.now(),
                isRead: false
            };
            notificationsUpdates[`/notifications/${followerId}/${notifId}`] = notification;
        });

        if (Object.keys(notificationsUpdates).length > 0) {
            await update(ref(db), notificationsUpdates);
        }
    } catch (e) {
        console.error("Error sending notifications", e);
    }
  },

  markNotificationRead: async (userId: string, notificationId: string) => {
      await update(ref(db, `notifications/${userId}/${notificationId}`), { isRead: true });
  },

  clearNotifications: async (userId: string) => {
      await remove(ref(db, `notifications/${userId}`));
  },

  sendSuggestion: async (suggestion: Suggestion) => {
    await set(ref(db, `suggestions/${suggestion.id}`), suggestion);
  },

  deleteSuggestion: async (id: string) => {
    await remove(ref(db, `suggestions/${id}`));
  },

  addDestination: async (destination: Destination) => {
    await set(ref(db, `destinations/${destination.id}`), destination);
  },

  deleteDestination: async (destinationId: string) => {
    await remove(ref(db, `destinations/${destinationId}`));
  },

  rateDestination: async (destinationId: string, userId: string, rating: number, currentRating: number, reviewCount: number = 0) => {
    // Para rating, también necesitamos asegurar que el destino exista en Firebase
    const destRef = ref(db, `destinations/${destinationId}`);
    const snapshot = await get(destRef);

    if (!snapshot.exists()) {
         const originalDest = ALL_DESTINATIONS.find(d => d.id === destinationId);
         if (originalDest) {
             // Crear copia inicial
             await set(destRef, originalDest);
         }
    }

    await set(ref(db, `destinations/${destinationId}/ratings/${userId}`), rating);
    const newCount = (reviewCount || 0) + 1;
    const newAvg = ((currentRating * (reviewCount || 0)) + rating) / newCount;
    await update(destRef, { rating: newAvg, reviewsCount: newCount });
  },

  // --- ACTUALIZACIÓN DE DESTINOS (FIXED) ---

  updateDestinationCover: async (destinationId: string, newImageUrl: string, fullDestination?: Destination) => {
    const destRef = ref(db, `destinations/${destinationId}`);
    const snapshot = await get(destRef);
    
    if (snapshot.exists()) {
        await update(destRef, { imageUrl: newImageUrl });
    } else {
        // Migrar de estático a Firebase
        const destToSave = fullDestination || ALL_DESTINATIONS.find(d => d.id === destinationId);
        if (destToSave) {
            await set(destRef, { ...destToSave, imageUrl: newImageUrl });
        }
    }
  },

  addPhotoToDestinationGallery: async (destinationId: string, currentGallery: string[], newImageUrl: string, fullDestination?: Destination) => {
    const destRef = ref(db, `destinations/${destinationId}`);
    const snapshot = await get(destRef);
    const updatedGallery = [newImageUrl, ...(currentGallery || [])];

    if (snapshot.exists()) {
        await update(destRef, { gallery: updatedGallery });
    } else {
        const destToSave = fullDestination || ALL_DESTINATIONS.find(d => d.id === destinationId);
        if (destToSave) {
            await set(destRef, { ...destToSave, gallery: updatedGallery });
        }
    }
  },

  removeDestinationPhoto: async (destinationId: string, currentGallery: string[], photoUrlToRemove: string, fullDestination?: Destination) => {
    const updatedGallery = currentGallery.filter(url => url !== photoUrlToRemove);
    const destRef = ref(db, `destinations/${destinationId}`);
    const snapshot = await get(destRef);

    if (snapshot.exists()) {
        await update(destRef, { gallery: updatedGallery });
    } else {
        const destToSave = fullDestination || ALL_DESTINATIONS.find(d => d.id === destinationId);
        if (destToSave) {
            await set(destRef, { ...destToSave, gallery: updatedGallery });
        }
    }
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

  deleteChat: async (chatId: string) => {
    await remove(ref(db, `chats/${chatId}`));
  },

  sendMessage: async (
    chatId: string, 
    senderId: string, 
    text: string, 
    type: 'text' | 'image' | 'video' | 'audio' = 'text',
    mediaUrl?: string | null,
    replyTo?: any
  ) => {
    const encryptedText = text ? EncryptionService.encrypt(text, chatId) : '';
    const encryptedMedia = mediaUrl ? EncryptionService.encrypt(mediaUrl, chatId) : null;

    const messageRef = push(ref(db, `chats/${chatId}/messages`));
    
    const messagePayload: any = {
      id: messageRef.key!,
      senderId,
      text: encryptedText,
      type,
      timestamp: Date.now(),
      isRead: false
    };

    if (encryptedMedia) messagePayload.mediaUrl = encryptedMedia;
    if (replyTo) messagePayload.replyTo = replyTo;

    await set(messageRef, messagePayload);

    let previewText = encryptedText;
    if (type === 'image') previewText = EncryptionService.encrypt('📷 Foto', chatId);
    else if (type === 'video') previewText = EncryptionService.encrypt('🎥 Video', chatId);
    else if (type === 'audio') previewText = EncryptionService.encrypt('🎤 Nota de voz', chatId);

    await update(ref(db, `chats/${chatId}`), {
      lastMessage: previewText, 
      lastTimestamp: Date.now(),
      updatedAt: Date.now()
    });
  },

  deleteMessage: async (chatId: string, messageId: string) => {
    await remove(ref(db, `chats/${chatId}/messages/${messageId}`));
  },

  editMessage: async (chatId: string, messageId: string, newText: string) => {
    const encryptedText = EncryptionService.encrypt(newText, chatId);
    await update(ref(db, `chats/${chatId}/messages/${messageId}`), {
      text: encryptedText
    });
  },

  markChatAsRead: async (chatId: string, currentUserId: string) => {
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
  
  clearAll: async () => {
    await set(ref(db), null);
    localStorage.clear();
    window.location.reload();
  }
};