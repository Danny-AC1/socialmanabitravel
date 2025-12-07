import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Lock, ChevronLeft, Search } from 'lucide-react';
import { User, Chat, Message } from '../types';
import { StorageService } from '../services/storageService';
import { EncryptionService } from '../services/encryptionService';
import { db } from '../services/firebase';
import { ref, onValue, off } from 'firebase/database';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  allUsers: User[];
  initialChatId?: string | null;
}

export const ChatModal: React.FC<ChatModalProps> = ({ 
  isOpen, 
  onClose, 
  currentUser, 
  allUsers,
  initialChatId 
}) => {
  const [activeChatId, setActiveChatId] = useState<string | null>(initialChatId || null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Cargar lista de chats del usuario
  useEffect(() => {
    if (!isOpen) return;

    const chatsRef = ref(db, 'chats');
    const unsubscribe = onValue(chatsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const userChats = Object.values(data)
          .filter((chat: any) => chat.participants.includes(currentUser.id))
          .sort((a: any, b: any) => b.updatedAt - a.updatedAt) as Chat[];
        setChats(userChats);
      } else {
        setChats([]);
      }
    });

    return () => off(chatsRef);
  }, [isOpen, currentUser.id]);

  // Cargar mensajes del chat activo
  useEffect(() => {
    if (!activeChatId) {
      setMessages([]);
      return;
    }

    const messagesRef = ref(db, `chats/${activeChatId}/messages`);
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const loadedMessages = Object.values(data).map((msg: any) => ({
          ...msg,
          // DESCIFRADO AUTOMÁTICO AL RECIBIR
          text: EncryptionService.decrypt(msg.text, activeChatId)
        })) as Message[];
        
        setMessages(loadedMessages.sort((a, b) => a.timestamp - b.timestamp));
      } else {
        setMessages([]);
      }
    });

    return () => off(messagesRef);
  }, [activeChatId]);

  // Auto-scroll al último mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Sincronizar prop inicial
  useEffect(() => {
    if (initialChatId) setActiveChatId(initialChatId);
  }, [initialChatId]);

  if (!isOpen) return null;

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChatId) return;

    await StorageService.sendMessage(activeChatId, currentUser.id, newMessage);
    setNewMessage('');
  };

  const getChatPartner = (chat: Chat) => {
    const partnerId = chat.participants.find(id => id !== currentUser.id);
    return allUsers.find(u => u.id === partnerId);
  };

  const activeChatPartner = activeChatId 
    ? getChatPartner(chats.find(c => c.id === activeChatId) || { participants: activeChatId.split('_') } as Chat) 
    : null;

  // Filtro de búsqueda para iniciar chats
  const filteredUsers = searchTerm 
    ? allUsers.filter(u => u.id !== currentUser.id && u.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : [];

  const handleStartChat = async (targetUserId: string) => {
    const chatId = await StorageService.initiateChat(currentUser.id, targetUserId);
    setActiveChatId(chatId);
    setSearchTerm('');
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl h-[85vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row">
        
        {/* LISTA DE CHATS (Sidebar) */}
        <div className={`w-full md:w-1/3 bg-stone-50 border-r border-stone-200 flex flex-col ${activeChatId ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b border-stone-200 bg-white">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-stone-800">Mensajes</h2>
              <button onClick={onClose} className="md:hidden p-2 rounded-full hover:bg-stone-100">
                <X size={20} />
              </button>
            </div>
            <div className="relative">
              <input 
                type="text" 
                placeholder="Buscar usuario..." 
                className="w-full bg-stone-100 border-none rounded-xl py-2 pl-9 pr-4 text-sm focus:ring-2 focus:ring-cyan-500 outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute left-3 top-2.5 text-stone-400" size={16} />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {searchTerm ? (
              <div className="p-2">
                <p className="text-xs font-bold text-stone-400 uppercase px-2 mb-2">Resultados</p>
                {filteredUsers.map(user => (
                  <div 
                    key={user.id} 
                    onClick={() => handleStartChat(user.id)}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-white cursor-pointer transition-colors"
                  >
                    <img src={user.avatar} className="w-10 h-10 rounded-full object-cover" alt="" />
                    <span className="font-semibold text-sm text-stone-700">{user.name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {chats.length === 0 && (
                  <div className="text-center py-10 text-stone-400 text-sm">
                    No tienes mensajes. <br/> Busca un usuario para chatear.
                  </div>
                )}
                {chats.map(chat => {
                  const partner = getChatPartner(chat);
                  if (!partner) return null;
                  const isSelected = activeChatId === chat.id;
                  
                  return (
                    <div 
                      key={chat.id}
                      onClick={() => setActiveChatId(chat.id)}
                      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${isSelected ? 'bg-white shadow-sm border border-stone-100' : 'hover:bg-stone-100'}`}
                    >
                      <div className="relative">
                        <img src={partner.avatar} className="w-12 h-12 rounded-full object-cover" alt="" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline">
                          <h4 className="font-bold text-sm text-stone-800 truncate">{partner.name}</h4>
                          <span className="text-[10px] text-stone-400">
                            {new Date(chat.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        </div>
                        <p className="text-xs text-stone-500 truncate flex items-center gap-1">
                           {/* Desciframos el último mensaje para la vista previa */}
                           {chat.lastMessage ? EncryptionService.decrypt(chat.lastMessage, chat.id) : 'Inicia la conversación'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* VENTANA DE CHAT (Main) */}
        <div className={`w-full md:w-2/3 bg-white flex flex-col ${!activeChatId ? 'hidden md:flex' : 'flex'}`}>
          {activeChatId && activeChatPartner ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-white z-10">
                <div className="flex items-center gap-3">
                  <button onClick={() => setActiveChatId(null)} className="md:hidden p-2 -ml-2 text-stone-500">
                    <ChevronLeft size={24} />
                  </button>
                  <img src={activeChatPartner.avatar} className="w-10 h-10 rounded-full object-cover border border-stone-100" alt="" />
                  <div>
                    <h3 className="font-bold text-stone-800">{activeChatPartner.name}</h3>
                    <div className="flex items-center text-xs text-green-600 gap-1 bg-green-50 px-2 py-0.5 rounded-full w-fit">
                      <Lock size={10} />
                      <span className="font-medium">Cifrado de extremo a extremo</span>
                    </div>
                  </div>
                </div>
                <button onClick={onClose} className="hidden md:block p-2 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-600">
                  <X size={24} />
                </button>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-stone-50/50">
                <div className="text-center py-4">
                  <div className="bg-yellow-50 text-yellow-700 text-xs px-3 py-2 rounded-lg inline-flex items-center gap-2 border border-yellow-100">
                    <Lock size={12} /> 
                    Los mensajes están protegidos con cifrado AES-256. Solo tú y {activeChatPartner.name} pueden leerlos.
                  </div>
                </div>
                
                {messages.map((msg) => {
                  const isMe = msg.senderId === currentUser.id;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] p-3 rounded-2xl text-sm shadow-sm ${
                        isMe 
                          ? 'bg-cyan-600 text-white rounded-br-none' 
                          : 'bg-white text-stone-800 rounded-bl-none border border-stone-100'
                      }`}>
                        <p>{msg.text}</p>
                        <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-cyan-100' : 'text-stone-400'}`}>
                          {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-stone-100 flex gap-2">
                <input 
                  type="text" 
                  placeholder="Escribe un mensaje..." 
                  className="flex-1 bg-stone-100 border-none rounded-full px-4 py-3 text-sm focus:ring-2 focus:ring-cyan-500 outline-none"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
                <button 
                  type="submit" 
                  disabled={!newMessage.trim()}
                  className="bg-cyan-600 text-white p-3 rounded-full hover:bg-cyan-700 disabled:opacity-50 transition-colors shadow-md shadow-cyan-200"
                >
                  <Send size={20} />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-stone-300 p-8">
               <div className="bg-stone-50 p-6 rounded-full mb-4">
                  <Lock size={48} className="opacity-20" />
               </div>
               <p>Selecciona un chat para comenzar una conversación segura.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};