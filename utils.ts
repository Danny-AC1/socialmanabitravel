

import { Badge, User, Challenge } from './types';

export const resizeImage = (file: File, maxWidth = 800, quality = 0.7): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const elem = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxWidth) {
            width *= maxWidth / height;
            height = maxWidth;
          }
        }

        elem.width = width;
        elem.height = height;
        const ctx = elem.getContext('2d');
        
        if (!ctx) {
            reject(new Error("Could not get canvas context"));
            return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        resolve(elem.toDataURL('image/jpeg', quality));
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

export const validateVideo = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    // 1. Check file size (limit to 10MB for base64 safety in this demo)
    const MAX_SIZE_MB = 10;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      reject(new Error(`El video es demasiado pesado. Máximo ${MAX_SIZE_MB}MB.`));
      return;
    }

    const video = document.createElement('video');
    video.preload = 'metadata';

    video.onloadedmetadata = function() {
      window.URL.revokeObjectURL(video.src);
      // 2. Check duration (Max 60 seconds)
      if (video.duration > 60) {
        reject(new Error("El video no puede durar más de 1 minuto."));
        return;
      }
      
      // Convert to Base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        resolve(reader.result as string);
      };
      reader.onerror = (error) => reject(error);
    };

    video.onerror = () => reject(new Error("Archivo de video inválido."));

    video.src = URL.createObjectURL(file);
  });
};

/**
 * Calcula la distancia en Kilómetros entre dos puntos geográficos
 * usando la fórmula de Haversine.
 */
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Radio de la tierra en km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distancia en km
  return d;
};

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

// --- SECURITY UTILS ---

export const ADMIN_EMAILS = ["danny.asc25@gmail.com", "d.e.a.c@outlook.com"];

export const isAdmin = (email: string | undefined): boolean => {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase().trim());
};

// --- GAMIFICATION UTILS ---

// 1. Valores de Puntos
export const POINT_VALUES = {
  LOGIN_DAILY: 10,
  POST: 15,
  STORY: 10,
  COMMENT: 5,
  ADD_DESTINATION: 50,
  ADD_PHOTO: 20,
  SHARE: 5,
  CHALLENGE_EASY: 30,
  CHALLENGE_HARD: 50
};

// 2. Lista de Insignias
export const BADGES: Badge[] = [
  { id: 'b_novato', name: 'Primeros Pasos', icon: '🐣', description: 'Crea tu primera publicación.' },
  { id: 'b_fotografo', name: 'Ojo Fotográfico', icon: '📸', description: 'Publica 5 fotos o videos.' },
  { id: 'b_social', name: 'Alma de la Fiesta', icon: '💬', description: 'Comenta en 10 publicaciones.' },
  { id: 'b_explorador', name: 'Explorador', icon: '🧭', description: 'Agrega un nuevo destino turístico.' },
  { id: 'b_contribuidor', name: 'Guía Local', icon: '🗺️', description: 'Sube 3 fotos a galerías de destinos.' },
  { id: 'b_influencer', name: 'Influencer', icon: '🌟', description: 'Alcanza los 500 puntos de explorador.' },
  { id: 'b_viajero_experto', name: 'Viajero Experto', icon: '✈️', description: 'Alcanza los 1000 puntos de explorador.' },
  { id: 'b_embajador', name: 'Embajador', icon: '👑', description: 'Agrega 3 destinos y alcanza 2000 puntos.' }
];

export const LEVELS = [
  { name: 'Turista Curioso', minPoints: 0, color: 'text-stone-500', icon: '🌱' },
  { name: 'Mochilero', minPoints: 100, color: 'text-blue-500', icon: '🎒' },
  { name: 'Aventurero', minPoints: 300, color: 'text-green-600', icon: '🧭' },
  { name: 'Guía Local', minPoints: 600, color: 'text-purple-600', icon: '🗺️' },
  { name: 'Leyenda de Ecuador', minPoints: 1500, color: 'text-amber-500', icon: '👑' }
];

export const getUserLevel = (points: number = 0) => {
  // Encontrar el nivel más alto alcanzado
  return [...LEVELS].reverse().find(l => points >= l.minPoints) || LEVELS[0];
};

export const getNextLevel = (points: number = 0) => {
  return LEVELS.find(l => l.minPoints > points) || null;
};

// Lógica para verificar nuevas insignias
export const checkNewBadges = (user: User, action: 'post' | 'comment' | 'destination' | 'photo' | 'points', totalActionCount?: number): Badge[] => {
  const currentBadges = user.badges || [];
  const hasBadge = (id: string) => currentBadges.some(b => b.id === id);
  const newBadges: Badge[] = [];
  const points = user.points || 0;

  // Badge: Novato (Primer Post)
  if (action === 'post' && !hasBadge('b_novato')) {
     newBadges.push(BADGES.find(b => b.id === 'b_novato')!);
  }

  // Badge: Fotógrafo (5 Posts - requires tracking count, simulating check)
  // En una app real, leeríamos el count exacto. Aquí asumimos que si ganó puntos por post, chequeamos.
  if (action === 'post' && !hasBadge('b_fotografo') && (totalActionCount || 0) >= 5) {
     newBadges.push(BADGES.find(b => b.id === 'b_fotografo')!);
  }

  // Badge: Social (10 Comentarios)
  if (action === 'comment' && !hasBadge('b_social') && (totalActionCount || 0) >= 10) {
     newBadges.push(BADGES.find(b => b.id === 'b_social')!);
  }

  // Badge: Explorador (1 Destino)
  if (action === 'destination' && !hasBadge('b_explorador')) {
     newBadges.push(BADGES.find(b => b.id === 'b_explorador')!);
  }

  // Badge: Contribuidor (3 Fotos)
  if (action === 'photo' && !hasBadge('b_contribuidor') && (totalActionCount || 0) >= 3) {
     newBadges.push(BADGES.find(b => b.id === 'b_contribuidor')!);
  }

  // Badges por Puntos
  if (points >= 500 && !hasBadge('b_influencer')) newBadges.push(BADGES.find(b => b.id === 'b_influencer')!);
  if (points >= 1000 && !hasBadge('b_viajero_experto')) newBadges.push(BADGES.find(b => b.id === 'b_viajero_experto')!);

  return newBadges;
};

// --- CHALLENGES SYSTEM ---

const CHALLENGES_POOL: Challenge[] = [
  {
    id: 'ch_sunset',
    title: 'Hora Dorada',
    description: 'Comparte tu mejor foto de un atardecer en Ecuador.',
    type: 'photo',
    points: 30,
    icon: '🌅',
    actionLabel: 'Subir Foto'
  },
  {
    id: 'ch_foodie',
    title: 'Sabor Criollo',
    description: 'Sube una foto de tu plato típico favorito.',
    type: 'photo',
    points: 30,
    icon: '🍤',
    actionLabel: 'Compartir Plato'
  },
  {
    id: 'ch_trivia_1',
    title: 'Trivia Manabita',
    description: '¿Cuál es la capital de la provincia de Manabí?',
    type: 'trivia',
    points: 20,
    icon: '🧠',
    actionLabel: 'Responder',
    question: '¿Cuál es la capital de la provincia de Manabí?',
    options: ['Manta', 'Portoviejo', 'Montecristi', 'Chone'],
    correctAnswer: 1 // Portoviejo
  },
  {
    id: 'ch_nature',
    title: 'Verde que te quiero verde',
    description: 'Comparte una foto donde la naturaleza sea protagonista.',
    type: 'photo',
    points: 30,
    icon: '🌿',
    actionLabel: 'Subir Foto'
  },
  {
    id: 'ch_trivia_2',
    title: 'Experto en Playas',
    description: '¿Dónde queda la playa de Los Frailes?',
    type: 'trivia',
    points: 20,
    icon: '🏖️',
    actionLabel: 'Adivinar',
    question: '¿En qué parque nacional se encuentra la playa de Los Frailes?',
    options: ['Machalilla', 'Yasuní', 'Cotopaxi', 'Podocarpus'],
    correctAnswer: 0 // Machalilla
  },
  {
    id: 'ch_selfie',
    title: 'Selfie Viajero',
    description: '¡Queremos ver tu sonrisa! Sube una selfie en tu lugar favorito.',
    type: 'photo',
    points: 35,
    icon: '🤳',
    actionLabel: 'Tomar Selfie'
  }
];

export const getDailyChallenge = (): Challenge => {
  // Algoritmo simple para seleccionar un desafío basado en el día del año
  // Esto asegura que todos los usuarios vean el mismo desafío el mismo día
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  
  const index = dayOfYear % CHALLENGES_POOL.length;
  return CHALLENGES_POOL[index];
};