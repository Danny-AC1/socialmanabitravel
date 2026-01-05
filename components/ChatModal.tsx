
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
import { resizeImage, validateVideo } from '../utils';

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
  
  const [inputText, setInputText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [mediaPreview, setMediaPreview] = useState<{type: 'image'|'video'|'audio', url: string} | null>(null);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isEditingId, setIsEditingId] = useState<string | null>(null);
  
  // AI States
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [chatSummary, setChatSummary] = useState<string | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<ChatAISuggestion[]>([]);
  const [isTranslatingId, setIsTranslatingId] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);

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
    if (msg.translation) return; // Ya traducido
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
          .filter((chat: any) => chat.participants.includes(currentUser.id))
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
        
        // Disparar sugerencias si el último mensaje no es mío
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

  // Fix: defined filteredUsers to enable user search within the chat sidebar
  const filteredUsers = allUsers.filter(u => 
    u.id !== currentUser.id && 
    (u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
     u.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Fix: implemented handleStartChat to correctly initiate or resume a conversation with a selected user
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
        const msgId = `msg_${Date.now()}`;
        await StorageService.sendMessage(activeChatId, currentUser.id, inputText, type, url, replyData);
        
        // Si enviamos audio, transcribirlo automáticamente para el receptor
        if (type === 'audio' && url) {
            setIsTranscribing(true);
            const transcription = await transcribeAudioMessage(url);
            // Actualizar el mensaje recién enviado con la transcripción (el ID real viene de Firebase)
            // Para simplicidad en este MVP, lo dejamos para el listener
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

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-md p-0 md:p-4 animate-in fade-in duration-300">
      <div className="bg-white/95 backdrop-blur-2xl w-full h-full md:max-w-6xl md:h-[92vh] md:rounded-[2.5rem] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.3)] flex flex-row relative border border-white/20">
        
        {/* SIDEBAR (GLASSMorphism) */}
        <div className={`w-full md:w-[380px] bg-white/50 border-r border-white/20 flex flex-col ${activeChatId ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-6 border-b border-gray-100/50 flex flex-col gap-4">
             <div className="flex justify-between items-center">
                <h2 className="text-2xl font-black text-cyan-900 tracking-tight">Mensajes</h2>
                <button onClick={onClose} className="md:hidden text-gray-500"><X size={24} /></button>
             </div>
             <div className="relative bg-gray-200/50 rounded-2xl h-12 flex items-center px-4 focus-within:ring-2 focus-within:ring-cyan-500 transition-all">
                <Search size={18} className="text-gray-400 mr-2" />
                <input 
                   className="bg-transparent outline-none w-full text-sm font-medium"
                   placeholder="Buscar viajeros o chats..."
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                />
             </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
             {searchTerm ? (
                filteredUsers.map(u => (
                  <div key={u.id} onClick={() => { setActiveChatId(null); setTimeout(() => handleStartChat(u.id), 50); }} className="flex items-center gap-4 p-4 hover:bg-white rounded-2xl cursor-pointer transition-all active:scale-95">
                     <img src={u.avatar} className="w-12 h-12 rounded-full object-cover ring-2 ring-cyan-100" />
                     <div className="flex-1"><p className="font-bold text-gray-900">{u.name}</p><p className="text-xs text-stone-400">Toca para iniciar chat</p></div>
                  </div>
                ))
             ) : (
                chats.map(chat => {
                  const partner = getChatPartner(chat);
                  if (!partner) return null;
                  const isActive = activeChatId === chat.id;
                  return (
                    <div key={chat.id} onClick={() => setActiveChatId(chat.id)} className={`flex items-center gap-4 p-4 cursor-pointer transition-all rounded-2xl group ${isActive ? 'bg-cyan-600 text-white shadow-lg' : 'hover:bg-white'}`}>
                       <div className="relative">
                          <img src={partner.avatar} className="w-14 h-14 rounded-full object-cover shadow-sm" />
                          <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white bg-green-500`}></div>
                       </div>
                       <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-baseline mb-1">
                             <h4 className={`font-bold truncate ${isActive ? 'text-white' : 'text-gray-900'}`}>{partner.name}</h4>
                             <span className={`text-[10px] font-bold ${isActive ? 'text-cyan-100' : 'text-gray-400'}`}>12:45</span>
                          </div>
                          <p className={`text-xs truncate ${isActive ? 'text-cyan-50' : 'text-gray-500'}`}>
                             {chat.lastMessage ? EncryptionService.decrypt(chat.lastMessage, chat.id) : 'Inicia el viaje...'}
                          </p>
                       </div>
                    </div>
                  );
                })
             )}
          </div>
        </div>

        {/* CHAT WINDOW (AI-First) */}
        <div className={`flex-1 flex flex-col relative bg-[#f8fafc] ${!activeChatId ? 'hidden md:flex' : 'flex'}`}>
           {activeChatId && getChatPartner(chats.find(c => c.id === activeChatId)!) ? (
              <>
                 {/* AI HEADER */}
                 <div className="bg-white/80 backdrop-blur-md p-4 px-6 flex items-center justify-between shadow-sm z-30 border-b border-gray-100">
                    <div className="flex items-center gap-4">
                       <button onClick={() => setActiveChatId(null)} className="md:hidden text-gray-500"><ChevronLeft size={28} /></button>
                       <div className="relative">
                          <img src={getChatPartner(chats.find(c => c.id === activeChatId)!)?.avatar} className="w-12 h-12 rounded-full object-cover" />
                       </div>
                       <div>
                          <h3 className="font-bold text-gray-900 leading-tight">{getChatPartner(chats.find(c => c.id === activeChatId)!)?.name}</h3>
                          <div className="flex items-center text-[10px] font-bold text-cyan-600 gap-1 tracking-wider uppercase">
                             <Lock size={10} /> Conexión Segura E2E
                          </div>
                       </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                       <button 
                          onClick={handleSummarize}
                          disabled={isSummarizing}
                          className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white p-2 px-4 rounded-xl flex items-center gap-2 text-xs font-bold shadow-lg hover:shadow-indigo-200 transition-all active:scale-95 disabled:opacity-50"
                       >
                          {isSummarizing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                          <span className="hidden sm:inline">IA Summary</span>
                       </button>
                    </div>
                 </div>

                 {/* CHAT SUMMARY (Glassmorphism Overlay) */}
                 {chatSummary && (
                    <div className="m-4 mb-0 bg-white/60 backdrop-blur-md border border-white p-4 rounded-2xl shadow-xl relative animate-in slide-in-from-top-4">
                       <button onClick={() => setChatSummary(null)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500"><X size={18} /></button>
                       <h4 className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                          <History size={14} /> Resumen de IA
                       </h4>
                       <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                          {chatSummary}
                       </div>
                    </div>
                 )}

                 {/* MESSAGES LIST */}
                 <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {messages.map((msg, idx) => {
                       const isMe = msg.senderId === currentUser.id;
                       const partner = getChatPartner(chats.find(c => c.id === activeChatId)!);
                       
                       return (
                          <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
                             {!isMe && <img src={partner?.avatar} className="w-8 h-8 rounded-full mt-auto mr-2 border border-white shadow-sm" />}
                             <div className={`max-w-[80%] relative group ${isMe ? 'items-end' : 'items-start'}`}>
                                <div className={`p-3 rounded-2xl shadow-sm text-sm ${isMe ? 'bg-cyan-600 text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none border border-gray-100'}`}>
                                   {msg.replyTo && (
                                      <div className={`mb-2 p-2 rounded-lg text-xs bg-black/5 border-l-4 ${isMe ? 'border-cyan-300' : 'border-cyan-600'}`}>
                                         <p className="font-bold opacity-70">{msg.replyTo.senderName}</p>
                                         <p className="truncate">{msg.replyTo.text}</p>
                                      </div>
                                   )}
                                   
                                   {msg.mediaUrl && msg.type === 'image' && <img src={msg.mediaUrl} className="rounded-xl mb-2 max-h-60 w-full object-cover" />}
                                   
                                   <p className="leading-relaxed">{msg.text}</p>

                                   {msg.translation && (
                                      <div className="mt-2 pt-2 border-t border-black/10 text-xs italic opacity-90 flex items-center gap-2">
                                         <Globe size={12} /> {msg.translation}
                                      </div>
                                   )}

                                   {msg.transcription && (
                                      <div className="mt-2 bg-black/5 p-2 rounded-lg text-xs flex flex-col gap-1">
                                         <span className="font-bold text-[10px] text-cyan-600 flex items-center gap-1"><Wand2 size={10} /> IA Transcribed</span>
                                         <p className="leading-tight text-gray-600" dangerouslySetInnerHTML={{ __html: msg.transcription }} />
                                      </div>
                                   )}
                                </div>

                                <div className={`flex items-center gap-2 mt-1 px-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                   <span className="text-[10px] text-gray-400 font-bold">12:30</span>
                                   {!isMe && (
                                      <button 
                                         onClick={() => handleTranslate(msg)}
                                         className="text-cyan-500 hover:text-cyan-700 p-1 rounded-full hover:bg-cyan-50 transition-colors"
                                         title="Traducir con IA"
                                      >
                                         {isTranslatingId === msg.id ? <Loader2 size={12} className="animate-spin" /> : <Globe size={12} />}
                                      </button>
                                   )}
                                   {isMe && <CheckCheck size={12} className="text-cyan-500" />}
                                </div>
                             </div>
                          </div>
                       );
                    })}
                    <div ref={messagesEndRef} />
                 </div>

                 {/* AI SUGGESTION CHIPS */}
                 {aiSuggestions.length > 0 && (
                    <div className="px-6 py-2 flex gap-2 overflow-x-auto no-scrollbar animate-in slide-in-from-bottom-2">
                       {aiSuggestions.map((sug, i) => (
                          <button 
                            key={i} 
                            onClick={() => setInputText(sug.query)}
                            className="bg-white border border-cyan-100 text-cyan-700 px-4 py-2 rounded-full text-xs font-bold shadow-sm hover:bg-cyan-50 transition-all flex items-center gap-2 whitespace-nowrap active:scale-95"
                          >
                             {sug.type === 'guide' && <MapIcon size={14} />}
                             {sug.type === 'weather' && <Sun size={14} />}
                             {sug.type === 'itinerary' && <Sparkles size={14} />}
                             {sug.label}
                          </button>
                       ))}
                       <button onClick={() => setAiSuggestions([])} className="text-gray-400 p-2"><X size={14} /></button>
                    </div>
                 )}

                 {/* INPUT AREA (MODERN) */}
                 <div className="p-4 bg-white border-t border-gray-100">
                    <div className="max-w-4xl mx-auto relative flex items-end gap-2">
                       <button className="p-3 text-gray-400 hover:text-cyan-600"><Paperclip size={24} /></button>
                       
                       <div className="flex-1 relative">
                          <textarea 
                             className="w-full bg-gray-50 border border-gray-100 rounded-[1.5rem] p-3 px-5 pr-12 outline-none focus:ring-2 focus:ring-cyan-500 transition-all min-h-[50px] max-h-32 resize-none text-sm font-medium"
                             placeholder="Escribe un mensaje..."
                             rows={1}
                             value={inputText}
                             onChange={e => setInputText(e.target.value)}
                             onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                          />
                          <button className="absolute right-3 bottom-3 text-gray-400 hover:text-cyan-600"><Mic size={20} /></button>
                       </div>

                       <button 
                          onClick={handleSendMessage}
                          className="bg-cyan-600 text-white p-4 rounded-full shadow-lg hover:bg-cyan-700 active:scale-90 transition-all"
                       >
                          <Send size={20} />
                       </button>
                    </div>
                 </div>
              </>
           ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
                 <div className="bg-white p-8 rounded-full shadow-inner mb-6">
                    <MessageSquare size={64} className="text-cyan-100" />
                 </div>
                 <h3 className="text-2xl font-black text-gray-800 mb-2">Tu Canvas de Viaje</h3>
                 <p className="text-gray-500 max-w-sm">Selecciona un chat para iniciar una conversación segura y potenciada por IA.</p>
              </div>
           )}
        </div>
      </div>
    </div>
  );
};
