import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Venue } from '../../types/accessibility';
import { calculateVenueScore } from '../../scoring/engine';
import { useAuth } from '../../context/AuthContext';

interface VenueMapProps {
  venues: Venue[];
  userLat: number;
  userLng: number;
  onSelectVenue: (venue: Venue) => void;
  selectedVenue: Venue | null;
}

export const VenueMap: React.FC<VenueMapProps> = ({
  venues,
  userLat,
  userLng,
  onSelectVenue,
  selectedVenue,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [id: string]: L.Marker }>({});
  const { selectedPersonas } = useAuth();
  const primaryPersona = selectedPersonas[0] || null;

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize Leaflet map
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [userLat, userLng],
        zoom: 14,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    map.setView([userLat, userLng]);

    // Clear existing markers
    Object.values(markersRef.current).forEach((m) => m.remove());
    markersRef.current = {};

    // Add user location marker
    const userIcon = L.divIcon({
      className: 'user-location-marker',
      html: `
        <div style="background-color: #0284c7; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.5);"></div>
      `,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });

    L.marker([userLat, userLng], { icon: userIcon })
      .addTo(map)
      .bindPopup('<strong>Your Location (Bengaluru)</strong>');

    // Add venue markers
    venues.forEach((v) => {
      const scoreRes = calculateVenueScore(v.features, primaryPersona, v.reviewsCount, v.verificationStatus);
      const isBarrier = scoreRes.hardConstraintFailed;
      const score = scoreRes.compositeScore || 0;

      let markerColor = '#059669'; // green
      if (isBarrier) {
        markerColor = '#e11d48'; // red
      } else if (score < 60) {
        markerColor = '#d97706'; // amber
      }

      const venueIcon = L.divIcon({
        className: 'venue-marker-custom',
        html: `
          <div style="
            background-color: ${markerColor};
            color: white;
            font-weight: 800;
            font-size: 11px;
            padding: 4px 8px;
            border-radius: 12px;
            border: 2px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            min-width: 32px;
          ">
            ${scoreRes.personaMatchPercentage || scoreRes.compositeScore || '•'}%
          </div>
        `,
        iconSize: [40, 26],
        iconAnchor: [20, 13],
      });

      const marker = L.marker([v.latitude, v.longitude], {
        icon: venueIcon,
        title: `${v.name} (Score: ${scoreRes.compositeScore}%)`,
      }).addTo(map);

      // Popup
      const popupContent = document.createElement('div');
      popupContent.className = 'p-1 text-slate-900';
      popupContent.innerHTML = `
        <h4 style="font-weight: bold; margin: 0 0 4px 0; font-size: 14px;">${v.name}</h4>
        <p style="margin: 0 0 6px 0; font-size: 12px; color: #475569;">${v.neighborhood}</p>
        <div style="font-size: 12px; font-weight: bold; margin-bottom: 8px;">
          Score: ${scoreRes.compositeScore}% ${isBarrier ? '<span style="color: #dc2626;">(Barrier Alert)</span>' : ''}
        </div>
        <button id="popup-btn-${v.id}" style="
          background-color: #0369a1;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
          font-weight: bold;
          width: 100%;
        ">
          View Details
        </button>
      `;

      marker.bindPopup(popupContent);
      marker.on('popupopen', () => {
        const btn = document.getElementById(`popup-btn-${v.id}`);
        if (btn) {
          btn.onclick = () => onSelectVenue(v);
        }
      });

      markersRef.current[v.id] = marker;
    });
  }, [venues, userLat, userLng, primaryPersona, onSelectVenue]);

  // Pan to selected venue if changed externally
  useEffect(() => {
    if (selectedVenue && mapInstanceRef.current) {
      mapInstanceRef.current.panTo([selectedVenue.latitude, selectedVenue.longitude], {
        animate: true,
      });
      const marker = markersRef.current[selectedVenue.id];
      if (marker) {
        marker.openPopup();
      }
    }
  }, [selectedVenue]);

  return (
    <div className="relative w-full h-[550px] md:h-[650px] rounded-2xl overflow-hidden border-2 border-slate-200 dark:border-slate-800 shadow-md">
      {/* Keyboard accessible announcement banner */}
      <div
        className="absolute top-2 left-2 right-2 z-[400] bg-slate-900/90 text-white text-xs px-3 py-2 rounded-lg backdrop-blur-sm flex items-center justify-between pointer-events-auto"
        role="note"
      >
        <span>
          Interactive Leaflet Map. Use arrow keys to pan, +/- to zoom.
        </span>
        <span className="font-semibold text-sky-400">
          Showing {venues.length} venues in Bengaluru
        </span>
      </div>

      <div
        ref={mapContainerRef}
        className="w-full h-full"
        tabIndex={0}
        aria-label="Map displaying accessible venues in Bengaluru"
        role="region"
      />
    </div>
  );
};
