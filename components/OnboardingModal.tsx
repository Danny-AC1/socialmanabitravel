
import React, { useState } from 'react';
import { ArrowRight, Map as MapIcon, Trophy, Sparkles, CheckCircle, Navigation, Users } from 'lucide-react';

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
      subtitle: "Bienvenido a Ecuador Travel",
      description: "Estás a punto de descubrir una nueva forma de viajar. Explora los 4 mundos de Ecuador, guarda tus recuerdos y conecta con otros viajeros.",
      color: "bg-cyan-50",
      accent: "text-cyan-700",
      bgGradient: "from-cyan-500/20 to-blue-500/20"
    },
    {
      icon: <Sparkles size={64} className="text-purple-600" />,
      title: "Tu Asistente Inteligente",
      subtitle: "Planificación con IA",
      description: "¿No sabes por dónde empezar? Usa nuestro Generador de Itinerarios. Dinos tu presupuesto y tiempo, y la IA creará el viaje perfecto para ti en segundos.",
      color: "bg-purple-50",
      accent: "text-purple-700",
      bgGradient: "from-purple-500/20 to-pink-500/20"
    },
    {
      icon: <Navigation size={64} className="text-emerald-600" />,
      title: "Explora en Tiempo Real",
      subtitle: "Radar Local",
      description: "Usa la función '¿Qué hay cerca?' para encontrar restaurantes, hoteles y atracciones a tu alrededor al instante. ¡Nunca más te sentirás perdido!",
      color: "bg-emerald-50",
      accent: "text-emerald-700",
      bgGradient: "from-emerald-500/20 to-teal-500/20"
    },
    {
      icon: <Users size={64} className="text-orange-600" />,
      title: "Comunidad y Grupos",
      subtitle: "Viaja Acompañado",
      description: "Únete a Grupos de Viaje públicos o crea los tuyos privados. Comparte plantillas de viaje, organiza salidas y conoce gente con tus mismos intereses.",
      color: "bg-orange-50",
      accent: "text-orange-700",
      bgGradient: "from-orange-500/20 to-red-500/20"
    },
    {
      icon: <Trophy size={64} className="text-yellow-600" />,
      title: "Gana Recompensas",
      subtitle: "Sube de Nivel",
      description: "Completa desafíos diarios y comparte tus experiencias para ganar XP. Empiezas como 'Turista Curioso'... ¿Podrás convertirte en una 'Leyenda de Ecuador'?",
      color: "bg-yellow-50",
      accent: "text-yellow-700",
      bgGradient: "from-yellow-500/20 to-amber-500/20"
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-900/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-[2rem] overflow-hidden shadow-2xl flex flex-col relative min-h-[550px] transition-all">
        
        {/* Decorative Background Blob */}
        <div className={`absolute top-0 left-0 w-full h-64 bg-gradient-to-b ${steps[currentStep].bgGradient} transition-colors duration-500`} />

        {/* Content */}
        <div className="relative flex-1 flex flex-col items-center text-center p-8 pt-12">
            
            {/* Floating Icon Card */}
            <div className="mb-8 p-8 bg-white rounded-3xl shadow-xl shadow-stone-200/50 animate-in zoom-in duration-500 border border-white/50 relative">
                {steps[currentStep].icon}
                <div className="absolute -bottom-3 -right-3 w-10 h-10 bg-gray-900 text-white rounded-full flex items-center justify-center font-bold text-sm border-4 border-white">
                    {currentStep + 1}/{steps.length}
                </div>
            </div>
            
            <h2 className="text-3xl font-black text-gray-800 mb-2 tracking-tight leading-none animate-in slide-in-from-bottom-2">
                {steps[currentStep].title}
            </h2>
            
            <h3 className={`text-xs font-bold uppercase tracking-[0.2em] mb-6 ${steps[currentStep].accent} bg-white/60 px-3 py-1 rounded-full`}>
                {steps[currentStep].subtitle}
            </h3>
            
            <p className="text-gray-500 leading-relaxed text-base font-medium max-w-xs mx-auto animate-in slide-in-from-bottom-4 delay-100">
                {steps[currentStep].description}
            </p>
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-white border-t border-gray-50 flex flex-col gap-4 z-10 relative">
            
            {/* Progress Dots */}
            <div className="flex justify-center gap-2 mb-2">
                {steps.map((_, idx) => (
                    <div 
                        key={idx} 
                        className={`h-2 rounded-full transition-all duration-500 ${idx === currentStep ? 'w-8 bg-cyan-600' : 'w-2 bg-gray-200'}`} 
                    />
                ))}
            </div>

            <button 
                onClick={handleNext}
                className="w-full bg-stone-900 hover:bg-black text-white py-4 rounded-xl font-bold shadow-lg shadow-stone-200 transition-all active:scale-95 flex items-center justify-center gap-2 group"
            >
                {currentStep === steps.length - 1 ? (
                    <>¡Comenzar Aventura! <CheckCircle size={20} className="text-green-400" /></>
                ) : (
                    <>Continuar <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" /></>
                )}
            </button>
            
            {currentStep < steps.length - 1 && (
                <button 
                    onClick={onClose}
                    className="text-gray-400 text-xs font-bold hover:text-gray-600 transition-colors py-2"
                >
                    Saltar Introducción
                </button>
            )}
        </div>

      </div>
    </div>
  );
};
