import React from 'react';
import { MapPin, BookOpen, Star, Clover } from 'lucide-react';
import { Destination } from '../types';

interface DestinationCardProps {
  destination: Destination;
  onClickGuide: (destinationName: string) => void;
}

export const DestinationCard: React.FC<DestinationCardProps> = ({ destination, onClickGuide }) => {
  return (
    <div className="relative w-full h-80 md:h-96 bg-gray-900 overflow-hidden rounded-3xl shadow-lg group">
      {/* Background Image with Zoom Effect */}
      <img 
        src={destination.imageUrl} 
        alt={destination.name} 
        className="absolute w-full h-full object-cover opacity-70 group-hover:scale-110 transition-transform duration-1000"
      />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-cyan-950/90 via-black/20 to-transparent" />
      
      {/* Top Badge */}
      <div className="absolute top-4 right-4 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 flex items-center gap-1 text-white text-xs font-bold">
        <Star size={12} className="text-yellow-400 fill-yellow-400" />
        {destination.rating}
      </div>

      {/* Content */}
      <div className="absolute bottom-0 left-0 p-6 w-full text-white">
        <div className="flex items-center space-x-2 text-cyan-300 mb-2">
          <MapPin size={16} />
          <span className="uppercase tracking-widest text-xs font-bold">{destination.location}</span>
        </div>
        
        <h2 className="text-2xl md:text-3xl font-black mb-2 leading-tight">
          {destination.name}
        </h2>
        
        <p className="text-gray-200 text-sm mb-4 line-clamp-2 opacity-90">
          {destination.description}
        </p>
        
        <div className="flex items-center justify-between">
            <span className="text-xs bg-cyan-900/50 px-2 py-1 rounded border border-cyan-500/30 text-cyan-200">
                {destination.category}
            </span>
            <button 
                onClick={() => onClickGuide(destination.name)}
                className="bg-white text-cyan-900 hover:bg-cyan-50 px-4 py-2 rounded-xl font-bold transition-colors flex items-center shadow-lg text-sm"
            >
                <BookOpen size={16} className="mr-2" />
                Guía de Viaje
            </button>
        </div>
      </div>
    </div>
  );
};