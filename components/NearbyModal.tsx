
import React, { useState } from 'react';
import { X, MapPin, Navigation, Loader2, Utensils, Camera, ShoppingBag, Clock, Star, AlertCircle, Bed, Award } from 'lucide-react';
import { Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface NearbyPlace {
  name: string;
  category: 'COMIDA' | 'TURISMO' | 'SERVICIO' | 'HOSPEDAJE';
  isOpen: boolean;
  rating: number;
  address: string;
  description: string;
  mapLink: string;
  isInternal?: boolean;
}

interface NearbyModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  language: Language;
  data: { places: NearbyPlace[] } | null;
}

export const NearbyModal: React.FC<NearbyModalProps> = ({ isOpen, onClose, isLoading, language, data }) => {
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'COMIDA' | 'TURISMO' | 'SERVICIO' | 'HOSPEDAJE'>('ALL');
  const t = TRANSLATIONS[language].nearby;

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

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-stone-900/90 backdrop-blur-md p-0 md:p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full h-full md:max-w-lg md:h-auto md:max-h-[85vh] md:rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col">
        
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white shrink-0">
          <div className="flex justify-between items-start mb-5">
            <div className="flex items-center gap-4">
                <div className={`bg-white/20 p-3 rounded-2xl border border-white/20 shadow-inner ${isLoading ? 'animate-pulse' : ''}`}>
                   <MapPin size={28} />
                </div>
                <div>
                    <h2 className="text-2xl font-black leading-none">{t.title}</h2>
                    <p className="text-emerald-100 text-[10px] font-black uppercase tracking-widest mt-1.5 flex items-center gap-1.5">
                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span> 
                        {language === 'es' ? 'Radio 20km' : '20km Radius'}
                    </p>
                </div>
            </div>
            <button onClick={onClose} className="bg-white/10 hover:bg-white/30 p-2 rounded-full transition-colors">
                <X size={20} />
            </button>
          </div>

          {!isLoading && places.length > 0 && (
              <div className="flex space-x-2 overflow-x-auto no-scrollbar">
                  {[
                      { id: 'ALL', label: t.categories.all },
                      { id: 'TURISMO', label: t.categories.tourism },
                      { id: 'COMIDA', label: t.categories.food },
                      { id: 'HOSPEDAJE', label: t.categories.stay },
                      { id: 'SERVICIO', label: t.categories.service }
                  ].map((filter) => (
                      <button
                          key={filter.id}
                          onClick={() => setActiveFilter(filter.id as any)}
                          className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${
                              activeFilter === filter.id 
                                ? 'bg-white text-teal-700 border-white shadow-lg scale-105' 
                                : 'bg-emerald-700/30 text-emerald-50 border-emerald-400/30 hover:bg-emerald-700/50'
                          }`}
                      >
                          {filter.label}
                      </button>
                  ))}
              </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto bg-stone-50 p-4 space-y-4 no-scrollbar pb-24 md:pb-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
                <div className="relative">
                    <div className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-20 duration-1000"></div>
                    <div className="bg-white p-6 rounded-full shadow-2xl relative z-10 border border-stone-100">
                        <Loader2 size={40} className="text-emerald-600 animate-spin" />
                    </div>
                </div>
                <h3 className="font-black text-stone-700 text-lg uppercase tracking-widest">{t.scanning}</h3>
            </div>
          ) : filteredPlaces.length > 0 ? (
            <div className="space-y-3 animate-in fade-in duration-500">
                {filteredPlaces.map((place, idx) => (
                    <div key={idx} className={`rounded-[2rem] p-5 shadow-sm border flex flex-col gap-4 hover:shadow-xl transition-all group ${place.isInternal ? 'bg-amber-50 border-amber-200' : 'bg-white border-stone-100'}`}>
                        <div className="flex justify-between items-start">
                            <div className="flex-1 min-w-0 pr-2">
                                <h3 className="font-black text-stone-800 text-base leading-tight group-hover:text-emerald-700 transition-colors flex items-center gap-1.5">
                                    {place.name}
                                    {place.isInternal && <Award size={16} className="text-amber-500 fill-amber-500" />}
                                </h3>
                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                    <span className={`text-[9px] font-black px-2 py-1 rounded-lg flex items-center gap-1.5 ${place.isInternal ? 'bg-amber-100 text-amber-700' : 'bg-stone-100 text-stone-500'}`}>
                                        {getCategoryIcon(place.category)}
                                        {place.category}
                                    </span>
                                    {place.rating > 0 && (
                                        <span className="flex items-center text-[10px] font-black text-amber-500 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100">
                                            <Star size={10} fill="currentColor" className="mr-1" />
                                            {place.rating}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className={`px-2 py-1 rounded-lg text-[9px] font-black border flex items-center gap-1 shrink-0 ${place.isOpen ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                                <Clock size={10} />
                                {place.isOpen ? (language === 'es' ? 'ABIERTO' : 'OPEN') : (language === 'es' ? 'CERRADO' : 'CLOSED')}
                            </div>
                        </div>

                        <p className="text-stone-500 text-xs font-medium leading-relaxed italic line-clamp-2">
                            "{place.description}"
                        </p>

                        <div className="flex items-center justify-between gap-4">
                            <p className="text-stone-400 text-[10px] font-bold flex items-center gap-1 truncate max-w-[150px]">
                                <MapPin size={10} /> {place.address}
                            </p>
                            <a 
                                href={place.mapLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`font-black text-[10px] px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-90 uppercase tracking-widest shadow-md ${place.isInternal ? 'bg-amber-600 text-white hover:bg-amber-700' : 'bg-stone-900 text-white hover:bg-emerald-600'}`}
                            >
                                <Navigation size={12} />
                                {language === 'es' ? 'Ir ahora' : 'Go now'}
                            </a>
                        </div>
                    </div>
                ))}
            </div>
          ) : (
             <div className="flex flex-col items-center justify-center py-20 text-stone-400 space-y-4">
                <AlertCircle size={48} className="opacity-10" />
                <div className="text-center">
                    <p className="font-black text-stone-500 uppercase tracking-widest">{t.noResults}</p>
                </div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};
