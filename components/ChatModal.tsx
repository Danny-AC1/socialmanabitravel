
import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Send, Lock, ChevronLeft, Search, Image as ImageIcon, 
  Mic, Paperclip, Trash2, Check, CheckCheck, 
  Play, Video, Reply as ReplyIcon, Edit2, AlertTriangle, User as UserIcon,
  Sparkles, Zap, Wand2, FileText, Brain, Loader2, Languages, Volume2, 
  Briefcase, Layout, Plus, DollarSign, MapPin, Calculator, ClipboardList, Scan, Globe, CloudSun, Navigation, FolderHeart, Calendar, Maximize2, Minimize2, Map as MapIcon, BarChart3, PieChart, Users2, Info, ChevronDown, PlusCircle
} from 'lucide-react';
import { User, Chat, Message } from '../types';
import { StorageService } from '../services/storageService';
import { EncryptionService } from '../services/encryptionService';
import { 
    transcribeAndSummarizeAudio, 
    getChatCopilotSuggestions, 
    summarizeChatHistory, 
    generatePackingList,
    analyzeTravelImage,
    translateTravelMessage,
    processVoiceAction,
    getPlaceLiveContext,
    getChatCatchUp,
    analyzeGroupRoles
} from '../services/geminiService';
import { db } from '../services/firebase';
import { onValue, ref, set, update } from 'firebase/database';
import { resizeImage } from '../utils';

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
  
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [chatSentiment, setChatSentiment] = useState<string>('calm');
  const [chatTheme, setChatTheme] = useState<string>('ocean');
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [transcriptions, setTranscriptions] = useState<Record<string, {transcription: string, summary: string}>>({});
  const [liveCards, setLiveCards] = useState<Record<string, {placeName: string, weather: string, temp: string, status: string}>>({});
  const [catchUpSummary, setCatchUpSummary] = useState<string | null>(null);
  const [userRoles, setUserRoles] = useState<Record<string, string>>({});
  
  const [polls, setPolls] = useState<Record<string, {question: string, options: string[], votes: Record<string, number>}>>({});
  const [isCreatingPoll, setIsCreatingPoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);

  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const [showLogistics, setShowLogistics] = useState(false);
  const [logisticsTab, setLogisticsTab] = useState<'checklist' | 'expenses' | 'vault'>('checklist');

  const [inputText, setInputText] = useState('');
  const [mediaPreview, setMediaPreview] = useState<{type: 'image'|'video'|'audio', url: string} | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);

  const getChatPartner = (chat: Chat) => {
    const partnerId = chat.participants.find(id => id !== currentUser.id);
    return allUsers.find(u => u.id === partnerId);
  };

  const getSenderName = (id: string) => {
      return id === currentUser.id ? 'Tú' : allUsers.find(u => u.id === id)?.name || 'Usuario';
  };

  const fetchAISuggestions = async (msgs: Message[]) => {
    if (msgs.length === 0 || isProcessingAI) return;
    const lastMsg = msgs[msgs.length - 1];
    
    if (lastMsg.text && !liveCards[lastMsg.id]) {
        const liveContext = await getPlaceLiveContext(lastMsg.text);
        if (liveContext) setLiveCards(prev => ({ ...prev, [lastMsg.id]: liveContext }));
    }

    if (msgs.length % 5 === 0) {
        const roles = await analyzeGroupRoles(msgs.slice(-20).map(m => m.text));
        setUserRoles(roles);
    }

    const result = await getChatCopilotSuggestions(msgs.slice(-5).map(m => m.text));
    setAiSuggestions(result.suggestions || []);
    setChatSentiment(result.sentiment || 'calm');
    if (result.theme) setChatTheme(result.theme);
  };

  const handleCatchUp = async () => {
      if (messages.length < 5) return;
      setIsProcessingAI(true);
      const summary = await getChatCatchUp(messages.map(m => `${getSenderName(m.senderId)}: ${m.text}`));
      setCatchUpSummary(summary);
      setIsProcessingAI(false);
  };

  const handleCreatePoll = async () => {
      if (!pollQuestion || pollOptions.filter(o => o.trim()).length < 2 || !activeChatId) return;
      const pollId = `poll_${Date.now()}`;
      await set(ref(db, `chats/${activeChatId}/polls/${pollId}`), {
          question: pollQuestion,
          options: pollOptions.filter(o => o.trim()),
          votes: {}
      });
      setIsCreatingPoll(false);
      setPollQuestion('');
      setPollOptions(['', '']);
      setIsActionMenuOpen(false);
  };

  const handleVote = async (pollId: string, optionIdx: number) => {
      if (!activeChatId) return;
      await update(ref(db, `chats/${activeChatId}/polls/${pollId}/votes`), {
          [currentUser.id]: optionIdx
      });
  };

  useEffect(() => {
    if (!isOpen) return;
    const chatsRef = ref(db, 'chats');
    return onValue(chatsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setChats(Object.values(data).filter((chat: any) => chat.participants.includes(currentUser.id)) as Chat[]);
    });
  }, [isOpen, currentUser.id]);

  useEffect(() => {
    const currentId = activeChatId;
    if (!currentId) return;
    const messagesRef = ref(db, `chats/${currentId}/messages`);
    onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const loadedMessages = Object.values(data).map((msg: any) => ({
          ...msg,
          text: msg.text ? EncryptionService.decrypt(msg.text, currentId) : '',
          mediaUrl: msg.mediaUrl ? EncryptionService.decrypt(msg.mediaUrl, currentId) : undefined
        })) as Message[];
        const sorted = loadedMessages.sort((a, b) => a.timestamp - b.timestamp);
        setMessages(sorted);
        fetchAISuggestions(sorted);
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    });
    onValue(ref(db, `chats/${currentId}/polls`), (snapshot) => setPolls(snapshot.val() || {}));
  }, [activeChatId]);

  const getRoleBadge = (userId: string) => {
      const role = userRoles[userId];
      if (!role) return null;
      let color = 'bg-stone-500';
      if (role === 'Planificador') color = 'bg-blue-600';
      if (role === 'Fotógrafo') color = 'bg-amber-600';
      if (role === 'Explorador') color = 'bg-emerald-600';
      return <span className={`ml-2 px-1.5 py-0.5 rounded text-[8px] text-white font-black uppercase ${color}`}>{role}</span>;
  };

  const getThemeStyles = () => {
      switch(chatTheme) {
          case 'sand': return 'bg-[#fdf6e3] text-amber-900';
          case 'forest': return 'bg-emerald-50 text-emerald-900';
          case 'bonfire': return 'bg-stone-900 text-orange-200';
          default: return 'bg-slate-50 text-slate-900';
      }
  };

  const handleSendMessage = async (text?: string) => {
      const t = text || inputText;
      if (!t.trim() && !mediaPreview || !activeChatId) return;
      await StorageService.sendMessage(activeChatId, currentUser.id, t, 'text', mediaPreview?.url);
      setInputText(''); setMediaPreview(null); setIsActionMenuOpen(false);
  };

  const handleRecordStart = async () => {
      try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const recorder = new MediaRecorder(stream);
          audioChunksRef.current = [];
          recorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
          recorder.start();
          mediaRecorderRef.current = recorder;
          setIsRecording(true);
          recordingTimerRef.current = setInterval(() => setRecordingDuration(p => p + 1), 1000);
      } catch (e) { alert("Micrófono no disponible"); }
  };

  const handleRecordEnd = () => {
      if (mediaRecorderRef.current && isRecording) {
          mediaRecorderRef.current.stop();
          mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
          clearInterval(recordingTimerRef.current);
          setTimeout(() => {
              const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
              const reader = new FileReader();
              reader.readAsDataURL(audioBlob);
              reader.onloadend = () => setMediaPreview({ type: 'audio', url: reader.result as string });
          }, 200);
      }
      setIsRecording(false);
  };

  if (!isOpen) return null;

  const activePartner = activeChatId ? getChatPartner(chats.find(c => c.id === activeChatId) || { participants: activeChatId.split('_') } as any) : null;

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/60 md:backdrop-blur-sm p-0 md:p-4">
      <div className={`bg-white w-full h-full md:max-w-6xl md:h-[90vh] md:rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-row relative`}>
        
        {/* SIDEBAR - Oculto en móvil cuando hay chat activo */}
        <div className={`w-full md:w-[350px] bg-white border-r border-gray-100 flex flex-col ${activeChatId ? 'hidden md:flex' : 'flex'}`}>
            <div className="p-4 md:p-6 border-b border-gray-50 flex items-center gap-3">
                <button onClick={onClose} className="text-stone-400 p-2 hover:bg-stone-50 rounded-full"><ChevronLeft size={24} /></button>
                <div className="flex-1 bg-stone-100 rounded-xl h-11 flex items-center px-4">
                    <Search size={16} className="text-stone-400 mr-2" />
                    <input className="bg-transparent outline-none w-full text-xs font-bold" placeholder="Buscar amigos..." />
                </div>
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar pb-20">
                {chats.map(chat => {
                    const partner = getChatPartner(chat);
                    if (!partner) return null;
                    return (
                        <div key={chat.id} onClick={() => setActiveChatId(chat.id)} className={`flex items-center gap-4 p-4 md:p-5 cursor-pointer hover:bg-stone-50 ${activeChatId === chat.id ? 'bg-cyan-50' : ''} border-b border-gray-50/50`}>
                            <img src={partner.avatar} className="w-12 h-12 md:w-14 md:h-14 rounded-2xl object-cover shadow-sm" />
                            <div className="flex-1 min-w-0">
                                <h4 className="font-black text-slate-800 text-sm">{partner.name}</h4>
                                <p className="text-[10px] md:text-xs text-stone-400 truncate mt-0.5">Toca para abrir conversación</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>

        {/* CHAT AREA - Ocupa todo el espacio en móvil si hay chat activo */}
        <div className={`flex-1 flex flex-col relative ${getThemeStyles()} ${!activeChatId ? 'hidden md:flex' : 'flex'}`}>
            {activeChatId && activePartner ? (
                <>
                    {/* Header optimizado para móvil */}
                    <div className="p-3 md:p-4 px-4 md:px-6 flex items-center justify-between z-20 sticky top-0 border-b border-black/5 backdrop-blur-xl">
                        <div className="flex items-center gap-3">
                            <button onClick={() => setActiveChatId(null)} className="md:hidden p-2 -ml-2 text-stone-600 active:bg-black/5 rounded-full transition-all"><ChevronLeft size={24} /></button>
                            <img src={activePartner.avatar} className="w-9 h-9 md:w-11 md:h-11 rounded-xl md:rounded-2xl object-cover shadow-sm" />
                            <div className="min-w-0">
                                <h3 className="font-black text-sm truncate leading-none mb-1">{activePartner.name}</h3>
                                <div className="flex items-center text-[8px] md:text-[9px] font-black uppercase tracking-widest gap-1 text-cyan-600">
                                    <Zap size={8} fill="currentColor" /> Copiloto IA
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-1 md:gap-2">
                            <button onClick={handleCatchUp} className="p-2.5 rounded-xl bg-white/30 hover:bg-white/50 text-current active:scale-95 transition-all"><PieChart size={18} /></button>
                            <button onClick={() => setShowLogistics(!showLogistics)} className={`p-2.5 rounded-xl transition-all ${showLogistics ? 'bg-cyan-600 text-white shadow-lg' : 'bg-white/30 active:scale-95'}`}><Layout size={18}/></button>
                        </div>
                    </div>

                    {/* Resumen IA Overlay */}
                    {catchUpSummary && (
                        <div className="absolute top-16 md:top-20 left-4 right-4 md:left-6 md:right-6 z-[30] bg-white/95 backdrop-blur-2xl p-4 md:p-5 rounded-[1.5rem] md:rounded-[2rem] shadow-2xl border border-white animate-in slide-in-from-top-4">
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="text-[10px] font-black uppercase text-cyan-600 tracking-widest flex items-center gap-2"><Info size={12}/> Resumen IA</h4>
                                <button onClick={() => setCatchUpSummary(null)} className="p-1 hover:bg-stone-100 rounded-full"><X size={14}/></button>
                            </div>
                            <p className="text-xs md:text-sm font-medium text-slate-700 italic leading-relaxed">"{catchUpSummary}"</p>
                        </div>
                    )}

                    {/* Mensajes con scroll suave */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 z-10 scroll-smooth no-scrollbar" ref={messagesEndRef}>
                        {messages.map(msg => {
                            const isMe = msg.senderId === currentUser.id;
                            const liveCard = liveCards[msg.id];
                            return (
                                <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                    <div className={`max-w-[90%] md:max-w-[85%] p-3 md:p-4 rounded-2xl md:rounded-3xl ${isMe ? 'bg-cyan-600 text-white rounded-tr-sm shadow-md' : 'bg-white text-slate-800 rounded-tl-sm shadow-sm'}`}>
                                        {!isMe && <p className="text-[9px] md:text-[10px] font-black mb-1 opacity-60 flex items-center">{getSenderName(msg.senderId)} {getRoleBadge(msg.senderId)}</p>}
                                        {msg.mediaUrl && msg.type === 'image' && <img src={msg.mediaUrl} className="rounded-xl md:rounded-2xl mb-2 w-full object-cover max-h-60" />}
                                        <p className="text-xs md:text-sm font-medium leading-relaxed">{msg.text}</p>
                                        <div className="mt-1 text-[8px] md:text-[9px] opacity-40 text-right">{new Date(msg.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                                    </div>
                                    {liveCard && (
                                        <div className="mt-2 w-full max-w-[240px] bg-white rounded-2xl md:rounded-3xl shadow-lg overflow-hidden animate-in zoom-in-95">
                                            <div className="bg-cyan-600 p-2.5 text-white flex justify-between items-center">
                                                <span className="text-[9px] font-black uppercase tracking-tighter">{liveCard.placeName}</span>
                                                <CloudSun size={12} />
                                            </div>
                                            <div className="p-3 flex justify-between items-center">
                                                <div><p className="text-xl font-black text-slate-800">{liveCard.temp}°</p><p className="text-[9px] font-bold text-stone-400">{liveCard.weather}</p></div>
                                                <button className="bg-slate-900 text-white p-2 rounded-xl active:scale-90 transition-all"><Navigation size={12}/></button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {/* Polls optimizados para móvil */}
                        {Object.entries(polls).map(([id, pollData]) => {
                            const poll = pollData as any;
                            const totalVotes = Object.values(poll.votes || {}).length;
                            return (
                                <div key={id} className="w-full max-w-[280px] md:max-w-xs mx-auto my-6 bg-white rounded-[2rem] p-5 shadow-xl border border-stone-100 animate-in zoom-in-95">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="bg-purple-100 p-2 rounded-xl text-purple-600"><BarChart3 size={18}/></div>
                                        <h4 className="font-black text-slate-800 text-xs uppercase tracking-tight">{poll.question}</h4>
                                    </div>
                                    <div className="space-y-2">
                                        {poll.options.map((opt: string, idx: number) => {
                                            const optionVotes = Object.values(poll.votes || {}).filter(v => v === idx).length;
                                            const pct = totalVotes > 0 ? (optionVotes / totalVotes) * 100 : 0;
                                            return (
                                                <button key={idx} onClick={() => handleVote(id, idx)} className="w-full text-left relative overflow-hidden bg-stone-50 p-2.5 rounded-xl active:bg-stone-100 transition-all">
                                                    <div className="absolute inset-y-0 left-0 bg-purple-100/50 transition-all duration-700" style={{ width: `${pct}%` }}></div>
                                                    <div className="relative flex justify-between items-center">
                                                        <span className="text-[11px] font-bold text-slate-700 truncate pr-2">{opt}</span>
                                                        <span className="text-[10px] font-black text-purple-600">{optionVotes}</span>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Sugerencias horizontales móviles */}
                    <div className="px-4 md:px-6 py-2 flex gap-2 overflow-x-auto no-scrollbar z-20">
                        {aiSuggestions.map((s, i) => (
                            <button key={i} onClick={() => handleSendMessage(s)} className="whitespace-nowrap px-4 py-2 bg-white/80 border border-black/5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-cyan-600 hover:text-white active:scale-95 transition-all flex items-center gap-2">
                                <Sparkles size={10}/> {s}
                            </button>
                        ))}
                    </div>

                    {/* Input Área Móvil */}
                    <div className="p-4 md:p-6 pt-0 z-20">
                        {isCreatingPoll && (
                            <div className="mb-3 bg-white/95 backdrop-blur-xl p-4 rounded-[1.5rem] shadow-2xl border border-purple-100 animate-in slide-in-from-bottom-4">
                                <div className="flex justify-between items-center mb-3">
                                    <h4 className="text-[10px] font-black uppercase text-purple-600 tracking-widest flex items-center gap-2"><PlusCircle size={12}/> Nueva Encuesta</h4>
                                    <button onClick={() => setIsCreatingPoll(false)} className="p-1"><X size={14}/></button>
                                </div>
                                <input placeholder="¿Qué vamos a decidir?" className="w-full p-2.5 bg-stone-50 rounded-xl mb-2 text-xs font-bold outline-none" value={pollQuestion} onChange={e => setPollQuestion(e.target.value)} />
                                <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                                    {pollOptions.map((opt, i) => (
                                        <input key={i} placeholder={`Opción ${i+1}`} className="w-full p-2 bg-stone-50 rounded-lg text-[11px] outline-none" value={opt} onChange={e => {
                                            const n = [...pollOptions]; n[i] = e.target.value; setPollOptions(n);
                                        }} />
                                    ))}
                                    <button onClick={() => setPollOptions([...pollOptions, ''])} className="text-[9px] font-black text-purple-500 uppercase px-1">+ Añadir opción</button>
                                </div>
                                <button onClick={handleCreatePoll} className="w-full mt-3 bg-purple-600 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-purple-100">Lanzar Encuesta</button>
                            </div>
                        )}

                        <div className="bg-white/90 backdrop-blur-2xl rounded-[1.8rem] md:rounded-[2.5rem] p-1.5 md:p-2 shadow-xl border border-black/5 flex items-center gap-1">
                            <button onClick={() => setIsActionMenuOpen(!isActionMenuOpen)} className={`p-3 md:p-4 rounded-full transition-all ${isActionMenuOpen ? 'bg-cyan-600 text-white rotate-45' : 'bg-stone-100 text-stone-500 active:scale-90'}`}><Plus size={22} /></button>
                            <textarea value={inputText} onChange={e => setInputText(e.target.value)} placeholder="Mensaje..." className="flex-1 bg-transparent py-3 md:py-4 px-2 outline-none text-slate-800 font-bold placeholder-stone-400 resize-none max-h-32 text-sm leading-tight" rows={1} />
                            <div className="flex gap-1 pr-1">
                                <button onMouseDown={handleRecordStart} onMouseUp={handleRecordEnd} onTouchStart={handleRecordStart} onTouchEnd={handleRecordEnd} className={`p-3 md:p-4 rounded-full transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-stone-100 text-stone-500 active:scale-90'}`}><Mic size={22} /></button>
                                <button onClick={() => handleSendMessage()} className="p-3 md:p-4 bg-cyan-600 text-white rounded-full shadow-lg active:scale-90 transition-all"><Send size={22} /></button>
                            </div>
                        </div>

                        {/* FAB Actions para móvil */}
                        {isActionMenuOpen && !isCreatingPoll && (
                            <div className="absolute bottom-20 md:bottom-24 left-4 md:left-6 flex gap-3 animate-in slide-in-from-bottom-4">
                                <button onClick={() => setIsCreatingPoll(true)} className="flex flex-col items-center gap-1 group">
                                    <div className="bg-purple-600 text-white p-3 md:p-4 rounded-2xl md:rounded-[1.5rem] shadow-xl group-active:scale-90 transition-transform"><BarChart3 size={20} /></div>
                                    <span className="text-[8px] md:text-[9px] font-black uppercase text-stone-500 tracking-widest">Encuesta</span>
                                </button>
                                <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center gap-1 group">
                                    <div className="bg-blue-600 text-white p-3 md:p-4 rounded-2xl md:rounded-[1.5rem] shadow-xl group-active:scale-90 transition-transform"><ImageIcon size={20} /></div>
                                    <span className="text-[8px] md:text-[9px] font-black uppercase text-stone-500 tracking-widest">Fotos</span>
                                </button>
                                <button onClick={() => { setShowLogistics(true); setIsActionMenuOpen(false); }} className="flex flex-col items-center gap-1 group">
                                    <div className="bg-emerald-600 text-white p-3 md:p-4 rounded-2xl md:rounded-[1.5rem] shadow-xl group-active:scale-90 transition-transform"><Calculator size={20} /></div>
                                    <span className="text-[8px] md:text-[9px] font-black uppercase text-stone-500 tracking-widest">Logística</span>
                                </button>
                            </div>
                        )}
                        <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={async (e) => {
                            const f = e.target.files?.[0]; if(f) { const b = await resizeImage(f, 800); setMediaPreview({type:'image', url:b}); setIsActionMenuOpen(false); }
                        }} />
                    </div>
                </>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-stone-300 p-10 text-center">
                    <div className="bg-white/40 p-8 md:p-10 rounded-[2.5rem] md:rounded-[3rem] border border-white/50 animate-in zoom-in duration-500"><Brain size={48} md:size={64} className="opacity-10" /></div>
                    <h3 className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px] md:text-xs mt-6">Selecciona una conversación</h3>
                </div>
            )}
        </div>

        {/* LOGISTICA DRAWER - Overlay completo en móvil */}
        {showLogistics && activeChatId && (
            <div className="fixed inset-0 md:relative md:inset-auto w-full md:w-[380px] bg-white border-l border-gray-100 flex flex-col animate-in slide-in-from-right-10 duration-300 z-[400] md:z-[40]">
                <div className="p-6 md:p-8 border-b border-gray-50 flex justify-between items-center bg-slate-900 text-white">
                    <div><h3 className="font-black text-lg md:text-xl leading-none">Logística</h3><p className="text-[8px] md:text-[10px] text-stone-400 uppercase font-black tracking-[0.2em] mt-2">IA Colaborativa</p></div>
                    <button onClick={() => setShowLogistics(false)} className="bg-white/10 p-2 md:p-3 rounded-xl active:bg-white/20 transition-all"><X size={20}/></button>
                </div>
                <div className="flex border-b border-gray-50 bg-slate-50/50 p-1">
                    <button onClick={() => setLogisticsTab('checklist')} className={`flex-1 px-4 py-3 md:py-4 text-[9px] md:text-[10px] font-black uppercase rounded-xl transition-all ${logisticsTab === 'checklist' ? 'bg-white text-cyan-600 shadow-sm' : 'text-stone-400'}`}>Checklist</button>
                    <button onClick={() => setLogisticsTab('expenses')} className={`flex-1 px-4 py-3 md:py-4 text-[9px] md:text-[10px] font-black uppercase rounded-xl transition-all ${logisticsTab === 'expenses' ? 'bg-white text-cyan-600 shadow-sm' : 'text-stone-400'}`}>Gastos</button>
                    <button onClick={() => setLogisticsTab('vault')} className={`flex-1 px-4 py-3 md:py-4 text-[9px] md:text-[10px] font-black uppercase rounded-xl transition-all ${logisticsTab === 'vault' ? 'bg-white text-cyan-600 shadow-sm' : 'text-stone-400'}`}>Vault</button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50/30 no-scrollbar">
                    <div className="bg-white p-5 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border border-stone-100 mb-4 shadow-sm">
                        <div className="flex items-center gap-3 mb-4"><Users2 size={16} className="text-cyan-600"/><h4 className="text-[10px] font-black uppercase text-stone-400">Personalidades</h4></div>
                        <div className="space-y-3">
                            {Object.entries(userRoles).length > 0 ? Object.entries(userRoles).map(([id, role]) => (
                                <div key={id} className="flex justify-between items-center animate-in fade-in duration-500">
                                    <span className="text-xs font-bold text-slate-700">{getSenderName(id)}</span>
                                    <span className="text-[8px] font-black uppercase bg-stone-100 px-2 py-1 rounded-lg text-stone-500">{role}</span>
                                </div>
                            )) : <p className="text-[10px] text-stone-300 italic text-center py-4">Conversa más para descubrir roles...</p>}
                        </div>
                    </div>
                    {/* Placeholder para contenido adicional */}
                    <div className="text-center p-10 opacity-20"><ClipboardList size={40} className="mx-auto" /></div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};
