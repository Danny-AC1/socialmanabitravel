
import React, { useState, useRef } from 'react';
import { X, MapPin, Loader2, Image as ImageIcon, Wand2, Globe, AlertTriangle } from 'lucide-react';
import { resizeImage } from '../utils';
import { generateDestinationDetails } from '../services/geminiService';
import { EcuadorRegion, Destination } from '../types';

interface AddDestinationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  existingDestinations: Destination[];
}

export const AddDestinationModal: React.FC<AddDestinationModalProps> = ({ isOpen, onClose, onSubmit, existingDestinations }) => {
  const [name, setName] = useState('');
  const [region, setRegion] = useState<EcuadorRegion>('Costa');
  const [province, setProvince] = useState('');
  const [locationDetail, setLocationDetail] = useState('');
  const [category, setCategory] = useState('Naturaleza');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiStatus, setAiStatus] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Provincias por región
  const provincesByRegion: Record<EcuadorRegion, string[]> = {
    'Costa': ['Manabí', 'Guayas', 'Santa Elena', 'El Oro', 'Esmeraldas', 'Los Ríos', 'Santo Domingo'],
    'Sierra': ['Pichincha', 'Azuay', 'Loja', 'Imbabura', 'Tungurahua', 'Cotopaxi', 'Chimborazo', 'Cañar', 'Carchi', 'Bolívar'],
    'Amazonía': ['Napo', 'Pastaza', 'Orellana', 'Sucumbíos', 'Morona Santiago', 'Zamora Chinchipe'],
    'Insular': ['Galápagos']
  };

  if (!isOpen) return null;

  const normalize = (text: string) => {
    return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const resized = await resizeImage(file, 1024);
        setImagePreview(resized);
      } catch (err) {
        console.error("Error resizing", err);
      }
    }
  };

  const handleSubmit = async () => {
    if (!name || !province || !imagePreview) {
      alert("Por favor completa el nombre, la provincia y sube una foto.");
      return;
    }

    // --- VALIDACIÓN DE DUPLICADOS ---
    const normalizedName = normalize(name);
    const duplicate = existingDestinations.find(d => normalize(d.name) === normalizedName);

    if (duplicate) {
      alert(`⚠️ ¡Atención!\n\nEl destino "${duplicate.name}" ya existe en nuestra base de datos (Ubicación: ${duplicate.location}).\n\nPor favor verifica si es el mismo lugar.`);
      return;
    }

    const fullLocation = locationDetail ? `${locationDetail}, ${province}` : `${province}, ${region}`;

    setIsSubmitting(true);
    setAiStatus('Consultando a la IA experta en turismo...');
    
    try {
      const aiDetails = await generateDestinationDetails(name, fullLocation, category);
      
      setAiStatus('Guardando destino...');

      const newDestination = {
        name,
        location: fullLocation,
        region,
        province,
        category,
        imageUrl: imagePreview,
        gallery: [imagePreview],
        rating: 5.0,
        priceLevel: 'Variado',
        description: aiDetails.description,
        fullDescription: aiDetails.fullDescription,
        highlights: aiDetails.highlights,
        travelTips: aiDetails.travelTips
      };

      await onSubmit(newDestination);
      
      // Reset
      setName('');
      setProvince('');
      setLocationDetail('');
      setImagePreview(null);
      onClose();

    } catch (error) {
      console.error(error);
      alert("Hubo un error al crear el destino. Intenta de nuevo.");
    } finally {
      setIsSubmitting(false);
      setAiStatus('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/80 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        
        <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-cyan-600 text-white">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Globe size={24} />
            Agregar Nuevo Destino
          </h2>
          <button onClick={onClose} className="bg-white/20 p-2 rounded-full hover:bg-white/40 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl h-40 flex flex-col items-center justify-center cursor-pointer transition-colors ${
              imagePreview ? 'border-transparent p-0' : 'border-gray-300 hover:border-cyan-500 bg-gray-50 hover:bg-cyan-50'
            }`}
          >
            {imagePreview ? (
              <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-2xl" />
            ) : (
              <div className="text-center text-gray-500">
                <ImageIcon size={32} className="mx-auto mb-2 text-gray-400" />
                <p className="font-semibold text-sm">Sube una foto portada</p>
                <span className="text-xs">Requerido</span>
              </div>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleImageChange} 
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre del Lugar</label>
            <input
              type="text"
              placeholder="Ej: Laguna de Quilotoa"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-cyan-500"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Región</label>
                <select 
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-cyan-500"
                  value={region}
                  onChange={(e) => {
                     setRegion(e.target.value as EcuadorRegion);
                     setProvince('');
                  }}
                >
                   <option value="Costa">Costa</option>
                   <option value="Sierra">Sierra</option>
                   <option value="Amazonía">Amazonía</option>
                   <option value="Insular">Galápagos</option>
                </select>
             </div>
             <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Provincia</label>
                <select 
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-cyan-500"
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                >
                   <option value="">Seleccionar</option>
                   {provincesByRegion[region].map(p => (
                      <option key={p} value={p}>{p}</option>
                   ))}
                </select>
             </div>
          </div>

          <div>
             <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ciudad / Detalle (Opcional)</label>
             <input
               type="text"
               placeholder="Ej: Pujilí"
               className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-cyan-500"
               value={locationDetail}
               onChange={(e) => setLocationDetail(e.target.value)}
             />
          </div>

          <div>
             <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Categoría</label>
             <select 
               className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-cyan-500"
               value={category}
               onChange={(e) => setCategory(e.target.value)}
             >
                <option value="Naturaleza">Naturaleza</option>
                <option value="Playa">Playa</option>
                <option value="Montaña">Montaña</option>
                <option value="Selva">Selva</option>
                <option value="Cultura">Cultura</option>
                <option value="Aventura">Aventura</option>
                <option value="Gastronomía">Gastronomía</option>
             </select>
          </div>

          <div className="bg-yellow-50 p-3 rounded-lg flex gap-2 text-yellow-700 text-xs border border-yellow-100">
             <AlertTriangle size={16} className="shrink-0" />
             <p>El sistema verificará si este lugar ya existe antes de crearlo.</p>
          </div>

          <button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin" />
                <span className="text-sm">{aiStatus}</span>
              </>
            ) : (
              <>
                <Wand2 size={20} />
                <span>Generar con IA y Guardar</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
