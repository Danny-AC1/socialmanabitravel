
import React, { useState } from 'react';
import { X, MapPin, Navigation, Loader2, Utensils, Camera, ShoppingBag, Clock, Star, AlertCircle, Bed, Award } from 'lucide-react';

interface NearbyPlace {
  name: string;
  category: 'COMIDA' | 'TURISMO' | 'SERVICIO' | 'HOSPEDAJE';
  isOpen: boolean;
  rating: number;
  address: string;
  description: string;
  mapLink: string;
  isInternal?: boolean; // Propiedad nueva para identificar destinos de la app
}

interface NearbyModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  data: { places: NearbyPlace[] } | null;
}

export const NearbyModal: React.FC<NearbyModalProps> = ({ isOpen, onClose, isLoading, data }) => {
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'COMIDA' | 'TURISMO' | 'SERVICIO' | 'HOSPEDAJE'>('ALL');

  if (!isOpen) return null;

  const places = data?.places || [];
  
  const filteredPlaces = activeFilter === 'ALL' 
    ? places 
    : places.filter(p => p.category === activeFilter);

  const getCategoryIcon = (cat: string) => {
      switch(cat) {
          case 'COMIDA': return <Utensils size={16} className="text-orange-500" />;
          case 'TURISMO': return <Camera size={16} className="text-cyan-500" />;
          case 'SERVICIO': return <ShoppingBag size={16} className="text-purple-500" />;
          case 'HOSPEDAJE': return <Bed size={16} className="text-indigo-500" />;
          default: return <MapPin size={16} className="text-gray-500" />;
      }
  };

  const getCategoryLabel = (cat: string) => {
      switch(cat) {
          case 'COMIDA': return 'Restaurantes';
          case 'TURISMO': return 'Turismo';
          case 'SERVICIO': return 'Servicios';
          case 'HOSPEDAJE': return 'Hospedaje';
          default: return 'General';
      }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-cyan-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        
        {/* Header con Gradiente */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-5 text-white shadow-md z-10">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
                <div className={`bg-white/20 p-2.5 rounded-xl border border-white/20 shadow-inner ${isLoading ? 'animate-pulse' : ''}`}>
                   <MapPin size={24} />
                </div>
                <div>
                    <h2 className="text-xl font-bold leading-tight">Radar Local</h2>
                    <p className="text-emerald-100 text-xs font-medium flex items-center gap-1">
                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span> 
                        Tiempo Real
                    </p>
                </div>
            </div>
            <button onClick={onClose} className="bg-white/10 hover:bg-white/30 p-2 rounded-full transition-colors">
                <X size={20} />
            </button>
          </div>

          {/* Filtros Tabs */}
          {!isLoading && places.length > 0 && (
              <div className="flex space-x-2 overflow-x-auto no-scrollbar pb-1">
                  {[
                      { id: 'ALL', label: 'Todo' },
                      { id: 'TURISMO', label: 'Turismo' },
                      { id: 'COMIDA', label: 'Comida' },
                      { id: 'HOSPEDAJE', label: 'Hospedaje' },
                      { id: 'SERVICIO', label: 'Servicios' }
                  ].map((filter) => (
                      <button
                          key={filter.id}
                          onClick={() => setActiveFilter(filter.id as any)}
                          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap border ${
                              activeFilter === filter.id 
                                ? 'bg-white text-teal-700 border-white shadow-sm' 
                                : 'bg-emerald-700/30 text-emerald-50 border-emerald-400/30 hover:bg-emerald-700/50'
                          }`}
                      >
                          {filter.label}
                      </button>
                  ))}
              </div>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto bg-stone-50 p-4 scroll-smooth">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-6">
                <div className="relative">
                    <div className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-20 duration-1000"></div>
                    <div className="bg-white p-4 rounded-full shadow-lg relative z-10">
                        <Loader2 size={32} className="text-emerald-600 animate-spin" />
                    </div>
                </div>
                <div>
                    <h3 className="font-bold text-stone-700 text-lg">Escaneando zona...</h3>
                    <p className="text-sm text-stone-400 mt-1 max-w-[200px] mx-auto">
                        Buscando restaurantes, hoteles y servicios cercanos.
                    </p>
                </div>
            </div>
          ) : filteredPlaces.length > 0 ? (
            <div className="space-y-3">
                {filteredPlaces.map((place, idx) => (
                    <div key={idx} className={`rounded-2xl p-4 shadow-sm border flex flex-col gap-3 hover:shadow-md transition-all group ${place.isInternal ? 'bg-amber-50 border-amber-200' : 'bg-white border-stone-100 hover:border-emerald-200'}`}>
                        
                        {/* Top Row: Name & Rating */}
                        <div className="flex justify-between items-start">
                            <div className="flex-1 min-w-0 pr-2">
                                <h3 className="font-bold text-stone-800 text-base leading-tight group-hover:text-emerald-700 transition-colors flex items-center gap-1">
                                    {place.name}
                                    {place.isInternal && <Award size={14} className="text-amber-500 fill-amber-500" />}
                                </h3>
                                <div className="flex items-center gap-2 mt-1">
                                    {place.isInternal && (
                                        <span className="bg-amber-100 text-amber-700 text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 border border-amber-200">
                                           Destino Destacado
                                        </span>
                                    )}
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${place.isInternal ? 'bg-white text-stone-500 border border-amber-100' : 'bg-stone-100 text-stone-500'}`}>
                                        {getCategoryIcon(place.category)}
                                        {getCategoryLabel(place.category)}
                                    </span>
                                    {place.rating > 0 && (
                                        <span className="flex items-center text-[10px] font-bold text-amber-500">
                                            <Star size={10} fill="currentColor" className="mr-0.5" />
                                            {place.rating}
                                        </span>
                                    )}
                                </div>
                            </div>
                            
                            {/* Status Badge */}
                            <div className={`px-2 py-1 rounded-lg text-[10px] font-bold border flex items-center gap-1 shrink-0 ${
                                place.isOpen 
                                    ? 'bg-green-50 text-green-700 border-green-100' 
                                    : 'bg-red-50 text-red-700 border-red-100'
                            }`}>
                                <Clock size={10} />
                                {place.isOpen ? 'ABIERTO' : 'CERRADO'}
                            </div>
                        </div>

                        {/* Middle: Description & Address */}
                        <div>
                            <p className="text-stone-600 text-xs line-clamp-2 mb-1">
                                {place.description}
                            </p>
                            <p className="text-stone-400 text-[10px] flex items-center gap-1">
                                <MapPin size={10} /> {place.address}
                            </p>
                        </div>

                        {/* Bottom: Action Button */}
                        <a 
                            href={place.mapLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors active:scale-95 ${place.isInternal ? 'bg-amber-100 hover:bg-amber-200 text-amber-800' : 'bg-stone-100 hover:bg-emerald-600 hover:text-white text-stone-600'}`}
                        >
                            <Navigation size={14} />
                            Cómo llegar
                        </a>
                    </div>
                ))}
            </div>
          ) : (
             <div className="flex flex-col items-center justify-center py-10 text-stone-400 space-y-3">
                <AlertCircle size={40} className="opacity-30" />
                <div className="text-center">
                    <p className="font-bold text-stone-500">Sin resultados</p>
                    <p className="text-xs">No encontramos lugares en esta categoría cerca de ti.</p>
                </div>
                <button onClick={onClose} className="text-xs text-emerald-600 font-bold hover:underline">
                    Intentar de nuevo
                </button>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};
