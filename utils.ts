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

// --- SECURITY UTILS ---

export const ADMIN_EMAILS = [
  "danny.asc25@gmail.com", 
  "d.e.a.c@outlook.com"
];

export const isAdmin = (email: string | undefined): boolean => {
  if (!email) return false;
  // Comparamos el email limpio (minúsculas y sin espacios) con la lista oficial
  return ADMIN_EMAILS.includes(email.toLowerCase().trim());
};