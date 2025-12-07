import React, { useState, useRef } from 'react';
import { X, MapPin, Loader2, Image as ImageIcon, Wand2, Globe, AlertTriangle, CheckCircle, Search, Info } from 'lucide-react';
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
  
  // Estados para la verificación final
  const [isVerified, setIsVerified] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [showVerifyButton, setShowVerifyButton] = useState(true);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const provincesByRegion: Record<EcuadorRegion, string[]> = {
    'Costa': ['Manabí', 'Guayas', 'Santa Elena', 'El Oro', 'Esmeraldas', 'Los Ríos', 'Santo Domingo'],
    'Sierra': ['Pichincha', 'Azuay', 'Loja', 'Imbabura', 'Tungurahua', 'Cotopaxi', 'Chimborazo', 'Cañar', 'Carchi', 'Bolívar'],
    'Amazonía': ['Napo', 'Pastaza', 'Orellana', 'Sucumbíos', 'Morona Santiago', 'Zamora Chinchipe'],
    'Insular': ['Galápagos']
  };

  if (!isOpen) return null;

  // Normalización básica (quita tildes, a minúsculas, trim)
  const normalize = (text: string) => {
    return (text || "")
      .toString()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  };

  // Normalización estricta para comparación (sin espacios)
  const strictNormalize = (text: string) => {
    return normalize(text).replace(/\s+/g, '');
  };

  const handleInputChange = (setter: any, value: any) => {
    setter(value);
    setIsVerified(false);
    setShowVerifyButton(true);
    setVerificationError(null);
  };

  const handleVerify = () => {
    if (!name.trim() || !province || !imagePreview) {
        setVerificationError("⚠️ Faltan datos. Completa nombre, provincia y foto para verificar.");
        return;
    }

    const inputName = normalize(name);
    const inputStrict = strictNormalize(name);
    const inputProv = normalize(province);
    
    // Palabras que, si son la única diferencia, indican que es el MISMO lugar
    // Ej: "Playa Los Frailes" es lo mismo que "Los Frailes"
    const genericWords = ['playa', 'parque', 'reserva', 'bosque', 'laguna', 'cascada', 'volcan', 'isla', 'puerto', 'nacional', 'ecologica', 'refugio'];

    // Búsqueda inteligente de duplicados
    const duplicate = existingDestinations.find(d => {
        const dbName = normalize(d.name);
        const dbStrict = strictNormalize(d.name);
        const dbProv = normalize(d.province);

        // Si son provincias diferentes, NO es duplicado (Ej: Santa Rosa El Oro vs Santa Rosa Pichincha)
        if (dbProv !== inputProv) return false;

        // 1. Coincidencia Exacta (Siempre duplicado)
        if (dbStrict === inputStrict) return true;

        // 2. Coincidencia Parcial Inteligente
        // Solo marcamos duplicado si uno contiene al otro Y la diferencia son solo palabras genéricas
        if (dbName.includes(inputName) || inputName.includes(dbName)) {
            
            // Calculamos la diferencia de palabras
            const longer = dbName.length > inputName.length ? dbName : inputName;
            const shorter = dbName.length > inputName.length ? inputName : dbName;
            
            // Quitamos la parte común
            const difference = longer.replace(shorter, '').trim();
            
            // Si la diferencia es sustancial (no solo palabras genéricas), asumimos que son lugares distintos
            // Ej: "Machalilla" vs "Parque Nacional Machalilla" -> Diferencia "Parque Nacional" -> Distinto
            // Ej: "Frailes" vs "Playa Frailes" -> Diferencia "Playa" -> Duplicado
            
            const diffWords = difference.split(/\s+/);
            const isGenericDiff = diffWords.every(word => genericWords.includes(word) || word.length < 3);

            if (isGenericDiff) return true; // Es duplicado (solo varía en "Playa", "El", etc)
            
            // Si la diferencia es grande, permitimos crearlo (Ej: Machalilla pueblo vs Parque)
            return false;
        }
        
        return false;
    });

    if (duplicate) {
        setVerificationError(`❌ Conflicto: Ya existe "${duplicate.name}" en ${duplicate.province}.`);
        setIsVerified(false);
    } else {
        setVerificationError(null);
        setIsVerified(true);
        setShowVerifyButton(false);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const resized = await resizeImage(file, 1024);
        handleInputChange(setImagePreview, resized);
      } catch (err) {
        console.error("Error resizing", err);
      }
    }
  };

  const handleSubmit = async () => {
    if (!isVerified) return;

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
      setIsVerified(false);
      setShowVerifyButton(true);
      onClose();

    } catch (error) {
      console.error(error);
      alert("Error al crear. Intenta de nuevo.");
    } finally {
      setIsSubmitting(false);
      setAiStatus('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/80 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-cyan-600 text-white">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Globe size={24} />
            Agregar Nuevo Destino
          </h2>
          <button onClick={onClose} className="bg-white/20 p-2 rounded-full hover:bg-white/40 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5">
          
          {/* FOTO (Required) */}
          <div 
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl h-48 flex flex-col items-center justify-center cursor-pointer transition-colors relative overflow-hidden group ${
              imagePreview ? 'border-transparent p-0' : 'border-gray-300 hover:border-cyan-500 bg-gray-50 hover:bg-cyan-50'
              }`}
          >
              {imagePreview ? (
                <>
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-white font-bold flex items-center gap-2"><ImageIcon size={20}/> Cambiar Foto</span>
                  </div>
                </>
              ) : (
                <div className="text-center text-gray-400 group-hover:text-cyan-600 transition-colors">
                    <div className="bg-white p-3 rounded-full shadow-sm mb-2 w-fit mx-auto">
                      <ImageIcon size={24} />
                    </div>
                    <p className="font-bold text-sm">Sube una foto de portada</p>
                    <span className="text-xs">Obligatorio</span>
                </div>
              )}
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
          </div>

          {/* NOMBRE */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre del Lugar</label>
            <input
              type="text"
              placeholder="Ej: Laguna de Quilotoa"
              className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-cyan-500 text-sm font-semibold"
              value={name}
              onChange={(e) => handleInputChange(setName, e.target.value)}
            />
          </div>

          {/* UBICACIÓN */}
          <div className="grid grid-cols-2 gap-4">
              <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Región</label>
                  <select 
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
                    value={region}
                    onChange={(e) => {
                        handleInputChange(setRegion, e.target.value as EcuadorRegion);
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
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
                    value={province}
                    onChange={(e) => handleInputChange(setProvince, e.target.value)}
                  >
                    <option value="">Seleccionar</option>
                    {provincesByRegion[region].map(p => (
                        <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
              </div>
          </div>

          <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ciudad o Detalle (Opcional)</label>
              <input
                type="text"
                placeholder="Ej: Sector Quilotoa"
                className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
                value={locationDetail}
                onChange={(e) => handleInputChange(setLocationDetail, e.target.value)}
              />
          </div>

          <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Categoría</label>
              <div className="flex flex-wrap gap-2">
                  {['Naturaleza', 'Playa', 'Montaña', 'Selva', 'Cultura', 'Aventura', 'Gastronomía'].map(cat => (
                      <button
                          key={cat}
                          onClick={() => handleInputChange(setCategory, cat)}
                          className={`text-xs px-3 py-1.5 rounded-full border transition-all ${category === cat ? 'bg-cyan-600 text-white border-cyan-600 shadow-md' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                      >
                          {cat}
                      </button>
                  ))}
              </div>
          </div>

          {/* ZONA DE VERIFICACIÓN (Al final) */}
          <div className="pt-4 border-t border-gray-100">
             
             {verificationError && (
                <div className="mb-4 bg-red-50 text-red-600 text-sm p-3 rounded-xl flex items-start gap-2 font-bold animate-in slide-in-from-top-1 border border-red-100">
                    <AlertTriangle size={18} className="shrink-0 mt-0.5" /> 
                    <span>{verificationError}</span>
                </div>
             )}

             {isVerified && (
                <div className="mb-4 bg-green-50 text-green-700 text-sm p-3 rounded-xl flex items-center gap-2 font-bold animate-in slide-in-from-top-1 border border-green-100">
                    <CheckCircle size={18} /> 
                    <span>¡Lugar disponible! Puedes crearlo.</span>
                </div>
             )}

             {showVerifyButton ? (
                <button 
                    onClick={handleVerify}
                    className="w-full bg-stone-800 hover:bg-stone-900 text-white font-bold py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                    <Search size={18} /> Verificar Disponibilidad
                </button>
             ) : (
                <button 
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed animate-in fade-in zoom-in"
                >
                    {isSubmitting ? (
                    <>
                        <Loader2 className="animate-spin" />
                        <span className="text-sm font-medium">{aiStatus}</span>
                    </>
                    ) : (
                    <>
                        <Wand2 size={20} />
                        <span>Generar con IA y Guardar</span>
                    </>
                    )}
                </button>
             )}
          </div>

        </div>
      </div>
    </div>
  );
};