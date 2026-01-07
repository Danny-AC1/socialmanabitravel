
import React, { useState, useRef } from 'react';
import { Map, Mail, Lock, User, ArrowRight, Loader2, Info, Camera, X, ChevronLeft } from 'lucide-react';
import { AuthService } from '../services/authService';
import { User as UserType } from '../types';
import { resizeImage } from '../utils';

interface AuthScreenProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserType) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [view, setView] = useState<'login' | 'register' | 'forgot'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const resized = await resizeImage(file, 400); 
        setAvatar(resized);
      } catch (err) {
        console.error("Error al procesar avatar", err);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (view === 'login') {
        const user = await AuthService.login(email, password);
        onLoginSuccess(user);
      } else if (view === 'register') {
        if (!name || !email || !password) throw new Error('Completa los campos requeridos.');
        const user = await AuthService.register(name, email, password, bio, avatar || undefined);
        onLoginSuccess(user);
      } else if (view === 'forgot') {
        if (!email) throw new Error("Ingresa tu correo.");
        await AuthService.resetPassword(email);
        setSuccessMsg("Instrucciones enviadas al correo.");
        setTimeout(() => setView('login'), 3000);
      }
    } catch (err: any) {
      setError(err.message || 'Error inesperado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-900/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row relative max-h-[90vh]">
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-50 bg-white/20 p-2 rounded-full text-white hover:bg-white/40 md:text-stone-400 md:hover:bg-stone-100"
        >
          <X size={24} />
        </button>

        <div className="md:w-1/2 bg-manabi-600 relative p-8 text-white flex flex-col justify-between overflow-hidden">
          <div className="absolute inset-0">
            <img 
              src="https://images.unsplash.com/photo-1590577976322-3d2d6e213068?q=80&w=800&auto=format&fit=crop" 
              className="w-full h-full object-cover opacity-30 mix-blend-overlay" 
              alt="Manabí" 
            />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-6">
               <Map size={32} className="text-manabi-200" />
               <span className="text-2xl font-black tracking-tight">MANABÍ TRAVEL</span>
            </div>
            <h1 className="text-4xl font-bold mb-4 leading-tight">
              {view === 'login' ? 'Bienvenido de nuevo.' : 'Únete a la comunidad.'}
            </h1>
            <p className="text-manabi-100">
              Explora playas vírgenes, gastronomía única y la calidez de nuestra gente.
            </p>
          </div>
        </div>

        <div className="md:w-1/2 p-8 md:p-12 overflow-y-auto">
          <h2 className="text-2xl font-bold text-stone-800 mb-2">
            {view === 'login' ? 'Iniciar Sesión' : view === 'register' ? 'Crear Cuenta' : 'Recuperar'}
          </h2>

          {error && <div className="bg-red-50 text-red-500 p-3 rounded-xl text-sm mb-4">{error}</div>}
          {successMsg && <div className="bg-green-50 text-green-600 p-3 rounded-xl text-sm mb-4">{successMsg}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            {view === 'register' && (
              <div className="flex justify-center mb-4">
                 <div 
                   className="relative w-20 h-20 rounded-full bg-stone-100 border-2 border-dashed border-stone-300 flex items-center justify-center cursor-pointer overflow-hidden"
                   onClick={() => fileInputRef.current?.click()}
                 >
                    {avatar ? <img src={avatar} className="w-full h-full object-cover" /> : <Camera size={24} className="text-stone-400" />}
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarChange} />
                 </div>
              </div>
            )}

            {view === 'register' && (
              <input 
                type="text" placeholder="Nombre"
                className="w-full border p-3 rounded-xl outline-none focus:ring-2 focus:ring-manabi-500"
                value={name} onChange={e => setName(e.target.value)}
              />
            )}

            <input 
              type="email" placeholder="Correo"
              className="w-full border p-3 rounded-xl outline-none focus:ring-2 focus:ring-manabi-500"
              value={email} onChange={e => setEmail(e.target.value)}
            />

            {view !== 'forgot' && (
              <input 
                type="password" placeholder="Contraseña"
                className="w-full border p-3 rounded-xl outline-none focus:ring-2 focus:ring-manabi-500"
                value={password} onChange={e => setPassword(e.target.value)}
              />
            )}

            <button 
              type="submit" disabled={loading}
              className="w-full bg-manabi-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-manabi-700 transition-all flex items-center justify-center"
            >
              {loading ? <Loader2 className="animate-spin" /> : 'Continuar'} <ArrowRight size={18} className="ml-2" />
            </button>
          </form>

          <div className="mt-8 text-center text-sm">
              <button 
                  onClick={() => setView(view === 'login' ? 'register' : 'login')}
                  className="text-manabi-600 font-bold"
              >
                  {view === 'login' ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Entra'}
              </button>
              <div className="mt-4">
                <button onClick={onClose} className="text-stone-400 font-medium hover:underline">
                  Seguir como invitado
                </button>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
};
