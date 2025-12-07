import React from 'react';
import { X, Users } from 'lucide-react';
import { User } from '../types';

interface FollowListModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  users: User[];
  onUserClick: (id: string) => void;
}

export const FollowListModal: React.FC<FollowListModalProps> = ({ isOpen, onClose, title, users, onUserClick }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[65] flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[70vh]">
        
        <div className="p-4 border-b border-stone-100 flex justify-between items-center bg-white">
            <h3 className="font-bold text-stone-800 flex items-center gap-2">
                <Users size={18} className="text-cyan-600" />
                {title}
            </h3>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-stone-100 transition-colors">
                <X size={20} />
            </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
            {users.length === 0 ? (
                <div className="text-center py-10 text-stone-400 text-sm">
                    Lista vacía.
                </div>
            ) : (
                users.map(u => (
                    <div 
                        key={u.id}
                        onClick={() => { onUserClick(u.id); onClose(); }}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-stone-50 cursor-pointer transition-colors"
                    >
                        <img src={u.avatar} className="w-10 h-10 rounded-full object-cover" alt="" />
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm text-stone-800 truncate">{u.name}</p>
                            <p className="text-xs text-stone-500 truncate">{u.bio || 'Sin biografía'}</p>
                        </div>
                    </div>
                ))
            )}
        </div>
      </div>
    </div>
  );
};