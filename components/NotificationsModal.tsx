import React from 'react';
import { X, Bell, Heart, MessageCircle, UserPlus, Image as ImageIcon, Video } from 'lucide-react';
import { Notification } from '../types';
import { StorageService } from '../services/storageService';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  currentUserId: string;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({ 
  isOpen, 
  onClose, 
  notifications,
  currentUserId 
}) => {
  if (!isOpen) return null;

  const handleMarkAsRead = async (notif: Notification) => {
      await StorageService.markNotificationRead(currentUserId, notif.id);
  };

  const handleClearAll = async () => {
      if(confirm("¿Borrar todas las notificaciones?")) {
          await StorageService.clearNotifications(currentUserId);
      }
  };

  const getIcon = (type: string) => {
      switch(type) {
          case 'like_post': return <Heart size={16} className="text-red-500 fill-red-500" />;
          case 'comment': return <MessageCircle size={16} className="text-blue-500" />;
          case 'follow': return <UserPlus size={16} className="text-green-500" />;
          case 'new_post': return <ImageIcon size={16} className="text-purple-500" />;
          case 'new_story': return <Video size={16} className="text-orange-500" />;
          default: return <Bell size={16} className="text-gray-500" />;
      }
  };

  const getText = (notif: Notification) => {
      switch(notif.type) {
          case 'like_post': return 'le gustó tu publicación.';
          case 'comment': return 'comentó en tu publicación.';
          case 'follow': return 'te comenzó a seguir.';
          case 'new_post': return 'subió una nueva publicación.';
          case 'new_story': return 'agregó una historia.';
          default: return 'hizo algo.';
      }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-end p-4 pt-16 pointer-events-none">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden pointer-events-auto border border-stone-200 animate-in slide-in-from-right-10 duration-300 max-h-[80vh] flex flex-col">
        
        <div className="p-4 border-b border-stone-100 flex justify-between items-center bg-stone-50">
            <h3 className="font-bold text-stone-800 flex items-center gap-2">
                <Bell size={18} className="text-cyan-600" />
                Notificaciones
            </h3>
            <div className="flex gap-2">
                {notifications.length > 0 && (
                    <button onClick={handleClearAll} className="text-xs text-red-500 font-bold hover:underline">
                        Borrar Todo
                    </button>
                )}
                <button onClick={onClose} className="text-stone-400 hover:text-stone-600">
                    <X size={20} />
                </button>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {notifications.length === 0 ? (
                <div className="text-center py-10 text-stone-400 text-sm">
                    <Bell size={32} className="mx-auto mb-2 opacity-20" />
                    No tienes notificaciones nuevas.
                </div>
            ) : (
                notifications.map(notif => (
                    <div 
                        key={notif.id}
                        onClick={() => handleMarkAsRead(notif)}
                        className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${notif.isRead ? 'bg-white hover:bg-stone-50' : 'bg-cyan-50/50 hover:bg-cyan-50 border-l-4 border-cyan-500'}`}
                    >
                        <div className="relative">
                            <img src={notif.senderAvatar} className="w-10 h-10 rounded-full object-cover border border-stone-200" alt="" />
                            <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                                {getIcon(notif.type)}
                            </div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-stone-800 line-clamp-2">
                                <span className="font-bold">{notif.senderName}</span> {getText(notif)}
                            </p>
                            <p className="text-[10px] text-stone-400 mt-0.5">
                                {new Date(notif.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </p>
                        </div>
                        {!notif.isRead && (
                            <div className="w-2 h-2 bg-cyan-500 rounded-full shrink-0"></div>
                        )}
                    </div>
                ))
            )}
        </div>
      </div>
    </div>
  );
};