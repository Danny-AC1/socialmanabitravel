
import React, { useState, useRef } from 'react';
import { X, Bed, Utensils, Info, CheckCircle, CreditCard, ChevronRight, ChevronLeft, Upload, Loader2, MessageCircle, DollarSign, Camera, Image as ImageIcon, Navigation, MapPin } from 'lucide-react';
import { ReservationOffer, ReservationItem, User, Booking } from '../types';
import { StorageService } from '../services/storageService';
import { resizeImage } from '../utils';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  offer: ReservationOffer;
  user: User;
}

export const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose, offer, user }) => {
  const [step, setStep] = useState<'select' | 'payment' | 'success'>('select');
  const [selectedItem, setSelectedItem] = useState<ReservationItem | null>(null);
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [galleryIndex, setGalleryIndex] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          setIsProcessing(true);
          const resized = await resizeImage(file, 800);
          setProofImage(resized);
          setIsProcessing(false);
      }
  };

  const handleConfirmBooking = async () => {
      if (!selectedItem || !proofImage) return;
      setIsProcessing(true);

      const booking: Booking = {
          id: `book_${Date.now()}`,
          userId: user.id,
          userName: user.name,
          offerId: offer.id,
          businessName: offer.businessName,
          offerType: offer.type,
          itemId: selectedItem.id,
          itemTitle: selectedItem.title,
          price: selectedItem.price,
          status: 'pending',
          proofUrl: proofImage,
          timestamp: Date.now()
      };

      await StorageService.createBooking(booking);
      
      // Lanzar WhatsApp
      const message = encodeURIComponent(
        `Hola ${offer.businessName}! Acabo de realizar una reserva por la app Ecuador Travel.\n\n` +
        `Reserva: ${selectedItem.title}\n` +
        `Usuario: ${user.name}\n` +
        `Monto: $${selectedItem.price}\n\n` +
        `Adjunto el comprobante de transferencia a continuación.`
      );
      
      window.open(`https://wa.me/${offer.businessPhone}?text=${message}`, '_blank');
      
      setIsProcessing(false);
      setStep('success');
  };

  const openGallery = (img: string, gallery: string[]) => {
      setViewingImage(img);
      setGalleryIndex(gallery.indexOf(img));
  };

  const nextImage = (e: React.MouseEvent, gallery: string[]) => {
      e.stopPropagation();
      const nextIdx = (galleryIndex + 1) % gallery.length;
      setGalleryIndex(nextIdx);
      setViewingImage(gallery[nextIdx]);
  };

  const prevImage = (e: React.MouseEvent, gallery: string[]) => {
      e.stopPropagation();
      const prevIdx = (galleryIndex - 1 + gallery.length) % gallery.length;
      setGalleryIndex(prevIdx);
      setViewingImage(gallery[prevIdx]);
  };

  const mapQuery = encodeURIComponent(`${offer.businessName} ${offer.businessAddress}`);
  const googleMapsUrl = offer.coordinates 
    ? `https://www.google.com/maps/dir/?api=1&destination=${offer.coordinates.latitude},${offer.coordinates.longitude}`
    : `https://www.google.com/maps/dir/?api=1&destination=${mapQuery}`;

  const embedUrl = offer.coordinates 
    ? `https://maps.google.com/maps?q=${offer.coordinates.latitude},${offer.coordinates.longitude}&t=&z=15&ie=UTF8&iwloc=&output=embed`
    : `https://maps.google.com/maps?q=${mapQuery}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-stone-900/90 backdrop-blur-md p-0 md:p-4 animate-in fade-in">
      <div className="bg-white w-full h-full md:max-w-2xl md:h-auto md:max-h-[95vh] md:rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col">
        
        <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-900 text-white shrink-0">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-white/10 rounded-xl">
                 {offer.type === 'hotel' ? <Bed size={24} /> : <Utensils size={24} />}
             </div>
             <div>
                 <h2 className="text-xl font-black">{offer.businessName}</h2>
                 <p className="text-[10px] uppercase font-black tracking-widest text-stone-400">Reserva de {offer.type === 'hotel' ? 'Habitación' : 'Menú'}</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-all"><X size={24} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-stone-50 pb-24 md:pb-6 no-scrollbar">
            {step === 'select' && (
                <div className="space-y-6 animate-in slide-in-from-right-4">
                    
                    {/* SECCIÓN DEL MAPA */}
                    <div className="bg-white p-2 rounded-[2rem] border border-stone-100 shadow-sm overflow-hidden mb-6">
                        <div className="relative h-40 rounded-[1.5rem] overflow-hidden bg-stone-100 mb-2">
                             <iframe 
                                title="Ubicación del establecimiento"
                                width="100%" 
                                height="100%" 
                                frameBorder="0" 
                                scrolling="no" 
                                marginHeight={0} 
                                marginWidth={0} 
                                src={embedUrl}
                                className="opacity-90"
                            ></iframe>
                        </div>
                        <div className="px-4 py-2 flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                                <MapPin size={16} className="text-manabi-600 shrink-0" />
                                <p className="text-[11px] font-bold text-stone-500 truncate">{offer.businessAddress}</p>
                            </div>
                            <a 
                                href={googleMapsUrl} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="bg-stone-900 text-white p-2.5 rounded-xl active:scale-95 transition-transform shadow-md shrink-0 ml-4"
                                title="Abrir en GPS"
                            >
                                <Navigation size={16} />
                            </a>
                        </div>
                    </div>

                    <h3 className="font-black text-stone-800 text-lg">Selecciona tu opción preferida</h3>
                    <div className="grid grid-cols-1 gap-4">
                        {offer.items.map(item => (
                            <div 
                                key={item.id} 
                                onClick={() => setSelectedItem(item)}
                                className={`bg-white rounded-3xl border-2 transition-all overflow-hidden cursor-pointer group ${selectedItem?.id === item.id ? 'border-manabi-600 shadow-xl' : 'border-stone-100 hover:border-stone-200 shadow-sm'}`}
                            >
                                <div className="h-48 relative overflow-hidden">
                                    <img src={item.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    {offer.type === 'hotel' && item.gallery && item.gallery.length > 0 && (
                                        <div className="absolute bottom-3 right-3 flex gap-1">
                                            {item.gallery.slice(0, 3).map((g, i) => (
                                                <button 
                                                    key={i} 
                                                    onClick={(e) => { e.stopPropagation(); openGallery(g, item.gallery!); }}
                                                    className="w-10 h-10 rounded-lg border-2 border-white shadow-lg overflow-hidden active:scale-90 transition-transform"
                                                >
                                                    <img src={g} className="w-full h-full object-cover" />
                                                </button>
                                            ))}
                                            {item.gallery.length > 3 && (
                                                <div className="w-10 h-10 rounded-lg bg-black/40 backdrop-blur-md border-2 border-white text-white flex items-center justify-center text-[10px] font-black">+{item.gallery.length - 3}</div>
                                            )}
                                        </div>
                                    )}
                                    <div className="absolute top-3 right-3 bg-white/95 px-3 py-1 rounded-full font-black text-manabi-700 shadow-lg text-sm">${item.price}</div>
                                </div>
                                <div className="p-5">
                                    <h4 className="font-black text-stone-800 text-lg mb-1">{item.title}</h4>
                                    <p className="text-stone-500 text-xs leading-relaxed">{item.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {step === 'payment' && selectedItem && (
                <div className="space-y-6 animate-in slide-in-from-right-4">
                    <div className="bg-manabi-50 p-6 rounded-3xl border border-manabi-100">
                        <h4 className="text-[10px] font-black uppercase text-manabi-600 tracking-[0.2em] mb-4">Detalles del Pago</h4>
                        <p className="text-stone-700 text-sm font-medium leading-relaxed whitespace-pre-wrap">{offer.bankDetails}</p>
                        <div className="mt-6 flex justify-between items-center border-t border-manabi-100 pt-4">
                            <span className="text-stone-500 text-xs font-bold">Total a transferir:</span>
                            <span className="text-2xl font-black text-manabi-700">${selectedItem.price}</span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <p className="text-xs font-black text-stone-400 uppercase tracking-widest">Sube tu comprobante</p>
                        <div 
                            onClick={() => !isProcessing && fileInputRef.current?.click()}
                            className={`h-48 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all relative overflow-hidden ${proofImage ? 'border-green-500 bg-green-50' : 'border-stone-200 hover:border-manabi-400 bg-white'}`}
                        >
                            {isProcessing ? (
                                <Loader2 className="animate-spin text-manabi-600" />
                            ) : proofImage ? (
                                <>
                                    <img src={proofImage} className="w-full h-full object-contain" />
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                        <span className="text-white text-xs font-black flex items-center gap-2"><ImageIcon size={18}/> Cambiar Foto</span>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center text-stone-400">
                                    <Camera size={32} className="mx-auto mb-2 opacity-20" />
                                    <p className="text-sm font-bold">Captura o Foto</p>
                                    <span className="text-[10px]">Toque para seleccionar</span>
                                </div>
                            )}
                        </div>
                        <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleFileUpload} />
                    </div>
                </div>
            )}

            {step === 'success' && (
                <div className="flex flex-col items-center justify-center py-12 text-center animate-in zoom-in duration-300">
                    <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6 text-green-600">
                        <CheckCircle size={64} />
                    </div>
                    <h2 className="text-2xl font-black text-stone-800 mb-2">¡Solicitud Enviada!</h2>
                    <p className="text-stone-500 max-w-xs mx-auto text-sm leading-relaxed mb-8">
                        Tu comprobante se ha guardado. También te hemos redirigido a WhatsApp para notificar a la empresa.
                    </p>
                    <button onClick={onClose} className="bg-stone-900 text-white font-black px-10 py-4 rounded-2xl shadow-xl active:scale-95 transition-transform uppercase tracking-widest text-xs">Finalizar</button>
                </div>
            )}
        </div>

        {step !== 'success' && (
            <div className="p-4 md:p-6 bg-white border-t border-stone-100 shrink-0">
                <div className="flex gap-3">
                    {step === 'payment' && (
                        <button onClick={() => setStep('select')} className="flex-1 bg-stone-100 text-stone-600 font-black py-4 rounded-2xl active:scale-95 transition-all text-xs uppercase">Atrás</button>
                    )}
                    <button 
                        onClick={() => step === 'select' ? (selectedItem && setStep('payment')) : handleConfirmBooking()}
                        disabled={step === 'select' ? !selectedItem : !proofImage || isProcessing}
                        className="flex-[2] bg-manabi-600 text-white font-black py-4 rounded-2xl shadow-xl disabled:opacity-50 active:scale-95 transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                    >
                        {isProcessing ? <Loader2 className="animate-spin" /> : step === 'select' ? 'Continuar' : 'Confirmar Reserva'}
                    </button>
                </div>
            </div>
        )}

        {/* IMAGE VIEWER FOR ROOM GALLERY */}
        {viewingImage && selectedItem?.gallery && (
            <div className="fixed inset-0 z-[500] bg-black/95 flex items-center justify-center p-4 animate-in fade-in" onClick={() => setViewingImage(null)}>
                <button onClick={() => setViewingImage(null)} className="absolute top-6 right-6 text-white/70 hover:text-white"><X size={32} /></button>
                
                {selectedItem.gallery.length > 1 && (
                    <>
                        <button onClick={(e) => prevImage(e, selectedItem.gallery!)} className="absolute left-4 top-1/2 -translate-y-1/2 p-4 text-white bg-white/10 rounded-full hover:bg-white/20 transition-all"><ChevronLeft size={32} /></button>
                        <button onClick={(e) => nextImage(e, selectedItem.gallery!)} className="absolute right-4 top-1/2 -translate-y-1/2 p-4 text-white bg-white/10 rounded-full hover:bg-white/20 transition-all"><ChevronRight size={32} /></button>
                    </>
                )}

                <img src={viewingImage} className="max-w-full max-h-[80vh] object-contain shadow-2xl rounded-xl" onClick={(e) => e.stopPropagation()} />
                
                <div className="absolute bottom-10 bg-black/50 backdrop-blur-md px-6 py-2 rounded-full border border-white/10 text-white text-xs font-black uppercase tracking-widest">
                    Foto {galleryIndex + 1} de {selectedItem.gallery.length}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};
