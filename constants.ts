import { Post, Story, Destination } from './types';

export const ALL_DESTINATIONS: Destination[] = [
  // PARQUE MACHALILLA (Featured Main Entry)
  {
    id: 'd0',
    name: 'Parque Nacional Machalilla',
    location: 'Costa Sur de Manabí',
    description: 'El tesoro natural más importante de la costa. Bosques, playas y ballenas.',
    fullDescription: 'El Parque Nacional Machalilla es una de las áreas protegidas más extensas de la costa ecuatoriana. Comprende dos zonas: una terrestre (56.184 has) y una marina (14.430 has). Es un verdadero santuario de biodiversidad que protege bosques secos y húmedos tropicales. Es el hogar de piqueros, monos aulladores y el escenario principal para el avistamiento de ballenas jorobadas de junio a septiembre. Incluye atractivos famosos como la Playa de los Frailes, Isla de la Plata y la Comuna Agua Blanca.',
    imageUrl: 'https://picsum.photos/id/1036/1200/600',
    gallery: [
      'https://picsum.photos/id/1036/800/400',
      'https://picsum.photos/id/1011/800/400',
      'https://picsum.photos/id/1039/800/400'
    ],
    highlights: [
      'Playa Los Frailes',
      'Isla de la Plata (Pequeña Galápagos)',
      'Avistamiento de Ballenas Jorobadas',
      'Sendero Ecológico Bola de Oro'
    ],
    travelTips: [
      'Regístrate en la entrada (es gratis).',
      'Lleva suficiente agua, el clima es seco y caluroso.',
      'Respeta la fauna silvestre, no alimentes a los animales.',
      'Usa protector solar biodegradable.'
    ],
    category: 'Naturaleza',
    rating: 5.0,
    priceLevel: 'Gratis'
  },
  // PARQUE MACHALILLA (Sub-destinations)
  {
    id: 'd1',
    name: 'Playa Los Frailes',
    location: 'Parque Nacional Machalilla',
    description: 'Considerada una de las playas más hermosas de Ecuador. Arena blanca y aguas cristalinas.',
    fullDescription: 'Los Frailes es una playa en forma de media luna, protegida dentro del Parque Nacional Machalilla. Es famosa por su arena blanca impecable, aguas color turquesa y bosque seco tropical circundante. Es una de las pocas playas vírgenes que quedan en Ecuador. Para llegar a la playa principal, atraviesas un bosque seco lleno de árboles de Palo Santo y barbasco.',
    imageUrl: 'https://picsum.photos/id/1036/800/600',
    gallery: [
      'https://picsum.photos/id/1036/800/400', 
      'https://picsum.photos/id/164/400/400',
      'https://picsum.photos/id/212/400/400'
    ],
    highlights: [
      'Mirador Las Fragatas con vista 360°',
      'Playa Tortuguita (arena negra volcánica)',
      'Snorkel en la orilla',
      'Sendero del Bosque Seco'
    ],
    travelTips: [
      'Entrada gratuita, pero registro obligatorio.',
      'Horario estricto: 08:00 a 16:00.',
      'No venden comida ni agua adentro: lleva todo.',
      'Prohibido plásticos de un solo uso.',
      'Lleva bloqueador y sombrero, el sol es fuerte.'
    ],
    category: 'Playa',
    rating: 5.0,
    priceLevel: 'Gratis'
  },
  {
    id: 'd2',
    name: 'Comuna Agua Blanca',
    location: 'Puerto López',
    description: 'Sitio arqueológico con restos de la cultura Manteña y laguna de azufre.',
    fullDescription: 'Agua Blanca es una comunidad ancestral ubicada en el corazón del Parque Nacional Machalilla. Alberga un museo de sitio con piezas de la cultura Manteña y una famosa laguna de agua sulfurosa volcánica con propiedades medicinales donde puedes bañarte. La comunidad gestiona el turismo, ofreciendo guías nativos que explican la flora, fauna y arqueología del sector.',
    imageUrl: 'https://picsum.photos/id/1039/800/600',
    gallery: [
      'https://picsum.photos/id/1039/800/400',
      'https://picsum.photos/id/238/400/400',
      'https://picsum.photos/id/239/400/400'
    ],
    highlights: [
      'Baño en la laguna de azufre medicinal',
      'Museo Arqueológico in situ',
      'Senderismo guiado por la comunidad',
      'Mascarilla de lodo natural'
    ],
    travelTips: [
      'Costo de entrada: $5.00 adultos.',
      'Incluye guía y uso de la laguna.',
      'El museo cierra a las 17:00.',
      'Alquila una bicicleta para recorrer los senderos.',
      'Prueba el "Seco de Chivo" en el restaurante comunitario.'
    ],
    category: 'Cultura',
    rating: 4.8,
    priceLevel: '$5 Entrada'
  },
  {
    id: 'd3',
    name: 'Isla de la Plata',
    location: 'A 40km de Puerto López',
    description: 'La "Pequeña Galápagos". Piqueros de patas azules y snorkel.',
    fullDescription: 'Conocida como la "Pequeña Galápagos" por compartir el mismo ecosistema y especies que el archipiélago pero a un costo más accesible. Es el mejor lugar en la costa continental para ver piqueros de patas azules, enmascarados y fragatas anidando. Los tours incluyen caminatas por senderos y snorkel donde es común ver tortugas marinas y peces coloridos.',
    imageUrl: 'https://picsum.photos/id/1011/800/600',
    gallery: [
      'https://picsum.photos/id/1011/800/400',
      'https://picsum.photos/id/215/400/400',
      'https://picsum.photos/id/216/400/400'
    ],
    highlights: [
      'Avistamiento de Piqueros Patas Azules',
      'Snorkel con tortugas marinas',
      'Avistamiento de ballenas (Jun-Sep) en el trayecto',
      'Senderos Escalera y Machete'
    ],
    travelTips: [
      'Tour diario cuesta entre $40 - $50.',
      'Salida 9:30 AM desde Puerto López.',
      'Viaje en bote dura 1 hora (toma pastilla para mareo).',
      'No se puede pernoctar en la isla.',
      'Lleva zapatos cómodos para caminar.'
    ],
    category: 'Aventura',
    rating: 4.9,
    priceLevel: '$$$ Tour'
  },
  // MANTA Y ALREDEDORES
  {
    id: 'd4',
    name: 'Bosque de Pacoche',
    location: 'Manta (Zona Rural)',
    description: 'Refugio de vida silvestre, hogar de monos aulladores.',
    fullDescription: 'El Refugio de Vida Silvestre Marino Costero Pacoche protege 13,000 hectáreas de ecosistemas costeros y marinos. Su mayor atractivo es el sendero del bosque húmedo ("Sendero del Mono"), donde casi siempre se pueden escuchar y observar monos aulladores negros en su hábitat natural, además de una vegetación exuberante inusual para la costa seca.',
    imageUrl: 'https://picsum.photos/id/1018/800/600',
    gallery: [
      'https://picsum.photos/id/1018/800/400',
      'https://picsum.photos/id/218/400/400',
      'https://picsum.photos/id/219/400/400'
    ],
    highlights: [
      'Sendero del Mono (1.5 km)',
      'Observación de Monos Aulladores',
      'Túneles de caña guadúa',
      'Artesanía en Paja Toquilla en Pile'
    ],
    travelTips: [
      'Entrada gratuita. Guía nativo obligatorio (propina).',
      'Lleva repelente de insectos fuerte.',
      'Ropa ligera pero pantalones largos recomendados.',
      'Combina la visita con la playa de Santa Marianita.'
    ],
    category: 'Naturaleza',
    rating: 4.7,
    priceLevel: 'Propina Guía'
  },
  {
    id: 'd5',
    name: 'Playa San Lorenzo',
    location: 'Cabo de San Lorenzo',
    description: 'Vistas panorámicas, faro y anidación de tortugas.',
    fullDescription: 'Ubicada en el extremo saliente del Cabo de San Lorenzo, esta playa ofrece un paisaje dramático con acantilados y formaciones rocosas. Es un sitio vital para la anidación de tortugas marinas (Golfinas y Verdes). Cuenta con un faro al que se puede subir para obtener las mejores vistas del océano Pacífico en la zona de Manta.',
    imageUrl: 'https://picsum.photos/id/1043/800/600',
    gallery: [
      'https://picsum.photos/id/1043/800/400',
      'https://picsum.photos/id/223/400/400',
      'https://picsum.photos/id/224/400/400'
    ],
    highlights: [
      'Caminata al Faro',
      'Fotografía de acantilados',
      'Temporada de anidación de tortugas (Sep-Dic)',
      'Comida típica en cabañas locales'
    ],
    travelTips: [
      'Playa de oleaje fuerte, precaución al nadar.',
      'Acceso gratuito.',
      'Excelente lugar para ver el atardecer.',
      'Accesible en auto desde Manta (30-40 min).'
    ],
    category: 'Playa',
    rating: 4.6,
    priceLevel: 'Gratis'
  },
  {
    id: 'd6',
    name: 'Ligüiki',
    location: 'Vía Manta - San Mateo',
    description: 'Corrales marinos ancestrales y arqueología viva.',
    fullDescription: 'Ligüiki es una pequeña comuna de pescadores con una historia milenaria. Es famosa por sus "corrales marinos", formaciones de piedra en semicírculo visibles en marea baja, construidos por culturas precolombinas para atrapar peces. Es un testimonio vivo de la ingeniería ancestral Manteña que se sigue utilizando hoy en día.',
    imageUrl: 'https://picsum.photos/id/1053/800/600',
    gallery: [
      'https://picsum.photos/id/1053/800/400',
      'https://picsum.photos/id/228/400/400',
      'https://picsum.photos/id/229/400/400'
    ],
    highlights: [
      'Corrales Marinos (marea baja)',
      'Playa tranquila y rocosa',
      'Gastronomía fresca local',
      'Senderismo arqueológico'
    ],
    travelTips: [
      'Visita obligatoria durante la MAREA BAJA.',
      'Lleva zapatos de agua para caminar por las rocas.',
      'Pide pulpo o camotillo en los restaurantes locales.',
      'Ideal para quienes buscan historia y tranquilidad.'
    ],
    category: 'Cultura',
    rating: 4.5,
    priceLevel: 'Gratis'
  },
  // NORTE DE MANABI
  {
    id: 'd7',
    name: 'Isla Corazón',
    location: 'Estuario del Río Chone',
    description: 'Manglar en forma de corazón, santuario de fragatas.',
    fullDescription: 'Ubicada cerca de San Vicente, esta isla de manglar tiene naturalmente forma de corazón (visible desde el aire). Es un refugio de vida silvestre comunitario. Se recorre en canoas a remo a través de túneles de manglar, culminando en una torre de observación donde verás miles de fragatas y otras aves marinas.',
    imageUrl: 'https://picsum.photos/id/1015/800/600',
    gallery: [
      'https://picsum.photos/id/1015/800/400',
      'https://picsum.photos/id/232/400/400',
      'https://picsum.photos/id/233/400/400'
    ],
    highlights: [
      'Túneles de manglar',
      'Colonia masiva de Fragatas',
      'Turismo comunitario ecológico',
      'Paseo en canoa tradicional'
    ],
    travelTips: [
      'Tour cuesta aprox. $15 por persona.',
      'Salidas desde Puerto Portovelo (cerca de San Vicente).',
      'Lleva binoculares si tienes.',
      'Mejor hora: Marea alta para entrar a los túneles.'
    ],
    category: 'Naturaleza',
    rating: 4.8,
    priceLevel: '$$ Tour'
  },
  {
    id: 'd8',
    name: 'Playa de Canoa',
    location: 'San Vicente',
    description: 'Paraíso del surf y ambiente relajado bohemio.',
    fullDescription: 'Canoa es una playa extensa de 17km, famosa internacionalmente por sus condiciones ideales para aprender surf. Tiene un ambiente relajado, joven y bohemio, con bares de playa, hostales ecológicos y una vibrante vida nocturna. Es también un excelente punto de partida para hacer parapente sobre los acantilados.',
    imageUrl: 'https://picsum.photos/id/1016/800/600',
    gallery: [
      'https://picsum.photos/id/1016/800/400',
      'https://picsum.photos/id/236/400/400',
      'https://picsum.photos/id/237/400/400'
    ],
    highlights: [
      'Clases de Surf',
      'Parapente desde el acantilado',
      'Cueva del Murciélago (marea baja)',
      'Vida nocturna frente al mar'
    ],
    travelTips: [
      'Ideal para hospedarse varios días.',
      'Alquiler de tabla de surf: $5 - $10 la hora.',
      'Vuelo en parapente: $30 - $40.',
      'Prueba los batidos de frutas en la playa.'
    ],
    category: 'Aventura',
    rating: 4.7,
    priceLevel: '$ - $$'
  },
  {
    id: 'd9',
    name: 'Cascada Salto del Armadillo',
    location: 'El Carmen / Armadillo',
    description: 'Impresionante caída de agua en la selva tropical.',
    fullDescription: 'Una de las cascadas más potentes de la región, ubicada en el cantón El Carmen, conocido como la "Puerta de Oro de Manabí". El Salto del Armadillo tiene una caída de unos 30 metros de altura rodeada de vegetación exuberante. Es un lugar perfecto para desconectarse, nadar en las zonas permitidas y disfrutar del sonido atronador del agua.',
    imageUrl: 'https://picsum.photos/id/1035/800/600',
    gallery: [
      'https://picsum.photos/id/1035/800/400',
      'https://picsum.photos/id/240/400/400',
      'https://picsum.photos/id/241/400/400'
    ],
    highlights: [
      'Miradores fotográficos',
      'Baño en el río (zonas calmas)',
      'Senderismo tropical',
      'Camping cercano'
    ],
    travelTips: [
      'Acceso algo difícil en invierno, vehículo alto recomendado.',
      'Entrada económica ($1 - $2).',
      'Lleva repelente y ropa de cambio.',
      'Cuidado con la corriente cerca de la caída.'
    ],
    category: 'Aventura',
    rating: 4.6,
    priceLevel: '$ Entrada'
  },
  {
    id: 'd10',
    name: 'Arco del Amor',
    location: 'Tasaste, Jama',
    description: 'Formación rocosa natural esculpida por el mar.',
    fullDescription: 'El Arco del Amor es una formación geológica impresionante en la playa de Tasaste. Es un arco de piedra natural gigante creado por la erosión de las olas durante siglos. Cuenta la leyenda local que las parejas que cruzan el arco juntas permanecerán unidas para siempre. Es un sitio muy fotogénico y tranquilo.',
    imageUrl: 'https://picsum.photos/id/1054/800/600',
    gallery: [
      'https://picsum.photos/id/1054/800/400',
      'https://picsum.photos/id/244/400/400',
      'https://picsum.photos/id/245/400/400'
    ],
    highlights: [
      'Fotografía en el Arco',
      'Caminatas en marea baja',
      'Playa virgen y solitaria',
      'Formaciones geológicas'
    ],
    travelTips: [
      'Solo accesible y seguro en MAREA BAJA.',
      'Lleva tu propia comida y agua, no hay tiendas cerca.',
      'Consulta la tabla de mareas antes de ir.',
      'Ideal para picnic romántico.'
    ],
    category: 'Naturaleza',
    rating: 4.5,
    priceLevel: 'Gratis'
  },
  {
    id: 'd11',
    name: 'Cojimíes',
    location: 'Pedernales',
    description: 'Gastronomía exquisita y estuario de palmeras.',
    fullDescription: 'Cojimíes es famoso por tener el estuario más bello de Manabí, rodeado de miles de palmeras de coco. Se puede cruzar en lancha a la "Isla del Amor". Pero su verdadero fuerte es la gastronomía: aquí se dice que se come el mejor encocado y los mariscos más frescos de la provincia. Es un destino familiar por excelencia.',
    imageUrl: 'https://picsum.photos/id/1029/800/600',
    gallery: [
      'https://picsum.photos/id/1029/800/400',
      'https://picsum.photos/id/248/400/400',
      'https://picsum.photos/id/249/400/400'
    ],
    highlights: [
      'Isla del Amor (playa virgen)',
      'Festival de la Corvina (Agosto)',
      'Paseos en lancha por el estuario',
      'Gastronomía (Encocados)'
    ],
    travelTips: [
      'Prueba el "Encocado de Cangrejo Azul".',
      'Paseo en lancha a la isla: $3 - $5 por persona.',
      'Playa de aguas mansas, segura para niños.',
      'Lleva efectivo, pocos cajeros.'
    ],
    category: 'Gastronomía',
    rating: 4.4,
    priceLevel: '$ - $$'
  },
  // CENTRO Y CULTURA
  {
    id: 'd12',
    name: 'Cerro Hojas Jaboncillo',
    location: 'Portoviejo / Picoazá',
    description: 'Parque arqueológico de la cultura Manteña.',
    fullDescription: 'Este complejo arqueológico abarca más de 3500 hectáreas en un bosque seco tropical. Fue un centro político y ceremonial de la cultura Manteña. El museo de sitio es moderno y educativo. El recorrido te lleva a ver los cimientos de las antiguas estructuras y las famosas sillas de piedra en forma de U ("Sillas de Poder").',
    imageUrl: 'https://picsum.photos/id/1027/800/600',
    gallery: [
      'https://picsum.photos/id/1027/800/400',
      'https://picsum.photos/id/252/400/400',
      'https://picsum.photos/id/253/400/400'
    ],
    highlights: [
      'Museo de Sitio moderno',
      'Sillas de Poder Manteñas',
      'Mirador de todo el valle de Portoviejo',
      'Sendero El Camino del Puma'
    ],
    travelTips: [
      'Entrada gratuita.',
      'Abierto de Miércoles a Domingo (consultar feriados).',
      'Hay cafetería y tienda de artesanías.',
      'Lleva agua para subir las escalinatas.'
    ],
    category: 'Cultura',
    rating: 4.7,
    priceLevel: 'Gratis'
  },
  {
    id: 'd13',
    name: 'Ciudad Alfaro',
    location: 'Montecristi',
    description: 'Cuna de Eloy Alfaro y del sombrero de paja toquilla.',
    fullDescription: 'Ubicado en la falda del cerro Montecristi, este complejo arquitectónico y cultural es un homenaje al ex presidente Eloy Alfaro. Alberga su mausoleo, museos históricos, una biblioteca y un paseo artesanal donde puedes ver a los tejedores creando los famosos sombreros de paja toquilla (mal llamados Panama Hats) en vivo.',
    imageUrl: 'https://picsum.photos/id/1033/800/600',
    gallery: [
      'https://picsum.photos/id/1033/800/400',
      'https://picsum.photos/id/256/400/400',
      'https://picsum.photos/id/257/400/400'
    ],
    highlights: [
      'Mausoleo de Eloy Alfaro',
      'Museo del Sombrero de Paja Toquilla',
      'Tren de la Unidad Nacional (exhibición)',
      'Vista panorámica de Montecristi'
    ],
    travelTips: [
      'Entrada y estacionamiento gratuitos.',
      'Compra artesanías directamente a los tejedores.',
      'Lleva sombrero o gorra para caminar por los exteriores.',
      'Ideal para visita educativa y familiar.'
    ],
    category: 'Cultura',
    rating: 4.8,
    priceLevel: 'Gratis'
  },
  {
    id: 'd14',
    name: 'La Boca de Crucita',
    location: 'Crucita',
    description: 'Manglar, avistamiento de aves y gastronomía.',
    fullDescription: 'La Boca es el punto donde el río Portoviejo desemboca en el océano Pacífico. Es un ecosistema de manglar rico en biodiversidad, hogar de más de 40 especies de aves. Es un destino más tranquilo que la playa principal de Crucita, ideal para comer mariscos frente al manglar y realizar paseos en bote.',
    imageUrl: 'https://picsum.photos/id/1019/800/600',
    gallery: [
      'https://picsum.photos/id/1019/800/400',
      'https://picsum.photos/id/260/400/400',
      'https://picsum.photos/id/261/400/400'
    ],
    highlights: [
      'Avistamiento de aves',
      'Sendero ecológico del manglar',
      'Restaurantes de mariscos rústicos',
      'Paseos en lancha por el río'
    ],
    travelTips: [
      'Prueba el "Viche de Pescado" aquí.',
      'Lleva repelente de mosquitos.',
      'Mejor ir durante el día para los paseos.',
      'Crucita pueblo está a 5 minutos (famoso por el parapente).'
    ],
    category: 'Naturaleza',
    rating: 4.3,
    priceLevel: '$ - $$'
  }
];

export const INITIAL_STORIES: Story[] = [];

export const INITIAL_POSTS: Post[] = [];