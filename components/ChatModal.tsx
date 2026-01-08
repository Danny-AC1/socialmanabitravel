
import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Send, Lock, ChevronLeft, Search, Image as ImageIcon, 
  Mic, Paperclip, Trash2, Check, CheckCheck, 
  Play, Video, Reply as ReplyIcon, Edit2, AlertTriangle, User as UserIcon
} from 'lucide-react';
import { User, Chat, Message } from '../types';
import { StorageService } from '../services/storageService';
import { EncryptionService } from '../services/encryptionService';
import { db } from '../services/firebase';
import { onValue, ref } from 'firebase/database';
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
  // --- STATES ---
  const [activeChatId, setActiveChatId] = useState<string | null>(initialChatId || null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  
  // Input & Search
  const [inputText, setInputText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Media & Reply & Actions
  const [mediaPreview, setMediaPreview] = useState<{type: 'image'|'video'|'audio', url: string} | null>(null);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null); 
  const [isEditingId, setIsEditingId] = useState<string | null>(null); 
  
  // Chat Deletion (Long Press)
  const [chatToDelete, setChatToDelete] = useState<Chat | null>(null);
  
  // Recording States
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);
  const prevChatIdRef = useRef<string | null>(null); 
  const longPressTimerRef = useRef<any>(null); 

  // Swipe States
  const [swipeStartX, setSwipeStartX] = useState<number | null>(null);
  const [swipedMessageId, setSwipedMessageId] = useState<string | null>(null);

  // --- HELPERS ---

  const getChatPartner = (chat: Chat) => {
    const partnerId = chat.participants.find(id => id !== currentUser.id);
    return allUsers.find(u => u.id === partnerId);
  };

  const getSenderName = (id: string) => {
      return id === currentUser.id ? 'Tú' : allUsers.find(u => u.id === id)?.name || 'Usuario';
  };

  const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleChatPressStart = (chat: Chat) => {
      longPressTimerRef.current = setTimeout(() => {
          setChatToDelete(chat);
          if (navigator.vibrate) navigator.vibrate(50);
      }, 800);
  };

  const handleChatPressEnd = () => {
      if (longPressTimerRef.current) {
          clearTimeout(longPressTimerRef.current);
          longPressTimerRef.current = null;
      }
  };

  const handleConfirmDeleteChat = async () => {
      if (chatToDelete) {
          await StorageService.deleteChat(chatToDelete.id);
          if (activeChatId === chatToDelete.id) {
              setActiveChatId(null);
          }
          setChatToDelete(null);
      }
  };

  // --- EFFECTS ---

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
      } else {
        setChats([]);
      }
    });
  }, [isOpen, currentUser.id]);

  useEffect(() => {
    if (!activeChatId) {
      setMessages([]);
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
        
        setMessages(loadedMessages.sort((a, b) => a.timestamp - b.timestamp));
        
        if (loadedMessages.some(m => !m.isRead && m.senderId !== currentUser.id)) {
           StorageService.markChatAsRead(activeChatId, currentUser.id);
        }
      } else {
        setMessages([]);
      }
    });
  }, [activeChatId]);

  useEffect(() => {
    if (messagesEndRef.current && !selectedMessage) {
      const isChatSwitch = prevChatIdRef.current !== activeChatId;
      messagesEndRef.current.scrollIntoView({ 
          behavior: isChatSwitch ? "auto" : "smooth" 
      });
      if (messages.length > 0) {
          prevChatIdRef.current = activeChatId;
      }
    }
  }, [messages, mediaPreview, replyTo, activeChatId]);

  useEffect(() => {
    if (initialChatId) setActiveChatId(initialChatId);
  }, [initialChatId]);

  if (!isOpen) return null;

  const handleStartChat = async (targetUserId: string) => {
    const chatId = await StorageService.initiateChat(currentUser.id, targetUserId);
    setActiveChatId(chatId);
    setSearchTerm('');
  };

  const handleSendMessage = async () => {
    if ((!inputText.trim() && !mediaPreview) || !activeChatId) return;

    if (isEditingId) {
        try {
            await StorageService.editMessage(activeChatId, isEditingId, inputText);
            setIsEditingId(null);
            setInputText('');
        } catch (e) {
            alert("Error al editar mensaje");
        }
        return;
    }

    let type: 'text' | 'image' | 'video' | 'audio' = 'text';
    let content = inputText;
    let url = null;

    if (mediaPreview) {
        type = mediaPreview.type;
        url = mediaPreview.url;
        if (!content.trim()) content = '';
    }

    const replyData = replyTo ? {
        id: replyTo.id,
        text: replyTo.type === 'text' ? replyTo.text : `[${replyTo.type}]`,
        senderName: getSenderName(replyTo.senderId),
        type: replyTo.type
    } : undefined;

    try {
        await StorageService.sendMessage(activeChatId, currentUser.id, content, type, url, replyData);
        setInputText('');
        setMediaPreview(null);
        setReplyTo(null);
    } catch (e: any) {
        console.error("Send Error:", e);
        alert("Error enviando mensaje: " + (e.message || "Desconocido"));
    }
  };

  const handleDeleteMessage = async () => {
    if (!activeChatId || !selectedMessage) return;
    if (confirm("¿Eliminar mensaje para ambos?")) {
        await StorageService.deleteMessage(activeChatId, selectedMessage.id);
        setSelectedMessage(null);
    }
  };

  const handleEditMessage = () => {
    if (!selectedMessage) return;
    setInputText(selectedMessage.text);
    setIsEditingId(selectedMessage.id);
    setSelectedMessage(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
        if (file.type.startsWith('video/')) {
            const base64 = await validateVideo(file);
            setMediaPreview({ type: 'video', url: base64 });
        } else {
            const base64 = await resizeImage(file, 800);
            setMediaPreview({ type: 'image', url: base64 });
        }
    } catch (err: any) {
        alert(err.message);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const startRecording = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        audioChunksRef.current = [];
        
        recorder.ondataavailable = (e) => {
            if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };

        mediaRecorderRef.current = recorder;
        recorder.start();
        setIsRecording(true);
        setRecordingDuration(0);
        
        recordingTimerRef.current = setInterval(() => {
            setRecordingDuration(prev => prev + 1);
        }, 1000);

    } catch (err) {
        alert("No se pudo acceder al micrófono.");
    }
  };

  const stopRecording = (shouldSave: boolean) => {
    if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
        clearInterval(recordingTimerRef.current);
        if (shouldSave) {
            setTimeout(() => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const reader = new FileReader();
                reader.readAsDataURL(audioBlob);
                reader.onloadend = () => {
                    const base64Audio = reader.result as string;
                    setMediaPreview({ type: 'audio', url: base64Audio });
                };
            }, 200);
        }
    }
    setIsRecording(false);
  };

  const handleRecordStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault(); 
    startRecording();
  };

  const handleRecordEnd = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    stopRecording(true);
  };

  const handleSwipeStart = (e: React.TouchEvent, msg: Message) => {
    setSwipeStartX(e.targetTouches[0].clientX);
    setSwipedMessageId(msg.id);
  };

  const handleSwipeMove = (_e: React.TouchEvent) => {
    if (swipeStartX === null) return;
  };

  const handleSwipeEnd = (e: React.TouchEvent, msg: Message) => {
    if (swipeStartX === null) return;
    const endX = e.changedTouches[0].clientX;
    if (endX - swipeStartX > 50) { 
        setReplyTo(msg);
    }
    setSwipeStartX(null);
    setSwipedMessageId(null);
  };

  const filteredUsers = searchTerm 
    ? allUsers.filter(u => u.id !== currentUser.id && u.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : [];

  const activePartner = activeChatId 
    ? getChatPartner(chats.find(c => c.id === activeChatId) || { participants: activeChatId.split('_') } as Chat) 
    : null;

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/60 backdrop-blur-sm p-0 md:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full h-full md:max-w-5xl md:h-[90vh] md:rounded-3xl overflow-hidden shadow-2xl flex flex-row relative">
        
        {/* DELETE CONFIRMATION OVERLAY */}
        {chatToDelete && (
            <div className="absolute inset-0 z-[500] bg-black/50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                    <div className="p-6 text-center">
                        <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                            <AlertTriangle className="text-red-600" size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">¿Eliminar Chat?</h3>
                        <p className="text-sm text-gray-500 mb-6">
                            Se eliminará la conversación con <strong>{getChatPartner(chatToDelete)?.name}</strong>. Esta acción no se puede deshacer.
                        </p>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => setChatToDelete(null)}
                                className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={handleConfirmDeleteChat}
                                className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors"
                            >
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* ACTION SHEET / MENU */}
        {selectedMessage && (
            <div className="absolute inset-0 z-[450] bg-black/50 flex items-center justify-center p-4 animate-in fade-in duration-150" onClick={() => setSelectedMessage(null)}>
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
                    <div className="p-4 bg-gray-50 border-b">
                        <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Opciones de Mensaje</p>
                        <p className="text-sm text-gray-700 truncate mt-1 italic">"{selectedMessage.text || 'Archivo multimedia'}"</p>
                    </div>
                    <div className="flex flex-col">
                        {selectedMessage.type === 'text' && (
                            <button onClick={handleEditMessage} className="p-4 text-left hover:bg-gray-100 flex items-center gap-3 text-gray-700 font-bold border-b border-gray-100 transition-colors">
                                <Edit2 size={20} /> Editar mensaje
                            </button>
                        )}
                        <button onClick={handleDeleteMessage} className="p-4 text-left hover:bg-red-50 flex items-center gap-3 text-red-600 font-bold transition-colors">
                            <Trash2 size={20} /> Eliminar para todos
                        </button>
                    </div>
                    <div className="p-3 bg-gray-50">
                        <button onClick={() => setSelectedMessage(null)} className="w-full py-3 rounded-xl text-center text-gray-500 font-bold hover:bg-gray-200 transition-colors bg-white border border-gray-200">
                            Cancelar
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* LEFT SIDEBAR (CHATS LIST) */}
        <div className={`w-full md:w-[350px] bg-white border-r border-gray-200 flex flex-col ${activeChatId ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b border-gray-100 flex items-center gap-3 bg-white sticky top-0 z-10">
             <button onClick={onClose} className="text-gray-500 p-1 hover:bg-gray-100 rounded-full"><ChevronLeft size={28} /></button>
             <div className="flex-1 relative bg-gray-100 rounded-2xl h-12 flex items-center px-4 overflow-hidden focus-within:ring-2 focus-within:ring-cyan-500 transition-all">
                <Search size={18} className="text-stone-400 mr-2" />
                <input 
                   className="bg-transparent outline-none w-full text-sm text-gray-700 placeholder-gray-400 font-medium"
                   placeholder="Buscar chats o personas..."
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                />
             </div>
          </div>

          <div className="flex-1 overflow-y-auto">
             {searchTerm ? (
                <div className="p-2 space-y-1">
                   {filteredUsers.map(u => (
                      <div key={u.id} onClick={() => handleStartChat(u.id)} className="flex items-center gap-4 p-4 hover:bg-gray-50 rounded-2xl cursor-pointer transition-colors border border-transparent hover:border-stone-100">
                         <img src={u.avatar} className="w-12 h-12 rounded-2xl object-cover shadow-sm" />
                         <span className="font-bold text-gray-800">{u.name}</span>
                      </div>
                   ))}
                   {filteredUsers.length === 0 && (
                       <div className="p-10 text-center text-stone-400">
                           <Search size={32} className="mx-auto mb-2 opacity-20" />
                           <p className="text-xs font-bold">No encontramos a nadie con ese nombre.</p>
                       </div>
                   )}
                </div>
             ) : (
                <div className="select-none divide-y divide-stone-50">
                   {chats.map(chat => {
                      const partner = getChatPartner(chat);
                      if (!partner) return null;
                      const isActive = activeChatId === chat.id;
                      const decryptedLastMsg = chat.lastMessage ? EncryptionService.decrypt(chat.lastMessage, chat.id) : '';
                      
                      return (
                         <div 
                            key={chat.id} 
                            onClick={() => setActiveChatId(chat.id)}
                            onMouseDown={() => handleChatPressStart(chat)}
                            onMouseUp={handleChatPressEnd}
                            onMouseLeave={handleChatPressEnd}
                            onTouchStart={() => handleChatPressStart(chat)}
                            onTouchEnd={handleChatPressEnd}
                            onTouchMove={handleChatPressEnd}
                            onContextMenu={(e) => e.preventDefault()}
                            className={`flex items-center gap-4 p-4 cursor-pointer transition-colors relative hover:bg-gray-50 active:bg-gray-100 ${isActive ? 'bg-cyan-50/50' : ''}`}
                         >
                            <div className="relative shrink-0">
                               <img src={partner.avatar} className="w-14 h-14 rounded-2xl object-cover pointer-events-none shadow-sm border border-white" />
                               <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                            </div>
                            <div className="flex-1 min-w-0">
                               <div className="flex justify-between items-baseline mb-0.5">
                                  <h4 className="font-bold text-gray-900 truncate text-sm">{partner.name}</h4>
                                  <span className="text-[10px] text-stone-400 font-bold">{new Date(chat.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                               </div>
                               <div className="flex items-center gap-1">
                                  <p className="text-xs text-stone-500 truncate flex-1 leading-tight">
                                     {decryptedLastMsg || 'Toca para chatear...'}
                                  </p>
                               </div>
                            </div>
                         </div>
                      );
                   })}
                   {chats.length === 0 && (
                       <div className="p-16 text-center text-stone-300">
                           <ImageIcon size={48} className="mx-auto mb-4 opacity-10" />
                           <p className="text-xs font-bold uppercase tracking-widest">Tus chats aparecerán aquí</p>
                       </div>
                   )}
                </div>
             )}
          </div>
        </div>

        {/* RIGHT SIDE (MESSAGES AREA) */}
        <div className={`flex-1 bg-[#f4f7f6] flex flex-col relative ${!activeChatId ? 'hidden md:flex' : 'flex'}`}>
           
           <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
              backgroundImage: `url("https://www.transparenttextures.com/patterns/cubes.png")`, 
              backgroundSize: '200px'
           }} />

           {activeChatId && activePartner ? (
              <>
                 {/* Chat Header */}
                 <div className="bg-white/80 backdrop-blur-md p-3 px-5 flex items-center justify-between shadow-sm z-20 sticky top-0 border-b border-stone-100">
                    <div className="flex items-center gap-4">
                       <button onClick={(e) => { e.stopPropagation(); setActiveChatId(null); }} className="md:hidden text-stone-500 p-2 -ml-2 hover:bg-gray-100 rounded-full"><ChevronLeft size={28} /></button>
                       <img src={activePartner.avatar} className="w-10 h-10 rounded-xl object-cover shadow-sm border border-stone-100" />
                       <div className="flex flex-col">
                          <h3 className="font-bold text-gray-900 text-sm leading-none mb-1">{activePartner.name}</h3>
                          <div className="flex items-center text-[10px] text-cyan-600 gap-1 font-bold uppercase tracking-wider"><Lock size={10} /> Privado</div>
                       </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="hidden md:flex p-2.5 bg-stone-100 text-stone-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all duration-200">
                            <X size={22} />
                        </button>
                    </div>
                 </div>

                 {/* Messages List */}
                 <div className="flex-1 overflow-y-auto p-4 space-y-3 z-10 scroll-smooth" ref={messagesEndRef}>
                    {messages.map((msg, idx) => {
                       const isMe = msg.senderId === currentUser.id;
                       const showTail = idx === messages.length - 1 || messages[idx + 1]?.senderId !== msg.senderId;
                       
                       return (
                          <div 
                             key={msg.id} 
                             className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} group relative select-none`}
                             onTouchStart={(e) => handleSwipeStart(e, msg)}
                             onTouchMove={handleSwipeMove}
                             onTouchEnd={(e) => handleSwipeEnd(e, msg)}
                             onClick={() => isMe ? setSelectedMessage(msg) : null}
                          >
                             <div 
                                className={`max-w-[85%] md:max-w-[70%] relative shadow-sm text-sm p-1.5 transition-all
                                   ${isMe 
                                      ? 'bg-cyan-600 text-white rounded-2xl rounded-tr-sm' 
                                      : 'bg-white text-gray-800 rounded-2xl rounded-tl-sm border border-stone-100'
                                   }
                                   ${!showTail && isMe ? 'rounded-tr-2xl mb-1' : ''}
                                   ${!showTail && !isMe ? 'rounded-tl-2xl mb-1' : ''}
                                   ${showTail ? 'mb-4' : ''}
                                   ${swipedMessageId === msg.id ? 'translate-x-10' : ''}
                                   active:scale-[0.98]
                                `}
                             >
                                {msg.replyTo && (
                                   <div className={`mx-1.5 mt-1 px-3 py-2 rounded-xl border-l-4 mb-2 cursor-pointer bg-black/5 ${isMe ? 'border-white/40' : 'border-cyan-500'}`}>
                                      <p className={`font-black text-[10px] uppercase tracking-wider mb-0.5 ${isMe ? 'text-white/80' : 'text-cyan-700'}`}>{msg.replyTo.senderName}</p>
                                      <p className={`text-xs truncate ${isMe ? 'text-white/70' : 'text-gray-500'}`}>{msg.replyTo.text}</p>
                                   </div>
                                )}

                                <div className="px-2 pb-5 min-w-[80px]">
                                   {msg.type === 'image' && msg.mediaUrl && (
                                      <div className="relative rounded-xl overflow-hidden mb-1.5 group/media shadow-inner border border-black/5">
                                          <img src={msg.mediaUrl} className="max-w-full block hover:scale-105 transition-transform duration-500" alt="Media" />
                                      </div>
                                   )}
                                   {msg.type === 'video' && msg.mediaUrl && (
                                      <video src={msg.mediaUrl} controls className="rounded-xl mb-1.5 max-w-full shadow-sm" />
                                   )}
                                   {msg.type === 'audio' && msg.mediaUrl && (
                                      <div className={`flex items-center gap-3 my-2 p-2.5 rounded-2xl shadow-sm ${isMe ? 'bg-cyan-700/50' : 'bg-stone-50'}`}>
                                         <button className={`p-3 rounded-full shadow-md ${isMe ? 'bg-white text-cyan-600' : 'bg-cyan-600 text-white'}`}>
                                            <Play size={18} fill="currentColor" />
                                         </button>
                                         <div className="flex-1 space-y-1">
                                            <div className={`h-1 rounded-full w-full ${isMe ? 'bg-white/20' : 'bg-cyan-100'}`}>
                                                <div className={`h-full rounded-full w-1/3 ${isMe ? 'bg-white' : 'bg-cyan-600'}`}></div>
                                            </div>
                                            <div className="flex justify-between items-center px-0.5">
                                                <span className={`text-[9px] font-black ${isMe ? 'text-white/60' : 'text-stone-400'}`}>NOTA DE VOZ</span>
                                                <audio src={msg.mediaUrl} className="hidden" />
                                            </div>
                                         </div>
                                      </div>
                                   )}
                                   {msg.text && <p className="whitespace-pre-wrap leading-relaxed px-1 font-medium">{msg.text}</p>}
                                </div>

                                <div className="absolute bottom-1.5 right-3 flex items-center gap-1.5 select-none">
                                   <span className={`text-[9px] font-bold ${isMe ? 'text-white/60' : 'text-stone-400'}`}>
                                      {new Date(msg.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                   </span>
                                   {isMe && (
                                      msg.isRead 
                                      ? <CheckCheck size={14} className="text-cyan-200" />
                                      : <Check size={14} className="text-white/40" />
                                   )}
                                </div>

                                <button 
                                    onClick={(e) => { e.stopPropagation(); setReplyTo(msg); }}
                                    className={`absolute top-1/2 -translate-y-1/2 ${isMe ? '-left-12' : '-right-12'} p-2.5 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 active:scale-90 text-stone-500 border border-stone-100`}
                                >
                                    <ReplyIcon size={18} />
                                </button>
                             </div>
                          </div>
                       );
                    })}
                    <div ref={messagesEndRef} />
                 </div>

                 {/* Input Area */}
                 <div className="bg-white p-2 md:p-4 z-20 border-t border-stone-100 shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
                    
                    {/* Editing / Reply / Media Context Overlays */}
                    <div className="space-y-1 mb-2">
                        {isEditingId && (
                        <div className="bg-cyan-50 px-4 py-3 rounded-2xl flex justify-between items-center border border-cyan-100 animate-in slide-in-from-bottom-2">
                            <div className="flex items-center gap-3">
                                <Edit2 size={20} className="text-cyan-600" />
                                <p className="text-cyan-700 font-bold text-xs uppercase tracking-wider">Modo Edición</p>
                            </div>
                            <button onClick={() => { setIsEditingId(null); setInputText(''); }} className="p-1 hover:bg-cyan-100 rounded-full"><X size={18} className="text-cyan-400" /></button>
                        </div>
                        )}

                        {replyTo && !isEditingId && (
                        <div className="flex items-center justify-between px-4 py-3 bg-stone-50 rounded-2xl border border-stone-200 animate-in slide-in-from-bottom-2">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="border-l-4 border-cyan-600 pl-3">
                                    <p className="text-cyan-600 font-black text-[10px] uppercase tracking-widest">Respuesta a {getSenderName(replyTo.senderId)}</p>
                                    <p className="text-stone-500 text-xs truncate max-w-[250px] font-medium">{replyTo.type === 'text' ? replyTo.text : 'Archivo adjunto'}</p>
                                </div>
                            </div>
                            <button onClick={() => setReplyTo(null)} className="p-1 hover:bg-stone-200 rounded-full"><X size={18} className="text-stone-400" /></button>
                        </div>
                        )}

                        {mediaPreview && (
                        <div className="px-4 py-3 bg-cyan-50/50 rounded-2xl border border-cyan-100 flex justify-between items-center animate-in slide-in-from-bottom-2">
                            <div className="flex gap-4 items-center">
                                <div className="bg-white p-2 rounded-xl shadow-sm">
                                    {mediaPreview.type === 'video' ? <Video size={20} className="text-cyan-600" /> : mediaPreview.type === 'audio' ? <Mic size={20} className="text-red-500" /> : <ImageIcon size={20} className="text-cyan-600" />}
                                </div>
                                <div>
                                    <span className="text-xs font-black text-stone-700 block uppercase tracking-wider">
                                        {mediaPreview.type === 'audio' ? 'Nota de voz' : 'Multimedia listo'}
                                    </span>
                                    <span className="text-[10px] text-stone-500 font-bold uppercase">Pulsa enviar para confirmar</span>
                                </div>
                            </div>
                            <button onClick={() => setMediaPreview(null)} className="p-2 bg-red-50 text-red-500 hover:bg-red-100 rounded-xl transition-colors"><Trash2 size={20} /></button>
                        </div>
                        )}
                    </div>

                    <div className="flex items-end gap-2">
                       {!isRecording && (
                           <div className="flex">
                               <button onClick={() => fileInputRef.current?.click()} className="p-3.5 text-stone-400 hover:text-cyan-600 hover:bg-stone-50 rounded-2xl transition-all active:scale-90">
                                  <Paperclip size={24} className="rotate-45" />
                               </button>
                               <input type="file" ref={fileInputRef} hidden accept="image/*,video/*" onChange={handleFileUpload} />
                           </div>
                       )}

                       <div className="flex-1 relative">
                           {isRecording ? (
                              <div className={`w-full h-[52px] flex items-center px-5 rounded-2xl transition-all duration-300 bg-red-50 border border-red-100`}>
                                 <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-3 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
                                 <span className={`font-mono font-black text-red-600 text-lg`}>
                                    {formatTime(recordingDuration)}
                                 </span>
                                 <span className="ml-auto text-[10px] text-red-400 uppercase font-black tracking-widest animate-pulse">
                                    Grabando...
                                 </span>
                              </div>
                           ) : (
                              <textarea
                                 value={inputText}
                                 onChange={(e) => setInputText(e.target.value)}
                                 placeholder={isEditingId ? "Escribe el nuevo texto..." : "Escribe tu mensaje..."}
                                 className="w-full bg-stone-100 max-h-32 min-h-[52px] py-3.5 px-5 rounded-2xl outline-none text-stone-800 resize-none overflow-y-auto leading-relaxed font-medium placeholder-stone-400 focus:bg-stone-50 focus:ring-2 focus:ring-cyan-500/10 transition-all border border-transparent focus:border-stone-200"
                                 rows={1}
                                 onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey && !isRecording) {
                                       e.preventDefault();
                                       handleSendMessage();
                                    }
                                 }}
                              />
                           )}
                       </div>

                       {(inputText.trim() || mediaPreview) && !isRecording ? (
                          <button 
                             onClick={() => handleSendMessage()}
                             type="button"
                             className="p-4 bg-cyan-600 hover:bg-cyan-700 text-white rounded-2xl shadow-lg shadow-cyan-200 transition-all active:scale-90 duration-200 flex items-center justify-center mb-0.5"
                          >
                             {isEditingId ? <Check size={22} strokeWidth={3} /> : <Send size={22} className="ml-0.5" strokeWidth={3} />}
                          </button>
                       ) : (
                          <div
                             className={`p-4 rounded-2xl shadow-lg mb-0.5 transition-all duration-300 cursor-pointer touch-none select-none flex items-center justify-center ${
                                isRecording 
                                   ? 'bg-red-500 text-white scale-110 shadow-red-200' 
                                   : 'bg-cyan-600 text-white hover:bg-cyan-700 shadow-cyan-200'
                             }`}
                             onMouseDown={handleRecordStart}
                             onTouchStart={handleRecordStart}
                             onMouseUp={handleRecordEnd}
                             onTouchEnd={handleRecordEnd}
                          >
                             <Mic size={24} strokeWidth={2.5} />
                          </div>
                       )}
                    </div>
                 </div>
              </>
           ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-stone-300 p-10 text-center">
                 <div className="bg-white/50 backdrop-blur-sm p-8 rounded-3xl mb-6 shadow-sm border border-stone-100">
                    <UserIcon size={56} className="opacity-10 text-stone-900" />
                 </div>
                 <h3 className="text-stone-400 font-black uppercase tracking-widest text-sm mb-2">Mensajería Segura</h3>
                 <p className="text-stone-400/60 text-xs max-w-[250px] leading-relaxed font-medium">Selecciona un viajero de la lista para iniciar una conversación cifrada de extremo a extremo.</p>
              </div>
           )}
        </div>
      </div>
    </div>
  );
};
