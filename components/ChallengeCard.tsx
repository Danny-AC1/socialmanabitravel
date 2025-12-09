
import React, { useState } from 'react';
import { Trophy, Clock, CheckCircle, Flame, ArrowRight } from 'lucide-react';
import { Challenge } from '../types';

interface ChallengeCardProps {
  challenge: Challenge;
  isCompleted: boolean;
  onParticipate: (challenge: Challenge) => void;
  onTriviaAnswer?: (challenge: Challenge, answerIndex: number) => boolean; // Returns true if correct
}

export const ChallengeCard: React.FC<ChallengeCardProps> = ({ 
  challenge, 
  isCompleted, 
  onParticipate,
  onTriviaAnswer
}) => {
  const [showTrivia, setShowTrivia] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isWrong, setIsWrong] = useState(false);

  // Time remaining calculation (Simple: ends at midnight)
  const now = new Date();
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  const hoursLeft = Math.max(0, Math.floor((endOfDay.getTime() - now.getTime()) / (1000 * 60 * 60)));

  const handleTriviaSubmit = (idx: number) => {
    setSelectedOption(idx);
    if (onTriviaAnswer) {
      const correct = onTriviaAnswer(challenge, idx);
      if (!correct) {
        setIsWrong(true);
        setTimeout(() => {
            setIsWrong(false);
            setSelectedOption(null);
        }, 1500);
      } else {
        setShowTrivia(false); // UI update handled by parent prop isCompleted
      }
    }
  };

  if (isCompleted) {
      return (
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-4 shadow-lg text-white mb-6 animate-in zoom-in duration-300 relative overflow-hidden">
             <div className="absolute top-0 right-0 opacity-10 transform translate-x-4 -translate-y-4">
                 <Trophy size={120} />
             </div>
             <div className="flex items-center gap-4 relative z-10">
                 <div className="bg-white/20 p-3 rounded-full">
                     <CheckCircle size={32} className="text-white" />
                 </div>
                 <div>
                     <h3 className="font-bold text-lg">¡Desafío Completado!</h3>
                     <p className="text-green-100 text-sm">Ganaste +{challenge.points} XP hoy.</p>
                 </div>
             </div>
        </div>
      );
  }

  return (
    <div className="bg-white rounded-2xl p-0 shadow-md mb-6 border border-purple-100 overflow-hidden relative group">
        {/* Header Gradient */}
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-4 flex justify-between items-start text-white">
            <div className="flex gap-3">
                <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm text-2xl h-12 w-12 flex items-center justify-center border border-white/10 shadow-inner">
                    {challenge.icon}
                </div>
                <div>
                    <div className="flex items-center gap-2 mb-0.5">
                        <span className="bg-orange-500 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                            <Flame size={10} fill="currentColor" /> DIARIO
                        </span>
                        <span className="text-xs text-indigo-200 flex items-center gap-1">
                            <Clock size={10} /> Termina en {hoursLeft}h
                        </span>
                    </div>
                    <h3 className="font-black text-lg leading-tight shadow-black drop-shadow-sm">{challenge.title}</h3>
                </div>
            </div>
            <div className="text-center bg-white/10 p-2 rounded-lg backdrop-blur-md border border-white/10 min-w-[60px]">
                <span className="block text-xl font-bold text-yellow-300">+{challenge.points}</span>
                <span className="block text-[9px] font-bold uppercase tracking-wider text-white/70">XP</span>
            </div>
        </div>

        {/* Content */}
        <div className="p-4">
            <p className="text-stone-600 text-sm mb-4 leading-relaxed">
                {challenge.description}
            </p>

            {challenge.type === 'trivia' && showTrivia ? (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                    <p className="font-bold text-stone-800 text-sm mb-2">{challenge.question}</p>
                    <div className="grid grid-cols-1 gap-2">
                        {challenge.options?.map((opt, idx) => (
                            <button 
                                key={idx}
                                onClick={() => handleTriviaSubmit(idx)}
                                className={`w-full text-left p-3 rounded-xl text-sm font-medium transition-all ${
                                    selectedOption === idx 
                                        ? isWrong 
                                            ? 'bg-red-100 text-red-700 border border-red-200' 
                                            : 'bg-green-100 text-green-700'
                                        : 'bg-stone-50 hover:bg-stone-100 text-stone-700'
                                }`}
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                    <button onClick={() => setShowTrivia(false)} className="text-xs text-stone-400 underline mt-2">Cancelar</button>
                </div>
            ) : (
                <button 
                    onClick={() => challenge.type === 'trivia' ? setShowTrivia(true) : onParticipate(challenge)}
                    className="w-full bg-stone-900 hover:bg-stone-800 text-white font-bold py-3 rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 group-hover:shadow-xl"
                >
                    {challenge.actionLabel} <ArrowRight size={18} />
                </button>
            )}
        </div>
    </div>
  );
};
