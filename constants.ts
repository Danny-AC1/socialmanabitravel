
import { Post, Story, Destination } from './types';

// --- VERSION CONTROL ---
export const APP_VERSION = '1.7.6';

export const RELEASE_NOTES = [
  {
    title: "Ecuador Travel: Estabilidad Mejorada",
    date: "Hotfix",
    changes: [
      { type: 'fix', text: "Corregido error de carga en búsqueda cuando las claves de traducción son nulas." },
      { type: 'improved', text: "Sistema de seguridad en plantillas de texto." }
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
      welcome: "Ecuador en tus manos.",
      join: "Únete a la aventura.",
      desc: "Crea tu propia red social de viajes. Explora, comparte y descubre Ecuador a tu manera.",
      name: "Nombre",
      email: "Correo",
      password: "Contraseña",
      bio: "Biografía",
      continue: "Continuar",
      noAccount: "¿No tienes cuenta? Regístrate",
      hasAccount: "¿Ya tienes cuenta? Entra",
      guest: "Seguir como invitado"
    },
    home: { recommended: "Sugeridos", stories: "Historias", create: "Crear", featured: "Destino Destacado", openGuide: "Abrir Guía" },
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
    search: { 
      title: "Descubrir Ecuador", 
      placeholder: "Busca playas, montañas, selva o grupos...", 
      all: "Todo", 
      destinations: "Destinos", 
      communities: "Comunidades", 
      travelers: "Viajeros", 
      placesFound: "Lugares Encontrados", 
      groupsFound: "Grupos de Viaje", 
      usersFound: "Viajeros Encontrados", 
      empty: "No encontramos resultados", 
      intro: "Escribe algo para empezar a descubrir Ecuador",
      suggestAdd: "¿Conoces '{name}' y no está aquí?",
      suggestAddBtn: "¡Añadir este destino!"
    },
    profile: { points: "Puntos", posts: "Publicaciones", followers: "Seguidores", bio: "Explorando las maravillas del Ecuador 🇪🇨", groups: "Grupos", aiTrips: "Viajes IA", suggest: "Sugerir", memories: "Memorias", achievements: "Logros", path: "Trayectoria", bookings: "Reservas", logout: "Cerrar Sesión", guest: "Viajero" },
    onboarding: {
      step1: { tag: "BIENVENIDA", title: "¡Hola, {name}!", subtitle: "Ecuador Travel Social", desc: "Bienvenido a tu nueva red social de viajes. Aquí tú creas el contenido que otros viajeros descubrirán." },
      step2: { tag: "CREACIÓN", title: "Tus propios lugares", subtitle: "Añade Destinos", desc: "Usa el botón de '+' en explorar para agregar tus lugares favoritos. Nuestra IA te ayudará a completar la información." },
      step3: { tag: "COMUNIDAD", title: "Comparte Experiencias", subtitle: "Muro Social", desc: "Publica fotos y videos de tus aventuras. Cada interacción te da puntos para subir de nivel." },
      step4: { tag: "IA", title: "Guía Inteligente", subtitle: "Soporte 24/7", desc: "Nuestra IA analiza tus fotos y te ayuda a planificar itinerarios hora por hora para cualquier destino." },
      step5: { tag: "GAMIFICACIÓN", title: "Tu Pasaporte Digital", subtitle: "Gana XP", desc: "Conviértete en una 'Leyenda del Ecuador' compartiendo las joyas ocultas de nuestro país." },
      next: "Siguiente",
      finish: "¡Comenzar!",
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
      welcome: "Ecuador in your hands.",
      join: "Join the adventure.",
      desc: "Create your own travel social network. Explore, share and discover Ecuador your way.",
      name: "Name",
      email: "Email",
      password: "Password",
      bio: "Bio",
      continue: "Continue",
      noAccount: "Don't have an account? Register",
      hasAccount: "Already have an account? Login",
      guest: "Continue as guest"
    },
    home: { recommended: "Suggested", stories: "Stories", create: "Create", featured: "Featured Destination", openGuide: "Open Guide" },
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
    search: { 
      title: "Discover Ecuador", 
      placeholder: "Search beaches, mountains, jungle or groups...", 
      all: "All", 
      destinations: "Destinations", 
      communities: "Communities", 
      travelers: "Travelers", 
      placesFound: "Places Found", 
      groupsFound: "Travel Groups", 
      usersFound: "Travelers Found", 
      empty: "No results found", 
      intro: "Type something to start discovering Ecuador",
      suggestAdd: "Do you know '{name}' and it's not here?",
      suggestAddBtn: "Add this destination!"
    },
    profile: { points: "Points", posts: "Posts", followers: "Followers", bio: "Exploring the wonders of Ecuador 🇪🇨", groups: "Groups", aiTrips: "AI Trips", suggest: "Suggest", memories: "Memories", achievements: "Achievements", path: "Trajectory", bookings: "Bookings", logout: "Logout", guest: "Traveler" },
    onboarding: {
      step1: { tag: "WELCOME", title: "Hi, {name}!", subtitle: "Ecuador Travel Social", desc: "Welcome to your new travel social network. Here you create the content that other travelers will discover." },
      step2: { tag: "CREATION", title: "Your own places", subtitle: "Add Destinations", desc: "Use the '+' button in explore to add your favorite places. Our AI will help you complete the information." },
      step3: { tag: "COMMUNITY", title: "Share Experiences", subtitle: "Social Feed", desc: "Post photos and videos of your adventures. Each interaction gives you points to level up." },
      step4: { tag: "AI", title: "Intelligent Guide", subtitle: "24/7 Support", desc: "Our AI analyzes your photos and helps you plan hour-by-hour itineraries for any destination." },
      step5: { tag: "LOGS", title: "Your Digital Passport", subtitle: "Earn XP", desc: "Become an 'Ecuador Legend' by sharing the hidden gems of our country." },
      next: "Next",
      finish: "Start!",
      skip: "Skip Tour"
    },
    post: { like: "Like", comment: "Comment", share: "Share", views: "View reviews", hide: "Hide log", time: "Posted today in real time", opinion: "Write your travel review..." }
  }
};

export const ALL_DESTINATIONS: Destination[] = [];

export const INITIAL_STORIES: Story[] = [];

export const INITIAL_POSTS: Post[] = [];
