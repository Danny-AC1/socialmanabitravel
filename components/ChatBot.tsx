import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, Loader2 } from 'lucide-react';
import { getTravelAdvice } from '../services/geminiService';

interface ChatBotProps {
  externalIsOpen?: boolean;
  externalQuery?: string;
  onCloseExternal?: () => void;
}

export const ChatBot: React.FC<ChatBotProps> = ({ externalIsOpen, externalQuery, onCloseExternal }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'model', text: string}[]>([
    { role: 'model', text: '¡Hola! Soy tu guía de Ecuador. Pregúntame sobre cualquier lugar turístico, comida o consejo de viaje.' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const handledQueryRef = useRef<string | null>(null);

  useEffect(() => {
    if (externalIsOpen) {
      setIsOpen(true);
    }
  }, [externalIsOpen]);

  useEffect(() => {
    if (externalQuery && externalQuery !== handledQueryRef.current && isOpen) {
       handledQueryRef.current = externalQuery;
       handleSend(undefined, externalQuery);
    }
  }, [externalQuery, isOpen]);

  const toggleChat = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    if (!newState && onCloseExternal) onCloseExternal();
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const handleSend = async (e?: React.FormEvent, overrideText?: string) => {
    e?.preventDefault();
    const textToSend = overrideText || inputValue;
    
    if (!textToSend.trim()) return;

    if (!overrideText) setInputValue(''); 
    
    setMessages(prev => [...prev, { role: 'user', text: textToSend }]);
    setIsLoading(true);

    const response = await getTravelAdvice(textToSend);
    
    setMessages(prev => [...prev, { role: 'model', text: response }]);
    setIsLoading(false);
  };

  return (
    <>
      {/* Botón Flotante Ajustado (Más alto y pequeño) */}
      <button 
        onClick={toggleChat}
        className={`fixed z-40 p-3 rounded-full shadow-lg transition-all duration-300 border-2 border-white 
          bottom-24 right-4 md:bottom-6 md:right-6
          ${isOpen ? 'rotate-90 scale-0' : 'bg-cyan-600 hover:bg-cyan-700 text-white scale-100'}`}
      >
        <MessageSquare size={24} />
      </button>

      {/* Ventana de Chat */}
      <div 
        className={`fixed z-50 w-full md:w-96 bg-white rounded-t-3xl md:rounded-2xl shadow-2xl flex flex-col transition-all duration-300 overflow-hidden 
          bottom-0 left-0 h-[80vh] md:h-[500px] md:bottom-24 md:right-6 md:left-auto
          ${isOpen ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'}`}
      >
        
        <div className="bg-gradient-to-r from-cyan-600 to-blue-600 p-4 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center space-x-2">
            <div className="bg-white/20 p-1 rounded-full">
              <Bot size={20} />
            </div>
            <div>
              <h3 className="font-bold text-sm">Guía Virtual Ecuador</h3>
              <span className="text-xs text-cyan-100 flex items-center">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-1"></span> En línea
              </span>
            </div>
          </div>
          <button onClick={toggleChat} className="text-white/80 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                msg.role === 'user' 
                  ? 'bg-cyan-600 text-white rounded-br-none' 
                  : 'bg-white border text-gray-800 rounded-bl-none shadow-sm'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border p-3 rounded-2xl rounded-bl-none shadow-sm flex items-center space-x-2">
                <Loader2 size={16} className="animate-spin text-cyan-600" />
                <span className="text-xs text-gray-500">Escribiendo...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSend} className="p-3 bg-white border-t flex items-center space-x-2 shrink-0 pb-safe">
          <input
            type="text"
            placeholder="Pregunta sobre turismo..."
            className="flex-1 bg-gray-100 border-none rounded-full px-4 py-3 text-sm focus:ring-2 focus:ring-cyan-500 outline-none"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <button 
            type="submit" 
            disabled={!inputValue.trim() || isLoading}
            className="p-3 bg-cyan-600 text-white rounded-full hover:bg-cyan-700 disabled:opacity-50 transition-colors shadow-md"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </>
  );
};