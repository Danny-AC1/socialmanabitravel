import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Send, Lock, ChevronLeft, Search, Image as ImageIcon, 
  Mic, Paperclip, Trash2, Check, CheckCheck, 
  Play, Video, Reply as ReplyIcon
} from 'lucide-react';
import { User, Chat, Message } from '../types';
import { StorageService } from '../services/storageService';
import { EncryptionService } from '../services/encryptionService';
import { db } from '../services/firebase';
import { ref, onValue, off } from 'firebase/database';
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
  
  // Media & Reply
  const [mediaPreview, setMediaPreview] = useState<{type: 'image'|'video'|'audio', url: string} | null>(null);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  
  // Recording States (idle, recording, canceling)
  const [recordingStatus, setRecordingStatus] = useState<'idle' | 'recording' | 'canceling'>('idle');
  const [recordingDuration, setRecordingDuration] = useState(0);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);
  const touchStartXRef = useRef<number | null>(null);

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
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, mediaPreview, replyTo]);

  useEffect(() => {
    if (initialChatId) setActiveChatId(initialChatId);
  }, [initialChatId]);

  if (!isOpen) return null;

  // --- HANDLERS ---

  const handleStartChat = async (targetUserId: string) => {
    const chatId = await StorageService.initiateChat(currentUser.id, targetUserId);
    setActiveChatId(chatId);
    setSearchTerm('');
  };

  const handleSendMessage = async () => {
    if ((!inputText.trim() && !mediaPreview) || !activeChatId) return;

    let type: 'text' | 'image' | 'video' | 'audio' = 'text';
    let content = inputText;
    let url = undefined;

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

  // --- OPTIMIZED AUDIO RECORDING ---

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
        setRecordingStatus('recording');
        setRecordingDuration(0);
        
        recordingTimerRef.current = setInterval(() => {
            setRecordingDuration(prev => prev + 1);
        }, 1000);

    } catch (err) {
        console.error(err);
        alert("No se pudo acceder al micrófono.");
        setRecordingStatus('idle');
    }
  };

  const stopRecording = (shouldSave: boolean) => {
    if (mediaRecorderRef.current && recordingStatus !== 'idle') {
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
    setRecordingStatus('idle');
    touchStartXRef.current = null;
  };

  const handleRecordStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault(); 
    if ('touches' in e) touchStartXRef.current = e.touches[0].clientX;
    startRecording();
  };

  const handleRecordMove = (e: React.TouchEvent) => {
    if (recordingStatus === 'idle') return;
    const currentX = e.touches[0].clientX;
    const startX = touchStartXRef.current || currentX;
    
    // Slide left > 100px to cancel
    if (startX - currentX > 100) {
        setRecordingStatus('canceling');
    } else {
        setRecordingStatus('recording');
    }
  };

  const handleRecordEnd = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (recordingStatus === 'canceling') {
        stopRecording(false); // Discard
    } else {
        stopRecording(true); // Save to preview
    }
  };

  // --- SWIPE TO REPLY ---

  const handleSwipeStart = (e: React.TouchEvent, msg: Message) => {
    setSwipeStartX(e.targetTouches[0].clientX);
    setSwipedMessageId(msg.id);
  };

  const handleSwipeMove = (e: React.TouchEvent) => {
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

  // --- RENDER ---

  const filteredUsers = searchTerm 
    ? allUsers.filter(u => u.id !== currentUser.id && u.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : [];

  const activePartner = activeChatId 
    ? getChatPartner(chats.find(c => c.id === activeChatId) || { participants: activeChatId.split('_') } as Chat) 
    : null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-0 md:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full h-full md:max-w-5xl md:h-[90vh] md:rounded-3xl overflow-hidden shadow-2xl flex flex-row">
        
        {/* LEFT SIDEBAR */}
        <div className={`w-full md:w-[350px] bg-white border-r border-gray-200 flex flex-col ${activeChatId ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-3 border-b border-gray-100 flex items-center gap-3 bg-white">
             <button onClick={onClose} className="md:hidden text-gray-500"><X size={24} /></button>
             <div className="flex-1 relative bg-gray-100 rounded-full h-10 flex items-center px-4 overflow-hidden focus-within:ring-2 focus-within:ring-cyan-500 transition-all">
                <Search size={18} className="text-gray-400 mr-2" />
                <input 
                   className="bg-transparent outline-none w-full text-sm text-gray-700 placeholder-gray-400"
                   placeholder="Buscar chats..."
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                />
             </div>
          </div>

          <div className="flex-1 overflow-y-auto">
             {searchTerm ? (
                <div className="p-2">
                   {filteredUsers.map(u => (
                      <div key={u.id} onClick={() => handleStartChat(u.id)} className="flex items-center gap-3 p-3 hover:bg-gray-100 rounded-xl cursor-pointer transition-colors">
                         <img src={u.avatar} className="w-12 h-12 rounded-full object-cover" />
                         <span className="font-bold text-gray-800">{u.name}</span>
                      </div>
                   ))}
                </div>
             ) : (
                <div>
                   {chats.map(chat => {
                      const partner = getChatPartner(chat);
                      if (!partner) return null;
                      const isActive = activeChatId === chat.id;
                      const decryptedLastMsg = chat.lastMessage ? EncryptionService.decrypt(chat.lastMessage, chat.id) : '';
                      
                      return (
                         <div 
                            key={chat.id} 
                            onClick={() => setActiveChatId(chat.id)}
                            className={`flex items-center gap-3 p-3 cursor-pointer transition-colors border-b border-gray-50 last:border-0 hover:bg-gray-100 ${isActive ? 'bg-cyan-50' : ''}`}
                         >
                            <div className="relative">
                               <img src={partner.avatar} className="w-14 h-14 rounded-full object-cover" />
                               <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
                            </div>
                            <div className="flex-1 min-w-0">
                               <div className="flex justify-between items-baseline">
                                  <h4 className="font-bold text-gray-900 truncate">{partner.name}</h4>
                                  <span className="text-xs text-gray-400">{new Date(chat.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                               </div>
                               <div className="flex items-center gap-1">
                                  <p className="text-sm text-gray-500 truncate flex-1">
                                     {decryptedLastMsg || 'Inicia la conversación'}
                                  </p>
                               </div>
                            </div>
                         </div>
                      );
                   })}
                </div>
             )}
          </div>
        </div>

        {/* RIGHT SIDE (Chat Window) */}
        <div className={`flex-1 bg-[#8e9aaf] flex flex-col relative ${!activeChatId ? 'hidden md:flex' : 'flex'}`}>
           
           <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
              backgroundImage: `url("https://web.telegram.org/img/bg_0.png")`, 
              backgroundSize: '400px'
           }} />

           {activeChatId && activePartner ? (
              <>
                 {/* Chat Header */}
                 <div className="bg-white p-2 px-4 flex items-center justify-between shadow-sm z-20 cursor-pointer">
                    <div className="flex items-center gap-4">
                       <button onClick={(e) => { e.stopPropagation(); setActiveChatId(null); }} className="md:hidden text-gray-500"><ChevronLeft size={26} /></button>
                       <img src={activePartner.avatar} className="w-10 h-10 rounded-full object-cover" />
                       <div className="flex flex-col">
                          <h3 className="font-bold text-gray-900 text-sm leading-tight">{activePartner.name}</h3>
                          <div className="flex items-center text-xs text-cyan-600 gap-1"><Lock size={10} /> Cifrado E2E</div>
                       </div>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="hidden md:block hover:text-red-500"><X size={24} /></button>
                 </div>

                 {/* Messages List */}
                 <div className="flex-1 overflow-y-auto p-4 space-y-2 z-10" ref={messagesEndRef}>
                    {messages.map((msg, idx) => {
                       const isMe = msg.senderId === currentUser.id;
                       const showTail = idx === messages.length - 1 || messages[idx + 1]?.senderId !== msg.senderId;
                       
                       return (
                          <div 
                             key={msg.id} 
                             className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} group relative`}
                             onTouchStart={(e) => handleSwipeStart(e, msg)}
                             onTouchMove={handleSwipeMove}
                             onTouchEnd={(e) => handleSwipeEnd(e, msg)}
                          >
                             <div 
                                className={`max-w-[75%] md:max-w-[60%] relative shadow-sm text-sm p-1
                                   ${isMe 
                                      ? 'bg-cyan-100 text-gray-900 rounded-2xl rounded-tr-sm' 
                                      : 'bg-white text-gray-900 rounded-2xl rounded-tl-sm'
                                   }
                                   ${!showTail && isMe ? 'rounded-tr-2xl mb-1' : ''}
                                   ${!showTail && !isMe ? 'rounded-tl-2xl mb-1' : ''}
                                   ${showTail ? 'mb-3' : ''}
                                   ${swipedMessageId === msg.id ? 'translate-x-10' : ''}
                                   transition-transform
                                `}
                             >
                                {msg.replyTo && (
                                   <div className={`mx-2 mt-2 px-2 py-1 rounded border-l-2 mb-1 cursor-pointer bg-black/5 border-cyan-500`}>
                                      <p className="text-cyan-700 font-bold text-xs">{msg.replyTo.senderName}</p>
                                      <p className="text-gray-500 text-xs truncate">{msg.replyTo.text}</p>
                                   </div>
                                )}

                                <div className="px-2 pb-4 min-w-[120px]">
                                   {msg.type === 'image' && msg.mediaUrl && (
                                      <img src={msg.mediaUrl} className="rounded-lg mb-1 max-w-full" alt="Media" />
                                   )}
                                   {msg.type === 'video' && msg.mediaUrl && (
                                      <video src={msg.mediaUrl} controls className="rounded-lg mb-1 max-w-full" />
                                   )}
                                   {msg.type === 'audio' && msg.mediaUrl && (
                                      <div className="flex items-center gap-2 my-2 bg-black/5 p-2 rounded-full">
                                         <div className="p-2 rounded-full bg-cyan-500 text-white">
                                            <Play size={14} fill="currentColor" />
                                         </div>
                                         <audio src={msg.mediaUrl} controls className="h-8 w-40 opacity-80" />
                                      </div>
                                   )}
                                   {msg.text && <p className="whitespace-pre-wrap leading-snug px-1 pt-1">{msg.text}</p>}
                                </div>

                                <div className="absolute bottom-1 right-2 flex items-center gap-1 select-none">
                                   <span className={`text-[10px] ${isMe ? 'text-cyan-800/60' : 'text-gray-400'}`}>
                                      {new Date(msg.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                   </span>
                                   {isMe && (
                                      msg.isRead 
                                      ? <CheckCheck size={14} className="text-cyan-600" />
                                      : <Check size={14} className="text-cyan-600" />
                                   )}
                                </div>

                                <button 
                                    onClick={() => setReplyTo(msg)}
                                    className={`absolute top-2 ${isMe ? '-left-10' : '-right-10'} p-2 bg-white rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity md:block hidden text-gray-500`}
                                >
                                    <ReplyIcon size={16} />
                                </button>
                             </div>
                          </div>
                       );
                    })}
                    <div ref={messagesEndRef} />
                 </div>

                 {/* Input Area */}
                 <div className="bg-white min-h-[60px] flex flex-col z-20">
                    
                    {/* Reply Preview */}
                    {replyTo && (
                       <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-t border-gray-200 animate-in slide-in-from-bottom-2">
                          <div className="flex items-center gap-3 overflow-hidden">
                             <div className="border-l-2 border-cyan-600 pl-2">
                                <p className="text-cyan-600 font-bold text-xs">Responder a {getSenderName(replyTo.senderId)}</p>
                                <p className="text-gray-500 text-xs truncate max-w-[200px]">{replyTo.type === 'text' ? replyTo.text : 'Archivo adjunto'}</p>
                             </div>
                          </div>
                          <button onClick={() => setReplyTo(null)}><X size={20} className="text-gray-400" /></button>
                       </div>
                    )}

                    {/* Media Preview (Includes Audio) */}
                    {mediaPreview && (
                       <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex justify-between items-center animate-in slide-in-from-bottom-2">
                          <div className="flex gap-4 items-center">
                             {mediaPreview.type === 'video' ? <Video className="text-cyan-600" /> : mediaPreview.type === 'audio' ? <Mic className="text-red-500" /> : <ImageIcon className="text-cyan-600" />}
                             <div>
                                <span className="text-sm font-medium text-gray-700 block">
                                    {mediaPreview.type === 'audio' ? 'Nota de voz' : 'Archivo multimedia'}
                                </span>
                                <span className="text-xs text-gray-500">Listo para enviar</span>
                             </div>
                             {mediaPreview.type === 'audio' && (
                                <audio src={mediaPreview.url} controls className="h-8 w-32" />
                             )}
                          </div>
                          <button onClick={() => setMediaPreview(null)}><Trash2 size={20} className="text-red-500" /></button>
                       </div>
                    )}

                    {/* Controls & Input */}
                    <div className="flex items-end gap-2 p-2 px-3">
                       
                       {/* Left Attachment Button (Hidden while recording) */}
                       {recordingStatus === 'idle' && (
                           <>
                               <button onClick={() => fileInputRef.current?.click()} className="p-3 text-gray-500 hover:text-gray-700 transition-colors">
                                  <Paperclip size={24} className="rotate-45" />
                               </button>
                               <input type="file" ref={fileInputRef} hidden accept="image/*,video/*" onChange={handleFileUpload} />
                           </>
                       )}

                       {/* Center Area: Textarea OR Recording Status */}
                       {recordingStatus !== 'idle' ? (
                          <div className={`flex-1 h-[48px] flex items-center px-4 rounded-2xl transition-colors ${recordingStatus === 'canceling' ? 'bg-red-50' : 'bg-gray-100'}`}>
                             <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-3"></div>
                             <span className={`font-mono font-bold ${recordingStatus === 'canceling' ? 'text-red-500' : 'text-gray-700'}`}>
                                {formatTime(recordingDuration)}
                             </span>
                             <span className="ml-auto text-xs text-gray-400 uppercase font-bold tracking-wide">
                                {recordingStatus === 'canceling' ? 'Soltar para cancelar' : '< Desliza para cancelar'}
                             </span>
                          </div>
                       ) : (
                          <textarea
                             value={inputText}
                             onChange={(e) => setInputText(e.target.value)}
                             placeholder="Escribe un mensaje..."
                             className="flex-1 bg-gray-100 max-h-32 min-h-[44px] py-3 px-4 rounded-2xl outline-none text-gray-800 resize-none overflow-y-auto leading-relaxed"
                             rows={1}
                             onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                   e.preventDefault();
                                   handleSendMessage();
                                }
                             }}
                          />
                       )}

                       {/* Dynamic Button: SEND or MIC */}
                       {(inputText.trim() || mediaPreview) && recordingStatus === 'idle' ? (
                          <button 
                             onClick={() => handleSendMessage()}
                             type="button"
                             className="p-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-full shadow-md transition-all active:scale-95 duration-200 ease-out flex items-center justify-center mb-1"
                          >
                             <Send size={20} className="ml-0.5 mt-0.5" />
                          </button>
                       ) : (
                          <div
                             className={`p-3 rounded-full shadow-md mb-1 transition-all duration-200 cursor-pointer touch-none select-none flex items-center justify-center ${
                                recordingStatus === 'canceling' 
                                ? 'bg-red-500 text-white scale-110 shake' 
                                : recordingStatus === 'recording' 
                                   ? 'bg-cyan-500 text-white scale-125' 
                                   : 'bg-cyan-500 text-white hover:bg-cyan-600'
                             }`}
                             onMouseDown={handleRecordStart}
                             onTouchStart={handleRecordStart}
                             onTouchMove={handleRecordMove}
                             onMouseUp={handleRecordEnd}
                             onTouchEnd={handleRecordEnd}
                          >
                             {recordingStatus === 'canceling' ? <Trash2 size={24} /> : <Mic size={24} />}
                          </div>
                       )}
                    </div>
                 </div>
              </>
           ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-stone-300 p-8">
                 <div className="bg-stone-50 p-6 rounded-full mb-4">
                    <Lock size={48} className="opacity-20" />
                 </div>
                 <p>Selecciona un chat para comenzar.</p>
              </div>
           )}
        </div>
      </div>
    </div>
  );
};