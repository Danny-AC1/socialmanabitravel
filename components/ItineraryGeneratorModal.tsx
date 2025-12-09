
import React, { useState } from 'react';
import { X, Calendar, DollarSign, MapPin, Sparkles, Loader2, Download, Share2 } from 'lucide-react';
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

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-cyan-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-600 to-blue-600 p-6 text-white flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-black flex items-center gap-2">
              <Sparkles className="text-yellow-300" />
              Planificador IA
            </h2>
            <p className="text-cyan-100 text-sm mt-1">Tu itinerario perfecto en segundos.</p>
          </div>
          <button onClick={onClose} className="bg-white/20 hover:bg-white/40 p-2 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-stone-50 p-6">
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
                  Generar Itinerario
                </button>
              </div>

              <div className="text-center text-stone-400 text-sm px-8">
                <p>Nuestra IA analizará clima, distancias y precios para darte la mejor ruta.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-in slide-in-from-bottom-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-stone-800">{result.title}</h3>
                <div className="flex gap-2">
                  <button onClick={handleShare} className="p-2 text-cyan-600 bg-cyan-50 rounded-full hover:bg-cyan-100">
                    <Share2 size={20} />
                  </button>
                  <button onClick={() => setResult(null)} className="text-sm text-stone-500 underline decoration-stone-300 underline-offset-4">
                    Nuevo Viaje
                  </button>
                </div>
              </div>

              <div className="flex gap-3 text-sm font-medium">
                <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg border border-blue-100">{result.duration}</span>
                <span className="bg-green-50 text-green-700 px-3 py-1 rounded-lg border border-green-100">{result.budget}</span>
              </div>

              <div className="space-y-6">
                {result.days.map((day, idx) => (
                  <div key={idx} className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm">
                    <div className="bg-stone-100 p-3 border-b border-stone-200 font-bold text-stone-700 flex items-center gap-2">
                      <div className="w-6 h-6 bg-cyan-600 text-white rounded-full flex items-center justify-center text-xs">
                        {idx + 1}
                      </div>
                      Día {idx + 1}
                    </div>
                    <div className="p-4 space-y-4">
                      <div className="flex gap-3">
                        <span className="text-xs font-bold uppercase text-orange-500 w-16 shrink-0 mt-1">Mañana</span>
                        <p className="text-sm text-stone-600">{day.morning}</p>
                      </div>
                      <div className="flex gap-3">
                        <span className="text-xs font-bold uppercase text-blue-500 w-16 shrink-0 mt-1">Tarde</span>
                        <p className="text-sm text-stone-600">{day.afternoon}</p>
                      </div>
                      <div className="flex gap-3">
                        <span className="text-xs font-bold uppercase text-purple-500 w-16 shrink-0 mt-1">Noche</span>
                        <p className="text-sm text-stone-600">{day.night}</p>
                      </div>
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
