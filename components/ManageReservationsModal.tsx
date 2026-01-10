
import React, { useState, useRef, useEffect } from 'react';
import { X, Plus, Trash2, Camera, Loader2, Save, MapPin, Bed, Utensils, Info, Phone, CreditCard, ChevronDown, ChevronUp, Image as ImageIcon, Users, CheckCircle, Navigation } from 'lucide-react';
import { Destination, ReservationOffer, ReservationItem, Booking } from '../types';
import { StorageService } from '../services/storageService';
import { resizeImage } from '../utils';
import { db } from '../services/firebase';
import { ref, onValue } from '@firebase/database';

interface ManageReservationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  destinations: Destination[];
}

export const ManageReservationsModal: React.FC<ManageReservationsModalProps> = ({ isOpen, onClose, destinations }) => {
  const [view, setView] = useState<'offers' | 'create' | 'bookings'>('offers');
  const [offers, setOffers] = useState<ReservationOffer[]>([]);
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Create Offer Form
  const [offerType, setOfferType] = useState<'hotel' | 'restaurant'>('hotel');
  const [businessName, setBusinessName] = useState('');
  const [selectedDestId, setSelectedDestId] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');
  const [bankDetails, setBankDetails] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [items, setItems] = useState<ReservationItem[]>([]);
  
  // New Item State (Form temporal para cada opción)
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemImage, setNewItemImage] = useState<string | null>(null);
  const [newItemGallery, setNewItemGallery] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
        const offersRef = ref(db, 'reservationOffers');
        const unsubOffers = onValue(offersRef, (snapshot) => {
            setOffers(snapshot.val() ? Object.values(snapshot.val()) : []);
        });

        const booksRef = ref(db, 'bookings');
        const unsubBookings = onValue(booksRef, (snapshot) => {
            setAllBookings(snapshot.val() ? Object.values(snapshot.val()) : []);
        });

        return () => {
            unsubOffers();
            unsubBookings();
        };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isGallery = false) => {
      const file = e.target.files?.[0];
      if (file) {
          setIsLoading(true);
          try {
              const resized = await resizeImage(file, 800);
              if (isGallery) {
                  setNewItemGallery(prev => [...prev, resized]);
              } else {
                  setNewItemImage(resized);
              }
          } catch (err) {
              alert("Error al procesar la imagen.");
          } finally {
              setIsLoading(false);
          }
      }
  };

  // FUNCIONAL: Añadir un ítem a la lista de opciones de la oferta
  const addItemToOffer = () => {
      if (!newItemTitle.trim()) {
          alert("Ingresa un título para esta opción.");
          return;
      }
      if (!newItemPrice || parseFloat(newItemPrice) <= 0) {
          alert("Ingresa un precio válido.");
          return;
      }
      if (!newItemImage) {
          alert("Sube una foto representativa para esta opción.");
          return;
      }

      const newItem: ReservationItem = {
          id: `item_${Date.now()}`,
          title: newItemTitle,
          description: newItemDesc,
          price: parseFloat(newItemPrice),
          imageUrl: newItemImage,
          gallery: offerType === 'hotel' ? newItemGallery : undefined
      };

      setItems(prev => [...prev, newItem]);
      
      // Limpiar formulario del ítem
      setNewItemTitle('');
      setNewItemPrice('');
      setNewItemDesc('');
      setNewItemImage(null);
      setNewItemGallery([]);
  };

  // FUNCIONAL: Guardar la oferta completa en la base de datos
  const handleSaveOffer = async () => {
      if (!businessName.trim()) {
          alert("Ingresa el nombre de la empresa.");
          return;
      }
      if (!selectedDestId) {
          alert("Selecciona el destino turístico asociado.");
          return;
      }
      if (!businessPhone.trim()) {
          alert("Ingresa un WhatsApp de contacto.");
          return;
      }
      if (items.length === 0) {
          alert("Debes añadir al menos una opción (habitación o menú) a la lista.");
          return;
      }

      setIsLoading(true);
      const dest = destinations.find(d => d.id === selectedDestId);
      
      const newOffer: ReservationOffer = {
          id: `off_${Date.now()}`,
          destinationId: selectedDestId,
          destinationName: dest?.name || "Desconocido",
          type: offerType,
          businessName,
          businessAddress,
          businessPhone,
          bankDetails,
          items,
          createdAt: Date.now(),
          coordinates: lat && lng ? {
              latitude: parseFloat(lat),
              longitude: parseFloat(lng)
          } : undefined
      };

      try {
          await StorageService.saveReservationOffer(newOffer);
          alert("¡Oferta de reserva publicada con éxito!");
          resetForm();
          setView('offers');
      } catch (err) {
          alert("Error al guardar la oferta. Intenta de nuevo.");
      } finally {
          setIsLoading(false);
      }
  };

  const resetForm = () => {
      setBusinessName('');
      setBusinessAddress('');
      setBusinessPhone('');
      setBankDetails('');
      setSelectedDestId('');
      setLat('');
      setLng('');
      setItems([]);
      setNewItemTitle('');
      setNewItemPrice('');
      setNewItemDesc('');
      setNewItemImage(null);
      setNewItemGallery([]);
  };

  const handleDeleteOffer = async (id: string) => {
      if (confirm("¿Eliminar esta oferta de reserva permanentemente?")) {
          await StorageService.deleteReservationOffer(id);
      }
  };

  const handleUpdateStatus = async (id: string, status: Booking['status']) => {
      await StorageService.updateBookingStatus(id, status);
  };

  const handleDeleteBooking = async (id: string) => {
      if (confirm("¿Borrar registro de reserva?")) {
          await StorageService.deleteBooking(id);
      }
  };

  return (
    <div className="fixed inset-0 z-[350] flex items-center justify-center bg-stone-900/90 backdrop-blur-md p-0 md:p-4 animate-in fade-in">
      <div className="bg-white w-full h-full md:max-w-4xl md:h-auto md:max-h-[90vh] md:rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col">
        
        <div className="p-6 bg-manabi-600 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
             <CreditCard size={24} />
             <div>
                 <h2 className="text-xl font-black">Panel de Reservas</h2>
                 <p className="text-[10px] uppercase font-black tracking-widest text-manabi-200">Administración de Ecuador Travel</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-all"><X size={24} /></button>
        </div>

        <div className="flex bg-stone-100 p-1 border-b border-stone-200">
            <button onClick={() => setView('offers')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${view === 'offers' ? 'bg-white text-manabi-600 shadow-sm' : 'text-stone-400'}`}>Ofertas Activas</button>
            <button onClick={() => setView('bookings')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${view === 'bookings' ? 'bg-white text-manabi-600 shadow-sm' : 'text-stone-400'}`}>Reservas Recibidas</button>
            <button onClick={() => setView('create')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${view === 'create' ? 'bg-white text-manabi-600 shadow-sm' : 'text-stone-400'}`}>Nueva Oferta +</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-stone-50 pb-24 md:pb-6">
            {view === 'offers' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in">
                    {offers.map(off => (
                        <div key={off.id} className="bg-white p-5 rounded-3xl border border-stone-100 shadow-sm group">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-2">
                                    <div className={`p-2 rounded-xl ${off.type === 'hotel' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                                        {off.type === 'hotel' ? <Bed size={18} /> : <Utensils size={18} />}
                                    </div>
                                    <div>
                                        <h4 className="font-black text-stone-800 leading-tight">{off.businessName}</h4>
                                        <span className="text-[9px] font-black text-stone-400 uppercase flex items-center gap-1"><MapPin size={10} /> {off.destinationName}</span>
                                    </div>
                                </div>
                                <button onClick={() => handleDeleteOffer(off.id)} className="text-stone-200 hover:text-red-500 transition-colors p-1"><Trash2 size={16} /></button>
                            </div>
                            <p className="text-xs text-stone-500 mb-4 font-medium">{off.items.length} opciones configuradas</p>
                            <div className="flex justify-between items-center text-[10px] font-bold text-stone-400 border-t border-stone-50 pt-3">
                                <span className="flex items-center gap-1"><Navigation size={10} /> {off.coordinates ? 'Mapa configurado' : 'Sin mapa'}</span>
                                <span className="text-manabi-600 font-black">ACTIVA</span>
                            </div>
                        </div>
                    ))}
                    {offers.length === 0 && (
                        <div className="col-span-2 py-20 text-center text-stone-300">
                             <ImageIcon size={48} className="mx-auto mb-2 opacity-20" />
                             <p className="text-sm font-black uppercase tracking-widest">No hay ofertas creadas</p>
                        </div>
                    )}
                </div>
            )}

            {view === 'bookings' && (
                <div className="space-y-4 animate-in fade-in">
                    {allBookings.map(book => (
                        <div key={book.id} className="bg-white p-5 rounded-3xl border border-stone-100 shadow-sm flex flex-col md:flex-row gap-4 md:items-center">
                            <div className="w-16 h-16 rounded-2xl bg-stone-100 overflow-hidden shrink-0 border border-stone-200">
                                <img src={book.proofUrl} className="w-full h-full object-cover cursor-pointer" onClick={() => window.open(book.proofUrl, '_blank')} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-black text-stone-800 text-sm truncate">{book.userName}</h4>
                                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase ${book.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {book.status === 'confirmed' ? 'Confirmado' : 'Pendiente'}
                                    </span>
                                </div>
                                <p className="text-xs text-stone-500 font-bold uppercase tracking-tight">{book.businessName} - {book.itemTitle}</p>
                                <p className="text-[10px] text-stone-300 mt-1">{new Date(book.timestamp).toLocaleString()}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-lg font-black text-manabi-600">${book.price}</span>
                                <div className="flex gap-1">
                                    <button onClick={() => handleUpdateStatus(book.id, 'confirmed')} title="Confirmar Reserva" className="p-2 bg-green-50 text-green-600 rounded-xl hover:bg-green-600 hover:text-white transition-all"><CheckCircle size={18} /></button>
                                    <button onClick={() => handleDeleteBooking(book.id)} title="Eliminar Registro" className="p-2 bg-stone-50 text-stone-300 rounded-xl hover:bg-red-50 hover:text-red-500 transition-all"><Trash2 size={18} /></button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {allBookings.length === 0 && (
                        <div className="py-20 text-center text-stone-300">
                             <Users size={48} className="mx-auto mb-2 opacity-20" />
                             <p className="text-sm font-black uppercase tracking-widest">No hay reservas recibidas</p>
                        </div>
                    )}
                </div>
            )}

            {view === 'create' && (
                <div className="space-y-6 animate-in slide-in-from-bottom-4">
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-100 space-y-4">
                        <h3 className="font-black text-stone-800 text-lg border-b border-stone-50 pb-3 mb-4">Información General</h3>
                        
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => setOfferType('hotel')} className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${offerType === 'hotel' ? 'border-manabi-600 bg-manabi-50 text-manabi-700' : 'border-stone-100 text-stone-400'}`}>
                                <Bed size={24} />
                                <span className="text-[10px] font-black uppercase">Hotel</span>
                            </button>
                            <button onClick={() => setOfferType('restaurant')} className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${offerType === 'restaurant' ? 'border-manabi-600 bg-manabi-50 text-manabi-700' : 'border-stone-100 text-stone-400'}`}>
                                <Utensils size={24} />
                                <span className="text-[10px] font-black uppercase">Restaurante</span>
                            </button>
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest block mb-2">Destino Turístico</label>
                            <select 
                                className="w-full p-4 bg-stone-50 rounded-2xl border border-stone-200 outline-none text-sm font-bold"
                                value={selectedDestId}
                                onChange={e => setSelectedDestId(e.target.value)}
                            >
                                <option value="">Seleccionar destino...</option>
                                {destinations.map(d => <option key={d.id} value={d.id}>{d.name} ({d.province})</option>)}
                            </select>
                        </div>

                        <input placeholder="Nombre de la Empresa" className="w-full p-4 bg-stone-50 rounded-2xl border border-stone-200 outline-none text-sm font-bold" value={businessName} onChange={e => setBusinessName(e.target.value)} />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input placeholder="WhatsApp (Ej: 5939...)" className="w-full p-4 bg-stone-50 rounded-2xl border border-stone-200 outline-none text-sm font-bold" value={businessPhone} onChange={e => setBusinessPhone(e.target.value)} />
                            <input placeholder="Dirección exacta" className="w-full p-4 bg-stone-50 rounded-2xl border border-stone-200 outline-none text-sm font-bold" value={businessAddress} onChange={e => setBusinessAddress(e.target.value)} />
                        </div>

                        <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100">
                             <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest block mb-3">Ubicación GPS (Para Mapa)</label>
                             <div className="grid grid-cols-2 gap-4">
                                <input placeholder="Latitud (Ej: -1.0541)" className="w-full p-3 bg-white rounded-xl border border-stone-200 outline-none text-xs font-bold" value={lat} onChange={e => setLat(e.target.value)} />
                                <input placeholder="Longitud (Ej: -80.4544)" className="w-full p-3 bg-white rounded-xl border border-stone-200 outline-none text-xs font-bold" value={lng} onChange={e => setLng(e.target.value)} />
                             </div>
                             <p className="text-[9px] text-stone-400 mt-2 italic">* Consigue estas coordenadas en Google Maps haciendo clic derecho sobre el lugar.</p>
                        </div>

                        <textarea placeholder="Datos bancarios para transferencia (Banco, Cuenta, Nombre, Cédula...)" className="w-full p-4 bg-stone-50 rounded-2xl border border-stone-200 outline-none text-sm font-medium h-32 resize-none" value={bankDetails} onChange={e => setBankDetails(e.target.value)} />
                    </div>

                    {/* ITEMS BUILDER */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-100 space-y-4">
                        <h3 className="font-black text-stone-800 text-lg border-b border-stone-50 pb-3 mb-4">Opciones de Reserva</h3>
                        
                        <div className="bg-stone-50 p-5 rounded-[2rem] border border-stone-100 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div 
                                    onClick={() => !isLoading && fileInputRef.current?.click()}
                                    className="h-32 md:h-full bg-white rounded-2xl border-2 border-dashed border-stone-200 flex flex-col items-center justify-center cursor-pointer hover:bg-stone-100 transition-colors overflow-hidden relative"
                                >
                                    {newItemImage ? <img src={newItemImage} className="w-full h-full object-cover" /> : <ImageIcon size={24} className="text-stone-300" />}
                                    <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={(e) => handleFileUpload(e)} />
                                </div>
                                <div className="md:col-span-2 space-y-3">
                                    <input placeholder="Título (Habitación Triple / Menú Degustación)" className="w-full p-3 bg-white rounded-xl border border-stone-100 outline-none text-sm font-bold" value={newItemTitle} onChange={e => setNewItemTitle(e.target.value)} />
                                    <div className="flex gap-2">
                                        <input type="number" placeholder="Precio $" className="w-24 p-3 bg-white rounded-xl border border-stone-100 outline-none text-sm font-bold" value={newItemPrice} onChange={e => setNewItemPrice(e.target.value)} />
                                        <input placeholder="Breve descripción..." className="flex-1 p-3 bg-white rounded-xl border border-stone-100 outline-none text-sm" value={newItemDesc} onChange={e => setNewItemDesc(e.target.value)} />
                                    </div>
                                </div>
                            </div>
                            
                            {offerType === 'hotel' && (
                                <div className="space-y-3">
                                    <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Galería de habitación (opcional)</p>
                                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                                        <button onClick={() => galleryInputRef.current?.click()} className="w-16 h-16 rounded-xl border-2 border-dashed border-stone-200 shrink-0 flex items-center justify-center text-stone-400 hover:bg-white transition-colors">
                                            <Plus size={20} />
                                        </button>
                                        {newItemGallery.map((img, i) => (
                                            <img key={i} src={img} className="w-16 h-16 rounded-xl object-cover border border-white shadow-sm shrink-0" />
                                        ))}
                                        <input type="file" ref={galleryInputRef} hidden accept="image/*" onChange={(e) => handleFileUpload(e, true)} />
                                    </div>
                                </div>
                            )}

                            <button 
                                onClick={addItemToOffer} 
                                className="w-full bg-stone-900 text-white font-black py-3 rounded-2xl text-[10px] uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                <Plus size={16} /> Añadir a la lista
                            </button>
                        </div>

                        {/* LISTA DE ITEMS AÑADIDOS */}
                        <div className="space-y-2 mt-4">
                            {items.length > 0 && <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2">{items.length} Opciones añadidas:</p>}
                            {items.map((it, idx) => (
                                <div key={it.id} className="flex items-center gap-4 bg-stone-50 p-3 rounded-2xl border border-stone-100 animate-in slide-in-from-right-2">
                                    <img src={it.imageUrl} className="w-12 h-12 rounded-xl object-cover" />
                                    <div className="flex-1 min-w-0">
                                        <h5 className="font-bold text-sm text-stone-800 truncate">{it.title}</h5>
                                        <p className="text-xs text-manabi-600 font-black">${it.price}</p>
                                    </div>
                                    <button onClick={() => setItems(items.filter((_, i) => i !== idx))} className="text-stone-300 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button 
                        onClick={handleSaveOffer} 
                        disabled={isLoading || items.length === 0}
                        className="w-full bg-manabi-600 text-white font-black py-4 rounded-3xl shadow-xl active:scale-95 transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale"
                    >
                        {isLoading ? <Loader2 className="animate-spin" /> : <><Save size={20}/> Guardar Oferta de Reserva</>}
                    </button>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
