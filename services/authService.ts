import { User } from '../types';

const KEYS = {
  USERS: 'manabi_users_v1',
  CURRENT_SESSION: 'manabi_session_v1'
};

export const AuthService = {
  // Get all registered users
  getUsers: (): User[] => {
    try {
      const stored = localStorage.getItem(KEYS.USERS);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  getUserById: (id: string): User | undefined => {
    const users = AuthService.getUsers();
    return users.find(u => u.id === id);
  },

  // Save users list
  saveUsers: (users: User[]) => {
    localStorage.setItem(KEYS.USERS, JSON.stringify(users));
  },

  // Register a new user
  register: (name: string, email: string, password: string, bio: string, customAvatar?: string): User => {
    const users = AuthService.getUsers();
    
    if (users.find(u => u.email === email)) {
      throw new Error('El correo electrónico ya está registrado.');
    }

    const newUser: User = {
      id: `u_${Date.now()}`,
      name,
      email,
      password, // In a real app, never store plain text passwords!
      bio: bio || 'Explorando Manabí 🌴',
      // Use custom avatar if provided, else generate one
      avatar: customAvatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${name.replace(/\s/g, '')}&backgroundColor=b6e3f4`,
      followers: [],
      following: []
    };

    users.push(newUser);
    AuthService.saveUsers(users);
    AuthService.setSession(newUser);
    return newUser;
  },

  // Login existing user
  login: (email: string, pass: string): User => {
    const users = AuthService.getUsers();
    const user = users.find(u => u.email === email && u.password === pass);
    
    if (!user) {
      throw new Error('Credenciales incorrectas.');
    }

    // Refresh user data from DB to session to ensure latest followers/following
    AuthService.setSession(user);
    return user;
  },

  // Update User Avatar
  updateUserAvatar: (userId: string, newAvatar: string): User => {
    const users = AuthService.getUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) throw new Error("Usuario no encontrado");

    // Update in list
    users[userIndex].avatar = newAvatar;
    AuthService.saveUsers(users);

    // Update session if it's the current user
    const session = AuthService.getSession();
    if (session && session.id === userId) {
      session.avatar = newAvatar;
      AuthService.setSession(session);
    }

    return users[userIndex];
  },

  // Toggle Follow
  toggleFollow: (currentUserId: string, targetUserId: string): { currentUser: User, targetUser: User } => {
    const users = AuthService.getUsers();
    const currentUserIdx = users.findIndex(u => u.id === currentUserId);
    const targetUserIdx = users.findIndex(u => u.id === targetUserId);

    if (currentUserIdx === -1 || targetUserIdx === -1) throw new Error("Usuario no encontrado");

    const currentUser = users[currentUserIdx];
    const targetUser = users[targetUserIdx];

    const isFollowing = currentUser.following.includes(targetUserId);

    if (isFollowing) {
      // Unfollow
      currentUser.following = currentUser.following.filter(id => id !== targetUserId);
      targetUser.followers = targetUser.followers.filter(id => id !== currentUserId);
    } else {
      // Follow
      currentUser.following.push(targetUserId);
      targetUser.followers.push(currentUserId);
    }

    users[currentUserIdx] = currentUser;
    users[targetUserIdx] = targetUser;
    
    AuthService.saveUsers(users);
    AuthService.setSession(currentUser); // Update session

    return { currentUser, targetUser };
  },

  // Set current active session
  setSession: (user: User) => {
    localStorage.setItem(KEYS.CURRENT_SESSION, JSON.stringify(user));
  },

  // Get current session
  getSession: (): User | null => {
    try {
      const stored = localStorage.getItem(KEYS.CURRENT_SESSION);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  },

  // Logout
  logout: () => {
    localStorage.removeItem(KEYS.CURRENT_SESSION);
  }
};