
import React, { useState, useRef, useEffect } from 'react';
import { X, MapPin, Star, Info, Camera, Compass, Wallet, MessageSquare, Plus, Upload, Trash2, Edit2, ChevronLeft, ChevronRight, AlertCircle, Navigation, Map, Award, Download, Check, MinusCircle } from 'lucide-react';
import { Destination } from '../types';
import { resizeImage, downloadMedia } from '../utils';

interface TravelGuideModalProps {
  destination: Destination;
  onClose: () => void;
  onAskAI: (query: string) => void;
  onRate: (rating: number) => void;
  onAddPhoto: (image: string) => void;
  isAdminUser: boolean; 
  onChangeCover?: (image: string) => void;
  onDeletePhoto?: (photoUrl: string) => void;
  onDeleteDestination?: (id: string) => void;
  onToggleFeatured?: (id: string, isFeatured: boolean) => void;
  onUpdateDestination?: (id: string, updates: Partial<Destination>) => void;
}

export const TravelGuideModal: React.FC<TravelGuideModalProps> = ({ 
  destination, 
  onClose, 
  onAskAI, 
  onRate, 
  onAddPhoto, 
  isAdminUser,
  onChangeCover,
  onDeletePhoto,
  onDeleteDestination,
  onToggleFeatured,
  onUpdateDestination
}) => {
  const [userRating, setUserRating] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  
  // States for Editing
  const [editingSection, setEditingSection] = useState<'highlights' | 'tips' | null>(null);
  const [tempList, setTempList] = useState<string[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  if (!destination) return null;

  // Generar URL de búsqueda para el mapa
  const mapQuery = encodeURIComponent(`${destination.name} ${destination.location} Ecuador`);
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${mapQuery}`;
  const embedMapUrl = `https://maps.google.com/maps?q=${mapQuery}&t=&z=13&ie=UTF8&iwloc=&output=embed`;

  const handleRating = (stars: number) => {
    setUserRating(stars);
    onRate(stars);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, isCover = false) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      try {
        const resized = await resizeImage(file, 1024);
        if (isCover && onChangeCover) {
            onChangeCover(resized);
            alert("Portada actualizada.");
        } else {
            onAddPhoto(resized);
            alert("¡Foto agregada a la galería exitosamente!");
        }
      } catch (err) {
        console.error("Error", err);
        alert("Error al subir imagen");
      }
      setIsUploading(false);
    }
  };

  const handleDeleteDestination = () => {
    if (confirm(`ATENCIÓN: ¿Estás seguro de ELIMINAR PERMANENTEMENTE "${destination.name}"?\n\nEsta acción no se puede deshacer.`)) {
        if(onDeleteDestination) onDeleteDestination(destination.id);
    }
  };

  const handleToggleFeature = () => {
      if(onToggleFeatured) {
          onToggleFeatured(destination.id, !destination.isFeatured);
          alert(destination.isFeatured ? "Quitado de destacados." : "¡Marcado como Destino Destacado en Inicio!");
      }
  };

  const handleDownload = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (viewingImage) {
          downloadMedia(viewingImage, `destination-${destination.name.replace(/\s+/g, '-')}-${Date.now()}.jpg`);
      }
  };

  // --- EDITING LOGIC ---

  const startEditing = (section: 'highlights' | 'tips') => {
      setTempList(section === 'highlights' ? (destination.highlights || []) : (destination.travelTips || []));
      setEditingSection(section);
  };

  const cancelEditing = () => {
      setEditingSection(null);
      setTempList([]);
  };

  const saveEditing = async () => {
      if (onUpdateDestination) {
          const updates = editingSection === 'highlights' 
              ? { highlights: tempList } 
              : { travelTips: tempList };
          await onUpdateDestination(destination.id, updates);
      }
      setEditingSection(null);
  };

  const handleItemChange = (index: number, value: string) => {
      const newList = [...tempList];
      newList[index] = value;
      setTempList(newList);
  };

  const handleAddItem = () => {
      setTempList([...tempList, ""]);
  };

  const handleRemoveItem = (index: number) => {
      const newList = tempList.filter((_, i) => i !== index);
      setTempList(newList);
  };

  // --- GALLERY NAVIGATION LOGIC ---
  
  const gallery = destination.gallery || [];
  const currentImageIndex = viewingImage ? gallery.indexOf(viewingImage) : -1;
  const hasMultipleImages = gallery.length > 1;

  const handleNextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (currentImageIndex === -1) return;
    const nextIndex = (currentImageIndex + 1) % gallery.length;
    setViewingImage(gallery[nextIndex]);
  };

  const handlePrevImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (currentImageIndex === -1) return;
    const prevIndex = (currentImageIndex - 1 + gallery.length) % gallery.length;
    setViewingImage(gallery[prevIndex]);
  };

  // Touch handlers for Swipe
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) handleNextImage();
    if (isRightSwipe) handlePrevImage();
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!viewingImage) return;
      if (e.key === 'ArrowRight') handleNextImage();
      if (e.key === 'ArrowLeft') handlePrevImage();
      if (e.key === 'Escape') setViewingImage(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewingImage, currentImageIndex]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-0 md:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full h-full md:h-[90vh] md:max-w-4xl md:rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        
        <div className="relative h-64 md:h-80 shrink-0 group">
          <img 
            src={destination.imageUrl} 
            alt={destination.name} 
            className="w-full h-full object-cover transition-transform duration-700 cursor-pointer"
            onClick={() => setViewingImage(destination.imageUrl)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />
          
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 bg-black/20 hover:bg-white text-white hover:text-black p-2 rounded-full backdrop-blur-md transition-all z-10"
          >
            <X size={24} />
          </button>

          {isAdminUser && (
             <>
               <div className="absolute top-4 left-4 z-10 flex gap-2 flex-wrap">
                  <button 
                    onClick={() => coverInputRef.current?.click()}
                    className="bg-white/20 hover:bg-white text-white hover:text-cyan-900 px-3 py-1.5 rounded-full backdrop-blur-md transition-all text-xs font-bold flex items-center gap-1"
                  >
                     <Edit2 size={12} /> Portada
                  </button>
                  <button 
                    onClick={handleToggleFeature}
                    className={`px-3 py-1.5 rounded-full backdrop-blur-md transition-all text-xs font-bold flex items-center gap-1 border ${destination.isFeatured ? 'bg-yellow-400 text-yellow-900 border-yellow-500' : 'bg-black/40 text-white border-white/30 hover:bg-yellow-400 hover:text-yellow-900'}`}
                  >
                     <Award size={12} /> {destination.isFeatured ? 'Destacado' : 'Destacar'}
                  </button>
                  <button 
                    onClick={handleDeleteDestination}
                    className="bg-red-600/80 hover:bg-red-600 text-white px-3 py-1.5 rounded-full backdrop-blur-md transition-all text-xs font-bold flex items-center gap-1 border border-red-400"
                  >
                     <Trash2 size={12} /> Eliminar
                  </button>
                  <input type="file" ref={coverInputRef} hidden accept="image/*" onChange={(e) => handlePhotoUpload(e, true)} />
               </div>
             </>
          )}

          <div className="absolute bottom-0 left-0 p-6 md:p-8 text-white w-full">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-cyan-600 text-white text-xs font-bold px-2 py-1 rounded-lg uppercase tracking-wider">
                {destination.category}
              </span>
              {destination.isUserGenerated && (
                <span className="bg-purple-600/80 text-white text-xs font-bold px-2 py-1 rounded-lg">
                    Comunidad
                </span>
              )}
            </div>
            <h2 className="text-3xl md:text-5xl font-black mb-1 leading-tight text-shadow-sm">{destination.name}</h2>
            <div className="flex items-center text-cyan-300 font-medium text-shadow-sm">
              <MapPin size={16} className="mr-1" />
              {destination.location}
              <span className="mx-2 text-white/40">|</span>
              <div className="flex items-center">
                 <Star size={16} className="text-yellow-400 fill-yellow-400 mr-1" />
                 <span className="text-white">{destination.rating?.toFixed(1) || '5.0'} / 5.0</span>
                 {destination.reviewsCount && <span className="text-white/60 text-xs ml-1">({destination.reviewsCount} votos)</span>}
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-stone-50">
          <div className="p-6 md:p-10 grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            
            {/* COLUMNA IZQUIERDA (Principal) */}
            <div className="md:col-span-2 space-y-8">
              {/* Rating Section */}
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-stone-100 flex items-center justify-between">
                 <div>
                    <h4 className="font-bold text-stone-700 text-sm">¿Has visitado este lugar?</h4>
                    <p className="text-xs text-stone-400">Califica tu experiencia</p>
                 </div>
                 <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                       <button 
                         key={star}
                         onClick={() => handleRating(star)}
                         className={`transition-all hover:scale-110 ${userRating >= star ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                       >
                          <Star size={24} />
                       </button>
                    ))}
                 </div>
              </div>

              <section>
                <h3 className="text-xl font-bold text-stone-800 mb-3 flex items-center gap-2">
                  <Info className="text-cyan-600" size={20} />
                  Sobre este lugar
                </h3>
                <p className="text-stone-600 leading-relaxed text-lg text-justify whitespace-pre-wrap">
                  {destination.fullDescription}
                </p>
              </section>

              <section>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-stone-800 flex items-center gap-2">
                    <Camera className="text-cyan-600" size={20} />
                    Galería de la Comunidad
                    </h3>
                    
                    {isAdminUser && (
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className="text-xs bg-cyan-100 hover:bg-cyan-200 text-cyan-800 px-3 py-1.5 rounded-full font-bold flex items-center gap-1 transition-colors"
                        >
                            {isUploading ? "Subiendo..." : <><Plus size={14}/> Gestionar Fotos</>}
                        </button>
                    )}
                    <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={(e) => handlePhotoUpload(e)} />
                </div>
                
                <div className="grid grid-cols-2 gap-2 md:gap-4">
                  {destination.gallery && destination.gallery.map((img, idx) => (
                    <div 
                        key={idx} 
                        onClick={() => setViewingImage(img)}
                        className={`rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer relative group/img ${idx === 0 ? 'col-span-2 h-48 md:h-64' : 'h-32 md:h-40'}`}
                    >
                      <img src={img} alt={`Gallery ${idx}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
                      {isAdminUser && (
                         <button 
                           onClick={(e) => { e.stopPropagation(); onDeletePhoto && onDeletePhoto(img); }}
                           className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-full opacity-0 group-hover/img:opacity-100 transition-opacity"
                         >
                            <Trash2 size={14} />
                         </button>
                      )}
                    </div>
                  ))}
                  {(!destination.gallery || destination.gallery.length === 0) && (
                     <div className="col-span-2 py-8 text-center text-stone-400 bg-stone-100 rounded-xl border border-dashed border-stone-200">
                        No hay fotos en la galería aún.
                     </div>
                  )}
                </div>
              </section>
            </div>

            {/* COLUMNA DERECHA (Sticky/Detalles) */}
            <div className="space-y-6">
              
              {/* MAPA ACTIVO Y NAVEGACIÓN */}
              <section className="bg-white p-1 rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
                <div className="p-3 pb-0 flex items-center justify-between mb-3">
                    <h3 className="font-bold text-stone-800 flex items-center gap-2 text-sm uppercase">
                        <Map size={16} className="text-cyan-600" /> Ubicación
                    </h3>
                </div>
                <div className="relative w-full h-48 bg-stone-100 rounded-xl overflow-hidden mb-2 mx-auto w-[calc(100%-16px)]">
                    <iframe 
                        title="Mapa del destino"
                        width="100%" 
                        height="100%" 
                        frameBorder="0" 
                        scrolling="no" 
                        marginHeight={0} 
                        marginWidth={0} 
                        src={embedMapUrl}
                        className="opacity-90 hover:opacity-100 transition-opacity"
                    ></iframe>
                    {/* Overlay para evitar scroll accidental en movil, requiere click para activar */}
                    <div className="absolute inset-0 pointer-events-none border-2 border-transparent hover:border-cyan-200 transition-colors rounded-xl"></div>
                </div>
                <div className="px-2 pb-2">
                    <a 
                        href={googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full bg-stone-800 hover:bg-stone-900 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors active:scale-95 text-sm shadow-md"
                    >
                        <Navigation size={16} />
                        Cómo llegar (GPS)
                    </a>
                </div>
              </section>

              {/* LO IMPERDIBLE (Highlights) */}
              <section>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-stone-800 flex items-center gap-2">
                        <Compass className="text-cyan-600" size={20} />
                        Lo Imperdible
                    </h3>
                    {isAdminUser && editingSection !== 'highlights' && (
                        <button onClick={() => startEditing('highlights')} className="text-cyan-600 hover:bg-cyan-50 p-1.5 rounded-full transition-colors">
                            <Edit2 size={16} />
                        </button>
                    )}
                </div>

                {editingSection === 'highlights' ? (
                    <div className="space-y-2 bg-stone-100 p-3 rounded-xl border border-stone-200">
                        {tempList.map((item, idx) => (
                            <div key={idx} className="flex gap-2">
                                <input 
                                    className="flex-1 text-sm p-2 rounded border border-gray-300"
                                    value={item}
                                    onChange={(e) => handleItemChange(idx, e.target.value)}
                                />
                                <button onClick={() => handleRemoveItem(idx)} className="text-red-500 hover:bg-red-100 p-2 rounded"><MinusCircle size={16} /></button>
                            </div>
                        ))}
                        <button onClick={handleAddItem} className="w-full text-xs font-bold text-cyan-600 py-2 hover:bg-white rounded border border-dashed border-cyan-300 flex items-center justify-center gap-1">
                            <Plus size={14} /> Agregar Item
                        </button>
                        <div className="flex gap-2 mt-2">
                            <button onClick={cancelEditing} className="flex-1 bg-white text-gray-600 text-xs font-bold py-2 rounded shadow-sm border">Cancelar</button>
                            <button onClick={saveEditing} className="flex-1 bg-cyan-600 text-white text-xs font-bold py-2 rounded shadow-sm">Guardar</button>
                        </div>
                    </div>
                ) : (
                    <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-3">
                        {destination.highlights && destination.highlights.map((item, idx) => (
                            <li key={idx} className="flex items-start bg-white p-3 rounded-xl shadow-sm border border-stone-100">
                            <div className="min-w-[6px] h-[6px] rounded-full bg-cyan-500 mt-2 mr-3" />
                            <span className="text-stone-700 font-medium">{item}</span>
                            </li>
                        ))}
                        {(!destination.highlights || destination.highlights.length === 0) && (
                            <li className="text-sm text-stone-400 italic">No hay puntos destacados.</li>
                        )}
                    </ul>
                )}
              </section>

              {/* TIPS DE VIAJERO */}
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-amber-800 flex items-center gap-2">
                        <Star size={18} />
                        Tips de Viajero
                    </h3>
                    {isAdminUser && editingSection !== 'tips' && (
                        <button onClick={() => startEditing('tips')} className="text-amber-800 hover:bg-amber-100 p-1.5 rounded-full transition-colors">
                            <Edit2 size={16} />
                        </button>
                    )}
                </div>

                {editingSection === 'tips' ? (
                    <div className="space-y-2 bg-white/50 p-3 rounded-xl border border-amber-200">
                        {tempList.map((item, idx) => (
                            <div key={idx} className="flex gap-2">
                                <input 
                                    className="flex-1 text-sm p-2 rounded border border-amber-200"
                                    value={item}
                                    onChange={(e) => handleItemChange(idx, e.target.value)}
                                />
                                <button onClick={() => handleRemoveItem(idx)} className="text-red-500 hover:bg-red-100 p-2 rounded"><MinusCircle size={16} /></button>
                            </div>
                        ))}
                        <button onClick={handleAddItem} className="w-full text-xs font-bold text-amber-600 py-2 hover:bg-white rounded border border-dashed border-amber-300 flex items-center justify-center gap-1">
                            <Plus size={14} /> Agregar Tip
                        </button>
                        <div className="flex gap-2 mt-2">
                            <button onClick={cancelEditing} className="flex-1 bg-white text-gray-600 text-xs font-bold py-2 rounded shadow-sm border">Cancelar</button>
                            <button onClick={saveEditing} className="flex-1 bg-amber-600 text-white text-xs font-bold py-2 rounded shadow-sm">Guardar</button>
                        </div>
                    </div>
                ) : (
                    <ul className="space-y-3">
                        {destination.travelTips && destination.travelTips.map((tip, idx) => (
                            <li key={idx} className="text-amber-900/80 text-sm flex gap-2">
                            <span>•</span>
                            {tip}
                            </li>
                        ))}
                        {(!destination.travelTips || destination.travelTips.length === 0) && (
                            <li className="text-sm text-amber-700/50 italic">No hay tips registrados.</li>
                        )}
                    </ul>
                )}
              </div>

              <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
                <h3 className="font-bold text-stone-800 mb-2">¿Tienes dudas?</h3>
                <p className="text-stone-500 text-sm mb-4">
                  Pregunta a nuestro guía virtual sobre horarios, mejores restaurantes cercanos o clima actual.
                </p>
                <button 
                  onClick={() => {
                    onClose();
                    onAskAI(`Cuéntame más sobre ${destination.name} en ${destination.location}. ¿Cómo llego y qué recomiendas comer?`);
                  }}
                  className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors active:scale-95"
                >
                  <MessageSquare size={18} />
                  Preguntar al Guía IA
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      {viewingImage && (
        <div 
          className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center animate-in fade-in duration-200 select-none"
          onClick={() => setViewingImage(null)}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
           <button 
             onClick={() => setViewingImage(null)}
             className="absolute top-4 right-4 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors z-50"
           >
             <X size={32} />
           </button>

           <button
             onClick={handleDownload}
             className="absolute top-4 right-16 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors z-50"
             title="Descargar imagen"
           >
             <Download size={32} />
           </button>

           {hasMultipleImages && (
             <>
               <button 
                  onClick={handlePrevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors hidden md:block z-40"
               >
                 <ChevronLeft size={48} />
               </button>
               <button 
                  onClick={handleNextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors hidden md:block z-40"
               >
                 <ChevronRight size={48} />
               </button>
             </>
           )}

           <img 
             src={viewingImage} 
             alt="Full size gallery" 
             className="max-w-full max-h-full object-contain shadow-2xl transition-transform duration-300"
             onClick={(e) => e.stopPropagation()}
           />
           
           {hasMultipleImages && (
             <div className="absolute bottom-6 text-white/40 text-xs md:hidden animate-pulse pointer-events-none">
               Desliza para ver más
             </div>
           )}
        </div>
      )}
    </div>
  );
};
