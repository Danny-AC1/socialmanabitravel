import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Lock, ChevronLeft, Search, Image as ImageIcon, Video, Mic, Smile, Reply, StopCircle, Play, Pause } from 'lucide-react';
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
  const [activeChatId, setActiveChatId] = useState<string | null>(initialChatId || null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Multimedia & Reply States
  const [isRecording, setIsRecording] = useState(false);
  const [mediaPreview, setMediaPreview] = useState<{type: 'image'|'video', url: string} | null>(null);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [showEmoji, setShowEmoji] = useState(false);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Swipe States
  const [swipeStartX, setSwipeStartX] = useState<number | null>(null);
  const [swipedMessageId, setSwipedMessageId] = useState<string | null>(null);

  // Cargar lista de chats
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

  // Cargar mensajes y marcar como leídos
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
          text: msg.text ? EncryptionService.decrypt(msg.text, activeChatId) : '',
          mediaUrl: msg.mediaUrl ? EncryptionService.decrypt(msg.mediaUrl, activeChatId) : undefined
        })) as Message[];
        
        setMessages(loadedMessages.sort((a, b) => a.timestamp - b.timestamp));
        
        // Optimización: Marcar como leído al entrar o recibir nuevo
        if (loadedMessages.some(m => !m.isRead && m.senderId !== currentUser.id)) {
           StorageService.markChatAsRead(activeChatId, currentUser.id);
        }
      } else {
        setMessages([]);
      }
    });

    return () => off(messagesRef);
  }, [activeChatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, mediaPreview, replyTo]);

  useEffect(() => {
    if (initialChatId) setActiveChatId(initialChatId);
  }, [initialChatId]);

  if (!isOpen) return null;

  // --- HANDLERS ---

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!newMessage.trim() && !mediaPreview) || !activeChatId) return;

    let type: 'text' | 'image' | 'video' = 'text';
    let content = newMessage;
    let url = undefined;

    if (mediaPreview) {
        type = mediaPreview.type;
        url = mediaPreview.url;
    }

    const replyData = replyTo ? {
        id: replyTo.id,
        text: replyTo.type === 'text' ? replyTo.text : `[${replyTo.type}]`,
        senderName: getSenderName(replyTo.senderId)
    } : undefined;

    await StorageService.sendMessage(activeChatId, currentUser.id, content, type, url, replyData);
    
    setNewMessage('');
    setMediaPreview(null);
    setReplyTo(null);
    setShowEmoji(false);
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
    } catch (err) {
        alert("Error al procesar archivo: " + err);
    }
  };

  const startRecording = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        audioChunksRef.current = [];
        
        recorder.ondataavailable = (e) => {
            if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };

        recorder.onstop = async () => {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            const reader = new FileReader();
            reader.readAsDataURL(audioBlob);
            reader.onloadend = async () => {
                const base64Audio = reader.result as string;
                if (activeChatId) {
                    await StorageService.sendMessage(activeChatId, currentUser.id, '', 'audio', base64Audio);
                }
            };
            stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorderRef.current = recorder;
        recorder.start();
        setIsRecording(true);
    } catch (err) {
        alert("No se pudo acceder al micrófono.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
    }
  };

  const handleSwipeStart = (e: React.TouchEvent, msg: Message) => {
    setSwipeStartX(e.targetTouches[0].clientX);
    setSwipedMessageId(msg.id);
  };

  const handleSwipeMove = (e: React.TouchEvent) => {
    if (swipeStartX === null) return;
    const currentX = e.targetTouches[0].clientX;
    const diff = currentX - swipeStartX;
    
    // Solo permitir swipe a la derecha (Reply)
    if (diff > 50) {
        // Visual feedback logic could go here via ref or state style
    }
  };

  const handleSwipeEnd = (e: React.TouchEvent, msg: Message) => {
    if (swipeStartX === null) return;
    const endX = e.changedTouches[0].clientX;
    if (endX - swipeStartX > 50) { // Umbral de swipe
        setReplyTo(msg);
    }
    setSwipeStartX(null);
    setSwipedMessageId(null);
  };

  const addEmoji = (emoji: string) => {
      setNewMessage(prev => prev + emoji);
  };

  // --- HELPERS ---

  const getChatPartner = (chat: Chat) => {
    const partnerId = chat.participants.find(id => id !== currentUser.id);
    return allUsers.find(u => u.id === partnerId);
  };

  const getSenderName = (id: string) => {
      return id === currentUser.id ? 'Tú' : allUsers.find(u => u.id === id)?.name || 'Usuario';
  };

  const filteredUsers = searchTerm 
    ? allUsers.filter(u => u.id !== currentUser.id && u.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : [];

  const handleStartChat = async (targetUserId: string) => {
    const chatId = await StorageService.initiateChat(currentUser.id, targetUserId);
    setActiveChatId(chatId);
    setSearchTerm('');
  };

  const emojis = ["👍", "❤️", "😂", "😮", "😢", "🔥", "🎉", "🌴", "🌊", "😎", "📷", "🇪🇨"];

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl h-[85vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row">
        
        {/* SIDEBAR */}
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
                {filteredUsers.map(user => (
                  <div key={user.id} onClick={() => handleStartChat(user.id)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white cursor-pointer transition-colors">
                    <img src={user.avatar} className="w-10 h-10 rounded-full object-cover" alt="" />
                    <span className="font-semibold text-sm text-stone-700">{user.name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {chats.map(chat => {
                  const partner = getChatPartner(chat);
                  if (!partner) return null;
                  const isSelected = activeChatId === chat.id;
                  const unreadCount = messages.filter(m => !m.isRead && m.senderId !== currentUser.id).length; // Simplified local check not efficient for list but ok for demo
                  
                  return (
                    <div key={chat.id} onClick={() => setActiveChatId(chat.id)} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${isSelected ? 'bg-white shadow-sm border border-stone-100' : 'hover:bg-stone-100'}`}>
                      <div className="relative">
                        <img src={partner.avatar} className="w-12 h-12 rounded-full object-cover" alt="" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline">
                          <h4 className="font-bold text-sm text-stone-800 truncate">{partner.name}</h4>
                          <span className="text-[10px] text-stone-400">{new Date(chat.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                        <p className="text-xs text-stone-500 truncate flex items-center gap-1">
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

        {/* CHAT AREA */}
        <div className={`w-full md:w-2/3 bg-white flex flex-col ${!activeChatId ? 'hidden md:flex' : 'flex'}`}>
          {activeChatId ? (
            <>
              {/* HEADER */}
              <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-white z-10">
                <div className="flex items-center gap-3">
                  <button onClick={() => setActiveChatId(null)} className="md:hidden p-2 -ml-2 text-stone-500"><ChevronLeft size={24} /></button>
                  {(() => {
                      const partner = getChatPartner(chats.find(c => c.id === activeChatId) || {participants: activeChatId.split('_')} as Chat);
                      return partner ? (
                          <>
                            <img src={partner.avatar} className="w-10 h-10 rounded-full object-cover" alt="" />
                            <div>
                                <h3 className="font-bold text-stone-800">{partner.name}</h3>
                                <div className="flex items-center text-xs text-green-600 gap-1"><Lock size={10} /> Cifrado E2E</div>
                            </div>
                          </>
                      ) : null;
                  })()}
                </div>
                <button onClick={onClose} className="hidden md:block p-2 rounded-full hover:bg-stone-100"><X size={24} /></button>
              </div>

              {/* MESSAGES */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-stone-50/50">
                {messages.map((msg) => {
                  const isMe = msg.senderId === currentUser.id;
                  return (
                    <div 
                        key={msg.id} 
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                        onTouchStart={(e) => handleSwipeStart(e, msg)}
                        onTouchMove={handleSwipeMove}
                        onTouchEnd={(e) => handleSwipeEnd(e, msg)}
                    >
                      <div className={`max-w-[80%] relative group transition-transform ${swipedMessageId === msg.id ? 'translate-x-10' : ''}`}>
                        
                        {/* Reply Preview inside bubble */}
                        {msg.replyTo && (
                            <div className={`text-xs mb-1 p-2 rounded-lg border-l-4 ${isMe ? 'bg-cyan-700/50 border-cyan-200 text-cyan-100' : 'bg-gray-100 border-cyan-600 text-gray-600'}`}>
                                <p className="font-bold text-[10px]">{msg.replyTo.senderName}</p>
                                <p className="truncate">{msg.replyTo.text}</p>
                            </div>
                        )}

                        <div className={`p-3 rounded-2xl text-sm shadow-sm ${isMe ? 'bg-cyan-600 text-white rounded-br-none' : 'bg-white text-stone-800 rounded-bl-none border border-stone-100'}`}>
                            
                            {/* Media Content */}
                            {msg.type === 'image' && msg.mediaUrl && (
                                <img src={msg.mediaUrl} className="rounded-lg mb-2 max-w-full h-auto" alt="Attached" />
                            )}
                            {msg.type === 'video' && msg.mediaUrl && (
                                <video src={msg.mediaUrl} controls className="rounded-lg mb-2 max-w-full h-auto" />
                            )}
                            {msg.type === 'audio' && msg.mediaUrl && (
                                <audio src={msg.mediaUrl} controls className="mb-1 w-60 h-8" />
                            )}

                            {/* Text Content */}
                            {msg.text && <p>{msg.text}</p>}
                            
                            <div className="flex items-center justify-end gap-1 mt-1">
                                <p className={`text-[10px] ${isMe ? 'text-cyan-100' : 'text-stone-400'}`}>
                                    {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </p>
                                {isMe && (
                                    <span className={`text-[10px] ${msg.isRead ? 'text-blue-200' : 'text-cyan-200'}`}>
                                        {msg.isRead ? '✓✓' : '✓'}
                                    </span>
                                )}
                            </div>
                        </div>
                        
                        {/* Reply Action Button (Desktop hover / Mobile swipe hint) */}
                        <button 
                            onClick={() => setReplyTo(msg)}
                            className={`absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-gray-200 rounded-full text-gray-600 ${isMe ? '-left-8' : '-right-8'}`}
                        >
                            <Reply size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* INPUT AREA */}
              <div className="bg-white border-t border-stone-100">
                {/* Reply Preview Footer */}
                {replyTo && (
                    <div className="bg-gray-50 px-4 py-2 flex justify-between items-center border-b border-gray-100">
                        <div className="text-xs text-gray-500 border-l-2 border-cyan-500 pl-2">
                            <span className="font-bold text-cyan-700">Respondiendo a {getSenderName(replyTo.senderId)}</span>
                            <p className="truncate max-w-[200px]">{replyTo.type === 'text' ? replyTo.text : `Archivo ${replyTo.type}`}</p>
                        </div>
                        <button onClick={() => setReplyTo(null)}><X size={16} className="text-gray-400" /></button>
                    </div>
                )}

                {/* Media Preview Footer */}
                {mediaPreview && (
                    <div className="bg-gray-50 px-4 py-2 flex justify-between items-center border-b border-gray-100">
                        <div className="flex items-center gap-2">
                            {mediaPreview.type === 'image' ? <ImageIcon className="text-cyan-600" size={20}/> : <Video className="text-cyan-600" size={20}/>}
                            <span className="text-xs text-gray-600">Archivo listo para enviar</span>
                        </div>
                        <button onClick={() => setMediaPreview(null)}><X size={16} className="text-gray-400" /></button>
                    </div>
                )}

                {/* Emoji Picker */}
                {showEmoji && (
                    <div className="px-4 py-2 flex gap-2 overflow-x-auto no-scrollbar bg-gray-50 border-b border-gray-100">
                        {emojis.map(e => (
                            <button key={e} onClick={() => addEmoji(e)} className="text-xl hover:scale-125 transition-transform">{e}</button>
                        ))}
                    </div>
                )}

                <form onSubmit={handleSendMessage} className="p-3 flex items-end gap-2">
                  <div className="flex gap-1 pb-2">
                     <button type="button" onClick={() => fileInputRef.current?.click()} className="text-stone-400 hover:text-cyan-600 p-2"><ImageIcon size={20} /></button>
                     <button type="button" onClick={() => setShowEmoji(!showEmoji)} className="text-stone-400 hover:text-cyan-600 p-2"><Smile size={20} /></button>
                     <input type="file" ref={fileInputRef} hidden accept="image/*,video/*" onChange={handleFileUpload} />
                  </div>

                  <div className="flex-1 bg-stone-100 rounded-2xl px-4 py-2 min-h-[44px] flex items-center">
                     <textarea 
                        placeholder="Escribe un mensaje..." 
                        className="w-full bg-transparent border-none outline-none text-sm resize-none max-h-24 pt-1"
                        rows={1}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                     />
                  </div>

                  {newMessage.trim() || mediaPreview ? (
                      <button type="submit" className="bg-cyan-600 text-white p-3 rounded-full hover:bg-cyan-700 shadow-md mb-1">
                        <Send size={18} />
                      </button>
                  ) : (
                      <button 
                        type="button" 
                        onMouseDown={startRecording} 
                        onMouseUp={stopRecording} 
                        onTouchStart={startRecording}
                        onTouchEnd={stopRecording}
                        className={`p-3 rounded-full shadow-md mb-1 transition-all ${isRecording ? 'bg-red-500 text-white scale-110 animate-pulse' : 'bg-cyan-600 text-white'}`}
                      >
                        {isRecording ? <StopCircle size={18} /> : <Mic size={18} />}
                      </button>
                  )}
                </form>
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