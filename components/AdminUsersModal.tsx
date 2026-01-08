
import React from 'react';
import { X, Users, Mail, Calendar, ShieldCheck } from 'lucide-react';
import { User } from '../types';

interface AdminUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
}

export const AdminUsersModal: React.FC<AdminUsersModalProps> = ({ isOpen, onClose, users }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-stone-900/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        <div className="bg-stone-800 p-5 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <Users size={24} className="text-manabi-400" />
            <div>
              <h2 className="text-lg font-bold">Usuarios Registrados</h2>
              <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">{users.length} miembros en total</p>
            </div>
          </div>
          <button onClick={onClose} className="hover:bg-white/10 p-2 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-stone-50 space-y-3">
          {users.map(u => (
            <div key={u.id} className="bg-white p-4 rounded-2xl border border-stone-100 shadow-sm flex items-center justify-between group hover:border-manabi-200 transition-colors">
              <div className="flex items-center gap-4">
                <img src={u.avatar} className="w-12 h-12 rounded-full object-cover border-2 border-stone-50" alt="" />
                <div>
                  <h4 className="font-bold text-stone-800 text-sm flex items-center gap-1">
                    {u.name}
                    {u.points && u.points > 500 && <ShieldCheck size={14} className="text-manabi-500" />}
                  </h4>
                  <div className="flex flex-col gap-0.5">
                    <p className="text-xs text-stone-500 flex items-center gap-1"><Mail size={10} /> {u.email}</p>
                    <p className="text-[10px] text-stone-400 flex items-center gap-1"><Calendar size={10} /> ID: {u.id}</p>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="bg-manabi-50 text-manabi-700 text-[10px] font-bold px-2 py-1 rounded-full border border-manabi-100">
                  {u.points || 0} XP
                </div>
              </div>
            </div>
          ))}
          {users.length === 0 && (
            <div className="py-20 text-center text-stone-400">
              <Users size={48} className="mx-auto mb-2 opacity-20" />
              <p>Cargando lista de usuarios...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
