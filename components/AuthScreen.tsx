import React, { useState, useRef } from 'react';
import { Map, Mail, Lock, User, ArrowRight, Loader2, Info, Camera, Upload, KeyRound, ChevronLeft } from 'lucide-react';
import { AuthService } from '../services/authService';
import { User as UserType } from '../types';
import { resizeImage } from '../utils';

interface AuthScreenProps {
  onLoginSuccess: (user: UserType) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess }) => {
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

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const resized = await resizeImage(file, 400); 
        setAvatar(resized);
      } catch (err) {
        console.error("Error resizing image", err);
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
        if (!name || !email || !password) {
          throw new Error('Por favor completa todos los campos requeridos.');
        }
        const user = await AuthService.register(name, email, password, bio, avatar || undefined);
        onLoginSuccess(user);
      } else if (view === 'forgot') {
        if (!email) throw new Error("Ingresa tu correo.");
        await AuthService.resetPassword(email);
        setSuccessMsg("¡Listo! Si el correo existe, recibirás instrucciones para restablecer tu contraseña.");
        setTimeout(() => setView('login'), 3000);
      }
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4 font-sans">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px]">
        
        <div className="md:w-1/2 bg-cyan-900 relative p-8 md:p-12 text-white flex flex-col justify-between">
          <div className="absolute inset-0 z-0">
            {/* Real Ecuador Landscape Image */}
            <img 
              src="https://images.unsplash.com/photo-1574966601746-86d79860b8e9?q=80&w=800&auto=format&fit=crop" 
              className="w-full h-full object-cover opacity-50 mix-blend-overlay" 
              alt="Ecuador Landscape" 
            />
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-950/90 to-blue-900/80" />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-6">
               <Map size={32} className="text-cyan-300" />
               <span className="text-2xl font-black tracking-tight">ECUADOR TRAVEL</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
              {view === 'login' ? 'Explora los 4 mundos.' : view === 'register' ? 'Tu aventura comienza.' : 'Recupera tu cuenta.'}
            </h1>
            <p className="text-cyan-100 text-lg">
              {view === 'login'
                ? 'Descubre playas, volcanes, selva y las islas encantadas.' 
                : view === 'register' 
                  ? 'Únete a la comunidad de viajeros más grande del país.'
                  : 'No te preocupes, te ayudamos a volver.'}
            </p>
          </div>

          <div className="relative z-10 text-xs text-cyan-200/60">
            © 2024 Ecuador Travel Network
          </div>
        </div>

        <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center overflow-y-auto max-h-screen">
          <div className="mb-2">
             {view === 'forgot' && (
                <button onClick={() => setView('login')} className="flex items-center text-sm text-stone-400 hover:text-cyan-600 mb-4 transition-colors">
                   <ChevronLeft size={16} className="mr-1" /> Volver al login
                </button>
             )}
             <h2 className="text-2xl font-bold text-stone-800">
               {view === 'login' ? 'Iniciar Sesión' : view === 'register' ? 'Crear Cuenta' : 'Restaurar Contraseña'}
             </h2>
          </div>

          <p className="text-stone-400 mb-8 text-sm">
            {view === 'login' ? 'Ingresa tus credenciales para acceder.' : view === 'register' ? 'Completa tus datos para registrarte.' : 'Ingresa tu correo para buscar tu cuenta.'}
          </p>

          {error && (
            <div className="bg-red-50 text-red-500 p-3 rounded-xl text-sm mb-6 flex items-center gap-2 animate-in slide-in-from-top-2">
              <Info size={16} />
              {error}
            </div>
          )}

          {successMsg && (
            <div className="bg-green-50 text-green-600 p-3 rounded-xl text-sm mb-6 flex items-center gap-2 animate-in slide-in-from-top-2">
              <Info size={16} />
              {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {view === 'register' && (
              <div className="flex justify-center mb-6">
                 <div 
                   className="relative w-24 h-24 rounded-full bg-stone-100 border-2 border-dashed border-stone-300 flex items-center justify-center cursor-pointer overflow-hidden hover:bg-stone-200 transition-colors"
                   onClick={() => fileInputRef.current?.click()}
                 >
                    {avatar ? (
                      <img src={avatar} className="w-full h-full object-cover" alt="Avatar" />
                    ) : (
                      <div className="flex flex-col items-center text-stone-400">
                        <Camera size={24} />
                        <span className="text-[10px] mt-1">Subir Foto</span>
                      </div>
                    )}
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*"
                      onChange={handleAvatarChange}
                    />
                 </div>
              </div>
            )}

            {view === 'register' && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-500 uppercase ml-1">Nombre Completo</label>
                <div className="relative">
                  <User className="absolute left-3 top-3.5 text-stone-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Ej: Juan Pérez"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl py-3 pl-10 px-4 focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-500 uppercase ml-1">Correo Electrónico</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 text-stone-400" size={18} />
                <input 
                  type="email" 
                  placeholder="hola@ejemplo.com"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl py-3 pl-10 px-4 focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {view !== 'forgot' && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-500 uppercase ml-1">Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 text-stone-400" size={18} />
                  <input 
                    type="password" 
                    placeholder="••••••••"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl py-3 pl-10 px-4 focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                {view === 'login' && (
                   <div className="text-right pt-1">
                      <button type="button" onClick={() => setView('forgot')} className="text-xs text-stone-400 hover:text-cyan-600 font-medium">
                         ¿Olvidaste tu contraseña?
                      </button>
                   </div>
                )}
              </div>
            )}

            {view === 'register' && (
               <div className="space-y-1">
                 <label className="text-xs font-bold text-stone-500 uppercase ml-1">Biografía Corta (Opcional)</label>
                 <textarea 
                   placeholder="Amante de la playa y el viche..."
                   className="w-full bg-stone-50 border border-stone-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-cyan-500 outline-none transition-all resize-none h-20"
                   value={bio}
                   onChange={(e) => setBio(e.target.value)}
                 />
               </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-cyan-200 hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center mt-6"
            >
              {loading ? <Loader2 className="animate-spin" /> : (
                <>
                  {view === 'login' ? 'Entrar ahora' : view === 'register' ? 'Registrarse' : 'Enviar Correo'} <ArrowRight size={18} className="ml-2" />
                </>
              )}
            </button>
          </form>

          {view !== 'forgot' && (
            <div className="mt-8 text-center">
                <p className="text-stone-500 text-sm">
                {view === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
                <button 
                    onClick={() => { setView(view === 'login' ? 'register' : 'login'); setError(''); }}
                    className="text-cyan-600 font-bold ml-1 hover:underline"
                >
                    {view === 'login' ? 'Regístrate aquí' : 'Inicia Sesión'}
                </button>
                </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};