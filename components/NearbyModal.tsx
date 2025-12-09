
import React from 'react';
import { X, MapPin, Navigation, Loader2 } from 'lucide-react';

interface NearbyModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  data: { text: string; places: any[] } | null;
}

export const NearbyModal: React.FC<NearbyModalProps> = ({ isOpen, onClose, isLoading, data }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-cyan-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-5 text-white flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className={`bg-white/20 p-2 rounded-full ${isLoading ? 'animate-pulse' : ''}`}>
               <MapPin size={24} />
            </div>
            <div>
                <h2 className="text-xl font-bold">¿Qué hay cerca?</h2>
                <p className="text-emerald-100 text-xs">Radar Turístico en Tiempo Real</p>
            </div>
          </div>
          <button onClick={onClose} className="bg-white/20 hover:bg-white/40 p-2 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-stone-50 p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                <div className="relative">
                    <div className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-20"></div>
                    <Loader2 size={48} className="text-emerald-600 animate-spin relative z-10" />
                </div>
                <h3 className="font-bold text-stone-600">Escaneando tu ubicación...</h3>
                <p className="text-sm text-stone-400 max-w-xs">Estamos consultando satélites y mapas para encontrar lo mejor a tu alrededor.</p>
            </div>
          ) : data ? (
            <div className="space-y-6">
                
                {/* AI Response Text */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-100 text-stone-700 leading-relaxed whitespace-pre-wrap text-sm">
                    {data.text}
                </div>

                {/* Map Links */}
                {data.places.length > 0 && (
                    <div>
                        <h4 className="font-bold text-stone-500 text-xs uppercase mb-3 flex items-center gap-2">
                            <Navigation size={14} /> Enlaces Directos
                        </h4>
                        <div className="grid gap-2">
                            {data.places.map((place: any, idx: number) => (
                                <a 
                                    key={idx}
                                    href={place.uri}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-between p-3 bg-white hover:bg-emerald-50 border border-stone-200 hover:border-emerald-200 rounded-xl transition-all group"
                                >
                                    <span className="font-bold text-stone-700 text-sm group-hover:text-emerald-700 truncate mr-2">
                                        {place.title}
                                    </span>
                                    <div className="bg-stone-100 p-1.5 rounded-full group-hover:bg-emerald-200 text-stone-400 group-hover:text-emerald-700 transition-colors">
                                        <Navigation size={14} />
                                    </div>
                                </a>
                            ))}
                        </div>
                    </div>
                )}
            </div>
          ) : (
             <div className="text-center py-10 text-stone-400">
                No se encontraron resultados. Asegúrate de activar tu GPS.
             </div>
          )}
        </div>
      </div>
    </div>
  );
};
