
import React, { useState, useRef } from 'react';
import { X, MapPin, Loader2, Image as ImageIcon, Wand2, Globe, AlertTriangle, CheckCircle, Search, Save, FileText, List } from 'lucide-react';
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
  // Datos Básicos
  const [name, setName] = useState('');
  const [region, setRegion] = useState<EcuadorRegion>('Costa');
  const [province, setProvince] = useState('');
  const [locationDetail, setLocationDetail] = useState('');
  const [category, setCategory] = useState('Naturaleza');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // Datos Detallados (Editables)
  const [description, setDescription] = useState('');
  const [fullDescription, setFullDescription] = useState('');
  const [highlightsStr, setHighlightsStr] = useState('');
  const [travelTipsStr, setTravelTipsStr] = useState('');

  // Estados de UI
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [aiStatus, setAiStatus] = useState('');
  const [step, setStep] = useState<'basic' | 'review'>('basic');
  
  // Verificación
  const [verificationError, setVerificationError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const provincesByRegion: Record<EcuadorRegion, string[]> = {
    'Costa': ['Manabí', 'Guayas', 'Santa Elena', 'El Oro', 'Esmeraldas', 'Los Ríos', 'Santo Domingo'],
    'Sierra': ['Pichincha', 'Azuay', 'Loja', 'Imbabura', 'Tungurahua', 'Cotopaxi', 'Chimborazo', 'Cañar', 'Carchi', 'Bolívar'],
    'Amazonía': ['Napo', 'Pastaza', 'Orellana', 'Sucumbíos', 'Morona Santiago', 'Zamora Chinchipe'],
    'Insular': ['Galápagos']
  };

  if (!isOpen) return null;

  // --- LÓGICA DE NORMALIZACIÓN AVANZADA ---

  const normalize = (text: string) => {
    return (text || "")
      .toString()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") 
      .trim();
  };

  const isProtectedArea = (text: string) => {
      const t = normalize(text);
      return t.includes('parque nacional') || t.includes('reserva') || t.includes('refugio de vida');
  };

  const getCoreName = (text: string) => {
      let cleaned = normalize(text);
      // Palabras que son descriptores genéricos y NO parte del nombre propio único si están al inicio
      const descriptorsToRemove = ['playa ', 'balneario ', 'sector ', 'comuna ', 'recinto '];
      
      descriptorsToRemove.forEach(d => {
          if (cleaned.startsWith(d)) cleaned = cleaned.replace(d, '');
      });
      
      return cleaned.trim();
  };

  const resetForm = () => {
      setName('');
      setProvince('');
      setLocationDetail('');
      setImagePreview(null);
      setDescription('');
      setFullDescription('');
      setHighlightsStr('');
      setTravelTipsStr('');
      setVerificationError(null);
      setStep('basic');
      setRegion('Costa');
      setCategory('Naturaleza');
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    setVerificationError(null);
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

  // PASO 1: Verificar y Generar Datos
  const handleVerifyAndGenerate = async () => {
    // 1. Validaciones de Campos
    if (!name.trim() || name.trim().length < 3) {
      setVerificationError("El nombre es muy corto.");
      return;
    }
    if (!province) {
      alert("Por favor selecciona una provincia.");
      return;
    }
    if (!imagePreview) {
      alert("Por favor sube una foto de portada.");
      return;
    }

    // 2. Verificación de Duplicados Inteligente
    const duplicate = existingDestinations.find(d => {
        const inputIsProtected = isProtectedArea(name);
        const dbIsProtected = isProtectedArea(d.name);

        if (inputIsProtected !== dbIsProtected) {
            return false; 
        }

        const inputCore = getCoreName(name);
        const dbCore = getCoreName(d.name);

        return inputCore === dbCore;
    });

    if (duplicate) {
        setVerificationError(`Este lugar parece duplicado de: "${duplicate.name}". Intenta buscarlo en la lista.`);
        return;
    }

    // 3. Si todo está bien, procedemos a la IA
    const fullLocation = locationDetail ? `${locationDetail}, ${province}` : `${province}, ${region}`;

    setIsSubmitting(true);
    setAiStatus('Consultando experto IA...');
    setVerificationError(null);
    
    try {
      const aiDetails = await generateDestinationDetails(name, fullLocation, category);
      
      setDescription(aiDetails.description || '');
      setFullDescription(aiDetails.fullDescription || '');
      setHighlightsStr(Array.isArray(aiDetails.highlights) ? aiDetails.highlights.join('\n') : '');
      setTravelTipsStr(Array.isArray(aiDetails.travelTips) ? aiDetails.travelTips.join('\n') : '');

      setStep('review');

    } catch (error) {
      console.error(error);
      setDescription(`Un hermoso lugar para visitar en ${province}.`);
      setStep('review');
    } finally {
      setIsSubmitting(false);
      setAiStatus('');
    }
  };

  // PASO 2: Guardar Final
  const handleFinalSubmit = async () => {
      if (!description.trim()) {
          alert("Por favor completa la descripción del lugar.");
          return;
      }

      setIsSaving(true);
      const fullLocation = locationDetail ? `${locationDetail}, ${province}` : `${province}, ${region}`;

      const highlightsArray = highlightsStr.split('\n').filter(line => line.trim().length > 0);
      const tipsArray = travelTipsStr.split('\n').filter(line => line.trim().length > 0);

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
        description: description,
        fullDescription: fullDescription || description,
        highlights: highlightsArray.length > 0 ? highlightsArray : ["Paisajes increíbles"],
        travelTips: tipsArray.length > 0 ? tipsArray : ["Llevar cámara", "Ropa cómoda"]
      };

      await onSubmit(newDestination);
      setIsSaving(false);
      resetForm();
      onClose();
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-stone-900/90 backdrop-blur-md p-0 md:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-none md:rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col h-full md:h-auto md:max-h-[90vh]">
        
        <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-cyan-600 text-white shrink-0">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Globe size={24} />
            {step === 'basic' ? 'Nuevo Destino (1/2)' : 'Revisar Información (2/2)'}
          </h2>
          <button onClick={() => { resetForm(); onClose(); }} className="bg-white/20 p-2 rounded-full hover:bg-white/40 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5 flex-1 pb-32 md:pb-6">
          
          {/* VISTA 1: DATOS BÁSICOS */}
          {step === 'basic' && (
            <div className="space-y-5 animate-in slide-in-from-left-4">
                
                {/* Nombre */}
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Nombre del Lugar</label>
                    <input
                        type="text"
                        placeholder="Ej: Laguna de Quilotoa"
                        className={`w-full bg-white border rounded-xl p-3 outline-none focus:ring-2 transition-all ${verificationError ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-cyan-500'}`}
                        value={name}
                        onChange={handleNameChange}
                    />
                    {verificationError && (
                        <div className="bg-red-50 text-red-600 text-xs mt-2 p-2 rounded-lg flex items-center gap-2 font-bold animate-in slide-in-from-top-1 border border-red-100">
                            <AlertTriangle size={14} className="shrink-0" /> 
                            <span>{verificationError}</span>
                        </div>
                    )}
                </div>

                {/* Formulario Completo (Siempre visible) */}
                <div className="space-y-5">
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
                            <span className="text-xs">Requerido</span>
                        </div>
                        )}
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Región</label>
                            <select 
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
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
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
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
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ciudad o Detalle (Opcional)</label>
                        <input
                        type="text"
                        placeholder="Ej: Sector Quilotoa"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
                        value={locationDetail}
                        onChange={(e) => setLocationDetail(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Categoría</label>
                        <div className="flex flex-wrap gap-2">
                            {['Naturaleza', 'Playa', 'Montaña', 'Selva', 'Cultura', 'Aventura', 'Gastronomía'].map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setCategory(cat)}
                                    className={`text-xs px-3 py-1.5 rounded-full border transition-all ${category === cat ? 'bg-cyan-600 text-white border-cyan-600 shadow-md' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
          )}

          {/* VISTA 2: REVISIÓN Y EDICIÓN */}
          {step === 'review' && (
              <div className="space-y-5 animate-in slide-in-from-right-4">
                  <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-amber-800 text-xs flex gap-2 items-start">
                      <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                      <p>La IA ha generado este contenido. <strong>Por favor revísalo y corrígelo</strong> si la información es incorrecta o está incompleta.</p>
                  </div>

                  <div>
                      <label className="flex items-center text-xs font-bold text-gray-500 uppercase mb-1 gap-2">
                          <FileText size={14}/> Descripción Corta
                      </label>
                      <textarea 
                          className="w-full bg-white border border-gray-200 rounded-xl p-3 h-20 text-sm focus:ring-2 focus:ring-cyan-500 outline-none"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Resumen breve para la tarjeta..."
                      />
                  </div>

                  <div>
                      <label className="flex items-center text-xs font-bold text-gray-500 uppercase mb-1 gap-2">
                          <FileText size={14}/> Historia y Descripción Completa
                      </label>
                      <textarea 
                          className="w-full bg-white border border-gray-200 rounded-xl p-3 h-40 text-sm focus:ring-2 focus:ring-cyan-500 outline-none"
                          value={fullDescription}
                          onChange={(e) => setFullDescription(e.target.value)}
                          placeholder="Detalle completo del lugar..."
                      />
                  </div>

                  <div>
                      <label className="flex items-center text-xs font-bold text-gray-500 uppercase mb-1 gap-2">
                          <List size={14}/> Puntos Destacados (Uno por línea)
                      </label>
                      <textarea 
                          className="w-full bg-white border border-gray-200 rounded-xl p-3 h-24 text-sm focus:ring-2 focus:ring-cyan-500 outline-none"
                          value={highlightsStr}
                          onChange={(e) => setHighlightsStr(e.target.value)}
                          placeholder="Ej: Mirador Principal&#10;Sendero de los Dioses"
                      />
                  </div>

                  <div>
                      <label className="flex items-center text-xs font-bold text-gray-500 uppercase mb-1 gap-2">
                          <List size={14}/> Tips de Viajero (Uno por línea)
                      </label>
                      <textarea 
                          className="w-full bg-white border border-gray-200 rounded-xl p-3 h-24 text-sm focus:ring-2 focus:ring-cyan-500 outline-none"
                          value={travelTipsStr}
                          onChange={(e) => setTravelTipsStr(e.target.value)}
                          placeholder="Ej: Llevar protector solar&#10;Ir temprano"
                      />
                  </div>
              </div>
          )}

          {/* BOTONES DE ACCIÓN */}
          <div className="pt-2">
            {step === 'basic' && (
                <button 
                    onClick={handleVerifyAndGenerate}
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed active:scale-95"
                >
                    {isSubmitting ? (
                    <>
                        <Loader2 className="animate-spin" />
                        <span className="text-sm font-medium">{aiStatus}</span>
                    </>
                    ) : (
                    <>
                        <Wand2 size={20} />
                        <span>Verificar y Generar</span>
                    </>
                    )}
                </button>
            )}

            {step === 'review' && (
                <div className="flex gap-3">
                    <button 
                        onClick={() => setStep('basic')}
                        className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold py-4 rounded-xl transition-colors"
                    >
                        Atrás
                    </button>
                    <button 
                        onClick={handleFinalSubmit}
                        disabled={isSaving}
                        className="flex-[2] bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                        Confirmar y Guardar
                    </button>
                </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
