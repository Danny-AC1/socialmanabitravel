import { ref, get, set, child, update } from "firebase/database";
import { db } from "./firebase";
import { User } from '../types';

export const AuthService = {
  // Obtener todos los usuarios (Async)
  getUsers: async (): Promise<User[]> => {
    try {
      const dbRef = ref(db);
      const snapshot = await get(child(dbRef, `users`));
      if (snapshot.exists()) {
        return Object.values(snapshot.val());
      } else {
        return [];
      }
    } catch (error) {
      console.error(error);
      return [];
    }
  },

  // Obtener un usuario por ID (Async)
  getUserById: async (id: string): Promise<User | undefined> => {
    try {
      const dbRef = ref(db);
      const snapshot = await get(child(dbRef, `users/${id}`));
      if (snapshot.exists()) {
        return snapshot.val();
      }
      return undefined;
    } catch {
      return undefined;
    }
  },

  // Registro en la Nube
  register: async (name: string, email: string, password: string, bio: string, customAvatar?: string): Promise<User> => {
    const users = await AuthService.getUsers();
    
    if (users.find(u => u.email === email)) {
      throw new Error('El correo electrónico ya está registrado.');
    }

    const userId = `u_${Date.now()}`;
    const newUser: User = {
      id: userId,
      name,
      email,
      password, 
      bio: bio || 'Explorando Ecuador 🇪🇨',
      avatar: customAvatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${name.replace(/\s/g, '')}&backgroundColor=b6e3f4`,
      followers: [],
      following: []
    };

    // Guardar en Firebase
    await set(ref(db, 'users/' + userId), newUser);
    
    AuthService.setSession(newUser);
    return newUser;
  },

  // Login validando con la Nube
  login: async (email: string, pass: string): Promise<User> => {
    const users = await AuthService.getUsers();
    const user = users.find(u => u.email === email && u.password === pass);
    
    if (!user) {
      throw new Error('Credenciales incorrectas.');
    }

    AuthService.setSession(user);
    return user;
  },

  // Simulación de reseteo de contraseña
  resetPassword: async (email: string): Promise<void> => {
    const users = await AuthService.getUsers();
    const user = users.find(u => u.email === email);
    
    if (!user) {
      throw new Error('No encontramos una cuenta con este correo.');
    }

    // En un sistema real aquí se enviaría un email. 
    // Como es Firebase RTDB sin Auth real, simulamos el éxito.
    // Opcional: Podríamos cambiar la contraseña a una temporal, pero es arriesgado sin validar email real.
    return new Promise(resolve => setTimeout(resolve, 1000));
  },

  updateUserAvatar: async (userId: string, newAvatar: string): Promise<User> => {
    const updates: any = {};
    updates[`/users/${userId}/avatar`] = newAvatar;
    
    await update(ref(db), updates);

    // Actualizar sesión local si es necesario
    const session = AuthService.getSession();
    if (session && session.id === userId) {
      session.avatar = newAvatar;
      AuthService.setSession(session);
      return session;
    }
    
    // Si no hay sesión, devolver el usuario actualizado parcialmente
    return { ...session!, avatar: newAvatar };
  },

  updateUserName: async (userId: string, newName: string): Promise<User> => {
    const updates: any = {};
    updates[`/users/${userId}/name`] = newName;
    
    await update(ref(db), updates);

    const session = AuthService.getSession();
    if (session && session.id === userId) {
      session.name = newName;
      AuthService.setSession(session);
      return session;
    }
    return { ...session!, name: newName };
  },

  toggleFollow: async (currentUserId: string, targetUserId: string) => {
    const currentUser = await AuthService.getUserById(currentUserId);
    const targetUser = await AuthService.getUserById(targetUserId);

    if (!currentUser || !targetUser) throw new Error("Usuario no encontrado");

    // Inicializar arrays si no existen (Firebase no guarda arrays vacíos)
    if (!currentUser.following) currentUser.following = [];
    if (!targetUser.followers) targetUser.followers = [];

    const isFollowing = currentUser.following.includes(targetUserId);

    let newFollowing = [...currentUser.following];
    let newFollowers = [...targetUser.followers];

    if (isFollowing) {
      newFollowing = newFollowing.filter(id => id !== targetUserId);
      newFollowers = newFollowers.filter(id => id !== currentUserId);
    } else {
      newFollowing.push(targetUserId);
      newFollowers.push(currentUserId);
    }

    // Actualizar en Firebase
    const updates: any = {};
    updates[`/users/${currentUserId}/following`] = newFollowing;
    updates[`/users/${targetUserId}/followers`] = newFollowers;

    await update(ref(db), updates);

    // Actualizar sesión local
    currentUser.following = newFollowing;
    AuthService.setSession(currentUser);
  },

  setSession: (user: User) => {
    localStorage.setItem('manabi_session_v1', JSON.stringify(user));
  },

  getSession: (): User | null => {
    try {
      const stored = localStorage.getItem('manabi_session_v1');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  },

  logout: () => {
    localStorage.removeItem('manabi_session_v1');
  }
};