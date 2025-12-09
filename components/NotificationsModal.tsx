import React from 'react';
import { X, Heart, MessageCircle, UserPlus, Bell, Info, Image as ImageIcon, Camera } from 'lucide-react';
import { Notification } from '../types';
import { StorageService } from '../services/storageService';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  currentUserId: string;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({ isOpen, onClose, notifications, currentUserId }) => {
  if (!isOpen) return null;

  const handleMarkAsRead = async (notifId: string) => {
    await StorageService.markNotificationRead(currentUserId, notifId);
  };

  const handleClearAll = async () => {
    if (confirm('¿Borrar todas las notificaciones?')) {
      await StorageService.clearNotifications(currentUserId);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'like':
      case 'like_post':
        return <Heart className="text-red-500 fill-red-500" size={18} />;
      case 'comment':
        return <MessageCircle className="text-blue-500 fill-blue-500" size={18} />;
      case 'follow':
        return <UserPlus className="text-green-500" size={18} />;
      case 'new_post':
        return <Camera className="text-purple-500" size={18} />;
      case 'new_story':
        return <ImageIcon className="text-pink-500" size={18} />;
      case 'system':
      default:
        return <Info className="text-gray-500" size={18} />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
        
        <div className="bg-white p-4 border-b border-gray-100 flex justify-between items-center sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <Bell size={20} className="text-cyan-600" />
            <h2 className="text-lg font-bold text-gray-800">Notificaciones</h2>
          </div>
          <div className="flex gap-2">
            {notifications.length > 0 && (
                <button onClick={handleClearAll} className="text-xs text-red-500 font-bold hover:bg-red-50 px-3 py-1.5 rounded-full transition-colors">
                    Borrar todo
                </button>
            )}
            <button onClick={onClose} className="bg-gray-100 p-2 rounded-full text-gray-500 hover:bg-gray-200 transition-colors">
                <X size={20} />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 bg-stone-50">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-stone-400">
              <Bell size={48} className="mb-4 opacity-20" />
              <p>No tienes notificaciones nuevas</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((notif) => (
                <div 
                  key={notif.id} 
                  className={`p-4 flex gap-3 hover:bg-white transition-colors cursor-pointer ${!notif.isRead ? 'bg-cyan-50/50' : ''}`}
                  onClick={() => handleMarkAsRead(notif.id)}
                >
                  <div className="relative shrink-0">
                    <img src={notif.senderAvatar} alt="" className="w-10 h-10 rounded-full object-cover border border-gray-200" />
                    <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                        {getIcon(notif.type)}
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <p className="text-sm text-gray-800 leading-snug">
                      <span className="font-bold">{notif.senderName}</span>{' '}
                      {notif.text}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(notif.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                  </div>

                  {notif.postImage && (
                    <img src={notif.postImage} className="w-10 h-10 rounded-lg object-cover bg-gray-100" />
                  )}
                  
                  {!notif.isRead && (
                     <div className="w-2 h-2 bg-cyan-500 rounded-full self-center"></div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};