import React, { useState, useEffect } from 'react';
import { X, MapPin, Save, Loader2 } from 'lucide-react';
import { Story } from '../types';

interface EditStoryModalProps {
  isOpen: boolean;
  story: Story | null;
  onClose: () => void;
  onSave: (id: string, caption: string, location: string) => void;
}

export const EditStoryModal: React.FC<EditStoryModalProps> = ({ isOpen, story, onClose, onSave }) => {
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (story) {
      setCaption(story.caption || '');
      setLocation(story.location || '');
    }
  }, [story]);

  if (!isOpen || !story) return null;

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    onSave(story.id, caption, location);
    setIsSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-stone-900/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
        <div className="flex justify-between items-center p-5 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800">Editar Historia</h2>
          <button onClick={onClose} className="bg-gray-100 p-2 rounded-full text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="flex gap-4">
             <div className="w-24 h-40 shrink-0 rounded-xl overflow-hidden bg-black flex items-center justify-center">
               {story.mediaType === 'video' ? (
                 <video src={story.imageUrl} className="w-full h-full object-cover" />
               ) : (
                 <img src={story.imageUrl} alt="Story preview" className="w-full h-full object-cover" />
               )}
             </div>
             <div className="flex-1 space-y-4">
                <div>
                  <label className="flex items-center text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wide">
                    <MapPin size={12} className="mr-1" />
                    Ubicación
                  </label>
                  <input
                    type="text"
                    className="w-full bg-gray-50 border-gray-200 border rounded-xl p-3 text-sm focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
             </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1.5">Descripción</label>
            <textarea
              className="w-full bg-gray-50 border-gray-200 border rounded-xl p-3 h-24 resize-none focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
            ></textarea>
          </div>

          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
          >
            {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
};