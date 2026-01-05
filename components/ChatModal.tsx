
import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Send, Lock, ChevronLeft, Search, Image as ImageIcon, 
  Mic, Paperclip, Trash2, Check, CheckCheck, 
  Play, Video, Reply as ReplyIcon, Edit2, AlertTriangle, 
  Sparkles, Globe, Wand2, Loader2, MessageSquare, Info, History,
  Map as MapIcon, Sun
} from 'lucide-react';
import { User, Chat, Message, ChatAISuggestion } from '../types';
import { StorageService } from '../services/storageService';
import { EncryptionService } from '../services/encryptionService';
import { 
  summarizeChatMessages, 
  translateChatMessage, 
  transcribeAudioMessage, 
  analyzeChatContext 
} from '../services/geminiService';
import { db } from '../services/firebase';
import { ref, onValue } from 'firebase/database';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  allUsers: User[];
  initialChatId?: string | null;
  isIntegrated?: boolean; // Nueva prop para indicar que no es un modal flotante
}

export const ChatModal: React.FC<ChatModalProps> = ({ 
  isOpen, 
  onClose, 
  currentUser, 
  allUsers,
  initialChatId,
  isIntegrated = false
}) => {
  const [activeChatId, setActiveChatId] = useState<string | null>(initialChatId || null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  
  const [inputText, setInputText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [mediaPreview, setMediaPreview] = useState<{type: 'image'|'video'|'audio', url: string} | null>(null);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [isEditingId, setIsEditingId] = useState<string | null>(null);
  
  // AI States
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [chatSummary, setChatSummary] = useState<string | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<ChatAISuggestion[]>([]);
  const [isTranslatingId, setIsTranslatingId] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- AI LOGIC ---

  const handleSummarize = async () => {
    if (messages.length < 5) {
        alert("Necesito al menos 5 mensajes para generar un resumen útil.");
        return;
    }
    setIsSummarizing(true);
    const contextMessages = messages.slice(-20).map(m => ({
        sender: m.senderId === currentUser.id ? 'Mí' : 'Compañero',
        text: m.text
    }));
    const summary = await summarizeChatMessages(contextMessages);
    setChatSummary(summary);
    setIsSummarizing(false);
  };

  const handleTranslate = async (msg: Message) => {
    if (msg.translation) return;
    setIsTranslatingId(msg.id);
    const translation = await translateChatMessage(msg.text);
    await StorageService.updateMessageAI(activeChatId!, msg.id, { translation });
    setIsTranslatingId(null);
  };

  const processAISuggestions = async (lastMsgText: string) => {
      if (!lastMsgText) return;
      const suggestions = await analyzeChatContext(lastMsgText);
      setAiSuggestions(suggestions);
  };

  // --- CORE CHAT LOGIC ---

  useEffect(() => {
    if (!isOpen) return;
    const chatsRef = ref(db, 'chats');
    return onValue(chatsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const userChats = Object.values(data)
          .filter((chat: any) => chat.participants && chat.participants.includes(currentUser.id))
          .sort((a: any, b: any) => b.updatedAt - a.updatedAt) as Chat[];
        setChats(userChats);
      }
    });
  }, [isOpen, currentUser.id]);

  useEffect(() => {
    if (!activeChatId) {
      setMessages([]);
      setChatSummary(null);
      setAiSuggestions([]);
      return;
    }

    const messagesRef = ref(db, `chats/${activeChatId}/messages`);
    return onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const loadedMessages = Object.values(data).map((msg: any) => ({
          ...msg,
          text: msg.text ? EncryptionService.decrypt(msg.text, activeChatId) : '',
          mediaUrl: msg.mediaUrl ? EncryptionService.decrypt(msg.mediaUrl, activeChatId) : undefined
        })) as Message[];
        
        const sorted = loadedMessages.sort((a, b) => a.timestamp - b.timestamp);
        setMessages(sorted);
        
        const lastMsg = sorted[sorted.length - 1];
        if (lastMsg && lastMsg.senderId !== currentUser.id) {
            processAISuggestions(lastMsg.text);
        }

        if (loadedMessages.some(m => !m.isRead && m.senderId !== currentUser.id)) {
           StorageService.markChatAsRead(activeChatId, currentUser.id);
        }
      }
    });
  }, [activeChatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, mediaPreview, aiSuggestions, chatSummary]);

  const filteredUsers = allUsers.filter(u => 
    u.id !== currentUser.id && 
    (u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
     u.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleStartChat = async (userId: string) => {
    const chatId = await StorageService.initiateChat(currentUser.id, userId);
    setActiveChatId(chatId);
    setSearchTerm('');
  };

  const handleSendMessage = async () => {
    if ((!inputText.trim() && !mediaPreview) || !activeChatId) return;

    if (isEditingId) {
        await StorageService.editMessage(activeChatId, isEditingId, inputText);
        setIsEditingId(null);
        setInputText('');
        return;
    }

    const type = mediaPreview?.type || 'text';
    const url = mediaPreview?.url || null;

    const replyData = replyTo ? {
        id: replyTo.id,
        text: replyTo.text || `[${replyTo.type}]`,
        senderName: replyTo.senderId === currentUser.id ? 'Tú' : allUsers.find(u => u.id === replyTo.senderId)?.name || 'Usuario'
    } : null;

    try {
        await StorageService.sendMessage(activeChatId, currentUser.id, inputText, type, url, replyData);
        if (type === 'audio' && url) {
            setIsTranscribing(true);
            const transcription = await transcribeAudioMessage(url);
            // StorageService.updateMessageAI(...) 
        }
        setInputText('');
        setMediaPreview(null);
        setReplyTo(null);
        setAiSuggestions([]);
    } catch (e) { alert("Error al enviar."); }
  };

  const getChatPartner = (chat: Chat) => {
    const partnerId = chat.participants.find(id => id !== currentUser.id);
    return allUsers.find(u => u.id === partnerId);
  };

  const modalClass = isIntegrated 
    ? "w-full h-full flex flex-row relative overflow-hidden" 
    : "fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-md p-0 md:p-4 animate-in fade-in duration-300";
  
  const innerClass = isIntegrated 
    ? "w-full h-full flex flex-row relative" 
    : "bg-white/95 backdrop-blur-2xl w-full h-full md:max-w-6xl md:h-[92vh] md:rounded-[2.5rem] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.3)] flex flex-row relative border border-white/20";

  return (
    <div className={modalClass}>
      <div className={innerClass}>
        
        {/* SIDEBAR */}
        <div className={`w-full md:w-[350px] bg-white/50 border-r border-stone-100 flex flex-col ${activeChatId && isIntegrated ? 'hidden md:flex' : activeChatId ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-5 border-b border-stone-100 flex flex-col gap-3">
             <div className="flex justify-between items-center">
                <h2 className="text-xl font-black text-cyan-900 tracking-tight">Viajeros</h2>
                {!isIntegrated && <button onClick={onClose} className="md:hidden text-gray-500"><X size={24} /></button>}
             </div>
             <div className="relative bg-gray-100/50 rounded-xl h-10 flex items-center px-3 focus-within:ring-2 focus-within:ring-cyan-500 transition-all">
                <Search size={16} className="text-gray-400 mr-2" />
                <input 
                   className="bg-transparent outline-none w-full text-xs font-medium"
                   placeholder="Buscar viajeros..."
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                />
             </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
             {searchTerm ? (
                filteredUsers.map(u => (
                  <div key={u.id} onClick={() => handleStartChat(u.id)} className="flex items-center gap-3 p-3 hover:bg-white rounded-xl cursor-pointer transition-all">
                     <img src={u.avatar} className="w-10 h-10 rounded-full object-cover ring-2 ring-cyan-50" />
                     <div className="flex-1"><p className="font-bold text-sm text-gray-900">{u.name}</p><p className="text-[10px] text-stone-400">Iniciar chat</p></div>
                  </div>
                ))
             ) : (
                chats.map(chat => {
                  const partner = getChatPartner(chat);
                  if (!partner) return null;
                  const isActive = activeChatId === chat.id;
                  return (
                    <div key={chat.id} onClick={() => setActiveChatId(chat.id)} className={`flex items-center gap-3 p-3 cursor-pointer transition-all rounded-xl group ${isActive ? 'bg-cyan-600 text-white shadow-md' : 'hover:bg-white'}`}>
                       <div className="relative">
                          <img src={partner.avatar} className="w-12 h-12 rounded-full object-cover shadow-sm" />
                          <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white bg-green-500`}></div>
                       </div>
                       <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-baseline">
                             <h4 className={`font-bold truncate text-sm ${isActive ? 'text-white' : 'text-gray-900'}`}>{partner.name}</h4>
                          </div>
                          <p className={`text-[10px] truncate ${isActive ? 'text-cyan-50' : 'text-gray-500'}`}>
                             {chat.lastMessage ? EncryptionService.decrypt(chat.lastMessage, chat.id) : 'Comenzar...'}
                          </p>
                       </div>
                    </div>
                  );
                })
             )}
          </div>
        </div>

        {/* CHAT WINDOW */}
        <div className={`flex-1 flex flex-col relative bg-stone-50/50 ${!activeChatId ? 'hidden md:flex' : 'flex'}`}>
           {activeChatId ? (
              <>
                 <div className="bg-white/80 backdrop-blur-md p-3 px-5 flex items-center justify-between shadow-sm z-30 border-b border-stone-100">
                    <div className="flex items-center gap-3">
                       <button onClick={() => setActiveChatId(null)} className="md:hidden text-stone-500"><ChevronLeft size={24} /></button>
                       <img src={getChatPartner(chats.find(c => c.id === activeChatId)!)?.avatar} className="w-10 h-10 rounded-full object-cover" />
                       <div>
                          <h3 className="font-bold text-gray-900 text-sm leading-tight">{getChatPartner(chats.find(c => c.id === activeChatId)!)?.name}</h3>
                          <div className="flex items-center text-[9px] font-bold text-cyan-600 gap-1 uppercase tracking-tighter">
                             <Lock size={8} /> Cifrado E2E
                          </div>
                       </div>
                    </div>
                    <button 
                       onClick={handleSummarize}
                       disabled={isSummarizing}
                       className="bg-indigo-600 text-white p-2 px-3 rounded-lg flex items-center gap-2 text-[10px] font-bold shadow-md hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
                    >
                       {isSummarizing ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                       <span>Resumen IA</span>
                    </button>
                 </div>

                 {chatSummary && (
                    <div className="m-3 mb-0 bg-indigo-50/80 backdrop-blur-sm border border-indigo-100 p-3 rounded-xl shadow-sm relative animate-in slide-in-from-top-2">
                       <button onClick={() => setChatSummary(null)} className="absolute top-1 right-1 text-indigo-300 hover:text-indigo-600"><X size={14} /></button>
                       <h4 className="text-[10px] font-black text-indigo-700 uppercase tracking-widest mb-1">IA Smart Summary</h4>
                       <div className="text-xs text-indigo-900 leading-tight whitespace-pre-wrap">{chatSummary}</div>
                    </div>
                 )}

                 <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messages.map((msg) => {
                       const isMe = msg.senderId === currentUser.id;
                       return (
                          <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-1`}>
                             <div className={`max-w-[85%] ${isMe ? 'items-end' : 'items-start'}`}>
                                <div className={`p-3 rounded-2xl text-xs ${isMe ? 'bg-cyan-600 text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none border border-stone-100 shadow-sm'}`}>
                                   {msg.replyTo && (
                                      <div className={`mb-1 p-1.5 rounded-lg text-[10px] bg-black/5 border-l-2 ${isMe ? 'border-cyan-300' : 'border-cyan-600'}`}>
                                         <p className="font-bold opacity-70">{msg.replyTo.senderName}</p>
                                         <p className="truncate">{msg.replyTo.text}</p>
                                      </div>
                                   )}
                                   {msg.mediaUrl && msg.type === 'image' && <img src={msg.mediaUrl} className="rounded-lg mb-2 max-h-48 w-full object-cover" />}
                                   <p className="leading-snug">{msg.text}</p>
                                   {msg.translation && (
                                      <div className="mt-2 pt-2 border-t border-black/5 text-[10px] italic opacity-80 flex items-center gap-1">
                                         <Globe size={10} /> {msg.translation}
                                      </div>
                                   )}
                                </div>
                                <div className={`flex items-center gap-1 mt-1 px-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                   {!isMe && (
                                      <button onClick={() => handleTranslate(msg)} className="text-cyan-500 p-0.5" title="Traducir">
                                         {isTranslatingId === msg.id ? <Loader2 size={10} className="animate-spin" /> : <Globe size={10} />}
                                      </button>
                                   )}
                                   {isMe && <CheckCheck size={10} className="text-cyan-500" />}
                                </div>
                             </div>
                          </div>
                       );
                    })}
                    <div ref={messagesEndRef} />
                 </div>

                 {aiSuggestions.length > 0 && (
                    <div className="px-4 py-2 flex gap-2 overflow-x-auto no-scrollbar">
                       {aiSuggestions.map((sug, i) => (
                          <button key={i} onClick={() => setInputText(sug.query)} className="bg-white border border-stone-200 text-stone-700 px-3 py-1.5 rounded-full text-[10px] font-bold shadow-sm hover:bg-stone-50 whitespace-nowrap active:scale-95 transition-all">
                             {sug.label}
                          </button>
                       ))}
                       <button onClick={() => setAiSuggestions([])} className="text-stone-400 p-1"><X size={12} /></button>
                    </div>
                 )}

                 <div className="p-3 bg-white border-t border-stone-100">
                    <div className="flex items-end gap-2">
                       <div className="flex-1 relative">
                          <textarea 
                             className="w-full bg-stone-50 border border-stone-100 rounded-xl p-2 px-4 outline-none focus:ring-1 focus:ring-cyan-500 transition-all min-h-[40px] max-h-24 resize-none text-xs font-medium"
                             placeholder="Escribe un mensaje..."
                             rows={1}
                             value={inputText}
                             onChange={e => setInputText(e.target.value)}
                             onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                          />
                       </div>
                       <button 
                          onClick={handleSendMessage}
                          className="bg-cyan-600 text-white p-2.5 rounded-full shadow-md hover:bg-cyan-700 active:scale-90 transition-all"
                       >
                          <Send size={16} />
                       </button>
                    </div>
                 </div>
              </>
           ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-10 opacity-40">
                 <MessageSquare size={48} className="text-stone-300 mb-4" />
                 <h3 className="text-lg font-bold text-stone-500">Tus Conversaciones</h3>
                 <p className="text-xs text-stone-400 max-w-[200px]">Selecciona un viajero de la lista para planificar tu próxima aventura.</p>
              </div>
           )}
        </div>
      </div>
    </div>
  );
};
