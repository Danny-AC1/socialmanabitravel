import { Post, Story } from '../types';
import { INITIAL_POSTS, INITIAL_STORIES } from '../constants';

const KEYS = {
  POSTS: 'manabi_posts_v2', // Updated to v2 to clear old generic data
  STORIES: 'manabi_stories_v2', // Updated to v2
  USER_LIKES: 'manabi_user_likes_v1' // Can stay v1 as likes on deleted posts don't matter much
};

export const StorageService = {
  getPosts: (): Post[] => {
    try {
      const stored = localStorage.getItem(KEYS.POSTS);
      return stored ? JSON.parse(stored) : INITIAL_POSTS;
    } catch (e) {
      return INITIAL_POSTS;
    }
  },

  savePosts: (posts: Post[]) => {
    localStorage.setItem(KEYS.POSTS, JSON.stringify(posts));
  },

  getStories: (): Story[] => {
    try {
      const stored = localStorage.getItem(KEYS.STORIES);
      return stored ? JSON.parse(stored) : INITIAL_STORIES;
    } catch (e) {
      return INITIAL_STORIES;
    }
  },

  saveStories: (stories: Story[]) => {
    localStorage.setItem(KEYS.STORIES, JSON.stringify(stories));
  },
  
  // Reset data for demo purposes if needed
  clearAll: () => {
    localStorage.removeItem(KEYS.POSTS);
    localStorage.removeItem(KEYS.STORIES);
    window.location.reload();
  }
};