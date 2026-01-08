
import { ref, set, remove, update, get, push } from "firebase/database";
import { db } from "./firebase";
import { Post, Story, Destination, Suggestion, User, Chat, Message, TravelGroup, TravelTemplate } from '../types';
import { EncryptionService } from "./encryptionService";
import { POINT_VALUES, checkNewBadges } from "../utils";

// NOTA: La lectura (GET) ahora se hace en App.tsx con listeners en tiempo real.
// Este servicio se encarga principalmente de las escrituras (WRITE).

export const StorageService = {
  
  // --- GAMIFICATION SYSTEM ---
  
  awardPoints: async (userId: string, amount: number, actionType: 'post' | 'comment' | 'destination' | 'photo' | 'share' | 'login') => {
    try {
        const userRef = ref(db, `users/${userId}`);
        const snapshot = await get(userRef);
        
        if (snapshot.exists()) {
            const user = snapshot.val() as User;
            const currentPoints = user.points || 0;
            const newPoints = currentPoints + amount;
            
            let actionCount = 0;
            if (actionType === 'post') actionCount = Math.floor(newPoints / POINT_VALUES.POST);
            if (actionType === 'comment') actionCount = Math.floor(newPoints / POINT_VALUES.COMMENT);
            
            const newBadges = checkNewBadges({ ...user, points: newPoints }, actionType as any, actionCount);
            
            const currentBadgeIds = new Set((user.badges || []).map(b => b.id));
            const uniqueNewBadges = newBadges.filter(b => !currentBadgeIds.has(b.id));
            const updatedBadges = [...(user.badges || []), ...uniqueNewBadges];

            await update(userRef, {
                points: newPoints,
                badges: updatedBadges
            });

            return { newPoints, newBadges: uniqueNewBadges };
        }
    } catch (e) {
        console.error("Error awarding points:", e);
    }
  },

  checkDailyLogin: async (userId: string) => {
    try {
        const userRef = ref(db, `users/${userId}`);
        const snapshot = await get(userRef);
        
        if (snapshot.exists()) {
            const user = snapshot.val() as User;
            const lastLogin = user.lastLogin || 0;
            const now = Date.now();

            const lastDate = new Date(lastLogin).toDateString();
            const currentDate = new Date(now).toDateString();

            if (lastDate !== currentDate) {
                await StorageService.awardPoints(userId, POINT_VALUES.LOGIN_DAILY, 'login');
                await update(userRef, { lastLogin: now });
                return true;
            }
        }
        return false;
    } catch (e) {
        console.error("Error checking daily login:", e);
        return false;
    }
  },

  completeChallenge: async (userId: string, challengeId: string, points: number) => {
    try {
        const userRef = ref(db, `users/${userId}`);
        const snapshot = await get(userRef);
        
        if (snapshot.exists()) {
            const user = snapshot.val() as User;
            const completed = user.completedChallenges || {};
            
            if (completed[challengeId]) {
                return false;
            }

            const newCompleted = { ...completed, [challengeId]: Date.now() };
            const currentPoints = user.points || 0;
            const newPoints = currentPoints + points;

            await update(userRef, {
                points: newPoints,
                completedChallenges: newCompleted
            });
            return true;
        }
        return false;
    } catch (e) {
        console.error("Error completing challenge:", e);
        return false;
    }
  },

  // --- CONTENT ---

  savePost: async (post: Post) => {
    await set(ref(db, 'posts/' + post.id), post);
    await StorageService.awardPoints(post.userId, POINT_VALUES.POST, 'post');
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
      likes: Math.max(0, newLikes) 
    });
  },

  addComment: async (postId: string, comments: any[]) => {
    await update(ref(db, `posts/${postId}`), {
      comments: comments
    });
    const newComment = comments[comments.length - 1];
    if (newComment) {
        await StorageService.awardPoints(newComment.userId, POINT_VALUES.COMMENT, 'comment');
    }
  },

  saveStory: async (story: Story) => {
    await set(ref(db, 'stories/' + story.id), story);
    await StorageService.awardPoints(story.userId, POINT_VALUES.STORY, 'post');
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

  // --- NOTIFICATIONS ---

  markNotificationRead: async (userId: string, notificationId: string) => {
    await update(ref(db, `notifications/${userId}/${notificationId}`), {
      isRead: true
    });
  },

  clearNotifications: async (userId: string) => {
    await remove(ref(db, `notifications/${userId}`));
  },

  // --- SUGGESTIONS ---

  sendSuggestion: async (suggestion: Suggestion) => {
    await set(ref(db, `suggestions/${suggestion.id}`), suggestion);
  },

  deleteSuggestion: async (id: string) => {
    await remove(ref(db, `suggestions/${id}`));
  },

  markSuggestionRead: async (id: string) => {
    await update(ref(db, `suggestions/${id}`), { isRead: true });
  },

  // --- DESTINATIONS ---

  addDestination: async (destination: Destination) => {
    await set(ref(db, `destinations/${destination.id}`), destination);
    if (destination.createdBy) {
        await StorageService.awardPoints(destination.createdBy, POINT_VALUES.ADD_DESTINATION, 'destination');
    }
  },

  deleteDestination: async (destinationId: string) => {
    await remove(ref(db, `destinations/${destinationId}`));
  },

  updateDestinationStatus: async (destinationId: string, updates: Partial<Destination>) => {
    await update(ref(db, `destinations/${destinationId}`), updates);
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

  addPhotoToDestinationGallery: async (destinationId: string, currentGallery: string[], newImageUrl: string, userId?: string) => {
    const updatedGallery = [newImageUrl, ...(currentGallery || [])];
    await update(ref(db, `destinations/${destinationId}`), {
      gallery: updatedGallery
    });
    if (userId) {
        await StorageService.awardPoints(userId, POINT_VALUES.ADD_PHOTO, 'photo');
    }
  },

  // --- TRAVEL GROUPS & TEMPLATES ---

  createTravelGroup: async (groupData: Omit<TravelGroup, 'members' | 'templates'>) => {
      const newGroup: TravelGroup = {
          ...groupData,
          members: { [groupData.adminId]: true }, 
      };
      await set(ref(db, `travelGroups/${groupData.id}`), newGroup);
  },

  updateTravelGroup: async (groupId: string, updates: Partial<TravelGroup>) => {
      await update(ref(db, `travelGroups/${groupId}`), updates);
  },

  deleteTravelGroup: async (groupId: string) => {
      await remove(ref(db, `travelGroups/${groupId}`));
  },

  joinTravelGroup: async (groupId: string, userId: string) => {
      await update(ref(db, `travelGroups/${groupId}/members`), {
          [userId]: true
      });
  },

  leaveTravelGroup: async (groupId: string, userId: string) => {
      await remove(ref(db, `travelGroups/${groupId}/members/${userId}`));
  },

  addMemberToGroup: async (groupId: string, userId: string) => {
      await update(ref(db, `travelGroups/${groupId}/members`), {
          [userId]: true
      });
  },

  createTravelTemplate: async (template: TravelTemplate) => {
      await set(ref(db, `travelGroups/${template.groupId}/templates/${template.id}`), template);
  },

  deleteTravelTemplate: async (groupId: string, templateId: string) => {
      await remove(ref(db, `travelGroups/${groupId}/templates/${templateId}`));
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

  createGroupChat: async (creatorId: string, participantIds: string[], name: string) => {
    const chatId = `grp_${Date.now()}`;
    const participants = Array.from(new Set([creatorId, ...participantIds]));
    const chatRef = ref(db, `chats/${chatId}`);
    
    const newChat: Chat = {
      id: chatId,
      participants: participants,
      name: name,
      isGroup: true,
      lastMessage: EncryptionService.encrypt('¡Nuevo grupo creado!', chatId),
      lastTimestamp: Date.now(),
      updatedAt: Date.now()
    };
    
    await set(chatRef, newChat);
    return chatId;
  },

  addParticipantToChat: async (chatId: string, userId: string, name?: string) => {
    const chatRef = ref(db, `chats/${chatId}`);
    const snapshot = await get(chatRef);
    
    if (snapshot.exists()) {
      const chat = snapshot.val() as Chat;
      const participants = Array.from(new Set([...(chat.participants || []), userId]));
      
      const updates: any = {
        participants: participants,
        updatedAt: Date.now()
      };

      // Si se convierte de P2P a Grupo
      if (!chat.isGroup && participants.length > 2) {
        updates.isGroup = true;
        if (name) updates.name = name;
      }

      await update(chatRef, updates);
    }
  },

  sendMessage: async (
    chatId: string, 
    senderId: string, 
    text: string, 
    type: 'text' | 'image' | 'video' | 'audio' = 'text',
    mediaUrl?: string | null,
    replyTo?: Message['replyTo']
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
    if (type === 'video') previewText = EncryptionService.encrypt('🎥 Video', chatId);
    if (type === 'audio') previewText = EncryptionService.encrypt('🎤 Nota de voz', chatId);

    await update(ref(db, `chats/${chatId}`), {
      lastMessage: previewText, 
      lastTimestamp: Date.now(),
      updatedAt: Date.now()
    });
  },

  deleteMessage: async (chatId: string, messageId: string) => {
    await remove(ref(db, `chats/${chatId}/messages/${messageId}`));
  },

  deleteChat: async (chatId: string) => {
    await remove(ref(db, `chats/${chatId}`));
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

  // --- LOGISTICS (CHECKLIST & EXPENSES) ---

  updateChecklist: async (chatId: string, items: any[]) => {
      await set(ref(db, `chats/${chatId}/logistics/checklist`), items);
  },

  updateExpenses: async (chatId: string, expenses: any[]) => {
      await set(ref(db, `chats/${chatId}/logistics/expenses`), expenses);
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
