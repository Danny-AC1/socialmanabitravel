
import React, { useState, useEffect } from 'react';
import { X, Send, Lightbulb, Trash2, MessageSquarePlus } from 'lucide-react';
import { Suggestion, User } from '../types';
import { StorageService } from '../services/storageService';

interface SuggestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  isAdmin: boolean;
  suggestions?: Suggestion[]; // Solo para admins
}

export const SuggestionsModal: React.FC<SuggestionsModalProps> = ({ 
  isOpen, 
  onClose, 
  currentUser, 
  isAdmin, 
  suggestions = [] 
}) => {
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Efecto para marcar como leídas las sugerencias cuando el Admin abre el modal
  useEffect(() => {
    if (isOpen && isAdmin) {
        suggestions.forEach(s => {
            if (!s.isRead) {
                StorageService.markSuggestionRead(s.id);
            }
        });
    }
  }, [isOpen, isAdmin, suggestions]);

  if (!isOpen) return null;

  const handleSend = async () => {
    if (!text.trim()) return;
    setIsSending(true);
    
    const newSuggestion: Suggestion = {
      id: `sug_${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      text: text,
      timestamp: Date.now(),
      isRead: false
    };

    await StorageService.sendSuggestion(newSuggestion);
    
    setIsSending(false);
    setText('');
    alert("¡Gracias! Tu sugerencia ha sido enviada a los administradores.");
    onClose();
  };

  const handleDelete = async (id: string) => {
    if(confirm("¿Borrar este mensaje?")) {
        await StorageService.deleteSuggestion(id);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-0 md:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full h-full md:max-w-md md:h-auto md:max-h-[80vh] md:rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        
        <div className="bg-cyan-700 p-4 flex justify-between items-center text-white">
          <div className="flex items-center gap-2">
            {isAdmin ? <Lightbulb size={24} className="text-yellow-300" /> : <MessageSquarePlus size={24} />}
            <h2 className="text-lg font-bold">
              {isAdmin ? 'Buzón de Sugerencias' : 'Enviar Sugerencia'}
            </h2>
          </div>
          <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto bg-stone-50 pb-24 md:pb-6">
          {isAdmin ? (
            <div className="space-y-4">
              {suggestions.length === 0 ? (
                <div className="text-center text-stone-400 py-10">
                  <Lightbulb size={48} className="mx-auto mb-2 opacity-20" />
                  <p>No hay mensajes nuevos.</p>
                </div>
              ) : (
                suggestions.map(s => (
                  <div key={s.id} className="bg-white p-4 rounded-xl shadow-sm border border-stone-100 relative group animate-in slide-in-from-bottom-2">
                    <div className="flex items-center gap-3 mb-2">
                      <img src={s.userAvatar} className="w-8 h-8 rounded-full object-cover" alt="" />
                      <div>
                        <p className="font-bold text-sm text-stone-800">{s.userName}</p>
                        <p className="text-[10px] text-stone-400">
                          {new Date(s.timestamp).toLocaleDateString()} - {new Date(s.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <p className="text-stone-600 text-sm bg-stone-50 p-3 rounded-lg">
                      {s.text}
                    </p>
                    <button 
                      onClick={() => handleDelete(s.id)}
                      className="absolute top-2 right-2 text-stone-300 hover:text-red-500 p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                    {!s.isRead && <span className="absolute top-2 right-8 w-2 h-2 bg-red-500 rounded-full"></span>}
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-stone-500 text-sm">
                ¿Tienes alguna idea para mejorar la app o conoces un lugar que deberíamos agregar? ¡Escríbenos!
              </p>
              <textarea
                className="w-full bg-white border border-stone-200 rounded-xl p-4 h-40 resize-none focus:ring-2 focus:ring-cyan-500 outline-none text-stone-700"
                placeholder="Escribe tu sugerencia aquí..."
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
              <button
                onClick={handleSend}
                disabled={isSending || !text.trim()}
                className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Send size={18} />
                {isSending ? 'Enviando...' : 'Enviar Mensaje'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
