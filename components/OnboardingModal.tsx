import React, { useState } from 'react';
import { ArrowRight, Map as MapIcon, Trophy, Sparkles, CheckCircle, Navigation } from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose, userName }) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const steps = [
    {
      icon: <MapIcon size={64} className="text-cyan-600" />,
      title: `¡Hola, ${userName.split(' ')[0]}!`,
      subtitle: "Tu Pasaporte a la Aventura",
      description: "Bienvenido a Ecuador Travel. Aquí no solo ves fotos, vives experiencias. Descubre los tesoros escondidos de la Costa, Sierra, Amazonía y Galápagos.",
      color: "bg-cyan-50",
      accent: "text-cyan-700"
    },
    {
      icon: <Sparkles size={64} className="text-purple-600" />,
      title: "Planifica con IA",
      subtitle: "Itinerarios en Segundos",
      description: "¿No sabes qué hacer? Usa el nuevo generador de itinerarios. Dinos tu presupuesto y días libres, y nuestra IA creará el plan de viaje perfecto para ti al instante.",
      color: "bg-purple-50",
      accent: "text-purple-700"
    },
    {
      icon: <Navigation size={64} className="text-emerald-600" />,
      title: "Radar Turístico",
      subtitle: "¿Qué hay cerca?",
      description: "Usa nuestra herramienta de geolocalización en tiempo real para encontrar atracciones, restaurantes y sitios turísticos justo donde estás parado ahora mismo.",
      color: "bg-emerald-50",
      accent: "text-emerald-700"
    },
    {
      icon: <Trophy size={64} className="text-amber-600" />,
      title: "Juega y Gana",
      subtitle: "Sube de Nivel",
      description: "Completa desafíos diarios, sube fotos y recibe 'Likes' para ganar puntos (XP). Empiezas como 'Turista Curioso'... ¿Podrás convertirte en una 'Leyenda de Ecuador'?",
      color: "bg-amber-50",
      accent: "text-amber-700"
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-900/90 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col relative min-h-[500px]">
        
        {/* Progress Bar */}
        <div className="flex gap-1 p-1">
            {steps.map((_, idx) => (
                <div 
                    key={idx} 
                    className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${idx <= currentStep ? 'bg-cyan-500' : 'bg-gray-100'}`} 
                />
            ))}
        </div>

        {/* Content */}
        <div className={`p-8 flex flex-col items-center text-center flex-1 transition-all duration-500 ${steps[currentStep].color}`}>
            <div className="mt-4 mb-8 p-6 bg-white rounded-full shadow-lg shadow-black/5 animate-in zoom-in duration-300 border-4 border-white">
                {steps[currentStep].icon}
            </div>
            
            <h2 className="text-3xl font-black text-gray-800 mb-2 tracking-tight leading-tight">
                {steps[currentStep].title}
            </h2>
            <h3 className={`text-sm font-bold uppercase tracking-widest mb-6 ${steps[currentStep].accent}`}>
                {steps[currentStep].subtitle}
            </h3>
            
            <p className="text-gray-600 leading-relaxed text-base font-medium">
                {steps[currentStep].description}
            </p>
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-white border-t border-gray-100 flex justify-between items-center z-10 relative">
            <button 
                onClick={onClose}
                className="text-gray-400 text-sm font-bold hover:text-gray-600 transition-colors px-4 py-2"
            >
                Omitir
            </button>

            <button 
                onClick={handleNext}
                className="bg-cyan-600 hover:bg-cyan-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-cyan-200 transition-all active:scale-95 flex items-center gap-2"
            >
                {currentStep === steps.length - 1 ? (
                    <>¡Empezar! <CheckCircle size={20} /></>
                ) : (
                    <>Siguiente <ArrowRight size={20} /></>
                )}
            </button>
        </div>

      </div>
    </div>
  );
};