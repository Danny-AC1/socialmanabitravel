
import React, { useState } from 'react';
import { X, ArrowRight, Map, Compass, Camera, MessageCircle, Heart, Globe, Sparkles, CheckCircle } from 'lucide-react';

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
      icon: <Globe size={64} className="text-cyan-600" />,
      title: `¡Hola, ${userName.split(' ')[0]}!`,
      subtitle: "Bienvenido a Ecuador Travel",
      description: "La primera red social turística inteligente diseñada para conectar a viajeros con los tesoros escondidos de los 4 mundos del Ecuador.",
      color: "bg-cyan-50"
    },
    {
      icon: <Compass size={64} className="text-purple-600" />,
      title: "Tu Guía Inteligente",
      subtitle: "Descubre y Planifica",
      description: "Usa la pestaña 'Explorar' para encontrar destinos por región. Si tienes dudas, nuestro Guía Virtual con IA te responderá al instante sobre qué comer, cómo llegar y dónde dormir.",
      color: "bg-purple-50"
    },
    {
      icon: <Camera size={64} className="text-orange-600" />,
      title: "Comparte tu Aventura",
      subtitle: "Historias y Posts",
      description: "Sube historias que duran 24 horas para momentos rápidos o publicaciones permanentes para tus mejores fotos. ¡No olvides que puedes subir videos cortos también!",
      color: "bg-orange-50"
    },
    {
      icon: <MessageCircle size={64} className="text-green-600" />,
      title: "Conecta Seguro",
      subtitle: "Chat Cifrado",
      description: "Chatea con otros viajeros con total privacidad. Nuestro chat estilo Telegram está cifrado de extremo a extremo e incluye notas de voz y multimedia.",
      color: "bg-green-50"
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-900/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col relative">
        
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
            <div className="mb-6 p-6 bg-white rounded-full shadow-sm animate-in zoom-in duration-300 border border-white/50">
                {steps[currentStep].icon}
            </div>
            
            <h2 className="text-2xl font-black text-gray-800 mb-1 tracking-tight">
                {steps[currentStep].title}
            </h2>
            <h3 className="text-sm font-bold text-cyan-700 uppercase tracking-widest mb-4">
                {steps[currentStep].subtitle}
            </h3>
            
            <p className="text-gray-600 leading-relaxed text-sm mb-6">
                {steps[currentStep].description}
            </p>
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-white border-t border-gray-100 flex justify-between items-center">
            <button 
                onClick={onClose}
                className="text-gray-400 text-sm font-bold hover:text-gray-600 transition-colors px-4 py-2"
            >
                Omitir
            </button>

            <button 
                onClick={handleNext}
                className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-cyan-200 transition-all active:scale-95 flex items-center gap-2"
            >
                {currentStep === steps.length - 1 ? (
                    <>¡Empezar! <CheckCircle size={18} /></>
                ) : (
                    <>Siguiente <ArrowRight size={18} /></>
                )}
            </button>
        </div>

      </div>
    </div>
  );
};
