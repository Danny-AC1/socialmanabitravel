
import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Send, Lock, ChevronLeft, Search, Image as ImageIcon, 
  Mic, Paperclip, Trash2, Check, CheckCheck, 
  Play, Video, Reply as ReplyIcon, Edit2, AlertTriangle, User as UserIcon,
  Sparkles, Zap, Wand2, FileText, Brain, Loader2, Languages, Volume2, 
// Fix: Removed non-existent UserGroupIcon from lucide-react
  Briefcase, Layout, Plus, DollarSign, MapPin, Calculator, ClipboardList, Scan, Globe, CloudSun, Navigation, FolderHeart, Calendar, Maximize2, Minimize2, Map as MapIcon, BarChart3, PieChart, Users2, Info, ChevronDown, PlusCircle, CheckSquare, Square, CreditCard, History, Waves, Pause, UserPlus, Download, Users
} from 'lucide-react';
import { User, Chat, Message } from '../types';
import { StorageService } from '../services/storageService';
import { EncryptionService } from '../services/encryptionService';
import { 
    transcribeAndSummarizeAudio, 
    getChatCopilotSuggestions, 
    getChatCatchUp,
    getPlaceLiveContext
} from '../services/geminiService';
import { db } from '../services/firebase';
// Fix: Added 'set' to imports from @firebase/database
import { onValue, ref, set } from '@firebase/database';
import { resizeImage, downloadMedia } from '../utils';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  allUsers: User[];
  initialChatId?: string | null;
}

interface ExpenseGroup {
    id: string;
    name: string;
    memberIds: string[];
}

interface CustomExpense {
    id: string;
    desc: string;
    amount: number;
    payerId: string;
    targetMemberIds: string[]; // Quiénes participan en este gasto
    timestamp: number;
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
  
  // Logistics State
  const [checklist, setChecklist] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<CustomExpense[]>([]);
  const [expenseGroups, setExpenseGroups] = useState<ExpenseGroup[]>([]);
  
  const [newItemText, setNewItemText] = useState('');
  const [newExpenseDesc, setNewExpenseDesc] = useState('');
  const [newExpenseAmount, setNewExpenseAmount] = useState('');
  const [expenseTargetType, setExpenseTargetType] = useState<'all' | 'custom'>('all');
  const [selectedExpenseMembers, setSelectedExpenseMembers] = useState<string[]>([]);
  
  const [showGroupCreator, setShowGroupCreator] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupMembers, setNewGroupMembers] = useState<string[]>([]);

  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [chatSentiment, setChatSentiment] = useState<string>('calm');
  const [chatTheme, setChatTheme] = useState<string>('ocean');
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [liveCards, setLiveCards] = useState<Record<string, {placeName: string, weather: string, temp: string, status: string}>>({});
  const [catchUpSummary, setCatchUpSummary] = useState<string | null>(null);
  
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const [showLogistics, setShowLogistics] = useState(false);
  const [logisticsTab, setLogisticsTab] = useState<'checklist' | 'expenses' | 'vault'>('checklist');

  // New States for Groups
  const [isAddingParticipants, setIsAddingParticipants] = useState(false);
  const [participantSearch, setParticipantSearch] = useState('');
  const [isCreatingNewGroup, setIsCreatingNewGroup] = useState(false);
  const [newChatGroupSelectedUsers, setNewChatGroupSelectedUsers] = useState<string[]>([]);
  const [newChatGroupName, setNewChatGroupName] = useState('');

  const [inputText, setInputText] = useState('');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [mediaPreview, setMediaPreview] = useState<{type: 'image'|'video'|'audio', url: string} | null>(null);
  const [stagedAudio, setStagedAudio] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  
  // Image Viewer State
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isFirstLoadRef = useRef(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  const getChatPartner = (chat: Chat) => {
    const partnerId = chat.participants.find(id => id !== currentUser.id);
    return allUsers.find(u => u.id === partnerId);
  };

  const getChatPartners = (chat: Chat) => {
      return (chat.participants || []).filter(id => id !== currentUser.id).map(id => allUsers.find(u => u.id === id)).filter(Boolean) as User[];
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

    const result = await getChatCopilotSuggestions(msgs.slice(-5).map(m => m.text));
    setAiSuggestions(result.suggestions || []);
    setChatSentiment(result.sentiment || 'calm');
    if (result.theme) setChatTheme(result.theme);
  };

  const handleCatchUp = async () => {
      if (messages.length < 3) {
          alert("Necesito al menos 3 mensajes para generar un resumen útil.");
          return;
      }
      setIsProcessingAI(true);
      const summary = await getChatCatchUp(messages.map(m => `${getSenderName(m.senderId)}: ${m.text}`));
      setCatchUpSummary(summary);
      setIsProcessingAI(false);
  };

  // --- SCROLL LOGIC ---
  useEffect(() => {
    if (messages.length > 0) {
      const scrollOptions: ScrollIntoViewOptions = {
        behavior: isFirstLoadRef.current ? 'auto' : 'smooth'
      };
      const timer = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView(scrollOptions);
        isFirstLoadRef.current = false;
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [messages, activeChatId]);

  useEffect(() => {
    isFirstLoadRef.current = true;
    setCatchUpSummary(null);
  }, [activeChatId]);

  // --- ACTIONS ---

  const handleDeleteChat = async (chatId: string) => {
      if (confirm("¿Estás seguro de eliminar esta conversación completa? Esta acción no se puede deshacer.")) {
          await StorageService.deleteChat(chatId);
          if (activeChatId === chatId) {
              setActiveChatId(null);
          }
      }
  };

  const handleAddParticipant = async (userId: string) => {
      if (!activeChatId) return;
      const chat = chats.find(c => c.id === activeChatId);
      if (!chat) return;

      if (!chat.isGroup) {
          const gName = prompt("Estás creando un grupo. ¿Cómo se llamará?");
          if (gName === null) return;
          await StorageService.addParticipantToChat(activeChatId, userId, gName || "Grupo de Viaje");
      } else {
          await StorageService.addParticipantToChat(activeChatId, userId);
      }
      setIsAddingParticipants(false);
      setParticipantSearch('');
  };

  const handleCreateNewGroupFromScratch = async () => {
      if (!newChatGroupName.trim() || newChatGroupSelectedUsers.length === 0) return;
      setIsProcessingAI(true);
      const newId = await StorageService.createGroupChat(currentUser.id, newChatGroupSelectedUsers, newChatGroupName);
      setActiveChatId(newId);
      setIsCreatingNewGroup(false);
      setNewChatGroupName('');
      setNewChatGroupSelectedUsers([]);
      setIsProcessingAI(false);
  };

  // --- LOGISTICS ACTIONS ---

  const handleAddChecklistItem = async (text: string) => {
      if (!text.trim() || !activeChatId) return;
      const item = { id: Date.now().toString(), text: text, completed: false, userId: currentUser.id };
      const updated = [...checklist, item];
      await StorageService.updateChecklist(activeChatId, updated);
      setNewItemText('');
  };

  const toggleChecklistItem = async (id: string) => {
      if (!activeChatId) return;
      const updated = checklist.map(item => item.id === id ? { ...item, completed: !item.completed } : item);
      await StorageService.updateChecklist(activeChatId, updated);
  };

  const removeChecklistItem = async (id: string) => {
      if (!activeChatId) return;
      const updated = checklist.filter(item => item.id !== id);
      await StorageService.updateChecklist(activeChatId, updated);
  };

  const handleAddExpense = async () => {
      if (!newExpenseDesc.trim() || isNaN(parseFloat(newExpenseAmount)) || !activeChatId) return;
      
      const currentChat = chats.find(c => c.id === activeChatId);
      const targetIds = expenseTargetType === 'all' 
        ? (currentChat?.participants || []) 
        : selectedExpenseMembers;

      if (targetIds.length === 0) {
          alert("Selecciona al menos un participante para este gasto.");
          return;
      }

      const expense: CustomExpense = { 
          id: Date.now().toString(), 
          desc: newExpenseDesc, 
          amount: parseFloat(newExpenseAmount), 
          payerId: currentUser.id, 
          targetMemberIds: targetIds,
          timestamp: Date.now() 
      };

      const updated = [...expenses, expense];
      await StorageService.updateExpenses(activeChatId, updated);
      setNewExpenseDesc('');
      setNewExpenseAmount('');
      setExpenseTargetType('all');
  };

  const handleCreateExpenseGroup = async () => {
      if (!newGroupName.trim() || newGroupMembers.length === 0 || !activeChatId) return;
      const group: ExpenseGroup = {
          id: `eg_${Date.now()}`,
          name: newGroupName.trim(),
          memberIds: newGroupMembers
      };
      const updated = [...expenseGroups, group];
      // Nota: Necesitaríamos añadir soporte en storageService para persistir grupos de gastos
      // Por ahora los simulamos o los guardamos en un nodo de logística si es posible
      await set(ref(db, `chats/${activeChatId}/logistics/expenseGroups`), updated);
      setNewGroupName('');
      setNewGroupMembers([]);
      setShowGroupCreator(false);
  };

  const removeExpense = async (id: string) => {
      if (!activeChatId) return;
      const updated = expenses.filter(e => e.id !== id);
      await StorageService.updateExpenses(activeChatId, updated);
  };

  // --- VOICE LOGIC ---

  const startRecording = async () => {
      try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const recorder = new MediaRecorder(stream);
          audioChunksRef.current = [];
          
          recorder.ondataavailable = (e) => {
              if (e.data.size > 0) audioChunksRef.current.push(e.data);
          };

          recorder.onstop = async () => {
              setIsProcessingVoice(true);
              const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
              const reader = new FileReader();
              reader.readAsDataURL(audioBlob);
              reader.onloadend = async () => {
                  const base64Audio = reader.result as string;
                  setStagedAudio(base64Audio);
                  try {
                      const { transcription } = await transcribeAndSummarizeAudio(base64Audio);
                      if (transcription && transcription !== "Error") {
                          setInputText(transcription);
                      }
                  } catch (err) { console.error("Error transcribiendo staged audio", err); }
                  setIsProcessingVoice(false);
              };
          };

          recorder.start();
          mediaRecorderRef.current = recorder;
          setIsRecording(true);
          setRecordingDuration(0);
          recordingTimerRef.current = setInterval(() => setRecordingDuration(p => p + 1), 1000);
      } catch (e) {
          alert("Permiso de micrófono denegado.");
          setIsRecording(false);
      }
  };

  const stopRecording = () => {
      if (mediaRecorderRef.current && isRecording) {
          mediaRecorderRef.current.stop();
          mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
          if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
          setIsRecording(false);
      }
  };

  const handleMicToggle = (e: React.MouseEvent) => {
      e.preventDefault();
      if (isRecording) stopRecording();
      else { setStagedAudio(null); startRecording(); }
  };

  const handlePlayAudio = (id: string, url: string) => {
      if (playingAudioId === id) {
          audioPlayerRef.current?.pause();
          setPlayingAudioId(null);
      } else {
          if (audioPlayerRef.current) audioPlayerRef.current.pause();
          const audio = new Audio(url);
          audio.onended = () => setPlayingAudioId(null);
          audio.play();
          audioPlayerRef.current = audio;
          setPlayingAudioId(id);
      }
  };

  const handleSendMessage = async (text?: string) => {
      const t = text || inputText;
      if (!t.trim() && !mediaPreview && !stagedAudio || !activeChatId) return;
      
      if (editingMessageId) {
          await StorageService.editMessage(activeChatId, editingMessageId, t);
          setEditingMessageId(null);
      } else if (stagedAudio) {
          await StorageService.sendMessage(activeChatId, currentUser.id, t || "Nota de voz", 'audio', stagedAudio);
          setStagedAudio(null);
      } else {
          await StorageService.sendMessage(activeChatId, currentUser.id, t, mediaPreview ? mediaPreview.type : 'text', mediaPreview?.url);
      }
      
      setInputText(''); 
      setMediaPreview(null); 
      setIsActionMenuOpen(false);
  };

  const handleDeleteMessage = async (msgId: string) => {
      if (confirm("¿Eliminar este mensaje permanentemente?")) {
          await StorageService.deleteMessage(activeChatId!, msgId);
      }
  };

  const handleStartEdit = (msg: Message) => {
      setEditingMessageId(msg.id);
      setInputText(msg.text);
      setStagedAudio(null);
      setMediaPreview(null);
      setIsActionMenuOpen(false);
  };

  const cancelEditing = () => {
      setEditingMessageId(null);
      setInputText('');
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
        StorageService.markChatAsRead(currentId, currentUser.id);
      } else {
        setMessages([]);
      }
    });

    onValue(ref(db, `chats/${currentId}/logistics/checklist`), (snapshot) => setChecklist(snapshot.val() || []));
    onValue(ref(db, `chats/${currentId}/logistics/expenses`), (snapshot) => setExpenses(snapshot.val() || []));
    onValue(ref(db, `chats/${currentId}/logistics/expenseGroups`), (snapshot) => setExpenseGroups(snapshot.val() || []));

  }, [activeChatId]);

  const getThemeStyles = () => {
      switch(chatTheme) {
          case 'sand': return 'bg-[#fdf6e3] text-amber-900';
          case 'forest': return 'bg-emerald-50 text-emerald-900';
          case 'bonfire': return 'bg-stone-900 text-orange-200';
          default: return 'bg-slate-50 text-slate-900';
      }
  };

  if (!isOpen) return null;

  const currentChatObj = chats.find(c => c.id === activeChatId);
  const activePartner = activeChatId && currentChatObj ? getChatPartner(currentChatObj) : null;
  const activePartners = activeChatId && currentChatObj ? getChatPartners(currentChatObj) : [];
  const vaultImages = messages.filter(m => m.type === 'image' && m.mediaUrl).map(m => m.mediaUrl!);

  // --- NUEVA LÓGICA DE CÁLCULO DE GASTOS ---
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  
  // Calcular deuda por usuario
  const userBalances: Record<string, number> = {};
  if (currentChatObj) {
      currentChatObj.participants.forEach(uid => userBalances[uid] = 0);
      
      expenses.forEach(exp => {
          const splitAmount = exp.amount / exp.targetMemberIds.length;
          exp.targetMemberIds.forEach(uid => {
              if (userBalances[uid] !== undefined) {
                  userBalances[uid] += splitAmount;
              }
          });
      });
  }

  const toggleMemberInExpense = (uid: string) => {
      setSelectedExpenseMembers(prev => 
        prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]
      );
  };

  const toggleMemberInNewGroup = (uid: string) => {
    setNewGroupMembers(prev => 
      prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]
    );
  };

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/60 md:backdrop-blur-sm p-0 md:p-4">
      <div className={`bg-white w-full h-full md:max-w-6xl md:h-[90vh] md:rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-row relative`}>
        
        {/* SIDEBAR */}
        <div className={`w-full md:w-[350px] bg-white border-r border-gray-100 flex flex-col ${activeChatId ? 'hidden md:flex' : 'flex'}`}>
            <div className="p-4 md:p-6 border-b border-gray-50 space-y-4">
                <div className="flex justify-between items-center">
                    <button onClick={onClose} className="text-stone-400 p-2 hover:bg-stone-50 rounded-full"><ChevronLeft size={24} /></button>
                    <button 
                        onClick={() => setIsCreatingNewGroup(true)}
                        className="bg-cyan-50 text-cyan-600 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1 hover:bg-cyan-100 transition-colors"
                    >
                        <UserPlus size={14} /> Nuevo Grupo
                    </button>
                </div>
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
                        <div key={chat.id} className={`group flex items-center gap-3 p-4 md:p-5 cursor-pointer hover:bg-stone-50 ${activeChatId === chat.id ? 'bg-cyan-50' : ''} border-b border-gray-50/50`}>
                            <div className="flex-1 flex items-center gap-4 min-w-0" onClick={() => setActiveChatId(chat.id)}>
                                <div className="relative shrink-0">
                                    <img src={partner.avatar} className="w-12 h-12 md:w-14 md:h-14 rounded-2xl object-cover shadow-sm" />
                                    {chat.isGroup && (
                                        <div className="absolute -bottom-1 -right-1 bg-cyan-600 text-white p-1 rounded-lg border-2 border-white">
                                            <Users2 size={10} />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-black text-slate-800 text-sm truncate">{chat.isGroup ? chat.name : partner.name}</h4>
                                    <p className="text-[10px] md:text-xs text-stone-400 truncate mt-0.5">{chat.isGroup ? `${chat.participants.length} participantes` : 'Chat individual'}</p>
                                </div>
                            </div>
                            <button 
                                onClick={(e) => { e.stopPropagation(); handleDeleteChat(chat.id); }}
                                className="p-2 text-stone-200 hover:text-red-500 transition-colors"
                                title="Eliminar Chat"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>

        {/* CHAT AREA */}
        <div className={`flex-1 flex flex-col relative ${getThemeStyles()} ${!activeChatId ? 'hidden md:flex' : 'flex'}`}>
            {activeChatId && activePartner && currentChatObj ? (
                <>
                    <div className="p-3 md:p-4 px-4 md:px-6 flex items-center justify-between z-20 sticky top-0 border-b border-black/5 backdrop-blur-xl">
                        <div className="flex items-center gap-3">
                            <button onClick={() => setActiveChatId(null)} className="md:hidden p-2 -ml-2 text-stone-600 active:bg-black/5 rounded-full transition-all"><ChevronLeft size={24} /></button>
                            
                            <div className="flex -space-x-4">
                                {activePartners.slice(0, 3).map((u, i) => (
                                    <img key={u.id} src={u.avatar} className="w-9 h-9 md:w-11 md:h-11 rounded-xl md:rounded-2xl object-cover shadow-md border-2 border-white ring-1 ring-black/5 z-[1]" style={{ zIndex: 3 - i }} />
                                ))}
                            </div>

                            <div className="min-w-0 ml-1">
                                <h3 className="font-black text-sm truncate leading-none mb-1">{currentChatObj.isGroup ? currentChatObj.name : activePartner.name}</h3>
                                <div className="flex items-center text-[8px] md:text-[9px] font-black uppercase tracking-widest gap-1 text-cyan-600">
                                    {currentChatObj.isGroup ? `${currentChatObj.participants.length} integrantes` : <><Zap size={8} fill="currentColor" /> Copiloto IA</>}
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-1 md:gap-2">
                            <button onClick={() => setIsAddingParticipants(true)} className="p-2 md:p-2.5 rounded-xl bg-white/30 hover:bg-white/50 text-current active:scale-95 transition-all"><UserPlus size={18} /></button>
                            <button onClick={handleCatchUp} disabled={isProcessingAI} className={`p-2 md:p-2.5 rounded-xl transition-all ${isProcessingAI ? 'bg-cyan-100 text-cyan-600' : 'bg-white/30 hover:bg-white/50 text-current active:scale-95'}`}>
                                {isProcessingAI ? <Loader2 size={18} className="animate-spin" /> : <PieChart size={18} />}
                            </button>
                            <button onClick={() => setShowLogistics(!showLogistics)} className={`p-2 md:p-2.5 rounded-xl transition-all ${showLogistics ? 'bg-cyan-600 text-white shadow-lg' : 'bg-white/30 active:scale-95'}`}><Layout size={18}/></button>
                        </div>
                    </div>

                    {catchUpSummary && (
                        <div className="mx-4 md:mx-6 mt-4 p-4 bg-gradient-to-br from-cyan-600 to-blue-700 text-white rounded-[1.5rem] shadow-xl animate-in slide-in-from-top-4 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform"><Sparkles size={64}/></div>
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                    <Brain size={18} className="text-cyan-200" />
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-100">Resumen de la Conversación</h4>
                                </div>
                                <button onClick={() => setCatchUpSummary(null)} className="text-white/60 hover:text-white transition-colors"><X size={18}/></button>
                            </div>
                            <p className="text-xs md:text-sm font-medium leading-relaxed italic">{catchUpSummary}</p>
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 z-10 scroll-smooth no-scrollbar" ref={messagesEndRef}>
                        {messages.map(msg => {
                            const isMe = msg.senderId === currentUser.id;
                            const liveCard = liveCards[msg.id];
                            return (
                                <div key={msg.id} className={`flex flex-col group/msg ${isMe ? 'items-end' : 'items-start'}`}>
                                    <div className="relative max-w-[90%] md:max-w-[85%]">
                                        {isMe && (
                                            <div className="absolute -left-12 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover/msg:opacity-100 transition-opacity hidden md:flex">
                                                <button onClick={() => handleStartEdit(msg)} className="p-1.5 bg-white shadow-sm border border-stone-100 rounded-full text-stone-400 hover:text-cyan-600"><Edit2 size={12} /></button>
                                                <button onClick={() => handleDeleteMessage(msg.id)} className="p-1.5 bg-white shadow-sm border border-stone-100 rounded-full text-stone-400 hover:text-red-500"><Trash2 size={12} /></button>
                                            </div>
                                        )}
                                        <div className={`p-3 md:p-4 rounded-2xl md:rounded-3xl ${isMe ? 'bg-cyan-600 text-white rounded-tr-sm shadow-md' : 'bg-white text-slate-800 rounded-tl-sm shadow-sm'}`}>
                                            {!isMe && <p className="text-[9px] md:text-[10px] font-black mb-1 opacity-60 flex items-center">{getSenderName(msg.senderId)}</p>}
                                            {msg.type === 'audio' && msg.mediaUrl && (
                                                <div className="mb-2 flex items-center gap-3 bg-black/10 p-2.5 rounded-2xl">
                                                    <button onClick={() => handlePlayAudio(msg.id, msg.mediaUrl!)} className="bg-white/90 text-slate-800 p-2 rounded-full shadow-sm active:scale-90 transition-transform">
                                                        {playingAudioId === msg.id ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                                                    </button>
                                                    <div className="flex-1 flex flex-col gap-1">
                                                        <div className="h-1 bg-white/20 rounded-full overflow-hidden"><div className={`h-full bg-white transition-all ${playingAudioId === msg.id ? 'w-full duration-[10s]' : 'w-0'}`}></div></div>
                                                        <span className="text-[8px] font-black opacity-40 uppercase tracking-widest text-right">Nota de voz</span>
                                                    </div>
                                                </div>
                                            )}
                                            {msg.mediaUrl && msg.type === 'image' && (
                                                <img src={msg.mediaUrl} onClick={() => setViewingImage(msg.mediaUrl!)} className="rounded-xl md:rounded-2xl mb-2 w-full object-cover max-h-60 cursor-pointer hover:opacity-90 transition-opacity" />
                                            )}
                                            <p className={`text-xs md:text-sm font-medium leading-relaxed ${msg.type === 'audio' ? 'italic opacity-90' : ''}`}>{msg.text}</p>
                                            <div className="mt-1 text-[8px] md:text-[9px] opacity-40 text-right flex items-center justify-end gap-1">
                                                {new Date(msg.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                                {isMe && <span className="ml-1">{msg.isRead ? <CheckCheck size={14} className="text-cyan-200" strokeWidth={3} /> : <Check size={14} className="text-white/60" strokeWidth={3} />}</span>}
                                            </div>
                                        </div>
                                    </div>
                                    {liveCard && (
                                        <div className="mt-2 w-full max-w-[200px] md:max-w-[240px] bg-white rounded-2xl md:rounded-3xl shadow-lg overflow-hidden animate-in zoom-in-95">
                                            <div className="bg-cyan-600 p-2 md:p-2.5 text-white flex justify-between items-center"><span className="text-[9px] font-black uppercase tracking-tighter">{liveCard.placeName}</span><CloudSun size={12} /></div>
                                            <div className="p-2 md:p-3 flex justify-between items-center">
                                                <div><p className="text-lg md:text-xl font-black text-slate-800">{liveCard.temp}°</p><p className="text-[9px] font-bold text-stone-400">{liveCard.weather}</p></div>
                                                <button className="bg-slate-900 text-white p-2 rounded-xl active:scale-90 transition-all"><Navigation size={12}/></button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="px-4 md:px-6 py-2 flex flex-col gap-2 z-20">
                        {editingMessageId && (
                            <div className="bg-amber-50 border border-amber-200 p-2 md:p-3 rounded-2xl flex items-center justify-between animate-in slide-in-from-bottom-2">
                                <div className="flex items-center gap-2"><Edit2 size={14} className="text-amber-600" /><p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Editando mensaje...</p></div>
                                <button onClick={cancelEditing} className="text-stone-400 hover:text-red-500 p-1"><X size={16} /></button>
                            </div>
                        )}
                        {stagedAudio && (
                            <div className="bg-cyan-50 border border-cyan-200 p-2 md:p-3 rounded-2xl flex items-center gap-3 animate-in slide-in-from-bottom-2">
                                <button onClick={() => handlePlayAudio('staged', stagedAudio)} className="bg-cyan-600 text-white p-2 rounded-full shadow-md">{playingAudioId === 'staged' ? <Pause size={16} /> : <Play size={16} fill="currentColor" />}</button>
                                <div className="flex-1"><p className="text-[10px] font-black text-cyan-600 uppercase tracking-widest">Grabación lista</p></div>
                                <button onClick={() => setStagedAudio(null)} className="text-stone-400 hover:text-red-500 p-1"><Trash2 size={16} /></button>
                            </div>
                        )}
                        {!editingMessageId && (
                            <div className="flex gap-2 overflow-x-auto no-scrollbar">
                                {aiSuggestions.map((s, i) => (
                                    <button key={i} onClick={() => handleSendMessage(s)} className="whitespace-nowrap px-3 py-1.5 md:px-4 md:py-2 bg-white/80 border border-black/5 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-cyan-600 hover:text-white active:scale-95 transition-all flex items-center gap-2">
                                        <Sparkles size={10}/> {s}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="p-3 md:p-6 pt-0 z-20">
                        <div className="bg-white/90 backdrop-blur-2xl rounded-[1.8rem] md:rounded-[2.5rem] p-1 md:p-2 shadow-xl border border-black/5 flex items-center gap-1">
                            {!editingMessageId ? (
                                <button onClick={() => setIsActionMenuOpen(!isActionMenuOpen)} className={`p-3 md:p-4 rounded-full transition-all ${isActionMenuOpen ? 'bg-cyan-600 text-white rotate-45' : 'bg-stone-100 text-stone-500 active:scale-90'}`}><Plus size={22} /></button>
                            ) : (
                                <button onClick={cancelEditing} className="p-3 md:p-4 rounded-full bg-stone-100 text-stone-500 active:scale-90 transition-all"><X size={22} /></button>
                            )}
                            
                            <div className="flex-1 relative flex items-center">
                                {isProcessingVoice && (
                                    <div className="absolute inset-0 bg-white z-10 flex items-center gap-2 px-2">
                                        <div className="flex gap-0.5"><div className="w-1 h-3 bg-cyan-500 animate-bounce"></div><div className="w-1 h-5 bg-cyan-500 animate-bounce [animation-delay:0.1s]"></div><div className="w-1 h-4 bg-cyan-500 animate-bounce [animation-delay:0.2s]"></div></div>
                                        <span className="text-[9px] font-black uppercase text-cyan-600 animate-pulse">Analizando...</span>
                                    </div>
                                )}
                                <textarea value={inputText} onChange={e => setInputText(e.target.value)} placeholder={editingMessageId ? "Editar mensaje..." : (stagedAudio ? "Añadir descripción..." : "Mensaje...")} className="w-full bg-transparent py-3 md:py-4 px-2 outline-none text-slate-800 font-bold placeholder-stone-400 resize-none max-h-32 text-xs md:text-sm leading-tight" rows={1} />
                            </div>

                            <div className="flex gap-1 pr-1">
                                {!editingMessageId && (
                                    <button onClick={handleMicToggle} className={`p-3 md:p-4 rounded-full transition-all touch-none ${isRecording ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'bg-stone-100 text-stone-500 active:scale-90'}`}>
                                        {isRecording ? <div className="flex gap-0.5 items-center px-1"><div className="w-1 h-3 bg-white animate-pulse"></div><div className="w-1 h-5 bg-white animate-pulse"></div><span className="ml-1 text-[10px] font-black">{recordingDuration}s</span></div> : <Mic size={22} />}
                                    </button>
                                )}
                                <button onClick={() => handleSendMessage()} className={`p-3 md:p-4 rounded-full shadow-lg active:scale-90 transition-all ${editingMessageId ? 'bg-amber-500' : 'bg-cyan-600'} text-white`}>
                                    {editingMessageId ? <Check size={22} strokeWidth={3} /> : <Send size={22} />}
                                </button>
                            </div>
                        </div>

                        {isActionMenuOpen && !editingMessageId && (
                            <div className="absolute bottom-20 md:bottom-24 left-4 md:left-6 flex gap-3 animate-in slide-in-from-bottom-4">
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
                            const f = e.target.files?.[0]; if(f) { const b = await resizeImage(f, 800); setMediaPreview({type:'image', url:b}); setIsActionMenuOpen(false); handleSendMessage(); }
                        }} />
                    </div>
                </>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-stone-300 p-10 text-center">
                    <div className="bg-white/40 p-8 md:p-10 rounded-[2.5rem] md:rounded-[3rem] border border-white/50 animate-in zoom-in duration-500"><Brain className="w-12 h-12 md:w-16 md:h-16 opacity-10" /></div>
                    <h3 className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px] md:text-xs mt-6">Selecciona una conversación</h3>
                </div>
            )}
        </div>

        {/* LOGISTICA DRAWER */}
        {showLogistics && activeChatId && (
            <div className="fixed inset-0 md:relative md:inset-auto w-full md:w-[420px] bg-white border-l border-gray-100 flex flex-col animate-in slide-in-from-right-10 duration-300 z-[400] md:z-[40]">
                <div className="p-5 md:p-8 border-b border-gray-50 flex justify-between items-center bg-slate-900 text-white">
                    <div><h3 className="font-black text-lg md:text-xl leading-none">Logística</h3><p className="text-[8px] md:text-[10px] text-stone-400 uppercase font-black tracking-[0.2em] mt-2">Viaje Inteligente</p></div>
                    <button onClick={() => setShowLogistics(false)} className="bg-white/10 p-2 md:p-3 rounded-xl active:bg-white/20 transition-all"><X size={20}/></button>
                </div>

                <div className="flex border-b border-gray-50 bg-slate-50/50 p-1">
                    <button onClick={() => setLogisticsTab('checklist')} className={`flex-1 px-4 py-3 md:py-4 text-[9px] md:text-[10px] font-black uppercase rounded-xl transition-all ${logisticsTab === 'checklist' ? 'bg-white text-cyan-600 shadow-sm' : 'text-stone-400'}`}>Tareas</button>
                    <button onClick={() => setLogisticsTab('expenses')} className={`flex-1 px-4 py-3 md:py-4 text-[9px] md:text-[10px] font-black uppercase rounded-xl transition-all ${logisticsTab === 'expenses' ? 'bg-white text-cyan-600 shadow-sm' : 'text-stone-400'}`}>Gastos</button>
                    <button onClick={() => setLogisticsTab('vault')} className={`flex-1 px-4 py-3 md:py-4 text-[9px] md:text-[10px] font-black uppercase rounded-xl transition-all ${logisticsTab === 'vault' ? 'bg-white text-cyan-600 shadow-sm' : 'text-stone-400'}`}>Fotos</button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50/30 no-scrollbar">
                    {logisticsTab === 'checklist' && (
                        <div className="space-y-4 animate-in fade-in">
                            <div className="flex gap-2">
                                <input placeholder="Nueva tarea..." className="flex-1 p-3 bg-white rounded-xl text-xs font-bold border border-stone-100 outline-none" value={newItemText} onChange={e => setNewItemText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddChecklistItem(newItemText)} />
                                <button onClick={() => handleAddChecklistItem(newItemText)} className="bg-cyan-600 text-white p-3 rounded-xl"><Plus size={18}/></button>
                            </div>
                            <div className="space-y-2">
                                {checklist.map(item => (
                                    <div key={item.id} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-stone-100 group">
                                        <button onClick={() => toggleChecklistItem(item.id)} className={`transition-colors ${item.completed ? 'text-green-500' : 'text-stone-300'}`}>{item.completed ? <CheckSquare size={18} /> : <Square size={18} className="opacity-20" />}</button>
                                        <span className={`flex-1 text-xs font-bold ${item.completed ? 'line-through text-stone-300' : 'text-slate-700'}`}>{item.text}</span>
                                        <button onClick={() => removeChecklistItem(item.id)} className="opacity-0 group-hover:opacity-100 text-stone-300 hover:text-red-500"><Trash2 size={14}/></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {logisticsTab === 'expenses' && currentChatObj && (
                        <div className="space-y-4 animate-in fade-in pb-10">
                            
                            {/* RESUMEN DE SALDOS INDIVIDUALES */}
                            <div className="bg-white p-5 rounded-[2rem] border border-stone-100 shadow-sm mb-4">
                                <h4 className="text-[10px] font-black uppercase text-stone-400 tracking-widest mb-4 flex items-center gap-2"><PieChart size={14} className="text-manabi-600" /> Saldos por Integrante</h4>
                                <div className="space-y-3">
                                    {Object.entries(userBalances).map(([uid, balance]) => {
                                        const u = allUsers.find(user => user.id === uid);
                                        return (
                                            <div key={uid} className="flex items-center justify-between group">
                                                <div className="flex items-center gap-2">
                                                    <img src={u?.avatar} className="w-8 h-8 rounded-full object-cover border border-stone-100" />
                                                    <div>
                                                        <p className="text-xs font-black text-slate-800">{u?.name}</p>
                                                        <p className="text-[8px] text-stone-400 uppercase">Total a pagar</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-black text-manabi-600">${balance.toFixed(2)}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="mt-4 pt-4 border-t border-stone-50 flex justify-between items-center">
                                    <span className="text-[10px] font-black text-stone-400">TOTAL GRUPAL</span>
                                    <span className="text-lg font-black text-slate-800">${totalExpenses.toFixed(2)}</span>
                                </div>
                            </div>

                            {/* GESTIÓN DE GRUPOS DE GASTOS */}
                            <div className="bg-cyan-50/50 p-5 rounded-[2rem] border border-cyan-100/50">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="text-[10px] font-black uppercase text-cyan-600 tracking-widest flex items-center gap-2"><Users size={14} /> Grupos de Gastos</h4>
                                    <button 
                                        onClick={() => setShowGroupCreator(!showGroupCreator)}
                                        className="p-1.5 bg-white rounded-lg text-cyan-600 shadow-sm border border-cyan-100 active:scale-90 transition-transform"
                                    >
                                        <Plus size={16} />
                                    </button>
                                </div>

                                {showGroupCreator && (
                                    <div className="bg-white p-4 rounded-2xl border border-cyan-100 mb-4 animate-in slide-in-from-top-2">
                                        <input 
                                            placeholder="Nombre del grupo (ej: Solo chicos)" 
                                            className="w-full p-3 bg-stone-50 rounded-xl text-xs font-bold mb-3 outline-none focus:ring-2 focus:ring-cyan-500" 
                                            value={newGroupName}
                                            onChange={e => setNewGroupName(e.target.value)}
                                        />
                                        <p className="text-[9px] font-black text-stone-400 uppercase mb-2">Seleccionar integrantes:</p>
                                        <div className="flex flex-wrap gap-1.5 mb-4">
                                            {currentChatObj.participants.map(uid => {
                                                const u = allUsers.find(user => user.id === uid);
                                                const isSel = newGroupMembers.includes(uid);
                                                return (
                                                    <button 
                                                        key={uid} 
                                                        onClick={() => toggleMemberInNewGroup(uid)}
                                                        className={`px-2 py-1.5 rounded-lg text-[9px] font-black transition-all ${isSel ? 'bg-cyan-600 text-white' : 'bg-stone-100 text-stone-500'}`}
                                                    >
                                                        {u?.name}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => setShowGroupCreator(false)} className="flex-1 py-2 text-[10px] font-black text-stone-400 uppercase">Cancelar</button>
                                            <button onClick={handleCreateExpenseGroup} className="flex-1 py-2 bg-cyan-600 text-white rounded-xl text-[10px] font-black uppercase shadow-lg">Crear</button>
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-2 overflow-x-auto no-scrollbar">
                                    {expenseGroups.map(eg => (
                                        <div key={eg.id} className="shrink-0 bg-white px-3 py-2 rounded-xl border border-cyan-100 flex items-center gap-2">
                                            <span className="text-[10px] font-black text-cyan-700">{eg.name}</span>
                                            <span className="bg-cyan-50 text-[8px] font-black text-cyan-600 px-1.5 py-0.5 rounded-md">{eg.memberIds.length} pers</span>
                                        </div>
                                    ))}
                                    {expenseGroups.length === 0 && !showGroupCreator && (
                                        <p className="text-[10px] font-bold text-stone-400 italic">No hay grupos creados</p>
                                    )}
                                </div>
                            </div>

                            {/* FORMULARIO DE GASTO INTELIGENTE */}
                            <div className="bg-white p-5 rounded-[2rem] border border-stone-100 shadow-sm">
                                <h4 className="text-[10px] font-black uppercase text-stone-400 tracking-widest mb-4">Añadir Nuevo Gasto</h4>
                                <div className="space-y-3">
                                    <input 
                                        placeholder="Descripción (ej: Pizza Manta)" 
                                        className="w-full p-3 bg-stone-50 rounded-xl text-xs font-bold outline-none border border-transparent focus:border-manabi-300"
                                        value={newExpenseDesc}
                                        onChange={e => setNewExpenseDesc(e.target.value)}
                                    />
                                    <div className="flex gap-2">
                                        <div className="flex-1 relative">
                                            <DollarSign size={14} className="absolute left-3 top-3.5 text-stone-400" />
                                            <input 
                                                type="number" 
                                                placeholder="Monto" 
                                                className="w-full pl-8 p-3 bg-stone-50 rounded-xl text-xs font-black outline-none"
                                                value={newExpenseAmount}
                                                onChange={e => setNewExpenseAmount(e.target.value)}
                                            />
                                        </div>
                                        <button onClick={handleAddExpense} className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-200">Añadir</button>
                                    </div>
                                    
                                    <div className="pt-2">
                                        <p className="text-[9px] font-black text-stone-400 uppercase mb-2">¿Cómo se divide?</p>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => setExpenseTargetType('all')}
                                                className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase border transition-all ${expenseTargetType === 'all' ? 'bg-manabi-600 text-white border-manabi-600' : 'bg-white text-stone-400 border-stone-200'}`}
                                            >
                                                Todos
                                            </button>
                                            <button 
                                                onClick={() => setExpenseTargetType('custom')}
                                                className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase border transition-all ${expenseTargetType === 'custom' ? 'bg-manabi-600 text-white border-manabi-600' : 'bg-white text-stone-400 border-stone-200'}`}
                                            >
                                                Integrantes...
                                            </button>
                                        </div>

                                        {expenseTargetType === 'custom' && (
                                            <div className="mt-3 animate-in fade-in slide-in-from-top-1">
                                                <div className="flex flex-wrap gap-1.5 mb-3">
                                                    {currentChatObj.participants.map(uid => {
                                                        const u = allUsers.find(user => user.id === uid);
                                                        const isSelected = selectedExpenseMembers.includes(uid);
                                                        return (
                                                            <button 
                                                                key={uid} 
                                                                onClick={() => toggleMemberInExpense(uid)}
                                                                className={`px-2 py-1.5 rounded-lg text-[8px] font-black uppercase border transition-all ${isSelected ? 'bg-amber-100 text-amber-700 border-amber-300' : 'bg-stone-50 text-stone-400 border-stone-100'}`}
                                                            >
                                                                {u?.name}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                                {expenseGroups.length > 0 && (
                                                    <div className="bg-stone-50 p-2 rounded-xl">
                                                        <p className="text-[8px] font-black text-stone-400 uppercase mb-1.5">Usar grupo rápido:</p>
                                                        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
                                                            {expenseGroups.map(eg => (
                                                                <button 
                                                                    key={eg.id} 
                                                                    onClick={() => setSelectedExpenseMembers(eg.memberIds)}
                                                                    className="shrink-0 bg-white px-2 py-1 rounded-md text-[8px] font-bold text-cyan-600 border border-cyan-100 shadow-sm"
                                                                >
                                                                    {eg.name}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* LISTADO DE GASTOS */}
                            <div className="space-y-2">
                                {expenses.map(exp => (
                                    <div key={exp.id} className="bg-white p-4 rounded-3xl border border-stone-100 flex justify-between items-center group">
                                        <div className="min-w-0">
                                            <h5 className="text-xs font-black text-slate-800 truncate">{exp.desc}</h5>
                                            <div className="flex items-center gap-1.5 mt-1">
                                                <span className="text-[8px] font-black text-stone-400 uppercase">{getSenderName(exp.payerId)} pagó</span>
                                                <span className="w-1 h-1 bg-stone-200 rounded-full"></span>
                                                <span className="text-[8px] font-black text-emerald-600 uppercase">{exp.targetMemberIds.length} participan</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-black text-slate-800">${exp.amount.toFixed(2)}</span>
                                            <button onClick={() => removeExpense(exp.id)} className="p-1.5 text-stone-200 hover:text-red-500 transition-colors"><Trash2 size={14}/></button>
                                        </div>
                                    </div>
                                ))}
                                {expenses.length === 0 && (
                                    <div className="py-10 text-center text-stone-300">
                                        <Calculator size={32} className="opacity-10 mx-auto mb-2" />
                                        <p className="text-[10px] font-black uppercase tracking-widest">Sin historial de gastos</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {logisticsTab === 'vault' && (
                        <div className="animate-in fade-in">
                            <div className="flex items-center gap-2 mb-4"><History size={14} className="text-cyan-600" /><h4 className="text-[10px] font-black uppercase text-stone-400">Galería del Chat ({vaultImages.length})</h4></div>
                            <div className="grid grid-cols-3 gap-2">
                                {vaultImages.map((img, i) => (<img key={i} src={img} onClick={() => setViewingImage(img)} className="w-full aspect-square object-cover rounded-xl shadow-sm border border-white hover:scale-105 transition-transform cursor-pointer" />))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* IMAGE VIEWER OVERLAY */}
        {viewingImage && (
            <div className="fixed inset-0 z-[500] bg-black/95 flex flex-col items-center justify-center animate-in fade-in duration-200" onClick={() => setViewingImage(null)}>
                <div className="absolute top-4 right-4 flex gap-4 z-[510]">
                    <button onClick={(e) => { e.stopPropagation(); downloadMedia(viewingImage, `chat-photo-${Date.now()}.jpg`); }} className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-all border border-white/10"><Download size={24} /></button>
                    <button onClick={() => setViewingImage(null)} className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-all border border-white/10"><X size={24} /></button>
                </div>
                <img src={viewingImage} className="max-w-full max-h-full object-contain select-none p-4" onClick={(e) => e.stopPropagation()} alt="Chat detail" />
            </div>
        )}
      </div>
    </div>
  );
};
