
import { Badge, User } from './types';

// --- MEDIA & FILE UTILS ---

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

/**
 * Comprime un video utilizando Canvas y MediaRecorder.
 * Mantiene alta calidad usando un bitrate elevado (6Mbps) y limitando a 1080p.
 */
const compressVideo = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.src = URL.createObjectURL(file);
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = "anonymous";

    video.onloadedmetadata = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Calidad de Cine: Max 1080p (Full HD)
      const MAX_WIDTH = 1920; 
      let width = video.videoWidth;
      let height = video.videoHeight;

      if (width > MAX_WIDTH) {
        height = height * (MAX_WIDTH / width);
        width = MAX_WIDTH;
      }

      canvas.width = width;
      canvas.height = height;

      // Intentar usar códecs modernos para máxima eficiencia
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') 
        ? 'video/webm;codecs=vp9' 
        : 'video/webm';

      // Bitrate de 6Mbps para "No pérdida de calidad" perceptible en móviles
      const mediaRecorder = new MediaRecorder(canvas.captureStream(30), {
        mimeType: mimeType,
        videoBitsPerSecond: 6000000 
      });

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          URL.revokeObjectURL(video.src);
          resolve(reader.result as string);
        };
        reader.onerror = (e) => reject(e);
      };

      // Iniciar proceso de dibujado por frames
      mediaRecorder.start();
      video.play();
      
      const renderFrame = () => {
        if (video.paused || video.ended) {
          mediaRecorder.stop();
          return;
        }
        if (ctx) ctx.drawImage(video, 0, 0, width, height);
        requestAnimationFrame(renderFrame);
      };
      
      renderFrame();
    };

    video.onerror = () => reject(new Error("Error al procesar el video."));
  });
};

export const validateVideo = async (file: File): Promise<string> => {
  // Umbral de 30MB para videos pesados
  const HEAVY_THRESHOLD = 30 * 1024 * 1024;

  if (file.size > HEAVY_THRESHOLD) {
    console.log("Video pesado detectado. Aplicando compresión de alta fidelidad...");
    try {
      return await compressVideo(file);
    } catch (error) {
      console.error("Fallo la compresión, cargando original...", error);
    }
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

export const downloadMedia = async (url: string, filename: string) => {
  try {
    if (url.startsWith('data:')) {
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
    }
    const response = await fetch(url);
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
  } catch (error) {
    window.open(url, '_blank');
  }
};

export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; 
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

const ECUADOR_LOCATIONS: Record<string, { lat: number, lng: number }> = {
    'manta': { lat: -0.95, lng: -80.73 },
    'portoviejo': { lat: -1.05, lng: -80.45 },
    'puerto lopez': { lat: -1.56, lng: -80.81 },
    'los frailes': { lat: -1.50, lng: -80.80 },
    'machalilla': { lat: -1.48, lng: -80.76 },
    'montecristi': { lat: -1.04, lng: -80.66 },
    'crucita': { lat: -0.87, lng: -80.53 },
    'canoa': { lat: -0.46, lng: -80.45 },
    'quito': { lat: -0.18, lng: -78.46 },
    'guayaquil': { lat: -2.18, lng: -79.88 }
};

export const getCoordinatesFromLocationName = (locationName: string): { lat: number, lng: number } | null => {
    if (!locationName) return null;
    const cleanName = locationName.toLowerCase().trim();
    if (ECUADOR_LOCATIONS[cleanName]) return ECUADOR_LOCATIONS[cleanName];
    for (const [key, coords] of Object.entries(ECUADOR_LOCATIONS)) {
        if (cleanName.includes(key)) return coords;
    }
    return null;
};

export const ADMIN_EMAILS = ["danny.asc25@gmail.com", "d.e.a.c@outlook.com"];
export const isAdmin = (email: string | undefined): boolean => {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase().trim());
};

export const POINT_VALUES = { LOGIN_DAILY: 10, POST: 15, STORY: 10, COMMENT: 5, ADD_DESTINATION: 50, ADD_PHOTO: 20, SHARE: 5 };
export const BADGES: Badge[] = [
  { id: 'b_novato', name: 'Primeros Pasos', icon: '🐣', description: 'Crea tu primera publicación.' },
  { id: 'b_fotografo', name: 'Ojo Fotográfico', icon: '📸', description: 'Publica 5 fotos o videos.' },
  { id: 'b_social', name: 'Alma de la Fiesta', icon: '💬', description: 'Comenta en 10 publicaciones.' },
  { id: 'b_explorador', name: 'Explorador', icon: '🧭', description: 'Agrega un nuevo destino turístico.' },
  { id: 'b_contribuidor', name: 'Guía Local', icon: '🗺️', description: 'Sube 3 fotos a galerías de destinos.' }
];

export const LEVELS = [
  { name: 'Turista Curioso', minPoints: 0, color: 'text-stone-500', icon: '🌱' },
  { name: 'Mochilero', minPoints: 100, color: 'text-blue-500', icon: '🎒' },
  { name: 'Aventurero', minPoints: 300, color: 'text-green-600', icon: '🧭' },
  { name: 'Guía Local', minPoints: 600, color: 'text-purple-600', icon: '🗺️' },
  { name: 'Leyenda de Ecuador', minPoints: 1500, color: 'text-amber-500', icon: '👑' }
];

export const getUserLevel = (points: number = 0) => [...LEVELS].reverse().find(l => points >= l.minPoints) || LEVELS[0];
export const getNextLevel = (points: number = 0) => LEVELS.find(l => l.minPoints > points) || null;

export const checkNewBadges = (user: User, action: string, totalActionCount?: number): Badge[] => {
  const currentBadges = user.badges || [];
  const hasBadge = (id: string) => currentBadges.some(b => b.id === id);
  const newBadges: Badge[] = [];
  if (action === 'post' && !hasBadge('b_novato')) newBadges.push(BADGES.find(b => b.id === 'b_novato')!);
  return newBadges;
};
