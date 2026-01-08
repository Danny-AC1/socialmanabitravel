
import React, { useState, useRef } from 'react';
import { X, Camera, Wand2, Loader2, MapPin, Image as ImageIcon, Clock, Video, AlertCircle, Users, Globe, Lock, MessageCircle } from 'lucide-react';
import { generateCaptionForImage } from '../services/geminiService';
import { resizeImage, validateVideo } from '../utils';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (image: string, caption: string, location: string, type: 'post' | 'story' | 'group', mediaType: 'image' | 'video', extraData?: any) => void;
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [mode, setMode] = useState<'post' | 'story' | 'group'>('post');
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  
  // Group Specific State
  const [groupName, setGroupName] = useState('');
  const [isPrivateGroup, setIsPrivateGroup] = useState(false);
  const [createLinkedChat, setCreateLinkedChat] = useState(true);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsProcessing(true);
      try {
        if (file.type.startsWith('video/')) {
           const videoBase64 = await validateVideo(file);
           setMediaType('video');
           setMediaPreview(videoBase64);
        } else {
           const size = mode === 'post' ? 1024 : 800;
           const resized = await resizeImage(file, size); 
           setMediaType('image');
           setMediaPreview(resized);
        }
      } catch (err: any) {
        console.error("Error processing file", err);
        alert(err.message || "Error al procesar el archivo.");
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleGenerateCaption = async () => {
    if (mediaType === 'video') {
       alert("La IA aún no puede ver videos, pero puedes escribir tu propia descripción.");
       return;
    }
    if (!location) {
      alert("Por favor ingresa una ubicación primero para que la IA pueda ayudarte.");
      return;
    }
    setIsGenerating(true);
    const suggestion = await generateCaptionForImage(location, "paisaje turístico, día soleado, aventura, ecuador");
    setCaption(suggestion);
    setIsGenerating(false);
  };

  const handleSubmit = () => {
    if (mode === 'group') {
        if (!groupName || !caption) {
            alert("Por favor completa el nombre y descripción de la comunidad.");
            return;
        }
        onSubmit(
            mediaPreview || 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=800&q=80',
            caption,
            groupName, // Usamos location para el nombre en el onSubmit genérico o extraData
            'group',
            'image',
            { name: groupName, isPrivate: isPrivateGroup, createChat: createLinkedChat }
        );
    } else if (mediaPreview) {
      onSubmit(
        mediaPreview, 
        caption,
        location,
        mode,
        mediaType
      );
    }
    
    // Reset
    setMediaPreview(null);
    setCaption('');
    setLocation('');
    setGroupName('');
    setMode('post');
    setMediaType('image');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-stone-900/90 backdrop-blur-md p-0 md:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-none md:rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in duration-200 flex flex-col h-full md:h-auto md:max-h-[90vh]">
        
        <div className="flex flex-col border-b border-gray-100 bg-white sticky top-0 z-10">
          <div className="flex justify-between items-center p-4 pb-2">
            <h2 className="text-xl font-black text-stone-800 flex items-center gap-2">
              <Camera size={24} className="text-manabi-600" />
              ¿Qué quieres compartir?
            </h2>
            <button onClick={onClose} className="bg-stone-100 p-2 rounded-full text-stone-500 hover:bg-red-50 hover:text-red-500 transition-colors">
              <X size={20} />
            </button>
          </div>
          
          <div className="flex px-4 space-x-1">
            <button 
              onClick={() => setMode('post')}
              className={`flex-1 pb-3 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all flex justify-center items-center gap-2 ${mode === 'post' ? 'border-manabi-600 text-manabi-700' : 'border-transparent text-stone-400 hover:text-stone-600'}`}
            >
              <ImageIcon size={14} /> Publicación
            </button>
            <button 
              onClick={() => setMode('story')}
              className={`flex-1 pb-3 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all flex justify-center items-center gap-2 ${mode === 'story' ? 'border-manabi-600 text-manabi-700' : 'border-transparent text-stone-400 hover:text-stone-600'}`}
            >
              <Clock size={14} /> Historia
            </button>
            <button 
              onClick={() => setMode('group')}
              className={`flex-1 pb-3 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all flex justify-center items-center gap-2 ${mode === 'group' ? 'border-manabi-600 text-manabi-700' : 'border-transparent text-stone-400 hover:text-stone-600'}`}
            >
              <Users size={14} /> Comunidad
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto flex-1 pb-32 md:pb-6">
          
          {mode === 'group' && (
              <div className="bg-cyan-50 p-3 rounded-2xl flex items-start gap-3 text-cyan-800 text-[11px] leading-relaxed border border-cyan-100">
                <Users size={18} className="shrink-0 text-cyan-500" />
                <p>Crea un espacio para organizar viajes, compartir itinerarios y chatear con otros exploradores.</p>
              </div>
          )}

          <div 
            onClick={() => !isProcessing && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl h-52 flex flex-col items-center justify-center cursor-pointer transition-all relative overflow-hidden ${
              mediaPreview ? 'border-transparent p-0 bg-black' : 'border-stone-200 hover:border-manabi-400 bg-stone-50 hover:bg-manabi-50/30'
            }`}
          >
            {isProcessing ? (
               <div className="flex flex-col items-center text-manabi-600 p-4 text-center">
                 <Loader2 size={32} className="animate-spin mb-2" />
                 <p className="text-sm font-black uppercase tracking-wide">Procesando...</p>
               </div>
            ) : mediaPreview ? (
              mediaType === 'video' ? (
                 <video src={mediaPreview} className="w-full h-full object-contain" controls autoPlay muted loop />
              ) : (
                 <img src={mediaPreview} alt="Preview" className="w-full h-full object-cover" />
              )
            ) : (
              <div className="text-center text-stone-400">
                <div className="bg-white p-4 rounded-3xl shadow-sm w-fit mx-auto mb-3 flex gap-2 border border-stone-100">
                  <ImageIcon size={24} className="text-manabi-500" />
                  {mode !== 'group' && (
                      <>
                        <div className="w-px h-6 bg-stone-100"></div>
                        <Video size={24} className="text-manabi-500" />
                      </>
                  )}
                </div>
                <p className="font-black text-xs uppercase tracking-widest text-stone-600">
                    {mode === 'group' ? 'Foto de Portada' : 'Subir Multimedia'}
                </p>
                <span className="text-[10px] text-stone-400">Toque para seleccionar</span>
              </div>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept={mode === 'group' ? "image/*" : "image/*,video/*"}
              onChange={handleFileChange} 
            />
          </div>

          <div className="space-y-4">
            {mode === 'group' ? (
                <div>
                    <label className="flex items-center text-[10px] font-black text-stone-400 mb-1.5 uppercase tracking-[0.2em]">
                        Nombre de la Comunidad
                    </label>
                    <input
                        type="text"
                        placeholder="Ej: Mochileros en Manabí"
                        className="w-full bg-stone-50 border-stone-200 border rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-manabi-500/20 focus:border-manabi-500 outline-none transition-all"
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                    />
                </div>
            ) : (
                <div>
                <label className="flex items-center text-[10px] font-black text-stone-400 mb-1.5 uppercase tracking-[0.2em]">
                    <MapPin size={12} className="mr-1 text-manabi-500" />
                    ¿Dónde estás?
                </label>
                <input
                    type="text"
                    placeholder={mode === 'story' ? "Ubicación opcional" : "Ej: Los Frailes, Manabí..."}
                    className="w-full bg-stone-50 border-stone-200 border rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-manabi-500/20 focus:border-manabi-500 outline-none transition-all"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                />
                </div>
            )}

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">
                  {mode === 'group' ? 'Sobre el grupo' : (mode === 'story' ? 'Texto breve' : 'Tu Experiencia')}
                </label>
                {mode === 'post' && (
                    <button 
                    onClick={handleGenerateCaption}
                    disabled={isGenerating || !location || mediaType === 'video'}
                    className="text-[10px] font-black uppercase flex items-center bg-manabi-50 text-manabi-600 px-3 py-1.5 rounded-full hover:bg-manabi-100 disabled:opacity-50 transition-colors border border-manabi-100"
                    >
                    {isGenerating ? <Loader2 size={12} className="animate-spin mr-1"/> : <Wand2 size={12} className="mr-1"/>}
                    IA Inspiración
                    </button>
                )}
              </div>
              <textarea
                className="w-full bg-stone-50 border-stone-200 border rounded-2xl p-4 h-24 resize-none text-sm font-medium focus:ring-2 focus:ring-manabi-500/20 focus:border-manabi-500 outline-none transition-all leading-relaxed"
                placeholder={mode === 'group' ? "Describe el objetivo del grupo..." : (mode === 'story' ? "Escribe un comentario rápido..." : "¿Qué hizo especial este momento?")}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
              ></textarea>
            </div>

            {mode === 'group' && (
                <div className="grid grid-cols-2 gap-3 pt-2">
                    <button 
                        onClick={() => setIsPrivateGroup(!isPrivateGroup)}
                        className={`p-3 rounded-2xl border flex flex-col items-center gap-1 transition-all ${isPrivateGroup ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-stone-50 border-stone-100 text-stone-500'}`}
                    >
                        {isPrivateGroup ? <Lock size={18}/> : <Globe size={18}/>}
                        <span className="text-[9px] font-black uppercase tracking-widest">{isPrivateGroup ? 'Privado' : 'Público'}</span>
                    </button>
                    <button 
                        onClick={() => setCreateLinkedChat(!createLinkedChat)}
                        className={`p-3 rounded-2xl border flex flex-col items-center gap-1 transition-all ${createLinkedChat ? 'bg-cyan-50 border-cyan-200 text-cyan-700' : 'bg-stone-50 border-stone-100 text-stone-500'}`}
                    >
                        <MessageCircle size={18}/>
                        <span className="text-[9px] font-black uppercase tracking-widest">{createLinkedChat ? 'Con Chat' : 'Sin Chat'}</span>
                    </button>
                </div>
            )}
          </div>
        </div>

        <div className="p-4 md:p-6 bg-white border-t border-stone-100 fixed bottom-0 left-0 w-full md:relative shrink-0">
          <button 
            onClick={handleSubmit}
            disabled={(mode !== 'group' && !mediaPreview) || !caption || isProcessing}
            className="w-full bg-manabi-600 hover:bg-manabi-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-manabi-200 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale uppercase tracking-widest text-sm"
          >
            {mode === 'post' ? 'Compartir Publicación' : (mode === 'story' ? 'Subir a Historias' : 'Lanzar Comunidad')}
          </button>
        </div>
      </div>
    </div>
  );
};
