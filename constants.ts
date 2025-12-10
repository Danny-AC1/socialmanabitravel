
import { Post, Story, Destination } from './types';

// --- VERSION CONTROL ---
export const APP_VERSION = '1.2.0';

export const RELEASE_NOTES = [
  {
    title: "¡Tu Pasaporte Digital ha evolucionado!",
    date: "Actualización Reciente",
    changes: [
      { type: 'new', text: "Mapa de Vida: Ahora puedes ver un mapa interactivo con tu historial de viajes en tu perfil." },
      { type: 'new', text: "Radar Local: Usa '¿Qué hay cerca?' en Explorar para encontrar restaurantes y sitios abiertos en tiempo real." },
      { type: 'new', text: "Desafíos Diarios: Gana XP completando misiones y trivias cada día." },
      { type: 'improved', text: "Guía IA: Respuestas más rápidas, precisas y visualmente ordenadas." },
      { type: 'improved', text: "Itinerarios: Nuevo diseño de línea de tiempo con horarios detallados." }
    ]
  }
];

export const ALL_DESTINATIONS: Destination[] = [];

export const INITIAL_STORIES: Story[] = [];
export const INITIAL_POSTS: Post[] = [];
