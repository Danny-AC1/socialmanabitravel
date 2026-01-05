
import { ref, set, remove, update, get, push } from "firebase/database";
import { db } from "./firebase";
import { Post, Story, Destination, Suggestion, User, Chat, Message, TravelGroup, TravelTemplate } from '../types';
import { EncryptionService } from "./encryptionService";
import { POINT_VALUES, checkNewBadges } from "../utils";

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
            const newBadges = checkNewBadges({ ...user, points: newPoints }, actionType as any, 0);
            const currentBadgeIds = new Set((user.badges || []).map(b => b.id));
            const uniqueNewBadges = newBadges.filter(b => !currentBadgeIds.has(b.id));
            const updatedBadges = [...(user.badges || []), ...uniqueNewBadges];
            await update(userRef, { points: newPoints, badges: updatedBadges });
            return { newPoints, newBadges: uniqueNewBadges };
        }
    } catch (e) { console.error(e); }
  },

  checkDailyLogin: async (userId: string) => {
    try {
        const userRef = ref(db, `users/${userId}`);
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
            const user = snapshot.val() as User;
            const lastLogin = user.lastLogin || 0;
            if (new Date(lastLogin).toDateString() !== new Date().toDateString()) {
                await StorageService.awardPoints(userId, POINT_VALUES.LOGIN_DAILY, 'login');
                await update(userRef, { lastLogin: Date.now() });
                return true;
            }
        }
        return false;
    } catch (e) { return false; }
  },

  completeChallenge: async (userId: string, challengeId: string, points: number) => {
    const userRef = ref(db, `users/${userId}`);
    const snapshot = await get(userRef);
    if (snapshot.exists()) {
        const user = snapshot.val() as User;
        const completed = user.completedChallenges || {};
        if (completed[challengeId]) return false;
        await update(userRef, { points: (user.points || 0) + points, completedChallenges: { ...completed, [challengeId]: Date.now() } });
        return true;
    }
    return false;
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
    await update(ref(db, `posts/${post.id}`), { likes: Math.max(0, isLiked ? post.likes - 1 : post.likes + 1) });
  },

  addComment: async (postId: string, comments: any[]) => {
    await update(ref(db, `posts/${postId}`), { comments });
    const newComment = comments[comments.length - 1];
    if (newComment) await StorageService.awardPoints(newComment.userId, POINT_VALUES.COMMENT, 'comment');
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
    await update(ref(db, `stories/${story.id}`), { likes: (story.likes || 0) + 1 });
  },

  markStoryViewed: async (storyId: string, user: User) => {
    await update(ref(db, `stories/${storyId}/viewers/${user.id}`), { userId: user.id, userName: user.name, userAvatar: user.avatar, timestamp: Date.now() });
  },

  // --- NOTIFICATIONS ---

  markNotificationRead: async (userId: string, notificationId: string) => {
    await update(ref(db, `notifications/${userId}/${notificationId}`), { isRead: true });
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
    if (destination.createdBy) await StorageService.awardPoints(destination.createdBy, POINT_VALUES.ADD_DESTINATION, 'destination');
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
    await update(ref(db, `destinations/${destinationId}`), { rating: newAvg, reviewsCount: newCount });
  },

  addPhotoToDestinationGallery: async (destinationId: string, currentGallery: string[], newImageUrl: string, userId?: string) => {
    await update(ref(db, `destinations/${destinationId}`), { gallery: [newImageUrl, ...(currentGallery || [])] });
    if (userId) await StorageService.awardPoints(userId, POINT_VALUES.ADD_PHOTO, 'photo');
  },

  // --- TRAVEL GROUPS ---

  createTravelGroup: async (groupData: Omit<TravelGroup, 'members' | 'templates'>) => {
      await set(ref(db, `travelGroups/${groupData.id}`), { ...groupData, members: { [groupData.adminId]: true } });
  },

  updateTravelGroup: async (groupId: string, updates: Partial<TravelGroup>) => {
      await update(ref(db, `travelGroups/${groupId}`), updates);
  },

  deleteTravelGroup: async (groupId: string) => {
      await remove(ref(db, `travelGroups/${groupId}`));
  },

  joinTravelGroup: async (groupId: string, userId: string) => {
      await update(ref(db, `travelGroups/${groupId}/members`), { [userId]: true });
  },

  leaveTravelGroup: async (groupId: string, userId: string) => {
      await remove(ref(db, `travelGroups/${groupId}/members/${userId}`));
  },

  addMemberToGroup: async (groupId: string, userId: string) => {
      await update(ref(db, `travelGroups/${groupId}/members`), { [userId]: true });
  },

  createTravelTemplate: async (template: TravelTemplate) => {
      await set(ref(db, `travelGroups/${template.groupId}/templates/${template.id}`), template);
  },

  deleteTravelTemplate: async (groupId: string, templateId: string) => {
      await remove(ref(db, `travelGroups/${groupId}/templates/${templateId}`));
  },

  // --- CHAT SYSTEM (ENHANCED OPTION A) ---

  getChatId: (userId1: string, userId2: string) => [userId1, userId2].sort().join('_'),

  initiateChat: async (currentUserId: string, targetUserId: string) => {
    const chatId = StorageService.getChatId(currentUserId, targetUserId);
    const chatRef = ref(db, `chats/${chatId}`);
    const snapshot = await get(chatRef);
    if (!snapshot.exists()) {
      await set(chatRef, { id: chatId, participants: [currentUserId, targetUserId], lastMessage: '', lastTimestamp: Date.now(), updatedAt: Date.now() });
    }
    return chatId;
  },

  sendMessage: async (chatId: string, senderId: string, text: string, type: Message['type'] = 'text', mediaUrl?: string | null, replyTo?: Message['replyTo']) => {
    const encryptedText = text ? EncryptionService.encrypt(text, chatId) : '';
    const encryptedMedia = mediaUrl ? EncryptionService.encrypt(mediaUrl, chatId) : null;
    const messageRef = push(ref(db, `chats/${chatId}/messages`));
    const payload: any = { id: messageRef.key!, senderId, text: encryptedText, type, timestamp: Date.now(), isRead: false };
    if (encryptedMedia) payload.mediaUrl = encryptedMedia;
    if (replyTo) payload.replyTo = replyTo;
    await set(messageRef, payload);

    let preview = encryptedText;
    if (type === 'image') preview = EncryptionService.encrypt('📷 Foto', chatId);
    if (type === 'audio') preview = EncryptionService.encrypt('🎤 Audio', chatId);
    await update(ref(db, `chats/${chatId}`), { lastMessage: preview, lastTimestamp: Date.now(), updatedAt: Date.now() });
  },

  updateMessageAI: async (chatId: string, messageId: string, aiMetadata: Partial<Message>) => {
    await update(ref(db, `chats/${chatId}/messages/${messageId}`), aiMetadata);
  },

  deleteMessage: async (chatId: string, messageId: string) => {
    await remove(ref(db, `chats/${chatId}/messages/${messageId}`));
  },

  deleteChat: async (chatId: string) => {
    await remove(ref(db, `chats/${chatId}`));
  },

  editMessage: async (chatId: string, messageId: string, newText: string) => {
    await update(ref(db, `chats/${chatId}/messages/${messageId}`), { text: EncryptionService.encrypt(newText, chatId) });
  },

  markChatAsRead: async (chatId: string, currentUserId: string) => {
    const messagesRef = ref(db, `chats/${chatId}/messages`);
    const snapshot = await get(messagesRef);
    if (snapshot.exists()) {
      const updates: any = {};
      snapshot.forEach((child) => {
        const msg = child.val();
        if (!msg.isRead && msg.senderId !== currentUserId) updates[`${child.key}/isRead`] = true;
      });
      if (Object.keys(updates).length > 0) await update(messagesRef, updates);
    }
  },

  updateDestinationCover: async (id: string, url: string) => { await update(ref(db, `destinations/${id}`), { imageUrl: url }); },
  removeDestinationPhoto: async (id: string, gallery: string[], url: string) => { await update(ref(db, `destinations/${id}`), { gallery: gallery.filter(u => u !== url) }); },
  clearAll: async () => { await set(ref(db), null); localStorage.clear(); window.location.reload(); }
};
