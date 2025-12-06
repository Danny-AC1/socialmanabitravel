import React, { useState, useRef } from 'react';
import { X, Camera, Wand2, Loader2, MapPin, Image as ImageIcon, Clock, Video, AlertCircle } from 'lucide-react';
import { generateCaptionForImage } from '../services/geminiService';
import { resizeImage, validateVideo } from '../utils';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (image: string, caption: string, location: string, type: 'post' | 'story', mediaType: 'image' | 'video') => void;
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [mode, setMode] = useState<'post' | 'story'>('post');
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
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
    if (mediaPreview) {
      onSubmit(
        mediaPreview, 
        caption,
        location,
        mode,
        mediaType
      );
      
      setMediaPreview(null);
      setCaption('');
      setLocation('');
      setMode('post');
      setMediaType('image');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-cyan-950/80 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        
        <div className="flex flex-col border-b border-gray-100">
          <div className="flex justify-between items-center p-4 pb-2">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Camera size={24} className="text-cyan-600" />
              Crear Contenido
            </h2>
            <button onClick={onClose} className="bg-gray-100 p-2 rounded-full text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors">
              <X size={20} />
            </button>
          </div>
          
          <div className="flex px-4 space-x-4">
            <button 
              onClick={() => setMode('post')}
              className={`flex-1 pb-3 text-sm font-bold border-b-2 transition-colors flex justify-center items-center gap-2 ${mode === 'post' ? 'border-cyan-600 text-cyan-700' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
            >
              <ImageIcon size={16} /> Publicación
            </button>
            <button 
              onClick={() => setMode('story')}
              className={`flex-1 pb-3 text-sm font-bold border-b-2 transition-colors flex justify-center items-center gap-2 ${mode === 'story' ? 'border-cyan-600 text-cyan-700' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
            >
              <Clock size={16} /> Historia (24h)
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto">
          {/* File Warning */}
          <div className="bg-blue-50 p-3 rounded-xl flex items-start gap-2 text-blue-700 text-xs">
             <AlertCircle size={16} className="shrink-0 mt-0.5" />
             <p>Puedes subir fotos o videos cortos de <strong>máximo 1 minuto</strong>. ¡Comparte tus mejores momentos!</p>
          </div>

          <div 
            onClick={() => !isProcessing && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl h-64 flex flex-col items-center justify-center cursor-pointer transition-colors relative overflow-hidden ${
              mediaPreview ? 'border-transparent p-0' : 'border-cyan-200 hover:border-cyan-500 bg-cyan-50/50 hover:bg-cyan-50'
            }`}
          >
            {isProcessing ? (
               <div className="flex flex-col items-center text-cyan-600">
                 <Loader2 size={32} className="animate-spin mb-2" />
                 <p className="text-sm font-medium">Procesando archivo...</p>
               </div>
            ) : mediaPreview ? (
              mediaType === 'video' ? (
                 <video src={mediaPreview} className="w-full h-full object-cover rounded-2xl" controls autoPlay muted loop />
              ) : (
                 <img src={mediaPreview} alt="Preview" className="w-full h-full object-cover rounded-2xl" />
              )
            ) : (
              <div className="text-center text-cyan-600">
                <div className="bg-white p-4 rounded-full shadow-sm w-fit mx-auto mb-3 flex gap-2">
                  <Camera size={24} />
                  <div className="w-px h-6 bg-gray-200"></div>
                  <Video size={24} />
                </div>
                <p className="font-semibold">Foto o Video</p>
                <span className="text-xs text-cyan-400">
                  Max 1 min
                </span>
              </div>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*,video/*" 
              onChange={handleFileChange} 
            />
          </div>

          <div className="animate-in fade-in slide-in-from-top-2 duration-300">
            <label className="flex items-center text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wide">
              <MapPin size={12} className="mr-1" />
              Ubicación {mode === 'story' && '(Opcional)'}
            </label>
            <input
              type="text"
              placeholder={mode === 'story' ? "Ej: Playa Murciélago" : "Ej: Los Frailes, Puerto López..."}
              className="w-full bg-gray-50 border-gray-200 border rounded-xl p-3 focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <div className="animate-in fade-in slide-in-from-top-2 duration-300 delay-75">
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide">
                {mode === 'story' ? 'Comentario (Opcional)' : 'Tu Experiencia'}
              </label>
              <button 
                onClick={handleGenerateCaption}
                disabled={isGenerating || !location || mediaType === 'video'}
                className="text-xs flex items-center bg-purple-50 text-purple-600 px-2 py-1 rounded-md hover:bg-purple-100 disabled:opacity-50 font-bold transition-colors"
              >
                {isGenerating ? <Loader2 size={12} className="animate-spin mr-1"/> : <Wand2 size={12} className="mr-1"/>}
                Inspírame con IA
              </button>
            </div>
            <textarea
              className="w-full bg-gray-50 border-gray-200 border rounded-xl p-3 h-24 resize-none focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
              placeholder={mode === 'story' ? "Añade un comentario..." : "¿Qué hizo especial este momento?"}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
            ></textarea>
          </div>

          <button 
            onClick={handleSubmit}
            disabled={!mediaPreview || (mode === 'post' && !caption) || isProcessing}
            className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-cyan-200 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {mode === 'post' ? 'Publicar en Perfil' : 'Subir Historia'}
          </button>
        </div>
      </div>
    </div>
  );
};