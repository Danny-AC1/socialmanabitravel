import React, { useState } from 'react';
import { X, Search, User, Mail, Users as UsersIcon, Shield } from 'lucide-react';
import { User as UserType } from '../types';
import { isAdmin } from '../utils';

interface AdminUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: UserType[];
}

export const AdminUsersModal: React.FC<AdminUsersModalProps> = ({ isOpen, onClose, users }) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="bg-stone-800 p-5 flex justify-between items-center text-white">
          <div className="flex items-center gap-3">
            <div className="bg-cyan-500 p-2 rounded-full text-white">
                <UsersIcon size={24} />
            </div>
            <div>
                <h2 className="text-xl font-bold">Usuarios Registrados</h2>
                <p className="text-xs text-stone-400">Total: {users.length} usuarios</p>
            </div>
          </div>
          <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-stone-100 bg-stone-50">
            <div className="relative">
                <Search className="absolute left-3 top-3 text-stone-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Buscar por nombre o correo..." 
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-cyan-500 outline-none text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </div>

        {/* Users List */}
        <div className="flex-1 overflow-y-auto p-4 bg-white space-y-3">
          {filteredUsers.length > 0 ? (
            filteredUsers.map(user => {
                const isUserAdmin = isAdmin(user.email);
                return (
                    <div key={user.id} className="flex items-center justify-between p-3 rounded-xl border border-stone-100 hover:border-cyan-200 hover:bg-cyan-50/30 transition-all group">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-full object-cover border border-stone-200" />
                                {isUserAdmin && (
                                    <div className="absolute -bottom-1 -right-1 bg-cyan-600 text-white p-0.5 rounded-full border-2 border-white" title="Administrador">
                                        <Shield size={10} fill="currentColor" />
                                    </div>
                                )}
                            </div>
                            <div>
                                <h3 className="font-bold text-stone-800 text-sm flex items-center gap-2">
                                    {user.name}
                                    {isUserAdmin && <span className="text-[10px] bg-cyan-100 text-cyan-700 px-2 py-0.5 rounded-full">Admin</span>}
                                </h3>
                                <div className="flex items-center gap-1 text-xs text-stone-500">
                                    <Mail size={12} />
                                    {user.email}
                                </div>
                            </div>
                        </div>
                        
                        <div className="text-right">
                            <div className="text-xs font-bold text-stone-600">
                                {user.followers?.length || 0} Seguidores
                            </div>
                            <div className="text-[10px] text-stone-400">
                                ID: {user.id.substring(0, 8)}...
                            </div>
                        </div>
                    </div>
                );
            })
          ) : (
            <div className="text-center py-10 text-stone-400">
                <User size={48} className="mx-auto mb-2 opacity-20" />
                <p>No se encontraron usuarios.</p>
            </div>
          )}
        </div>
        
        <div className="p-3 bg-stone-50 text-center text-[10px] text-stone-400 border-t border-stone-100">
            Panel de Administración - Ecuador Travel
        </div>
      </div>
    </div>
  );
};