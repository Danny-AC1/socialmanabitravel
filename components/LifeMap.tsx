
import React, { useEffect, useRef, useState } from 'react';
import { Map, Calendar, MapPin, X } from 'lucide-react';
import { Post } from '../types';
import { getCoordinatesFromLocationName } from '../utils';

// Importamos tipos globales (L) de Leaflet que están en window
declare global {
  interface Window {
    L: any;
  }
}

interface LifeMapProps {
  posts: Post[];
}

export const LifeMap: React.FC<LifeMapProps> = ({ posts }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [stats, setStats] = useState({ locations: 0, distance: 0 });

  useEffect(() => {
    if (!mapContainerRef.current || !window.L) return;

    // 1. Filtrar posts con ubicación y ordenarlos cronológicamente (antiguos primero para la línea)
    const sortedPosts = [...posts]
        .filter(p => p.location && getCoordinatesFromLocationName(p.location))
        .sort((a, b) => a.timestamp - b.timestamp);

    // Si ya existe mapa, limpiarlo
    if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
    }

    // 2. Inicializar Mapa (Centrado en Ecuador)
    const map = window.L.map(mapContainerRef.current).setView([-1.83, -78.18], 7);
    mapInstanceRef.current = map;

    // 3. Capa Base (CartoDB Dark Matter para estilo moderno)
    window.L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(map);

    // 4. Crear Marcadores y Líneas
    const latLngs: any[] = [];
    const uniqueLocations = new Set();

    sortedPosts.forEach((post) => {
        const coords = getCoordinatesFromLocationName(post.location);
        if (coords) {
            uniqueLocations.add(post.location.toLowerCase().trim());
            const latLng = [coords.lat, coords.lng];
            latLngs.push(latLng);

            // Icono personalizado con la foto del usuario
            const customIcon = window.L.divIcon({
                className: 'custom-div-icon',
                html: `<div class="marker-pin"><img src="${post.imageUrl}" class="marker-image"/></div>`,
                iconSize: [40, 40],
                iconAnchor: [20, 40],
                popupAnchor: [0, -45]
            });

            // Popup
            const dateStr = new Date(post.timestamp).toLocaleDateString();
            const popupContent = `
                <div style="text-align: center; min-width: 150px;">
                    <img src="${post.imageUrl}" style="width: 100%; height: 100px; object-fit: cover; border-radius: 8px; margin-bottom: 5px;" />
                    <strong style="display: block; font-size: 14px; margin-bottom: 2px;">${post.location}</strong>
                    <span style="font-size: 11px; color: #666;">${dateStr}</span>
                    <p style="font-size: 12px; margin-top: 5px; font-style: italic;">"${post.caption.substring(0, 50)}${post.caption.length > 50 ? '...' : ''}"</p>
                </div>
            `;

            window.L.marker(latLng, { icon: customIcon })
                .addTo(map)
                .bindPopup(popupContent);
        }
    });

    // 5. Dibujar Línea de Vida (Polyline)
    if (latLngs.length > 1) {
        const polyline = window.L.polyline(latLngs, {
            color: '#0ea5e9', // cyan-500
            weight: 3,
            opacity: 0.7,
            dashArray: '5, 10', // Línea punteada
            lineCap: 'round'
        }).addTo(map);
        
        // Ajustar vista para que quepan todos los puntos
        map.fitBounds(polyline.getBounds(), { padding: [50, 50] });
    }

    setStats({
        locations: uniqueLocations.size,
        distance: latLngs.length // Simplificación: número de paradas
    });

    // Cleanup
    return () => {
        if (mapInstanceRef.current) {
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
        }
    };
  }, [posts]);

  if (posts.length === 0) {
      return (
          <div className="flex flex-col items-center justify-center h-64 bg-stone-100 rounded-3xl border border-stone-200">
              <Map size={48} className="text-stone-300 mb-2" />
              <p className="text-stone-500 font-bold">Aún no tienes viajes registrados</p>
              <p className="text-xs text-stone-400">Publica fotos con ubicación para llenar tu mapa.</p>
          </div>
      );
  }

  return (
    <div className="relative w-full h-[500px] rounded-3xl overflow-hidden shadow-lg border border-stone-200 bg-stone-900 group">
        <div ref={mapContainerRef} className="w-full h-full z-0" />
        
        {/* Overlay Stats */}
        <div className="absolute top-4 left-4 z-[400] bg-white/90 backdrop-blur-md p-3 rounded-xl shadow-lg border border-white/20">
            <h3 className="text-xs font-bold text-stone-500 uppercase mb-2 flex items-center gap-1">
                <MapPin size={12} /> Tu Historial
            </h3>
            <div className="flex gap-4">
                <div>
                    <span className="block text-xl font-black text-cyan-600">{stats.locations}</span>
                    <span className="text-[10px] text-stone-500 font-bold">Lugares</span>
                </div>
                <div>
                    <span className="block text-xl font-black text-purple-600">{posts.length}</span>
                    <span className="text-[10px] text-stone-500 font-bold">Memorias</span>
                </div>
            </div>
        </div>

        <div className="absolute bottom-4 right-4 z-[400] bg-black/60 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-medium pointer-events-none">
             Mapa de Vida • Ecuador Travel
        </div>
    </div>
  );
};
