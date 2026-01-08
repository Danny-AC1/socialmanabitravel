
import React, { useState } from 'react';
import { X, Calendar, DollarSign, MapPin, Sparkles, Loader2, Download, Share2, Sun, Sunset, Moon, Clock } from 'lucide-react';
import { generateItinerary } from '../services/geminiService';
import { Itinerary } from '../types';

interface ItineraryGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ItineraryGeneratorModal: React.FC<ItineraryGeneratorModalProps> = ({ isOpen, onClose }) => {
  const [destination, setDestination] = useState('');
  const [days, setDays] = useState(3);
  const [budget, setBudget] = useState('Moderado');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<Itinerary | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!destination) return;
    setIsGenerating(true);
    try {
      const data = await generateItinerary(destination, days, budget);
      setResult(data);
    } catch (error) {
      alert("Hubo un problema creando tu viaje. Intenta de nuevo.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShare = () => {
    if (!result) return;
    const text = `¡Mira mi plan de viaje a ${destination}!\n\n${result.title}\n${result.duration} - Presupuesto ${result.budget}`;
    alert(`Copiado al portapapeles:\n\n${text}`);
  };

  const renderTimeSegment = (rawText: string, icon: React.ReactNode, title: string, colorClass: string) => {
    if (!rawText) return null;
    
    // Split by new lines to separate activities
    const activities = rawText.split('\n').filter(line => line.trim().length > 0);

    return (
        <div className="relative pl-8 pb-8 last:pb-0">
            {/* Timeline Line */}
            <div className="absolute left-[11px] top-8 bottom-0 w-0.5 bg-gray-200"></div>
            
            {/* Timeline Icon */}
            <div className={`absolute left-0 top-0 w-6 h-6 rounded-full flex items-center justify-center border-2 bg-white z-10 ${colorClass}`}>
                {icon}
            </div>

            <h4 className="font-bold text-gray-800 mb-3 text-sm flex items-center">{title}</h4>

            <div className="space-y-3">
                {activities.map((activity, idx) => {
                    // Detect Time Pattern (e.g., "08:00 AM - " or "14:00: ")
                    const timeMatch = activity.match(/^(\d{1,2}:\d{2}\s?(?:AM|PM|am|pm)?)\s?[-:]\s?(.*)/);
                    const time = timeMatch ? timeMatch[1] : null;
                    const desc = timeMatch ? timeMatch[2] : activity;

                    return (
                        <div key={idx} className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex gap-3 items-start hover:border-cyan-200 transition-colors">
                            {time ? (
                                <div className="shrink-0 flex flex-col items-center min-w-[60px]">
                                    <Clock size={12} className="text-gray-400 mb-0.5" />
                                    <span className="text-[10px] font-bold text-gray-600 uppercase whitespace-nowrap bg-gray-100 px-1.5 py-0.5 rounded">
                                        {time}
                                    </span>
                                </div>
                            ) : (
                                <div className="shrink-0 w-1.5 h-1.5 rounded-full bg-gray-300 mt-2 ml-1"></div>
                            )}
                            <p className="text-sm text-gray-600 leading-snug">{desc}</p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-cyan-950/80 backdrop-blur-md p-0 md:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full h-full md:max-w-2xl md:h-auto md:max-h-[90vh] md:rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-600 to-blue-600 p-6 text-white flex justify-between items-start shrink-0">
          <div>
            <h2 className="text-2xl font-black flex items-center gap-2">
              <Sparkles className="text-yellow-300" />
              Planifica Tu Viaje
            </h2>
            <p className="text-cyan-100 text-sm mt-1">Tu itinerario perfecto, hora por hora.</p>
          </div>
          <button onClick={onClose} className="bg-white/20 hover:bg-white/40 p-2 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-stone-50 p-6 scroll-smooth pb-24 md:pb-6">
          {!result ? (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">¿A dónde quieres ir?</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 text-cyan-600" size={20} />
                    <input 
                      type="text" 
                      placeholder="Ej: Manta, Baños, Cuenca..." 
                      className="w-full pl-10 p-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-cyan-500 outline-none font-medium"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Duración (Días)</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 text-cyan-600" size={20} />
                      <select 
                        className="w-full pl-10 p-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-cyan-500 outline-none"
                        value={days}
                        onChange={(e) => setDays(Number(e.target.value))}
                      >
                        {[1,2,3,4,5,7,10].map(d => <option key={d} value={d}>{d} días</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Presupuesto</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-3 text-cyan-600" size={20} />
                      <select 
                        className="w-full pl-10 p-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-cyan-500 outline-none"
                        value={budget}
                        onChange={(e) => setBudget(e.target.value)}
                      >
                        <option value="Mochilero (Bajo)">Mochilero ($)</option>
                        <option value="Moderado">Moderado ($$)</option>
                        <option value="Lujo (Alto)">Lujo ($$$)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleGenerate}
                  disabled={isGenerating || !destination}
                  className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-cyan-200 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
                >
                  {isGenerating ? <Loader2 className="animate-spin" /> : <Sparkles />}
                  {isGenerating ? 'Planificando tu aventura...' : 'Generar Itinerario'}
                </button>
              </div>

              <div className="text-center text-stone-400 text-sm px-8">
                <p>Nuestro Sistema analizará clima, distancias y precios para darte la mejor ruta.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 pb-10">
              <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-stone-100">
                <div>
                    <h3 className="text-lg font-black text-stone-800">{result.title}</h3>
                    <div className="flex gap-2 text-xs font-medium mt-1">
                        <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100">{result.duration}</span>
                        <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded border border-green-100">{result.budget}</span>
                    </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleShare} className="p-2.5 text-cyan-600 bg-cyan-50 rounded-xl hover:bg-cyan-100 transition-colors">
                    <Share2 size={20} />
                  </button>
                  <button onClick={() => setResult(null)} className="p-2.5 text-stone-500 bg-stone-100 rounded-xl hover:bg-stone-200 transition-colors font-bold text-xs">
                    Nuevo
                  </button>
                </div>
              </div>

              <div className="space-y-8">
                {result.days.map((day, idx) => (
                  <div key={idx} className="relative">
                    {/* Day Header Sticky */}
                    <div className="sticky top-0 z-20 bg-stone-50 py-2">
                        <div className="bg-stone-800 text-white px-4 py-2 rounded-lg inline-flex items-center gap-2 shadow-lg">
                            <Calendar size={14} />
                            <span className="font-bold">Día {idx + 1}</span>
                        </div>
                    </div>

                    <div className="pl-4 mt-2 border-l-2 border-stone-200 ml-4 space-y-0">
                        {renderTimeSegment(day.morning, <Sun size={14} className="text-orange-500" />, "Mañana", "border-orange-200 text-orange-500")}
                        {renderTimeSegment(day.afternoon, <Sunset size={14} className="text-blue-500" />, "Tarde", "border-blue-200 text-blue-500")}
                        {renderTimeSegment(day.night, <Moon size={14} className="text-indigo-500" />, "Noche", "border-indigo-200 text-indigo-500")}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
