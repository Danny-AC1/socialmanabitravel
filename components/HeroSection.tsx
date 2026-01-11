
import React from 'react';
import { MapPin, BookOpen, Star, Compass } from 'lucide-react';
import { Destination, Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface HeroSectionProps {
  destination: Destination | null;
  onGuideClick: (name: string) => void;
  language: Language;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ destination, onGuideClick, language }) => {
  const t = TRANSLATIONS[language].home;
  
  if (!destination) {
    return (
      <div className="relative w-full h-96 bg-gray-900 overflow-hidden mb-6 rounded-3xl shadow-lg flex items-center justify-center">
         <div className="text-center text-white/50 p-6">
            <Compass size={48} className="mx-auto mb-2 opacity-50" />
            <h2 className="text-xl font-bold">Ecuador Travel</h2>
            <p className="text-sm">Discover amazing destinations</p>
         </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-96 bg-gray-900 overflow-hidden mb-6 rounded-3xl shadow-lg group">
      
      {/* Background with subtle animation */}
      <img 
        src={destination.imageUrl} 
        alt={destination.name} 
        className="absolute w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-1000"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-cyan-950/90 via-transparent to-transparent" />
      
      {/* Badge Featured */}
      <div className="absolute top-6 right-6 bg-yellow-500/20 backdrop-blur-md border border-yellow-500/50 text-yellow-100 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm">
         <Star size={12} fill="currentColor" /> {t.featured}
      </div>

      <div className="absolute bottom-0 left-0 p-6 md:p-10 text-white max-w-2xl">
        <div className="flex items-center space-x-2 text-cyan-300 mb-3 bg-black/30 w-fit px-3 py-1 rounded-full backdrop-blur-sm border border-white/10">
          <MapPin size={16} />
          <span className="uppercase tracking-widest text-xs font-bold">{destination.location}</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 leading-tight tracking-tight text-shadow-lg">
          {destination.name}
        </h1>
        <p className="text-gray-100 text-base md:text-lg mb-6 line-clamp-2 md:line-clamp-3 font-medium text-shadow-sm">
          {destination.description}
        </p>
        <div className="flex space-x-4">
          <button 
            onClick={() => onGuideClick(destination.name)}
            className="bg-white text-cyan-900 hover:bg-cyan-50 px-6 py-3 rounded-xl font-bold transition-colors flex items-center shadow-lg active:scale-95 transform"
          >
            <BookOpen size={18} className="mr-2" />
            {t.openGuide}
          </button>
        </div>
      </div>
    </div>
  );
};
