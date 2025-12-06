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
    imageUrl: 'https://picsum.photos/id/1036/1200/600',
    gallery: [
      'https://picsum.photos/id/1036/800/400',
      'https://picsum.photos/id/1011/800/400',
      'https://picsum.photos/id/1039/800/400'
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
    imageUrl: 'https://picsum.photos/id/1015/1200/600',
    gallery: ['https://picsum.photos/id/1016/800/400'],
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
    imageUrl: 'https://picsum.photos/id/1040/1200/600',
    gallery: ['https://picsum.photos/id/1041/800/400'],
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
    imageUrl: 'https://picsum.photos/id/1036/800/600',
    gallery: [
      'https://picsum.photos/id/1036/800/400', 
      'https://picsum.photos/id/164/400/400'
    ],
    highlights: ['Mirador Las Fragatas', 'Playa Tortuguita', 'Snorkel en la orilla'],
    travelTips: ['Entrada gratuita.', 'Horario: 08:00 a 16:00.', 'No venden comida adentro.'],
    category: 'Playa',
    rating: 5.0,
    priceLevel: 'Gratis'
  },
  {
    id: 'd8',
    name: 'Playa de Canoa',
    location: 'San Vicente',
    region: 'Costa',
    province: 'Manabí',
    description: 'Paraíso del surf y ambiente relajado bohemio.',
    fullDescription: 'Canoa es una playa extensa de 17km, famosa internacionalmente por sus condiciones ideales para aprender surf. Tiene un ambiente relajado, joven y bohemio.',
    imageUrl: 'https://picsum.photos/id/1016/800/600',
    gallery: ['https://picsum.photos/id/1016/800/400'],
    highlights: ['Clases de Surf', 'Parapente', 'Vida nocturna'],
    travelTips: ['Alquiler de tabla: $5/hora.', 'Prueba los batidos de frutas.'],
    category: 'Aventura',
    rating: 4.7,
    priceLevel: '$ - $$'
  },
  {
    id: 'd200',
    name: 'Parque Nacional Yasuní',
    location: 'Orellana',
    region: 'Amazonía',
    province: 'Orellana',
    description: 'El lugar más biodiverso del planeta por metro cuadrado.',
    fullDescription: 'El Parque Nacional Yasuní es una reserva de la biosfera en el corazón de la Amazonía ecuatoriana. Es hogar de comunidades indígenas no contactadas y una diversidad de flora y fauna inigualable.',
    imageUrl: 'https://picsum.photos/id/1043/1200/600',
    gallery: ['https://picsum.photos/id/1044/800/400'],
    highlights: ['Saladeros de loros', 'Avistamiento de delfines rosados', 'Caminatas nocturnas'],
    travelTips: ['Vacúnate contra la fiebre amarilla.', 'Lleva repelente fuerte.', 'Contrata guías certificados.'],
    category: 'Selva',
    rating: 4.9,
    priceLevel: '$$$'
  }
];

export const INITIAL_STORIES: Story[] = [];
export const INITIAL_POSTS: Post[] = [];