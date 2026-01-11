
import { Post, Story, Destination } from './types';

// --- VERSION CONTROL ---
export const APP_VERSION = '1.4.0';

export const RELEASE_NOTES = [
  {
    title: "Traducción Completa",
    date: "Actualización Reciente",
    changes: [
      { type: 'new', text: "Soporte 100% Multilingüe: Toda la interfaz ahora cambia entre ES/EN." },
      { type: 'improved', text: "Chatbot y IA: Sugerencias adaptadas al idioma del usuario." },
      { type: 'new', text: "Sistema de Reservas Traducido." }
    ]
  }
];

export const TRANSLATIONS = {
  es: {
    common: {
      save: "Guardar",
      cancel: "Cancelar",
      delete: "Eliminar",
      edit: "Editar",
      back: "Volver",
      next: "Siguiente",
      finish: "Finalizar",
      loading: "Cargando...",
      success: "¡Realizado con éxito!",
      error: "Error al procesar la solicitud.",
      upload: "Subir Multimedia",
      location: "Ubicación",
      close: "Cerrar"
    },
    nav: { explore: "Explorar", search: "Buscar", profile: "Perfil", portals: "Portales", home: "Muro", publish: "Publicar" },
    auth: {
      login: "Iniciar Sesión",
      register: "Crear Cuenta",
      forgot: "Recuperar",
      welcome: "Bienvenido de nuevo.",
      join: "Únete a la comunidad.",
      desc: "Explora playas vírgenes, gastronomía única y la calidez de nuestra gente.",
      name: "Nombre",
      email: "Correo",
      password: "Contraseña",
      bio: "Biografía",
      continue: "Continuar",
      noAccount: "¿No tienes cuenta? Regístrate",
      hasAccount: "¿Ya tienes cuenta? Entra",
      guest: "Seguir como invitado"
    },
    home: { recommended: "Recomendados", stories: "Historias", create: "Crear", featured: "Destino de la Semana", openGuide: "Abrir Guía" },
    explore: { radar: "Radar Local", plan: "Planificar", add: "Añadir", places: "lugares por descubrir" },
    create: {
      title: "¿Qué quieres compartir?",
      post: "Publicación",
      story: "Historia",
      group: "Comunidad",
      where: "¿Dónde estás?",
      experience: "Tu Experiencia (opcional)",
      groupName: "Nombre de la Comunidad",
      groupAbout: "Sobre el grupo",
      publishPost: "Compartir Publicación",
      publishStory: "Subir a Historias",
      publishGroup: "Lanzar Comunidad"
    },
    guide: {
      about: "Sobre este lugar",
      gallery: "Galería de la Comunidad",
      addPhoto: "Agregar Foto",
      map: "Ubicación",
      gps: "Cómo llegar (GPS)",
      highlights: "Lo Imperdible",
      tips: "Tips de Viajero",
      askAi: "Preguntar al Guía IA",
      doubts: "¿Tienes dudas?",
      aiHelp: "Pregunta a nuestro guía virtual sobre horarios, mejores restaurantes cercanos o clima actual.",
      rate: "Califica tu experiencia",
      visited: "¿Has visitado este lugar?"
    },
    nearby: {
      title: "Radar Local",
      scanning: "Escaneando zona...",
      noResults: "Sin resultados en esta categoría.",
      categories: { all: "Todo", tourism: "Turismo", food: "Comida", stay: "Hospedaje", service: "Servicios" }
    },
    itinerary: {
      title: "Planifica Tu Viaje",
      subtitle: "Tu itinerario perfecto, hora por hora.",
      destination: "¿A dónde quieres ir?",
      duration: "Duración (Días)",
      budget: "Presupuesto",
      generate: "Generar Itinerario",
      generating: "Planificando tu aventura...",
      new: "Nuevo"
    },
    chat: {
      search: "Buscar amigos...",
      newGroup: "Nuevo Grupo",
      summary: "Resumen de la Conversación",
      aiGenerated: "Generado por IA",
      logistics: "Logística",
      checklist: "Checklist",
      expenses: "Gastos",
      vault: "Vault",
      placeholder: "Mensaje...",
      recording: "Grabando...",
      analyzing: "Analizando voz...",
      suggestions: "Sugerencias IA"
    },
    booking: {
      title: "Reservas Disponibles",
      reserve: "Reservar",
      details: "Detalles del Pago",
      transfer: "Total a transferir:",
      proof: "Sube tu comprobante",
      confirm: "Confirmar Reserva",
      sent: "¡Solicitud Enviada!",
      sentDesc: "Tu comprobante se ha guardado. Te hemos redirigido a WhatsApp."
    },
    search: { title: "Descubrir", placeholder: "Buscar destinos, provincias, grupos o personas...", all: "Todo", destinations: "Destinos", communities: "Comunidades", travelers: "Viajeros", placesFound: "Lugares Encontrados", groupsFound: "Grupos de Viaje", usersFound: "Viajeros Encontrados", empty: "No encontramos resultados", intro: "Escribe algo para empezar a descubrir Ecuador" },
    profile: { points: "Puntos", posts: "Publicaciones", followers: "Seguidores", bio: "Explorando las maravillas de Ecuador 🇪🇨", groups: "Grupos", aiTrips: "Viajes IA", suggest: "Sugerir", memories: "Memorias", achievements: "Logros", path: "Trayectoria", bookings: "Reservas", logout: "Cerrar Sesión", guest: "Viajero" },
    onboarding: {
      step1: { tag: "BIENVENIDA", title: "¡Hola, {name}!", subtitle: "Bienvenido a Manabí Social", desc: "Estás entrando al corazón turístico de la costa ecuatoriana. Prepárate para descubrir un paraíso de arena blanca y aguas turquesas." },
      step2: { tag: "DESTINOS", title: "Los Frailes y Machalilla", subtitle: "Naturaleza en Estado Puro", desc: "Explora guías detalladas de la playa Los Frailes y las rutas místicas del Parque Nacional Machalilla. Todo lo que necesitas saber antes de ir." },
      step3: { tag: "TECNOLOGÍA", title: "Portales de IA", subtitle: "Exploración Inteligente", desc: "Nuestra IA analiza tus fotos en tiempo real para contarte la historia de cada lugar. Usa los 'Portales' para una experiencia inmersiva única." },
      step4: { tag: "SOCIAL", title: "Comunidad Viajera", subtitle: "Conecta y Planifica", desc: "Únete a grupos de mochileros, comparte tus itinerarios y organiza salidas grupales a las islas y reservas de la provincia." },
      step5: { tag: "LOGROS", title: "Tu Pasaporte Digital", subtitle: "Gana XP y Medallas", desc: "Cada foto compartida y cada lugar visitado te otorga puntos. ¿Podrás llegar al rango de 'Leyenda de Ecuador'?" },
      next: "Siguiente",
      finish: "¡Empezar mi aventura!",
      skip: "Saltar Tour"
    },
    post: { like: "Me gusta", comment: "Comentar", share: "Compartir", views: "Ver opiniones", hide: "Ocultar bitácora", time: "Publicado hoy en tiempo real", opinion: "Escribe tu opinión viajera..." }
  },
  en: {
    common: {
      save: "Save",
      cancel: "Cancel",
      delete: "Delete",
      edit: "Edit",
      back: "Back",
      next: "Next",
      finish: "Finish",
      loading: "Loading...",
      success: "Success!",
      error: "Error processing request.",
      upload: "Upload Media",
      location: "Location",
      close: "Close"
    },
    nav: { explore: "Explore", search: "Search", profile: "Profile", portals: "Portals", home: "Feed", publish: "Post" },
    auth: {
      login: "Login",
      register: "Register",
      forgot: "Forgot Password",
      welcome: "Welcome back.",
      join: "Join the community.",
      desc: "Explore virgin beaches, unique gastronomy and the warmth of our people.",
      name: "Name",
      email: "Email",
      password: "Password",
      bio: "Bio",
      continue: "Continue",
      noAccount: "Don't have an account? Register",
      hasAccount: "Already have an account? Login",
      guest: "Continue as guest"
    },
    home: { recommended: "Recommended", stories: "Stories", create: "Create", featured: "Destination of the Week", openGuide: "Open Guide" },
    explore: { radar: "Local Radar", plan: "Plan", add: "Add", places: "places to discover" },
    create: {
      title: "What do you want to share?",
      post: "Post",
      story: "Story",
      group: "Community",
      where: "Where are you?",
      experience: "Your Experience (optional)",
      groupName: "Community Name",
      groupAbout: "About the group",
      publishPost: "Share Post",
      publishStory: "Upload to Stories",
      publishGroup: "Launch Community"
    },
    guide: {
      about: "About this place",
      gallery: "Community Gallery",
      addPhoto: "Add Photo",
      map: "Location",
      gps: "Directions (GPS)",
      highlights: "Highlights",
      tips: "Travel Tips",
      askAi: "Ask AI Guide",
      doubts: "Have questions?",
      aiHelp: "Ask our virtual guide about schedules, best nearby restaurants or current weather.",
      rate: "Rate your experience",
      visited: "Have you visited this place?"
    },
    nearby: {
      title: "Local Radar",
      scanning: "Scanning area...",
      noResults: "No results in this category.",
      categories: { all: "All", tourism: "Tourism", food: "Food", stay: "Stay", service: "Services" }
    },
    itinerary: {
      title: "Plan Your Trip",
      subtitle: "Your perfect itinerary, hour by hour.",
      destination: "Where do you want to go?",
      duration: "Duration (Days)",
      budget: "Budget",
      generate: "Generate Itinerary",
      generating: "Planning your adventure...",
      new: "New"
    },
    chat: {
      search: "Search friends...",
      newGroup: "New Group",
      summary: "Conversation Summary",
      aiGenerated: "AI Generated",
      logistics: "Logistics",
      checklist: "Checklist",
      expenses: "Expenses",
      vault: "Vault",
      placeholder: "Message...",
      recording: "Recording...",
      analyzing: "Analyzing voice...",
      suggestions: "AI Suggestions"
    },
    booking: {
      title: "Available Bookings",
      reserve: "Book now",
      details: "Payment Details",
      transfer: "Total to transfer:",
      proof: "Upload your receipt",
      confirm: "Confirm Booking",
      sent: "Request Sent!",
      sentDesc: "Your receipt has been saved. We redirected you to WhatsApp."
    },
    tabs: { explore: "Explore", search: "Search", profile: "Profile", portals: "Portals", wall: "Feed" },
    search: { title: "Discover", placeholder: "Search destinations, provinces, groups or people...", all: "All", destinations: "Destinations", communities: "Communities", travelers: "Travelers", placesFound: "Places Found", groupsFound: "Travel Groups", usersFound: "Travelers Found", empty: "No results found", intro: "Type something to start discovering Ecuador" },
    profile: { points: "Points", posts: "Posts", followers: "Followers", bio: "Exploring the wonders of Ecuador 🇪🇨", groups: "Groups", aiTrips: "AI Trips", suggest: "Suggest", memories: "Memories", achievements: "Achievements", path: "Trajectory", bookings: "Bookings", logout: "Logout", guest: "Traveler" },
    onboarding: {
      step1: { tag: "WELCOME", title: "Hi, {name}!", subtitle: "Welcome to Manabí Social", desc: "You are entering the tourist heart of the Ecuadorian coast. Get ready to discover a paradise of white sand and turquoise waters." },
      step2: { tag: "DESTINATIONS", title: "Los Frailes & Machalilla", subtitle: "Pure Nature", desc: "Explore detailed guides for Los Frailes beach and the mystical routes of Machalilla National Park. Everything you need to know before you go." },
      step3: { tag: "TECHNOLOGY", title: "AI Portals", subtitle: "Intelligent Exploration", desc: "Our AI analyzes your photos in real time to tell you the history of each place. Use 'Portals' for a unique immersive experience." },
      step4: { tag: "SOCIAL", title: "Travel Community", subtitle: "Connect & Plan", desc: "Join backpacker groups, share your itineraries, and organize group trips to the islands and reserves of the province." },
      step5: { tag: "ACHIEVEMENTS", title: "Your Digital Passport", subtitle: "Earn XP & Badges", desc: "Every photo shared and every place visited earns you points. Can you reach the 'Ecuador Legend' rank?" },
      next: "Next",
      finish: "Start my adventure!",
      skip: "Skip Tour"
    },
    post: { like: "Like", comment: "Comment", share: "Share", views: "View reviews", hide: "Hide log", time: "Posted today in real time", opinion: "Write your travel review..." }
  }
};

export const ALL_DESTINATIONS: Destination[] = [];
export const INITIAL_STORIES: Story[] = [];
export const INITIAL_POSTS: Post[] = [];
