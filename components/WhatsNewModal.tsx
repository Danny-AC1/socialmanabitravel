
import React from 'react';
import { X, Sparkles, Zap, Map, CheckCircle, ArrowRight } from 'lucide-react';
import { RELEASE_NOTES, APP_VERSION } from '../constants';

interface WhatsNewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WhatsNewModal: React.FC<WhatsNewModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const currentRelease = RELEASE_NOTES[0]; // Mostramos solo la última actualización

  const getIcon = (type: string) => {
    switch (type) {
      case 'new': return <Sparkles size={16} className="text-amber-500" />;
      case 'improved': return <Zap size={16} className="text-cyan-500" />;
      case 'fix': return <CheckCircle size={16} className="text-green-500" />;
      default: return <Sparkles size={16} />;
    }
  };

  const getLabel = (type: string) => {
    switch (type) {
      case 'new': return 'NUEVO';
      case 'improved': return 'MEJORA';
      case 'fix': return 'CORRECCIÓN';
      default: return 'INFO';
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'new': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'improved': return 'bg-cyan-100 text-cyan-700 border-cyan-200';
      case 'fix': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-900/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col relative">
        
        {/* Header with decorative background */}
        <div className="relative bg-gradient-to-br from-cyan-600 to-blue-700 p-8 text-white text-center overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            
            <div className="relative z-10 flex flex-col items-center">
                <div className="bg-white/20 p-3 rounded-2xl mb-3 backdrop-blur-md shadow-inner border border-white/20">
                    <Map size={32} className="text-white" />
                </div>
                <h2 className="text-2xl font-black tracking-tight mb-1">¡Novedades!</h2>
                <p className="text-cyan-100 text-sm font-medium">Versión {APP_VERSION}</p>
            </div>

            <button 
                onClick={onClose}
                className="absolute top-4 right-4 bg-black/10 hover:bg-black/20 text-white p-2 rounded-full transition-colors backdrop-blur-md"
            >
                <X size={20} />
            </button>
        </div>

        <div className="p-6 bg-white flex-1 overflow-y-auto max-h-[60vh]">
            <h3 className="font-bold text-gray-800 text-lg mb-4 leading-tight">{currentRelease.title}</h3>
            
            <div className="space-y-4">
                {currentRelease.changes.map((change, idx) => (
                    <div key={idx} className="flex gap-3 items-start group">
                        <div className={`shrink-0 mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold border ${getColor(change.type)}`}>
                            {getLabel(change.type)}
                        </div>
                        <p className="text-sm text-gray-600 leading-snug group-hover:text-gray-900 transition-colors">
                            {change.text}
                        </p>
                    </div>
                ))}
            </div>
        </div>

        <div className="p-5 border-t border-gray-100 bg-gray-50">
            <button 
                onClick={onClose}
                className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-cyan-200 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
                <span>¡Entendido, a explorar!</span>
                <ArrowRight size={18} />
            </button>
        </div>
      </div>
    </div>
  );
};
