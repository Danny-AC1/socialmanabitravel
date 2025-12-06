import { Post, Story, Destination } from './types';

export const ALL_DESTINATIONS: Destination[] = [
  {
    id: 'd0',
    name: 'Parque Nacional Machalilla',
    location: 'Puerto López',
    region: 'Costa',
    province: 'Manabí',
    description: 'El tesoro natural más importante de la costa. Bosques, playas y ballenas.',
    fullDescription: 'El Parque Nacional Machalilla es una de las áreas protegidas más extensas de la costa ecuatoriana. Comprende dos zonas: una terrestre (56.184 has) y una marina (14.430 has). Es un verdadero santuario de biodiversidad que protege bosques secos y húmedos tropicales. Es el hogar de piqueros, monos aulladores y el escenario principal para el avistamiento de ballenas jorobadas de junio a septiembre.',
    imageUrl: 'https://images.unsplash.com/photo-1598384232375-a010488950d4?q=80&w=1200&auto=format&fit=crop', // Real Puerto Lopez/Machalilla vibe
    gallery: [
      'https://images.unsplash.com/photo-1622312270830-22c507117188?q=80&w=800&auto=format&fit=crop', // Whales
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800&auto=format&fit=crop', // Beach
    ],
    highlights: [
      'Playa Los Frailes',
      'Isla de la Plata',
      'Avistamiento de Ballenas Jorobadas',
      'Sendero Ecológico Bola de Oro'
    ],
    travelTips: [
      'Regístrate en la entrada (es gratis).',
      'Lleva suficiente agua, el clima es seco y caluroso.',
      'Respeta la fauna silvestre.'
    ],
    category: 'Naturaleza',
    rating: 5.0,
    priceLevel: 'Gratis'
  },
  {
    id: 'd100',
    name: 'Volcán Cotopaxi',
    location: 'Latacunga',
    region: 'Sierra',
    province: 'Cotopaxi',
    description: 'El volcán activo más alto del mundo y símbolo de los Andes.',
    fullDescription: 'El Parque Nacional Cotopaxi alberga uno de los volcanes activos más bellos del mundo, con su cono perfecto cubierto de nieve. A solo dos horas de Quito, es un destino imperdible para amantes de la montaña. Puedes visitar la laguna de Limpiopungo o subir hasta el refugio José Ribas.',
    imageUrl: 'https://images.unsplash.com/photo-1563297129-37803e726488?q=80&w=1200&auto=format&fit=crop', // Real Cotopaxi
    gallery: ['https://images.unsplash.com/photo-1542665093-a4e92b3c4850?q=80&w=800&auto=format&fit=crop'],
    highlights: ['Refugio José Ribas', 'Laguna de Limpiopungo', 'Senderismo de altura'],
    travelTips: ['Lleva ropa muy abrigada.', 'Toma té de coca para el soroche.', 'Llega temprano.'],
    category: 'Montaña',
    rating: 4.9,
    priceLevel: 'Gratis'
  },
  {
    id: 'd101',
    name: 'Islas Galápagos',
    location: 'Archipiélago de Colón',
    region: 'Insular',
    province: 'Galápagos',
    description: 'Laboratorio viviente de la evolución y patrimonio de la humanidad.',
    fullDescription: 'Las Islas Galápagos son un archipiélago volcánico único en el mundo, famoso por su vasta cantidad de especies endémicas que inspiraron a Charles Darwin. Aquí puedes nadar con lobos marinos, ver tortugas gigantes en libertad y piqueros de patas azules sin miedo a los humanos.',
    imageUrl: 'https://images.unsplash.com/photo-1516641396056-0ce60a85d49f?q=80&w=1200&auto=format&fit=crop', // Real Galapagos
    gallery: ['https://images.unsplash.com/photo-1596489397685-6e0a8118029d?q=80&w=800&auto=format&fit=crop'],
    highlights: ['Tortuga Bay', 'Kicker Rock', 'Estación Charles Darwin'],
    travelTips: ['Paga la entrada al parque en el aeropuerto.', 'No toques a los animales.', 'Usa bloqueador biodegradable.'],
    category: 'Naturaleza',
    rating: 5.0,
    priceLevel: '$$$$'
  },
  {
    id: 'd1',
    name: 'Playa Los Frailes',
    location: 'Puerto López',
    region: 'Costa',
    province: 'Manabí',
    description: 'Considerada una de las playas más hermosas de Ecuador. Arena blanca y aguas cristalinas.',
    fullDescription: 'Los Frailes es una playa en forma de media luna, protegida dentro del Parque Nacional Machalilla. Es famosa por su arena blanca impecable, aguas color turquesa y bosque seco tropical circundante.',
    imageUrl: 'https://images.unsplash.com/photo-1620668045956-6511b8b21245?q=80&w=1200&auto=format&fit=crop', // Beach vibe
    gallery: [
      'https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?q=80&w=800&auto=format&fit=crop', 
    ],
    highlights: ['Mirador Las Fragatas', 'Playa Tortuguita', 'Snorkel en la orilla'],
    travelTips: ['Entrada gratuita.', 'Horario: 08:00 a 16:00.', 'No venden comida adentro.'],
    category: 'Playa',
    rating: 5.0,
    priceLevel: 'Gratis'
  },
  {
    id: 'd200',
    name: 'Parque Nacional Yasuní',
    location: 'Orellana',
    region: 'Amazonía',
    province: 'Orellana',
    description: 'El lugar más biodiverso del planeta por metro cuadrado.',
    fullDescription: 'El Parque Nacional Yasuní es una reserva de la biosfera en el corazón de la Amazonía ecuatoriana. Es hogar de comunidades indígenas no contactadas y una diversidad de flora y fauna inigualable.',
    imageUrl: 'https://images.unsplash.com/photo-1627921200830-47402d242491?q=80&w=1200&auto=format&fit=crop', // Amazon vibe
    gallery: ['https://images.unsplash.com/photo-1549806541-6927959082cd?q=80&w=800&auto=format&fit=crop'],
    highlights: ['Saladeros de loros', 'Avistamiento de delfines rosados', 'Caminatas nocturnas'],
    travelTips: ['Vacúnate contra la fiebre amarilla.', 'Lleva repelente fuerte.', 'Contrata guías certificados.'],
    category: 'Selva',
    rating: 4.9,
    priceLevel: '$$$'
  }
];

export const INITIAL_STORIES: Story[] = [];
export const INITIAL_POSTS: Post[] = [];