import React, { useState, useRef } from 'react';
import { X, MapPin, Star, Info, Camera, Compass, Wallet, MessageSquare, Plus, Upload } from 'lucide-react';
import { Destination } from '../types';
import { resizeImage } from '../utils';

interface TravelGuideModalProps {
  destination: Destination;
  onClose: () => void;
  onAskAI: (query: string) => void;
  onRate: (rating: number) => void;
  onAddPhoto: (image: string) => void;
}

export const TravelGuideModal: React.FC<TravelGuideModalProps> = ({ destination, onClose, onAskAI, onRate, onAddPhoto }) => {
  const [userRating, setUserRating] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!destination) return null;

  const handleRating = (stars: number) => {
    setUserRating(stars);
    onRate(stars);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      try {
        const resized = await resizeImage(file, 1024);
        onAddPhoto(resized);
        alert("¡Foto agregada a la galería exitosamente!");
      } catch (err) {
        console.error("Error", err);
        alert("Error al subir imagen");
      }
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-0 md:p-4">
      <div className="bg-white w-full h-full md:h-[90vh] md:max-w-4xl md:rounded-3xl overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in duration-300">
        
        <div className="relative h-64 md:h-80 shrink-0">
          <img 
            src={destination.imageUrl} 
            alt={destination.name} 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
          
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 bg-black/20 hover:bg-white text-white hover:text-black p-2 rounded-full backdrop-blur-md transition-all z-10"
          >
            <X size={24} />
          </button>

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
            <h2 className="text-3xl md:text-5xl font-black mb-1 leading-tight">{destination.name}</h2>
            <div className="flex items-center text-cyan-300 font-medium">
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
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="text-xs bg-stone-100 hover:bg-stone-200 text-stone-600 px-3 py-1.5 rounded-full font-bold flex items-center gap-1 transition-colors"
                    >
                        {isUploading ? "Subiendo..." : <><Plus size={14}/> Agregar Foto</>}
                    </button>
                    <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handlePhotoUpload} />
                </div>
                
                <div className="grid grid-cols-2 gap-2 md:gap-4">
                  {destination.gallery && destination.gallery.map((img, idx) => (
                    <div key={idx} className={`rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer ${idx === 0 ? 'col-span-2 h-48 md:h-64' : 'h-32 md:h-40'}`}>
                      <img src={img} alt={`Gallery ${idx}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div className="space-y-6">
              <section>
                <h3 className="text-xl font-bold text-stone-800 mb-4 flex items-center gap-2">
                  <Compass className="text-cyan-600" size={20} />
                  Lo Imperdible
                </h3>
                <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-3">
                  {destination.highlights && destination.highlights.map((item, idx) => (
                    <li key={idx} className="flex items-start bg-white p-3 rounded-xl shadow-sm border border-stone-100">
                      <div className="min-w-[6px] h-[6px] rounded-full bg-cyan-500 mt-2 mr-3" />
                      <span className="text-stone-700 font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6">
                <h3 className="font-bold text-amber-800 mb-4 flex items-center gap-2">
                  <Star size={18} />
                  Tips de Viajero
                </h3>
                <ul className="space-y-3">
                  {destination.travelTips && destination.travelTips.map((tip, idx) => (
                    <li key={idx} className="text-amber-900/80 text-sm flex gap-2">
                      <span>•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
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
                  className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                  <MessageSquare size={18} />
                  Preguntar al Guía IA
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};