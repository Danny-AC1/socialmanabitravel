
import React, { useState } from 'react';
import { ArrowRight, Trophy, Sparkles, CheckCircle, Users, Palmtree, Waves, Zap } from 'lucide-react';
import { TRANSLATIONS } from '../constants';
import { Language } from '../types';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  language: Language;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose, userName, language }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const t = TRANSLATIONS[language].onboarding;

  if (!isOpen) return null;

  const steps = [
    {
      icon: <Waves size={64} className="text-manabi-600" />,
      title: t.step1.title.replace('{name}', userName.split(' ')[0]),
      subtitle: t.step1.subtitle,
      description: t.step1.desc,
      accent: "text-manabi-700",
      bgGradient: "from-manabi-500/20 to-cyan-500/20",
      tag: t.step1.tag
    },
    {
      icon: <Palmtree size={64} className="text-emerald-600" />,
      title: t.step2.title,
      subtitle: t.step2.subtitle,
      description: t.step2.desc,
      accent: "text-emerald-700",
      bgGradient: "from-emerald-500/20 to-teal-500/20",
      tag: t.step2.tag
    },
    {
      icon: <Zap size={64} className="text-amber-500" />,
      title: t.step3.title,
      subtitle: t.step3.subtitle,
      description: t.step3.desc,
      accent: "text-amber-700",
      bgGradient: "from-amber-500/20 to-orange-500/20",
      tag: t.step3.tag
    },
    {
      icon: <Users size={64} className="text-purple-600" />,
      title: t.step4.title,
      subtitle: t.step4.subtitle,
      description: t.step4.desc,
      accent: "text-purple-700",
      bgGradient: "from-purple-500/20 to-pink-500/20",
      tag: t.step4.tag
    },
    {
      icon: <Trophy size={64} className="text-yellow-600" />,
      title: t.step5.title,
      subtitle: t.step5.subtitle,
      description: t.step5.desc,
      accent: "text-yellow-700",
      bgGradient: "from-yellow-500/20 to-amber-500/20",
      tag: t.step5.tag
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
    <div className="fixed inset-0 z-[600] flex items-center justify-center bg-stone-900/95 backdrop-blur-md p-4 animate-in fade-in duration-500">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col relative min-h-[580px] border border-white/10">
        
        <div className={`absolute top-0 left-0 w-full h-72 bg-gradient-to-b ${steps[currentStep].bgGradient} transition-all duration-700 ease-in-out`} />

        <div className="relative flex-1 flex flex-col items-center text-center p-8 pt-16">
            <div className={`mb-6 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] bg-white shadow-sm ${steps[currentStep].accent} animate-in zoom-in duration-500`}>
                {steps[currentStep].tag}
            </div>
            
            <div className="mb-8 p-8 bg-white rounded-[2rem] shadow-2xl shadow-stone-200/50 animate-in zoom-in duration-500 border border-stone-50 relative group">
                <div className="group-hover:scale-110 transition-transform duration-500">
                    {steps[currentStep].icon}
                </div>
                <div className="absolute -bottom-3 -right-3 w-10 h-10 bg-stone-900 text-white rounded-2xl flex items-center justify-center font-black text-sm border-4 border-white shadow-lg">
                    {currentStep + 1}
                </div>
            </div>
            
            <h2 className="text-3xl font-black text-stone-800 mb-2 tracking-tighter leading-none animate-in slide-in-from-bottom-2">
                {steps[currentStep].title}
            </h2>
            
            <h3 className={`text-xs font-bold uppercase tracking-widest mb-6 ${steps[currentStep].accent} opacity-80`}>
                {steps[currentStep].subtitle}
            </h3>
            
            <p className="text-stone-500 leading-relaxed text-sm md:text-base font-medium max-w-[280px] mx-auto animate-in slide-in-from-bottom-4 delay-100">
                {steps[currentStep].description}
            </p>
        </div>

        <div className="p-8 bg-white z-10 relative">
            <div className="flex justify-center gap-2 mb-8">
                {steps.map((_, idx) => (
                    <div 
                        key={idx} 
                        className={`h-1.5 rounded-full transition-all duration-500 ${idx === currentStep ? 'w-8 bg-manabi-600' : 'w-1.5 bg-stone-200'}`} 
                    />
                ))}
            </div>

            <div className="space-y-4">
                <button 
                    onClick={handleNext}
                    className="w-full bg-stone-900 hover:bg-manabi-600 text-white py-4 rounded-2xl font-black shadow-xl shadow-stone-200 transition-all active:scale-95 flex items-center justify-center gap-3 group uppercase tracking-widest text-xs"
                >
                    {currentStep === steps.length - 1 ? (
                        <>{t.finish} <CheckCircle size={18} className="text-manabi-400" /></>
                    ) : (
                        <>{t.next} <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>
                    )}
                </button>
                
                {currentStep < steps.length - 1 && (
                    <button 
                        onClick={onClose}
                        className="w-full text-stone-400 text-[10px] font-black uppercase tracking-[0.2em] hover:text-stone-600 transition-colors py-2"
                    >
                        {t.skip}
                    </button>
                )}
            </div>
        </div>

      </div>
    </div>
  );
};
