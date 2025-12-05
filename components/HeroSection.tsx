import React from 'react';
import { MapPin, BookOpen } from 'lucide-react';

interface HeroSectionProps {
  onGuideClick: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onGuideClick }) => {
  return (
    <div className="relative w-full h-96 bg-gray-900 overflow-hidden mb-6 rounded-3xl shadow-lg">
      <img 
        src="https://picsum.photos/id/1036/1200/600" 
        alt="Los Frailes Beach" 
        className="absolute w-full h-full object-cover opacity-60 hover:scale-105 transition-transform duration-700"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-cyan-950/90 via-transparent to-transparent" />
      
      <div className="absolute bottom-0 left-0 p-6 md:p-10 text-white max-w-2xl">
        <div className="flex items-center space-x-2 text-cyan-300 mb-3 bg-black/30 w-fit px-3 py-1 rounded-full backdrop-blur-sm border border-white/10">
          <MapPin size={16} />
          <span className="uppercase tracking-widest text-xs font-bold">Destino Destacado</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 leading-tight tracking-tight">
          Parque Nacional Machalilla
        </h1>
        <p className="text-gray-100 text-base md:text-lg mb-6 line-clamp-2 md:line-clamp-none font-medium text-shadow-sm">
          Descubre la playa virgen de Los Frailes y la biodiversidad única de Puerto López. 
          ¡La aventura comienza aquí!
        </p>
        <div className="flex space-x-4">
          <button 
            onClick={onGuideClick}
            className="bg-white text-cyan-900 hover:bg-cyan-50 px-6 py-3 rounded-xl font-bold transition-colors flex items-center shadow-lg active:scale-95 transform"
          >
            <BookOpen size={18} className="mr-2" />
            Guía de Viaje
          </button>
        </div>
      </div>
    </div>
  );
};