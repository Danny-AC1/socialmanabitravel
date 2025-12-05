import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, Loader2 } from 'lucide-react';
import { getTravelAdvice } from '../services/geminiService';

export const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'model', text: string}[]>([
    { role: 'model', text: '¡Hola! Soy tu guía de Manabí. ¿Quieres saber cómo llegar a Los Frailes o dónde comer en Puerto López?' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const toggleChat = () => setIsOpen(!isOpen);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim()) return;

    const userMsg = inputValue;
    setInputValue('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    const response = await getTravelAdvice(userMsg);
    
    setMessages(prev => [...prev, { role: 'model', text: response }]);
    setIsLoading(false);
  };

  return (
    <>
      {/* Floating Button */}
      <button 
        onClick={toggleChat}
        className={`fixed bottom-6 right-6 z-40 p-4 rounded-full shadow-lg transition-all duration-300 ${isOpen ? 'rotate-90 scale-0' : 'bg-cyan-600 hover:bg-cyan-700 text-white scale-100'}`}
      >
        <MessageSquare size={28} />
      </button>

      {/* Chat Window */}
      <div className={`fixed bottom-6 right-6 z-50 w-80 md:w-96 bg-white rounded-2xl shadow-2xl flex flex-col transition-all duration-300 origin-bottom-right overflow-hidden ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`} style={{ height: '500px' }}>
        
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-600 to-blue-600 p-4 text-white flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="bg-white/20 p-1 rounded-full">
              <Bot size={20} />
            </div>
            <div>
              <h3 className="font-bold text-sm">Guía Virtual Manabí</h3>
              <span className="text-xs text-cyan-100 flex items-center">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-1"></span> En línea
              </span>
            </div>
          </div>
          <button onClick={toggleChat} className="text-white/80 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Messages */}
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

        {/* Input */}
        <form onSubmit={handleSend} className="p-3 bg-white border-t flex items-center space-x-2">
          <input
            type="text"
            placeholder="Pregunta sobre turismo..."
            className="flex-1 bg-gray-100 border-none rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-cyan-500 outline-none"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <button 
            type="submit" 
            disabled={!inputValue.trim() || isLoading}
            className="p-2 bg-cyan-600 text-white rounded-full hover:bg-cyan-700 disabled:opacity-50 transition-colors"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </>
  );
};