
import React, { useState, useEffect, useRef } from 'react';
import { X, Users, Plus, Search, Map, Calendar, DollarSign, ArrowRight, ArrowLeft, Share2, Trash2, FileText, Loader2, Image as ImageIcon, Lock, Shield, UserPlus, Unlock, Globe, Sun, Sunset, Moon, PlusCircle, Camera, Edit2 } from 'lucide-react';
import { User, TravelGroup, TravelTemplate } from '../types';
import { StorageService } from '../services/storageService';
import { db } from '../services/firebase';
import { ref, onValue } from 'firebase/database';
import { resizeImage } from '../utils';

interface TravelGroupsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  allUsers: User[];
  initialGroupId?: string | null;
}

export const TravelGroupsModal: React.FC<TravelGroupsModalProps> = ({ isOpen, onClose, currentUser, allUsers, initialGroupId }) => {
  const [view, setView] = useState<'list' | 'create' | 'detail' | 'create_template' | 'add_member'>('list');
  const [groups, setGroups] = useState<TravelGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<TravelGroup | null>(null);
  
  // Create Group Form
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newGroupImage, setNewGroupImage] = useState<string | null>(null);
  const [isPrivateGroup, setIsPrivateGroup] = useState(false);
  
  // Create Template Form
  const [templateTitle, setTemplateTitle] = useState('');
  const [templateDesc, setTemplateDesc] = useState('');
  const [templateDuration, setTemplateDuration] = useState('3 Días');
  const [templateBudget, setTemplateBudget] = useState('$200');
  
  // Itinerary Builder State
  const [itineraryDays, setItineraryDays] = useState<{morning: string, afternoon: string, night: string}[]>([
      { morning: '', afternoon: '', night: '' }
  ]);

  // Add Member
  const [memberSearch, setMemberSearch] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editImageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
        const groupsRef = ref(db, 'travelGroups');
        return onValue(groupsRef, (snapshot) => {
            const data = snapshot.val();
            const loadedGroups: TravelGroup[] = data ? Object.values(data) : [];
            setGroups(loadedGroups.sort((a, b) => b.createdAt - a.createdAt));
            
            // Actualizar selectedGroup si estamos en detalle
            if (selectedGroup) {
                const updated = loadedGroups.find(g => g.id === selectedGroup.id);
                if (updated) setSelectedGroup(updated);
            }
        });
    }
  }, [isOpen, selectedGroup?.id]);

  useEffect(() => {
    if (initialGroupId && groups.length > 0) {
        const group = groups.find(g => g.id === initialGroupId);
        if (group) {
            setSelectedGroup(group);
            setView('detail');
        }
    }
  }, [initialGroupId, groups]);

  if (!isOpen) return null;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          try {
              const resized = await resizeImage(file, 600);
              setNewGroupImage(resized);
          } catch (e) {
              alert("Error al procesar imagen");
          }
      }
  };

  const handleEditGroupImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && selectedGroup) {
          try {
              const resized = await resizeImage(file, 600);
              await StorageService.updateTravelGroup(selectedGroup.id, { imageUrl: resized });
              // Firebase listener updates state automatically, but we can optimistically update
              setSelectedGroup({ ...selectedGroup, imageUrl: resized });
          } catch (e) {
              alert("Error al cambiar imagen");
          }
      }
  };

  const handleCreateGroup = async () => {
      if (!newGroupName || !newGroupDesc) return;
      setIsLoading(true);
      const newGroup = {
          id: `tg_${Date.now()}`,
          name: newGroupName,
          description: newGroupDesc,
          imageUrl: newGroupImage || 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=800&q=80',
          adminId: currentUser.id,
          createdAt: Date.now(),
          isPrivate: isPrivateGroup
      };
      await StorageService.createTravelGroup(newGroup);
      setIsLoading(false);
      setNewGroupName('');
      setNewGroupDesc('');
      setNewGroupImage(null);
      setIsPrivateGroup(false);
      setView('list');
  };

  // Logic to build the final description string from the itinerary days
  const handleCreateTemplate = async () => {
      if (!selectedGroup || !templateTitle) return;
      setIsLoading(true);

      // Build formatted description
      let finalDescription = templateDesc.trim();
      
      // Check if there is at least one activity filled
      const hasItinerary = itineraryDays.some(d => d.morning || d.afternoon || d.night);

      if (hasItinerary) {
          finalDescription += "\n\n✨ ITINERARIO DETALLADO ✨";
          itineraryDays.forEach((day, index) => {
              if (!day.morning && !day.afternoon && !day.night) return;
              
              finalDescription += `\n\n📅 DÍA ${index + 1}`;
              if (day.morning) finalDescription += `\n☀️ Mañana: ${day.morning}`;
              if (day.afternoon) finalDescription += `\n🌤️ Tarde: ${day.afternoon}`;
              if (day.night) finalDescription += `\n🌙 Noche: ${day.night}`;
          });
      }

      const newTemplate: TravelTemplate = {
          id: `tpl_${Date.now()}`,
          groupId: selectedGroup.id,
          authorId: currentUser.id,
          authorName: currentUser.name,
          authorAvatar: currentUser.avatar,
          title: templateTitle,
          description: finalDescription,
          duration: templateDuration,
          budget: templateBudget,
          timestamp: Date.now(),
          likes: 0
      };
      await StorageService.createTravelTemplate(newTemplate);
      setIsLoading(false);
      
      // Reset form
      setTemplateTitle('');
      setTemplateDesc('');
      setItineraryDays([{ morning: '', afternoon: '', night: '' }]);
      setView('detail');
  };

  const handleJoin = async (group: TravelGroup) => {
      // Si es privado, no se puede unir directamente (debe ser añadido)
      if (group.isPrivate) return;
      await StorageService.joinTravelGroup(group.id, currentUser.id);
  };

  const handleLeave = async (group: TravelGroup) => {
      if(confirm("¿Salir del grupo?")) {
          await StorageService.leaveTravelGroup(group.id, currentUser.id);
          setView('list');
      }
  };

  const handleDeleteGroup = async () => {
      if(selectedGroup && confirm(`ATENCIÓN: ¿Estás seguro de eliminar el grupo "${selectedGroup.name}"?\n\nSe borrarán todas las plantillas y datos asociados. Esta acción no se puede deshacer.`)) {
          await StorageService.deleteTravelGroup(selectedGroup.id);
          setView('list');
          setSelectedGroup(null);
      }
  };

  const handleDeleteTemplate = async (templateId: string) => {
      if(selectedGroup && confirm("¿Borrar plantilla?")) {
          await StorageService.deleteTravelTemplate(selectedGroup.id, templateId);
      }
  };

  const handleAddMember = async (userId: string) => {
      if (selectedGroup) {
          await StorageService.addMemberToGroup(selectedGroup.id, userId);
          alert("Usuario agregado correctamente.");
          setView('detail');
      }
  };

  const toggleGroupPrivacy = async () => {
      if (!selectedGroup) return;
      const newStatus = !selectedGroup.isPrivate;
      if (confirm(`¿Cambiar el grupo a ${newStatus ? 'Privado' : 'Público'}?`)) {
          await StorageService.updateTravelGroup(selectedGroup.id, { isPrivate: newStatus });
      }
  };

  // ITINERARY BUILDER HELPERS
  const addDay = () => {
      setItineraryDays([...itineraryDays, { morning: '', afternoon: '', night: '' }]);
      // Update duration automatically
      setTemplateDuration(`${itineraryDays.length + 1} Días`);
  };

  const removeDay = (index: number) => {
      if (itineraryDays.length > 1) {
          const newDays = itineraryDays.filter((_, i) => i !== index);
          setItineraryDays(newDays);
          setTemplateDuration(`${newDays.length} Días`);
      }
  };

  const updateDay = (index: number, part: 'morning' | 'afternoon' | 'night', value: string) => {
      const newDays = [...itineraryDays];
      newDays[index][part] = value;
      setItineraryDays(newDays);
  };

  // --- RENDER FUNCTIONS ---

  const renderList = () => (
      <div className="space-y-4 p-6">
          <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-800 text-lg">Explorar Grupos</h3>
              <button onClick={() => setView('create')} className="bg-cyan-600 text-white px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 hover:bg-cyan-700 transition-colors shadow-md">
                  <Plus size={16} /> Crear Grupo
              </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {groups.map(group => {
                  const memberCount = group.members ? Object.keys(group.members).length : 0;
                  const isMember = group.members && group.members[currentUser.id];
                  
                  return (
                      <div key={group.id} onClick={() => { setSelectedGroup(group); setView('detail'); }} className="bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden cursor-pointer hover:shadow-md transition-all group-card relative">
                          <div className="h-32 bg-gray-200 relative">
                              <img src={group.imageUrl} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors"></div>
                              {isMember && <span className="absolute top-2 right-2 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm">MIEMBRO</span>}
                              <span className="absolute top-2 left-2 bg-black/40 backdrop-blur-md text-white p-1 rounded-full">
                                  {group.isPrivate ? <Lock size={12}/> : <Globe size={12}/>}
                              </span>
                          </div>
                          <div className="p-4">
                              <h4 className="font-bold text-gray-800 text-lg mb-1 flex items-center gap-2">
                                  {group.name}
                              </h4>
                              <p className="text-gray-500 text-xs line-clamp-2 mb-3">{group.description}</p>
                              <div className="flex items-center gap-4 text-xs text-gray-400 font-medium">
                                  <span className="flex items-center gap-1"><Users size={14} /> {memberCount} viajeros</span>
                                  <span className="flex items-center gap-1"><FileText size={14} /> {(group.templates ? Object.keys(group.templates).length : 0)} plantillas</span>
                              </div>
                              
                              {!isMember && !group.isPrivate && (
                                  <div className="mt-3">
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); handleJoin(group); }} 
                                        className="w-full bg-cyan-50 text-cyan-700 text-xs font-bold py-2 rounded-lg hover:bg-cyan-100 transition-colors"
                                      >
                                          Unirme
                                      </button>
                                  </div>
                              )}
                          </div>
                      </div>
                  );
              })}
              {groups.length === 0 && (
                  <div className="col-span-2 text-center py-10 text-gray-400">
                      <Users size={48} className="mx-auto mb-2 opacity-20" />
                      <p>No hay grupos aún. ¡Crea el primero!</p>
                  </div>
              )}
          </div>
      </div>
  );

  const renderCreateGroup = () => (
      <div className="p-6 space-y-4">
          <button onClick={() => setView('list')} className="text-sm text-gray-500 hover:text-cyan-600 flex items-center gap-1 font-bold mb-2">
              <ArrowLeft size={16} /> Volver
          </button>
          <h2 className="text-xl font-bold text-gray-800">Nuevo Grupo de Viaje</h2>
          
          <div 
              onClick={() => fileInputRef.current?.click()}
              className="h-40 bg-stone-100 rounded-xl border-2 border-dashed border-stone-300 flex flex-col items-center justify-center cursor-pointer hover:bg-stone-200 transition-colors overflow-hidden relative"
          >
              {newGroupImage ? (
                  <img src={newGroupImage} className="w-full h-full object-cover" />
              ) : (
                  <>
                      <ImageIcon className="text-stone-400 mb-2" />
                      <span className="text-xs text-stone-500 font-bold">Subir Portada</span>
                  </>
              )}
              <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleImageUpload} />
          </div>

          <input type="text" placeholder="Nombre del Grupo (ej: Mochileros Ecuador)" className="w-full p-3 bg-stone-50 rounded-xl border border-stone-200 outline-none focus:ring-2 focus:ring-cyan-500 font-bold" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} />
          <textarea placeholder="Descripción del grupo..." className="w-full p-3 bg-stone-50 rounded-xl border border-stone-200 outline-none focus:ring-2 focus:ring-cyan-500 resize-none h-24" value={newGroupDesc} onChange={e => setNewGroupDesc(e.target.value)} />
          
          <div 
             className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${isPrivateGroup ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200'}`} 
             onClick={() => setIsPrivateGroup(!isPrivateGroup)}
          >
              <div className={`p-2 rounded-full ${isPrivateGroup ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                  {isPrivateGroup ? <Lock size={20} /> : <Globe size={20} />}
              </div>
              <div className="flex-1">
                  <p className={`text-sm font-bold ${isPrivateGroup ? 'text-orange-800' : 'text-green-800'}`}>
                      {isPrivateGroup ? 'Grupo Privado' : 'Grupo Público'}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                      {isPrivateGroup 
                        ? 'Solo tú puedes agregar miembros. No aparecerá en búsquedas.' 
                        : 'Cualquier usuario puede unirse y ver el contenido.'}
                  </p>
              </div>
          </div>

          <button onClick={handleCreateGroup} disabled={isLoading || !newGroupName} className="w-full bg-cyan-600 text-white font-bold py-3 rounded-xl shadow-lg flex items-center justify-center gap-2">
              {isLoading ? <Loader2 className="animate-spin" /> : 'Crear Grupo'}
          </button>
      </div>
  );

  const renderAddMember = () => {
      // Filtramos usuarios que no estén ya en el grupo
      const nonMembers = allUsers.filter(u => selectedGroup && (!selectedGroup.members || !selectedGroup.members[u.id]));
      const filteredUsers = memberSearch 
        ? nonMembers.filter(u => u.name.toLowerCase().includes(memberSearch.toLowerCase())) 
        : nonMembers;

      return (
        <div className="p-6 space-y-4">
             <button onClick={() => setView('detail')} className="text-sm text-gray-500 hover:text-cyan-600 flex items-center gap-1 font-bold mb-2">
                  <ArrowLeft size={16} /> Volver al grupo
             </button>
             <h2 className="text-xl font-bold text-gray-800">Agregar Miembros</h2>
             <p className="text-xs text-stone-500">Busca usuarios para añadir a "{selectedGroup?.name}".</p>
             
             <div className="relative">
                <Search className="absolute left-3 top-3 text-stone-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Buscar usuario..." 
                    className="w-full pl-10 p-3 bg-stone-50 border border-stone-200 rounded-xl outline-none"
                    value={memberSearch}
                    onChange={e => setMemberSearch(e.target.value)}
                />
             </div>

             <div className="space-y-2 max-h-[300px] overflow-y-auto">
                 {filteredUsers.length > 0 ? (
                     filteredUsers.map(u => (
                         <div key={u.id} className="flex justify-between items-center p-3 border border-stone-100 rounded-xl hover:bg-stone-50">
                             <div className="flex items-center gap-3">
                                 <img src={u.avatar} className="w-10 h-10 rounded-full object-cover" />
                                 <span className="font-bold text-sm text-gray-800">{u.name}</span>
                             </div>
                             <button onClick={() => handleAddMember(u.id)} className="text-cyan-600 hover:bg-cyan-50 p-2 rounded-full">
                                 <Plus size={20} />
                             </button>
                         </div>
                     ))
                 ) : (
                     <div className="text-center py-8 text-gray-400 text-sm">No se encontraron usuarios disponibles.</div>
                 )}
             </div>
        </div>
      );
  };

  const renderDetail = () => {
      if (!selectedGroup) return null;
      const isMember = selectedGroup.members && selectedGroup.members[currentUser.id];
      const isAdminOfGroup = selectedGroup.adminId === currentUser.id;
      const templates = selectedGroup.templates ? Object.values(selectedGroup.templates) : [];
      
      // Si es privado y no soy miembro (y no soy el admin global o creador), mostrar pantalla de bloqueo
      if (selectedGroup.isPrivate && !isMember && !isAdminOfGroup) {
          return (
              <div className="flex flex-col h-full bg-stone-50">
                 <div className="relative h-48 bg-gray-900">
                    <img src={selectedGroup.imageUrl} className="w-full h-full object-cover opacity-50 blur-sm" />
                    <button onClick={() => setView('list')} className="absolute top-4 left-4 bg-white/20 text-white p-2 rounded-full hover:bg-white/40 transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                        <Lock size={48} className="mb-2" />
                        <h2 className="text-2xl font-bold">{selectedGroup.name}</h2>
                        <p className="text-sm font-medium bg-black/40 px-3 py-1 rounded-full mt-2">Grupo Privado</p>
                    </div>
                 </div>
                 <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-stone-500">
                    <Shield size={64} className="mb-4 text-stone-300" />
                    <h3 className="text-lg font-bold text-stone-700">Contenido Restringido</h3>
                    <p className="text-sm max-w-xs mt-2">Este grupo es privado. Solo los miembros añadidos por el administrador pueden ver las plantillas y el contenido.</p>
                 </div>
              </div>
          );
      }

      return (
          <div className="flex flex-col h-full overflow-hidden">
             {/* Cover */}
             <div className="h-48 shrink-0 relative group">
                 <img src={selectedGroup.imageUrl} className="w-full h-full object-cover" />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                 
                 <button onClick={() => setView('list')} className="absolute top-4 left-4 bg-black/40 text-white p-2 rounded-full hover:bg-black/60 transition-colors z-20">
                     <ArrowLeft size={20} />
                 </button>
                 
                 {/* Admin Actions (Top Right) */}
                 {isAdminOfGroup && (
                     <div className="absolute top-4 right-4 flex gap-2 z-20">
                         <button 
                            onClick={toggleGroupPrivacy}
                            className="bg-black/40 text-white p-2 rounded-full hover:bg-black/60 transition-colors backdrop-blur-md"
                            title={selectedGroup.isPrivate ? "Hacer Público" : "Hacer Privado"}
                         >
                             {selectedGroup.isPrivate ? <Unlock size={20} /> : <Lock size={20} />}
                         </button>
                         <button 
                            onClick={handleDeleteGroup}
                            className="bg-red-600/60 text-white p-2 rounded-full hover:bg-red-600 transition-colors backdrop-blur-md"
                            title="Eliminar Grupo"
                         >
                             <Trash2 size={20} />
                         </button>
                     </div>
                 )}

                 {/* Edit Photo Button (Center Overlay for Admin) */}
                 {isAdminOfGroup && (
                     <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                         <button 
                            onClick={() => editImageInputRef.current?.click()}
                            className="bg-black/50 hover:bg-black/70 text-white px-4 py-2 rounded-full font-bold flex items-center gap-2 backdrop-blur-sm"
                         >
                             <Camera size={20} /> Editar Foto
                         </button>
                         <input type="file" ref={editImageInputRef} hidden accept="image/*" onChange={handleEditGroupImage} />
                     </div>
                 )}

                 <div className="absolute bottom-4 left-4 text-white z-20 pointer-events-none">
                     <h2 className="text-2xl font-bold leading-tight flex items-center gap-2">
                         {selectedGroup.name}
                         {selectedGroup.isPrivate && <Lock size={16} className="text-stone-300" />}
                     </h2>
                     <p className="text-white/80 text-sm line-clamp-1">{selectedGroup.description}</p>
                 </div>
                 
                 <div className="absolute bottom-4 right-4 flex gap-2 z-20">
                     {isAdminOfGroup && (
                         <button onClick={() => setView('add_member')} className="bg-white/20 hover:bg-white/40 text-white text-xs font-bold px-3 py-1.5 rounded-full border border-white/30 backdrop-blur-md flex items-center gap-1">
                             <UserPlus size={12} /> Agregar
                         </button>
                     )}
                     {isMember ? (
                         <button onClick={() => handleLeave(selectedGroup)} className="bg-red-500/80 hover:bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-full border border-red-400 backdrop-blur-md">Salir</button>
                     ) : (
                         <button onClick={() => handleJoin(selectedGroup)} className="bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold px-6 py-2 rounded-full shadow-lg border border-cyan-400">Unirme</button>
                     )}
                 </div>
             </div>

             {/* Content */}
             <div className="flex-1 overflow-y-auto bg-stone-50 p-6">
                 <div className="flex justify-between items-center mb-4">
                     <h3 className="font-bold text-gray-800 flex items-center gap-2">
                         <FileText className="text-cyan-600" size={20} /> Plantillas de Viaje
                     </h3>
                     {isMember && (
                         <button onClick={() => setView('create_template')} className="text-cyan-600 text-xs font-bold bg-cyan-50 px-3 py-1.5 rounded-full hover:bg-cyan-100 transition-colors flex items-center gap-1">
                             <Plus size={14} /> Compartir Plantilla
                         </button>
                     )}
                 </div>

                 {templates.length > 0 ? (
                     <div className="space-y-4">
                         {templates.map(tpl => (
                             <div key={tpl.id} className="bg-white p-4 rounded-xl shadow-sm border border-stone-100 relative group">
                                 <div className="flex justify-between items-start mb-2">
                                     <h4 className="font-bold text-gray-800 text-lg">{tpl.title}</h4>
                                     <div className="flex gap-2 text-xs font-bold">
                                         <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded">{tpl.duration}</span>
                                         <span className="bg-green-50 text-green-600 px-2 py-0.5 rounded">{tpl.budget}</span>
                                     </div>
                                 </div>
                                 <p className="text-stone-600 text-sm mb-3 whitespace-pre-wrap leading-relaxed">{tpl.description}</p>
                                 
                                 <div className="flex items-center justify-between border-t border-gray-50 pt-3">
                                     <div className="flex items-center gap-2">
                                         <img src={tpl.authorAvatar} className="w-6 h-6 rounded-full" />
                                         <span className="text-xs text-gray-500">Por <strong>{tpl.authorName}</strong></span>
                                     </div>
                                     <div className="flex items-center gap-2">
                                         {/* Only admin or author can delete */}
                                         {(currentUser.id === tpl.authorId || currentUser.id === selectedGroup.adminId) && (
                                             <button onClick={() => handleDeleteTemplate(tpl.id)} className="text-stone-300 hover:text-red-500">
                                                 <Trash2 size={16} />
                                             </button>
                                         )}
                                         <button onClick={() => alert("Copiado al portapapeles")} className="text-stone-300 hover:text-cyan-600">
                                             <Share2 size={16} />
                                         </button>
                                     </div>
                                 </div>
                             </div>
                         ))}
                     </div>
                 ) : (
                     <div className="text-center py-10 text-stone-400 border-2 border-dashed border-stone-200 rounded-xl">
                         <Map size={32} className="mx-auto mb-2 opacity-30" />
                         <p className="text-sm">Aún no hay plantillas.</p>
                         {isMember && <p className="text-xs">¡Comparte tu itinerario favorito!</p>}
                     </div>
                 )}
             </div>
          </div>
      );
  };

  const renderCreateTemplate = () => (
      <div className="p-6 space-y-4">
          <button onClick={() => setView('detail')} className="text-sm text-gray-500 hover:text-cyan-600 flex items-center gap-1 font-bold mb-2">
              <ArrowLeft size={16} /> Cancelar
          </button>
          <h2 className="text-xl font-bold text-gray-800">Compartir Plantilla de Viaje</h2>
          <p className="text-xs text-stone-500">Ayuda a otros viajeros con tu experiencia.</p>

          <input type="text" placeholder="Título (ej: Ruta del Sol 3 Días)" className="w-full p-3 bg-stone-50 rounded-xl border border-stone-200 outline-none focus:ring-2 focus:ring-cyan-500 font-bold" value={templateTitle} onChange={e => setTemplateTitle(e.target.value)} />
          
          <div className="grid grid-cols-2 gap-4">
              <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Duración</label>
                  <div className="relative">
                      <Calendar className="absolute left-3 top-3 text-stone-400" size={16} />
                      <input type="text" className="w-full p-3 pl-9 bg-stone-50 rounded-xl border border-stone-200 outline-none text-sm" value={templateDuration} onChange={e => setTemplateDuration(e.target.value)} />
                  </div>
              </div>
              <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Presupuesto Aprox.</label>
                  <div className="relative">
                      <DollarSign className="absolute left-3 top-3 text-stone-400" size={16} />
                      <input type="text" className="w-full p-3 pl-9 bg-stone-50 rounded-xl border border-stone-200 outline-none text-sm" value={templateBudget} onChange={e => setTemplateBudget(e.target.value)} />
                  </div>
              </div>
          </div>

          <div>
              <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Intro / Resumen</label>
              <textarea placeholder="Breve introducción o consejos generales..." className="w-full p-3 bg-stone-50 rounded-xl border border-stone-200 outline-none focus:ring-2 focus:ring-cyan-500 resize-none h-24 text-sm leading-relaxed" value={templateDesc} onChange={e => setTemplateDesc(e.target.value)} />
          </div>

          {/* ITINERARY BUILDER */}
          <div className="border-t border-stone-200 pt-4">
               <div className="flex justify-between items-center mb-3">
                   <h3 className="font-bold text-gray-700 text-sm uppercase">Itinerario Detallado</h3>
                   <button onClick={addDay} className="text-cyan-600 text-xs font-bold flex items-center gap-1 hover:bg-cyan-50 px-2 py-1 rounded transition-colors">
                       <PlusCircle size={14} /> Agregar Día
                   </button>
               </div>

               <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                   {itineraryDays.map((day, idx) => (
                       <div key={idx} className="bg-stone-50 p-3 rounded-xl border border-stone-200 relative group">
                           <div className="flex justify-between items-center mb-2">
                               <span className="font-bold text-sm text-stone-600 bg-white px-2 py-0.5 rounded border">Día {idx + 1}</span>
                               {itineraryDays.length > 1 && (
                                   <button onClick={() => removeDay(idx)} className="text-stone-300 hover:text-red-500">
                                       <Trash2 size={14} />
                                   </button>
                               )}
                           </div>
                           
                           <div className="space-y-2">
                               <div className="flex items-center gap-2">
                                   <Sun size={16} className="text-orange-400 shrink-0" />
                                   <input 
                                     type="text" 
                                     placeholder="Actividades de la mañana..." 
                                     className="w-full bg-white text-sm p-2 rounded-lg border border-stone-200 outline-none focus:border-cyan-400"
                                     value={day.morning}
                                     onChange={(e) => updateDay(idx, 'morning', e.target.value)}
                                   />
                               </div>
                               <div className="flex items-center gap-2">
                                   <Sunset size={16} className="text-blue-400 shrink-0" />
                                   <input 
                                     type="text" 
                                     placeholder="Actividades de la tarde..." 
                                     className="w-full bg-white text-sm p-2 rounded-lg border border-stone-200 outline-none focus:border-cyan-400"
                                     value={day.afternoon}
                                     onChange={(e) => updateDay(idx, 'afternoon', e.target.value)}
                                   />
                               </div>
                               <div className="flex items-center gap-2">
                                   <Moon size={16} className="text-indigo-400 shrink-0" />
                                   <input 
                                     type="text" 
                                     placeholder="Actividades de la noche..." 
                                     className="w-full bg-white text-sm p-2 rounded-lg border border-stone-200 outline-none focus:border-cyan-400"
                                     value={day.night}
                                     onChange={(e) => updateDay(idx, 'night', e.target.value)}
                                   />
                               </div>
                           </div>
                       </div>
                   ))}
               </div>
          </div>

          <button onClick={handleCreateTemplate} disabled={isLoading || !templateTitle} className="w-full bg-cyan-600 text-white font-bold py-3 rounded-xl shadow-lg flex items-center justify-center gap-2">
              {isLoading ? <Loader2 className="animate-spin" /> : 'Publicar Plantilla'}
          </button>
      </div>
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-cyan-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
          {/* Header (Only for List view essentially, others have custom headers) */}
          {view === 'list' && (
              <div className="bg-white p-4 border-b border-gray-100 flex justify-between items-center">
                  <div className="flex items-center gap-2 text-cyan-700">
                      <Users size={24} />
                      <h2 className="text-xl font-black tracking-tight">Comunidades</h2>
                  </div>
                  <button onClick={onClose} className="bg-gray-100 p-2 rounded-full text-gray-500 hover:bg-gray-200 transition-colors">
                      <X size={20} />
                  </button>
              </div>
          )}

          <div className="flex-1 overflow-y-auto bg-stone-50">
              {view === 'list' && renderList()}
              {view === 'create' && renderCreateGroup()}
              {view === 'detail' && renderDetail()}
              {view === 'create_template' && renderCreateTemplate()}
              {view === 'add_member' && renderAddMember()}
          </div>
      </div>
    </div>
  );
};
