import { Post, Story, Destination } from './types';

export const ALL_DESTINATIONS: Destination[] = [
  // ==========================================
  // REGIÓN COSTA
  // ==========================================
  
  // --- MANABÍ ---
  {
    id: 'c_machalilla',
    name: 'Parque Nacional Machalilla',
    location: 'Puerto López',
    region: 'Costa',
    province: 'Manabí',
    description: 'Santuario de naturaleza y arqueología milenaria.',
    fullDescription: 'El Parque Nacional Machalilla es una de las áreas protegidas más extensas y significativas de la costa ecuatoriana. Ubicado estratégicamente en el cantón Puerto López, al suroeste de la provincia de Manabí, este parque abarca dos zonas: una terrestre (56.184 hectáreas) y una marina (14.430 hectáreas). Su importancia radica en ser un refugio vital para el bosque seco tropical y el bosque húmedo de la cordillera Chongón-Colonche, ecosistemas únicos en el mundo.\n\nHistóricamente, estas tierras fueron el asentamiento de la cultura Manteña (500 d.C. - 1532 d.C.), cuyos vestigios arqueológicos, como sillas de poder y centros ceremoniales, aún se encuentran en la comuna de Agua Blanca. Geográficamente, el parque ofrece una diversidad impresionante: desde playas de arena blanca y acantilados imponentes hasta islas como la de la Plata y Salango. Su clima varía desde seco en la costa hasta húmedo en las partes altas, creando microclimas perfectos para una biodiversidad asombrosa que incluye monos aulladores, venados, armadillos y más de 270 especies de aves.\n\nEn el ámbito marino, Machalilla es famoso mundialmente por ser el área de reproducción y crianza de las ballenas jorobadas, que llegan desde la Antártida entre junio y septiembre, ofreciendo un espectáculo natural inigualable. Además, sus arrecifes de coral son el hogar de tortugas marinas, mantarrayas y peces tropicales, convirtiéndolo en un paraíso para el buceo y el snorkel.',
    imageUrl: 'https://images.unsplash.com/photo-1598384232375-a010488950d4?q=80&w=1200&auto=format&fit=crop',
    gallery: ['https://images.unsplash.com/photo-1620668045956-6511b8b21245?q=80&w=800&auto=format&fit=crop'],
    highlights: ['Playa Los Frailes', 'Isla de la Plata', 'Comuna Agua Blanca', 'Avistamiento de Ballenas'],
    travelTips: ['Lleva suficiente agua y protección solar', 'Respeta los senderos marcados', 'La mejor época para ballenas es julio-agosto'],
    category: 'Naturaleza',
    rating: 5.0,
    priceLevel: 'Gratis'
  },
  {
    id: 'c_frailes',
    name: 'Playa Los Frailes',
    location: 'Puerto López',
    region: 'Costa',
    province: 'Manabí',
    description: 'La playa más virgen y prístina del Ecuador.',
    fullDescription: 'Considerada por muchos como la playa más hermosa del Ecuador continental, Los Frailes es una bahía de arena blanca en forma de media luna, protegida por acantilados y un denso bosque seco. Se encuentra ubicada dentro del Parque Nacional Machalilla, en el cantón Puerto López, provincia de Manabí. A diferencia de otras playas turísticas, Los Frailes se mantiene en un estado casi virgen, sin edificaciones, hoteles ni vendedores ambulantes, lo que garantiza una experiencia de paz y conexión total con la naturaleza.\n\nPara llegar a la playa principal, los visitantes pueden recorrer un sendero autoguiado que pasa por un bosque de árboles de Palo Santo y barbasco, ofreciendo vistas panorámicas desde el mirador Las Fragatas. Este camino también permite descubrir dos playas más pequeñas y solitarias: La Tortuguita (de arena negra y formaciones rocosas) y La Playita (donde se puede observar cangrejos y aves marinas). Sus aguas, de un color turquesa cristalino, son tranquilas y seguras para nadar, aunque siempre se recomienda precaución.\n\nEl sitio es un ejemplo de conservación exitosa. El acceso está controlado por guardaparques para evitar la contaminación y proteger la fauna local, que incluye piqueros de patas azules, fragatas y lagartijas endémicas. Es el lugar ideal para quienes buscan escapar del ruido y disfrutar de un paisaje costero inalterado.',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop',
    gallery: [],
    highlights: ['Mirador Las Fragatas', 'Senderismo por bosque seco', 'Snorkel en aguas claras'],
    travelTips: ['El ingreso es gratuito pero cierra a las 16:00', 'No hay tiendas, lleva tu comida y agua (envases reutilizables)', 'Usa calzado cómodo para la caminata'],
    category: 'Playa',
    rating: 5.0,
    priceLevel: 'Gratis'
  },
  {
    id: 'c_montanita',
    name: 'Montañita',
    location: 'Santa Elena',
    region: 'Costa',
    province: 'Santa Elena',
    description: 'La capital internacional del surf y la fiesta.',
    fullDescription: 'Montañita es mucho más que una playa; es un fenómeno cultural y turístico ubicado en la parroquia Manglaralto del cantón Santa Elena, provincia de Santa Elena. Lo que comenzó como un pequeño pueblo de pescadores y un secreto a voces entre hippies y surfistas en los años 70, se ha transformado en un destino cosmopolita vibrante. Sus calles peatonales están llenas de arte, música en vivo, restaurantes de comida internacional y una atmósfera de libertad única en el país.\n\nGeográficamente, Montañita cuenta con una punta rocosa que genera una de las mejores olas derechas del Pacífico Sur, atrayendo a surfistas profesionales y aficionados de todo el mundo durante todo el año. La playa es amplia y dorada, perfecta para tomar el sol y disfrutar de los atardeceres legendarios. Hacia el norte, la playa se conecta con Olón, ofreciendo un contraste más tranquilo y familiar.\n\nLa vida nocturna es otro de sus grandes atractivos. La famosa "Calle de los Cocteles" y sus discotecas a orillas del mar ofrecen fiesta ininterrumpida. Sin embargo, Montañita también ha sabido conservar espacios de tranquilidad y conexión con la naturaleza, especialmente hacia el sector de La Punta. Es un lugar donde conviven idiomas, culturas y estilos de vida, haciendo de cada visita una experiencia inolvidable.',
    imageUrl: 'https://images.unsplash.com/photo-1533230588647-73d745c9938c?q=80&w=1200&auto=format&fit=crop',
    gallery: ['https://images.unsplash.com/photo-1528150395403-992a693e26c8?q=80&w=800&auto=format&fit=crop'],
    highlights: ['Surf de clase mundial', 'Vida nocturna vibrante', 'Gastronomía internacional', 'Santuario de Olón cercano'],
    travelTips: ['Ten precaución con las corrientes marinas', 'Prueba el ceviche de los carritos en la playa', 'Lleva efectivo en billetes pequeños'],
    category: 'Aventura',
    rating: 4.7,
    priceLevel: '$$'
  },
  {
    id: 'd_guayaquil',
    name: 'Malecón 2000',
    location: 'Guayaquil',
    region: 'Costa',
    province: 'Guayas',
    description: 'El corazón moderno e histórico de la Perla del Pacífico.',
    fullDescription: 'El Malecón Simón Bolívar, conocido popularmente como Malecón 2000, es el proyecto de regeneración urbana más exitoso de América del Sur y el ícono turístico de Guayaquil. Ubicado en el centro del cantón Guayaquil, provincia del Guayas, este paseo peatonal de 2.5 kilómetros bordea el majestuoso río Guayas, fusionando historia, naturaleza y modernidad en un solo espacio seguro y vibrante.\n\nEl recorrido es un viaje a través de la historia de la ciudad. Comienza en el sur con el Mercado del Río y el Palacio de Cristal (una estructura de hierro diseñada por Gustave Eiffel), pasa por monumentos históricos como el Hemiciclo de la Rotonda (que conmemora el encuentro entre Bolívar y San Martín) y la Torre del Reloj, y culmina en el norte con los jardines, museos y el acceso al tradicional Barrio Las Peñas. El Malecón es también un pulmón verde, con jardines botánicos que albergan flora nativa y fauna local como iguanas y aves.\n\nAdemás de su valor histórico, ofrece entretenimiento moderno con el centro comercial, cines, zonas de juegos infantiles y "La Perla", una rueda moscovita gigante que ofrece vistas panorámicas inigualables de la ciudad y el río. Es el punto de encuentro por excelencia de los guayaquileños y una parada obligatoria para entender la identidad porteña.',
    imageUrl: 'https://images.unsplash.com/photo-1575487428448-4770e0a53b53?q=80&w=1200&auto=format&fit=crop',
    gallery: ['https://images.unsplash.com/photo-1626922765383-a7b629002271?q=80&w=800&auto=format&fit=crop'],
    highlights: ['Hemiciclo de la Rotonda', 'La Perla (Rueda Moscovita)', 'Jardines del Malecón', 'Barrio Las Peñas'],
    travelTips: ['Visítalo al atardecer para ver la puesta de sol sobre el río', 'Sube los 444 escalones del Cerro Santa Ana al final del recorrido', 'Usa ropa fresca y cómoda'],
    category: 'Cultura',
    rating: 4.8,
    priceLevel: 'Gratis'
  },

  // --- SIERRA ---
  {
    id: 'd_cotopaxi',
    name: 'Volcán Cotopaxi',
    location: 'Latacunga',
    region: 'Sierra',
    province: 'Cotopaxi',
    description: 'El coloso de los Andes, un cono de nieve perfecto.',
    fullDescription: 'El Volcán Cotopaxi es uno de los volcanes activos más altos y bellos del mundo, elevándose a 5,897 metros sobre el nivel del mar. Es la pieza central del Parque Nacional Cotopaxi, ubicado mayoritariamente en el cantón Latacunga, provincia de Cotopaxi, aunque su área de influencia se extiende a Pichincha y Napo. Su forma cónica casi perfecta y su casquete glaciar perpetuo lo convierten en el símbolo indiscutible de los Andes ecuatorianos.\n\nEl parque nacional ofrece un paisaje de páramo impresionante, dominado por pajonales dorados, rocas volcánicas y lagunas como la de Limpiopungo, donde se reflejan los nevados Rumiñahui y Cotopaxi. Es un hábitat crucial para fauna andina como lobos de páramo, venados de cola blanca, conejos, cóndores y manadas de caballos salvajes que recorren las planicies. Para los amantes del montañismo, el Cotopaxi es un reto clásico; su ascenso requiere preparación técnica y física, pero la vista desde la cumbre es una de las más gratificantes del continente.\n\nHistóricamente, el volcán ha sido venerado por las culturas indígenas precolombinas como una deidad sagrada. Hoy en día, es un laboratorio natural para vulcanólogos y un destino imperdible para turistas que pueden llegar en vehículo hasta el parqueadero a 4,500 metros y caminar hasta el refugio José Ribas a 4,864 metros, tocando la nieve sin necesidad de equipo profesional.',
    imageUrl: 'https://images.unsplash.com/photo-1563297129-37803e726488?q=80&w=1200&auto=format&fit=crop',
    gallery: ['https://images.unsplash.com/photo-1542665093-a4e92b3c4850?q=80&w=800&auto=format&fit=crop'],
    highlights: ['Refugio José Ribas', 'Laguna de Limpiopungo', 'Centro de Interpretación', 'Glaciares'],
    travelTips: ['Es indispensable llevar ropa térmica y cortavientos', 'Bebe mucha agua y té de coca para la altura', 'Ingresa temprano (el parque abre a las 08:00)'],
    category: 'Montaña',
    rating: 4.9,
    priceLevel: 'Gratis'
  },
  {
    id: 'd_quilotoa',
    name: 'Laguna del Quilotoa',
    location: 'Pujilí',
    region: 'Sierra',
    province: 'Cotopaxi',
    description: 'La joya esmeralda de los Andes ecuatorianos.',
    fullDescription: 'La Laguna del Quilotoa es uno de los paisajes más surreales y fotogénicos de Sudamérica. Se trata de una caldera volcánica llena de agua de color verde esmeralda o azul turquesa (dependiendo de la luz solar), ubicada en la parroquia Zumbahua del cantón Pujilí, provincia de Cotopaxi. Este cráter se formó tras una erupción masiva hace aproximadamente 800 años, y hoy en día es el destino principal del circuito turístico conocido como el "Quilotoa Loop".\n\nEl borde del cráter se encuentra a unos 3,900 metros sobre el nivel del mar, ofreciendo miradores espectaculares como el de Shalalá, construido con madera y vidrio. Los visitantes pueden descender por un sendero arenoso hasta la orilla de la laguna (unos 280 metros de desnivel), donde es posible alquilar kayaks para navegar sobre las aguas sulfurosas y burbujeantes. El ascenso de regreso es un reto físico considerable, aunque se ofrece el servicio de mulas para quienes lo requieran.\n\nLa zona está habitada por comunidades indígenas Kichwa que han mantenido sus tradiciones, vestimenta y arte, especialmente la pintura de Tigua. El clima es frío y ventoso, típico del páramo andino, pero la calidez de la gente local y la majestuosidad del paisaje hacen que el viaje valga cada segundo.',
    imageUrl: 'https://images.unsplash.com/photo-1518182170546-0766aaab9aa4?q=80&w=1200&auto=format&fit=crop',
    gallery: ['https://images.unsplash.com/photo-1610987166167-9c60dfd239c0?q=80&w=800&auto=format&fit=crop'],
    highlights: ['Mirador de Shalalá', 'Descenso al cráter', 'Kayak en la laguna', 'Artesanías de Tigua'],
    travelTips: ['Lleva efectivo, no hay cajeros cerca', 'El viento es muy fuerte, usa rompevientos', 'Prueba el locro de papa en los restaurantes comunitarios'],
    category: 'Aventura',
    rating: 4.9,
    priceLevel: '$'
  },
  {
    id: 'd_banos',
    name: 'Baños de Agua Santa',
    location: 'Baños',
    region: 'Sierra',
    province: 'Tungurahua',
    description: 'La capital de la aventura y puerta de la Amazonía.',
    fullDescription: 'Baños de Agua Santa es un destino magnético ubicado en un valle al pie del volcán Tungurahua, en el cantón Baños, provincia de Tungurahua. Conocida como el "Pedacito de Cielo", esta ciudad es el punto de transición geográfico y climático entre los Andes y la Amazonía, lo que le otorga una biodiversidad y paisajes únicos de montañas verdes y cascadas impresionantes.\n\nEs famosa mundialmente por su "Ruta de las Cascadas", un recorrido que incluye caídas de agua espectaculares como el Manto de la Novia y el imponente Pailón del Diablo. Baños es la capital del turismo de aventura en Ecuador: aquí se practica rafting en el río Pastaza, canyoning, puenting, escalada y ciclismo de montaña. Para quienes buscan relajación, la ciudad ofrece piscinas de aguas termales minerales que brotan de las entrañas del volcán, ideales para descansar después de un día de actividad.\n\nCulturalmente, Baños es conocida por la devoción a la Virgen de Agua Santa, cuya basílica es un sitio de peregrinación, y por su gastronomía dulce: las melcochas (dulces de caña hechos a mano en las puertas de las tiendas) y el jugo de caña son tradiciones vivas que endulzan la visita de todos los turistas.',
    imageUrl: 'https://images.unsplash.com/photo-1634657963273-02f693b790d5?q=80&w=1200&auto=format&fit=crop',
    gallery: ['https://images.unsplash.com/photo-1587595431973-160d0d94add1?q=80&w=800&auto=format&fit=crop'],
    highlights: ['Pailón del Diablo', 'Casa del Árbol (Columpio del Fin del Mundo)', 'Ruta de las Cascadas', 'Termas de la Virgen'],
    travelTips: ['Alquila una bicicleta o buggy para recorrer las cascadas', 'Visita los miradores nocturnos para ver la ciudad iluminada', 'Prueba las melcochas tradicionales'],
    category: 'Aventura',
    rating: 4.8,
    priceLevel: '$$'
  },
  {
    id: 'd_quito',
    name: 'Centro Histórico de Quito',
    location: 'Quito',
    region: 'Sierra',
    province: 'Pichincha',
    description: 'El relicario de arte en América y Primer Patrimonio de la Humanidad.',
    fullDescription: 'El Centro Histórico de Quito es el casco colonial más grande, mejor conservado y menos alterado de toda América. Ubicado en el corazón del Distrito Metropolitano de Quito, provincia de Pichincha, fue declarado el Primer Patrimonio Cultural de la Humanidad por la UNESCO en 1978. Caminar por sus calles es viajar en el tiempo a través de siglos de historia, arte y arquitectura que fusionan estilos españoles, italianos, moriscos e indígenas (Escuela Quiteña).\n\nSus plazas, como la Plaza Grande (Independencia) y la Plaza de San Francisco, son escenarios vivos de la política y cultura ecuatoriana. Sus iglesias son verdaderas joyas: la Iglesia de la Compañía de Jesús, con su interior cubierto totalmente de láminas de oro, es considerada la obra cumbre del barroco en Latinoamérica. La Basílica del Voto Nacional, de estilo neogótico, destaca por sus gárgolas que representan la fauna ecuatoriana en lugar de figuras mitológicas.\n\nEl centro no es solo un museo; es un barrio vivo lleno de comercios tradicionales, sombrererías, tiendas de especias y restaurantes que sirven platos típicos como el hornado, el locro de papa y los dulces de colación. Desde el mirador de El Panecillo, la Virgen de Quito vigila esta ciudad de leyendas y tradiciones eternas.',
    imageUrl: 'https://images.unsplash.com/photo-1573147895475-1044342337dd?q=80&w=1200&auto=format&fit=crop',
    gallery: ['https://images.unsplash.com/photo-1596305047805-2c8c49e2954a?q=80&w=800&auto=format&fit=crop'],
    highlights: ['Iglesia de la Compañía de Jesús', 'El Panecillo', 'Calle La Ronda', 'Basílica del Voto Nacional'],
    travelTips: ['Visita La Ronda por la noche para música en vivo y canelazos', 'Sube a las torres de la Basílica para la mejor vista', 'Cuida tus pertenencias en zonas concurridas'],
    category: 'Cultura',
    rating: 4.8,
    priceLevel: 'Gratis'
  },
  {
    id: 'd_cuenca',
    name: 'Cuenca',
    location: 'Cuenca',
    region: 'Sierra',
    province: 'Azuay',
    description: 'La Atenas del Ecuador, ciudad de ríos, artesanía y encanto.',
    fullDescription: 'Santa Ana de los Cuatro Ríos de Cuenca es, sin duda, una de las ciudades más bellas y cultas del país. Ubicada en un valle interandino en el cantón Cuenca, capital de la provincia del Azuay, esta ciudad Patrimonio de la Humanidad enamora por su arquitectura republicana, sus calles empedradas y su ambiente relajado y seguro.\n\nSu centro histórico está dominado por la imponente Catedral de la Inmaculada Concepción (Catedral Nueva), con sus icónicas cúpulas de azulejos celestes que son el símbolo de la ciudad. Cuenca es atravesada por cuatro ríos (Tomebamba, Yanuncay, Tarqui y Machángara), cuyas orillas se han convertido en hermosos parques lineales ideales para caminar y hacer deporte. La ciudad es también el centro artesanal más importante del país, siendo la cuna del famoso sombrero de paja toquilla (mal llamado Panama Hat) y de una fina tradición en cerámica, joyería y hierro forjado.\n\nCerca de la ciudad se encuentra el Parque Nacional Cajas, un páramo lacustre de belleza mística, y las ruinas de Ingapirca, el complejo arqueológico inca más importante de Ecuador. Su gastronomía, con platos como el mote pillo y el cuy asado, es otro motivo para visitarla y quedarse.',
    imageUrl: 'https://images.unsplash.com/photo-1579707282660-f82329241940?q=80&w=1200&auto=format&fit=crop',
    gallery: ['https://images.unsplash.com/photo-1630344835698-8c10427c59bd?q=80&w=800&auto=format&fit=crop'],
    highlights: ['Catedral Nueva', 'Mirador de Turi', 'Museo del Sombrero', 'Paseo del Río Tomebamba'],
    travelTips: ['Recorre el Barranco a pie', 'Visita el mercado de las flores', 'El clima es primaveral todo el año, lleva un suéter ligero'],
    category: 'Cultura',
    rating: 4.9,
    priceLevel: '$'
  },

  // --- AMAZONÍA ---
  {
    id: 'd_cuyabeno',
    name: 'Reserva Cuyabeno',
    location: 'Lago Agrio',
    region: 'Amazonía',
    province: 'Sucumbíos',
    description: 'El reino de las lagunas negras y la selva inundada.',
    fullDescription: 'La Reserva de Producción de Fauna Cuyabeno es un ecosistema amazónico único, caracterizado por sus bosques inundados (igapó) y su complejo sistema de lagunas de aguas negras. Se encuentra ubicada en el cantón Cuyabeno y parte de Putumayo, en la provincia de Sucumbíos, al noreste de Ecuador. Es uno de los lugares más biodiversos y accesibles para experimentar la selva profunda.\n\nNavegar por la Laguna Grande al atardecer es una experiencia mágica; el agua oscura refleja el cielo y los árboles macrolobios sumergidos crean un paisaje surrealista. La reserva es hogar de una fauna impresionante: delfines rosados y grises de río, manatíes, caimanes negros, anacondas, monos de varias especies y más de 550 especies de aves, incluyendo guacamayos y el prehistórico hoatzín. Es un paraíso para fotógrafos de naturaleza y observadores de aves.\n\nAdemás de su riqueza natural, Cuyabeno es territorio ancestral de comunidades indígenas como los Siona, Secoya y Cofán. El turismo sostenible aquí permite visitar estas comunidades, aprender sobre su cosmovisión, medicina natural y tradiciones, como la preparación del casabe (pan de yuca). Dormir en un eco-lodge en medio de la selva, escuchando los sonidos nocturnos, es una aventura inolvidable.',
    imageUrl: 'https://images.unsplash.com/photo-1627921200830-47402d242491?q=80&w=1200&auto=format&fit=crop',
    gallery: ['https://images.unsplash.com/photo-1549806541-6927959082cd?q=80&w=800&auto=format&fit=crop'],
    highlights: ['Laguna Grande al atardecer', 'Avistamiento de delfines rosados', 'Caminatas nocturnas', 'Visita a comunidad Siona'],
    travelTips: ['Se requiere vacuna de fiebre amarilla', 'Lleva poncho de lluvia y repelente fuerte', 'No hay señal celular, disfruta la desconexión'],
    category: 'Selva',
    rating: 4.9,
    priceLevel: '$$$'
  },
  {
    id: 'd_misahualli',
    name: 'Puerto Misahuallí',
    location: 'Tena',
    region: 'Amazonía',
    province: 'Napo',
    description: 'La puerta de entrada a la selva y tierra de monos traviesos.',
    fullDescription: 'Puerto Misahuallí es el primer puerto turístico de la Amazonía ecuatoriana, ubicado en la parroquia del mismo nombre, cantón Tena, provincia de Napo. A orillas del majestuoso río Napo, este pintoresco pueblo ofrece una playa de arena fluvial de agua dulce, un paisaje selvático exuberante y una atmósfera relajada ideal para quienes se inician en la aventura amazónica.\n\nEl pueblo es famoso por su población de monos capuchinos silvestres que viven libremente en el parque central y los árboles aledaños. Estos monos son muy sociables (y traviesos), interactuando con los turistas y posando para fotos, aunque se debe tener cuidado con las pertenencias y la comida. Desde el puerto, salen canoas a motor que llevan a los visitantes a conocer atractivos cercanos como la cascada de las Latas, el centro de rescate de animales AmaZOOnico, y comunidades Kichwa que ofrecen turismo cultural, danza y artesanías.\n\nMisahuallí conserva el encanto de un pueblo de frontera, con calles tranquilas, clima tropical húmedo y una oferta gastronómica exótica donde se puede probar el maito de tilapia o el chontacuro (gusano de chonta) para los más valientes.',
    imageUrl: 'https://images.unsplash.com/photo-1544256968-305886af34dc?q=80&w=1200&auto=format&fit=crop',
    gallery: ['https://images.unsplash.com/photo-1604599245593-9c59505dc241?q=80&w=800&auto=format&fit=crop'],
    highlights: ['Monos en el parque central', 'Playa del Río Napo', 'Paseos en canoa', 'Museo de Trampas'],
    travelTips: ['Cuida tus gafas y cámaras de los monos', 'Usa repelente y protector solar', 'Prueba el maito de pescado local'],
    category: 'Selva',
    rating: 4.6,
    priceLevel: '$'
  },

  // --- INSULAR ---
  {
    id: 'd_galapagos',
    name: 'Islas Galápagos',
    location: 'Archipiélago de Colón',
    region: 'Insular',
    province: 'Galápagos',
    description: 'El laboratorio viviente de la evolución y Patrimonio Natural de la Humanidad.',
    fullDescription: 'Las Islas Galápagos son, sin exagerar, uno de los destinos naturales más extraordinarios del planeta. Ubicadas a 1,000 km de la costa continental, conforman la provincia de Galápagos y se dividen en tres cantones: Santa Cruz, San Cristóbal e Isabela. Este archipiélago volcánico es famoso por inspirar la Teoría de la Evolución de Charles Darwin debido a su fauna única y endémica que no teme al ser humano.\n\nAquí la vida salvaje es la protagonista absoluta. Puedes caminar entre tortugas gigantes centenarias en las tierras altas, nadar con leones marinos juguetones en la orilla, bucear junto a tiburones martillo y observar piqueros de patas azules realizando sus danzas de cortejo. Cada isla tiene su propio paisaje y especies: desde los paisajes lunares de Bartolomé hasta las playas de arena blanca de Tortuga Bay y los túneles de lava submarinos de Isabela.\n\nGalápagos no es solo un destino de playa, es una experiencia educativa y de conservación. La Estación Científica Charles Darwin y los esfuerzos de protección hacen de este lugar un modelo mundial. Es un viaje transformador que conecta al visitante con la esencia misma de la vida en la Tierra.',
    imageUrl: 'https://images.unsplash.com/photo-1516641396056-0ce60a85d49f?q=80&w=1200&auto=format&fit=crop',
    gallery: [
       'https://images.unsplash.com/photo-1596489397685-6e0a8118029d?q=80&w=800&auto=format&fit=crop',
       'https://images.unsplash.com/photo-1502219504825-4c07d391f1b2?q=80&w=800&auto=format&fit=crop'
    ],
    highlights: ['Tortuga Bay (Santa Cruz)', 'León Dormido (San Cristóbal)', 'Los Túneles (Isabela)', 'Estación Charles Darwin'],
    travelTips: ['Paga la entrada al parque en efectivo ($30 nacionales / $100 extranjeros)', 'Usa siempre bloqueador biodegradable', 'Mantén 2 metros de distancia con los animales'],
    category: 'Naturaleza',
    rating: 5.0,
    priceLevel: '$$$$'
  }
];

export const INITIAL_STORIES: Story[] = [];
export const INITIAL_POSTS: Post[] = [];