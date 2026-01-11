
import React, { useState, useRef } from 'react';
/* Added PlusCircle to the imports from lucide-react */
import { X, Camera, Wand2, Loader2, MapPin, Image as ImageIcon, Clock, Video, AlertCircle, Users, Globe, Lock, MessageCircle, ChevronLeft, ChevronRight, PlusCircle } from 'lucide-react';
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
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
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
    const files = e.target.files;
    if (files && files.length > 0) {
      setIsProcessing(true);
      try {
        if (files[0].type.startsWith('video/')) {
           // Los videos siguen siendo individuales
           const videoBase64 = await validateVideo(files[0]);
           setMediaType('video');
           setMediaPreview(videoBase64);
           setGalleryPreviews([]);
        } else {
           // Soporte para múltiples imágenes
           const imagePromises = Array.from(files).slice(0, 10).map(file => {
             const size = mode === 'post' ? 1024 : 800;
             return resizeImage(file, size);
           });
           
           const results = await Promise.all(imagePromises);
           setMediaType('image');
           setMediaPreview(results[0]);
           setGalleryPreviews(results);
        }
      } catch (err: any) {
        console.error("Error processing files", err);
        alert(err.message || "Error al procesar archivos.");
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const removeImage = (index: number) => {
      const newGallery = galleryPreviews.filter((_, i) => i !== index);
      setGalleryPreviews(newGallery);
      if (newGallery.length > 0) {
          setMediaPreview(newGallery[0]);
      } else {
          setMediaPreview(null);
      }
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
            groupName,
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
        mediaType,
        galleryPreviews.length > 1 ? { gallery: galleryPreviews } : undefined
      );
    }
    
    // Reset
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setMediaPreview(null);
    setGalleryPreviews([]);
    setCaption('');
    setLocation('');
    setGroupName('');
    setMode('post');
    setMediaType('image');
  };

  const isSubmitDisabled = 
    isProcessing || 
    (mode === 'group' ? (!groupName || !caption) : !mediaPreview);

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-stone-900/90 backdrop-blur-md p-0 md:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-none md:rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in duration-200 flex flex-col h-full md:h-auto md:max-h-[90vh]">
        
        <div className="flex flex-col border-b border-gray-100 bg-white sticky top-0 z-10">
          <div className="flex justify-between items-center p-4 pb-2">
            <h2 className="text-xl font-black text-stone-800 flex items-center gap-2">
              <Camera size={24} className="text-manabi-600" />
              ¿Qué quieres compartir?
            </h2>
            <button onClick={() => { resetForm(); onClose(); }} className="bg-stone-100 p-2 rounded-full text-stone-500 hover:bg-red-50 hover:text-red-500 transition-colors">
              <X size={20} />
            </button>
          </div>
          
          <div className="flex px-4 space-x-1">
            <button onClick={() => setMode('post')} className={`flex-1 pb-3 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${mode === 'post' ? 'border-manabi-600 text-manabi-700' : 'border-transparent text-stone-400 hover:text-stone-600'}`}>Publicación</button>
            <button onClick={() => setMode('story')} className={`flex-1 pb-3 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${mode === 'story' ? 'border-manabi-600 text-manabi-700' : 'border-transparent text-stone-400 hover:text-stone-600'}`}>Historia</button>
            <button onClick={() => setMode('group')} className={`flex-1 pb-3 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${mode === 'group' ? 'border-manabi-600 text-manabi-700' : 'border-transparent text-stone-400 hover:text-stone-600'}`}>Comunidad</button>
          </div>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto flex-1 pb-32 md:pb-6">
          
          <div className="space-y-4">
              <div 
                onClick={() => !isProcessing && fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl h-52 flex flex-col items-center justify-center cursor-pointer transition-all relative overflow-hidden ${
                  mediaPreview ? 'border-transparent p-0 bg-black' : 'border-stone-200 hover:border-manabi-400 bg-stone-50 hover:bg-manabi-50/30'
                }`}
              >
                {isProcessing ? (
                   <div className="flex flex-col items-center text-manabi-600">
                     <Loader2 size={32} className="animate-spin mb-2" />
                     <p className="text-xs font-black uppercase">Procesando...</p>
                   </div>
                ) : mediaPreview ? (
                  mediaType === 'video' ? (
                     <video src={mediaPreview} className="w-full h-full object-contain" controls autoPlay muted loop />
                  ) : (
                     <img src={mediaPreview} alt="Preview" className="w-full h-full object-contain" />
                  )
                ) : (
                  <div className="text-center text-stone-400">
                    <div className="bg-white p-4 rounded-3xl shadow-sm w-fit mx-auto mb-3 border border-stone-100">
                      <ImageIcon size={24} className="text-manabi-500" />
                    </div>
                    <p className="font-black text-xs uppercase tracking-widest text-stone-600">Subir Multimedia</p>
                    <span className="text-[10px] text-stone-400">Puedes seleccionar varias fotos</span>
                  </div>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  multiple={mode === 'post'}
                  accept={mode === 'group' ? "image/*" : "image/*,video/*"}
                  onChange={handleFileChange} 
                />
              </div>

              {galleryPreviews.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                      {galleryPreviews.map((img, idx) => (
                          <div key={idx} className="relative w-16 h-16 shrink-0 rounded-lg overflow-hidden border-2 border-stone-100 group">
                              <img src={img} className="w-full h-full object-cover cursor-pointer" onClick={() => setMediaPreview(img)} />
                              <button onClick={() => removeImage(idx)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <X size={12} />
                              </button>
                          </div>
                      ))}
                      <button onClick={() => fileInputRef.current?.click()} className="w-16 h-16 shrink-0 border-2 border-dashed border-stone-200 rounded-lg flex items-center justify-center text-stone-400 hover:bg-stone-50">
                          <PlusCircle size={20} />
                      </button>
                  </div>
              )}
          </div>

          <div className="space-y-4">
            {mode === 'group' ? (
                <div>
                    <label className="text-[10px] font-black text-stone-400 mb-1.5 uppercase tracking-[0.2em] block">Nombre de la Comunidad</label>
                    <input type="text" placeholder="Ej: Mochileros en Manabí" className="w-full bg-stone-50 border-stone-200 border rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-manabi-500/20 outline-none" value={groupName} onChange={(e) => setGroupName(e.target.value)} />
                </div>
            ) : (
                <div>
                <label className="flex items-center text-[10px] font-black text-stone-400 mb-1.5 uppercase tracking-[0.2em]">
                    <MapPin size={12} className="mr-1 text-manabi-500" /> ¿Dónde estás?
                </label>
                <input type="text" placeholder={mode === 'story' ? "Ubicación opcional" : "Ej: Los Frailes, Manabí..."} className="w-full bg-stone-50 border-stone-200 border rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-manabi-500/20 outline-none" value={location} onChange={(e) => setLocation(e.target.value)} />
                </div>
            )}

            <div>
              <label className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] block mb-1.5">
                {mode === 'group' ? 'Sobre el grupo' : (mode === 'story' ? 'Texto breve (opcional)' : 'Tu Experiencia (opcional)')}
              </label>
              <textarea
                className="w-full bg-stone-50 border-stone-200 border rounded-2xl p-4 h-24 resize-none text-sm font-medium outline-none focus:ring-2 focus:ring-manabi-500/20"
                placeholder={mode === 'group' ? "Describe el objetivo del grupo..." : (mode === 'story' ? "Escribe un comentario rápido..." : "¿Qué hizo especial este momento?")}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
              ></textarea>
            </div>
          </div>
        </div>

        <div className="p-4 md:p-6 bg-white border-t border-stone-100 shrink-0">
          <button onClick={handleSubmit} disabled={isSubmitDisabled} className="w-full bg-manabi-600 hover:bg-manabi-700 text-white font-black py-4 rounded-2xl shadow-xl active:scale-95 disabled:opacity-50 uppercase tracking-widest text-sm">
            {mode === 'post' ? 'Compartir Publicación' : (mode === 'story' ? 'Subir a Historias' : 'Lanzar Comunidad')}
          </button>
        </div>
      </div>
    </div>
  );
};
