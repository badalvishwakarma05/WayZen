import React, { createContext, useContext, useState } from 'react';
import { calculateDistanceMeters } from '../utils/geo';
import { ALL_SEEDED_VENUES } from '../db/mockData';
import { Venue } from '../types/accessibility';

export interface NeighborhoodOption {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

export interface CityOption {
  id: string;
  name: string;
  state: string;
  defaultLat: number;
  defaultLon: number;
  neighborhoods: NeighborhoodOption[];
}

export const SUPPORTED_CITIES: CityOption[] = [
  {
    id: 'bengaluru',
    name: 'Bengaluru',
    state: 'Karnataka',
    defaultLat: 12.9756,
    defaultLon: 77.6066,
    neighborhoods: [
      { id: 'church-st', name: 'Church Street / MG Road', latitude: 12.9756, longitude: 77.6066 },
      { id: 'indiranagar', name: 'Indiranagar (12th Main / 100ft Rd)', latitude: 12.9719, longitude: 77.6412 },
      { id: 'brigade-rd', name: 'Brigade Road / Residency Rd', latitude: 12.9739, longitude: 77.6074 },
      { id: 'cubbon-park', name: 'Cubbon Park / Kasturba Rd', latitude: 12.9763, longitude: 77.5929 },
      { id: 'koramangala', name: 'Koramangala (5th Block)', latitude: 12.9352, longitude: 77.6245 },
      { id: 'jayanagar', name: 'Jayanagar 4th Block', latitude: 12.9298, longitude: 77.5847 },
    ],
  },
  {
    id: 'mumbai',
    name: 'Mumbai',
    state: 'Maharashtra',
    defaultLat: 18.9401,
    defaultLon: 72.8347,
    neighborhoods: [
      { id: 'fort-colaba', name: 'Fort / Colaba', latitude: 18.9401, longitude: 72.8347 },
      { id: 'lower-parel', name: 'Lower Parel / Worli', latitude: 18.995, longitude: 72.8242 },
      { id: 'bandra-west', name: 'Bandra West (Bandstand / Hill Rd)', latitude: 19.0434, longitude: 72.8197 },
      { id: 'juhu', name: 'Juhu / Vile Parle', latitude: 19.1062, longitude: 72.8258 },
    ],
  },
  {
    id: 'delhi',
    name: 'Delhi NCR',
    state: 'Delhi',
    defaultLat: 28.6315,
    defaultLon: 77.2167,
    neighborhoods: [
      { id: 'connaught-place', name: 'Connaught Place (Inner Circle)', latitude: 28.6328, longitude: 77.2195 },
      { id: 'lodhi-road', name: 'Lodhi Road / Habitat Centre', latitude: 28.5894, longitude: 77.2248 },
      { id: 'ina-south-delhi', name: 'INA / Dilli Haat', latitude: 28.5733, longitude: 77.2084 },
      { id: 'hauz-khas', name: 'Hauz Khas Village / Green Park', latitude: 28.5494, longitude: 77.2001 },
    ],
  },
  {
    id: 'chennai',
    name: 'Chennai',
    state: 'Tamil Nadu',
    defaultLat: 13.0827,
    defaultLon: 80.2707,
    neighborhoods: [
      { id: 'central-periamet', name: 'Central / Periamet', latitude: 13.0827, longitude: 80.2755 },
      { id: 'teynampet-cathedral', name: 'Teynampet / Cathedral Rd', latitude: 13.05, longitude: 80.2508 },
      { id: 'royapettah', name: 'Royapettah / Anna Salai', latitude: 13.0573, longitude: 80.2592 },
      { id: 'besant-nagar', name: 'Besant Nagar (Elliot Beach)', latitude: 12.9984, longitude: 80.2678 },
    ],
  },
];

// Backward compatibility export
export const BENGALURU_NEIGHBORHOODS = SUPPORTED_CITIES[0].neighborhoods;

interface LocationContextType {
  latitude: number;
  longitude: number;
  radiusKm: number;
  setRadiusKm: (r: number) => void;
  permissionStatus: 'prompt' | 'granted' | 'denied' | 'unsupported';
  isLocating: boolean;
  requestGps: () => void;
  selectedCityId: string;
  selectCity: (cityId: string) => void;
  availableCities: CityOption[];
  currentNeighborhoods: NeighborhoodOption[];
  selectedNeighborhoodId: string;
  selectNeighborhood: (id: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  venues: Venue[];
  addVenueReview: (venueId: string, review: any) => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedCityId, setSelectedCityId] = useState('bengaluru');
  const currentCity = SUPPORTED_CITIES.find((c) => c.id === selectedCityId) || SUPPORTED_CITIES[0];

  const [latitude, setLatitude] = useState(currentCity.defaultLat);
  const [longitude, setLongitude] = useState(currentCity.defaultLon);
  const [radiusKm, setRadiusKm] = useState(15);
  const [permissionStatus, setPermissionStatus] = useState<'prompt' | 'granted' | 'denied' | 'unsupported'>('prompt');
  const [isLocating, setIsLocating] = useState(false);
  const [selectedNeighborhoodId, setSelectedNeighborhoodId] = useState(currentCity.neighborhoods[0].id);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [venues, setVenues] = useState<Venue[]>(() => {
    const saved = localStorage.getItem('accesspath_venues');
    return saved ? JSON.parse(saved) : ALL_SEEDED_VENUES;
  });

  const selectCity = (cityId: string) => {
    const city = SUPPORTED_CITIES.find((c) => c.id === cityId);
    if (city) {
      setSelectedCityId(cityId);
      setLatitude(city.defaultLat);
      setLongitude(city.defaultLon);
      setSelectedNeighborhoodId(city.neighborhoods[0]?.id || '');
    }
  };

  const requestGps = () => {
    if (!navigator.geolocation) {
      setPermissionStatus('unsupported');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        setPermissionStatus('granted');
        setIsLocating(false);
      },
      (err) => {
        console.warn('Geolocation denied or error:', err.message);
        setPermissionStatus('denied');
        setIsLocating(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const selectNeighborhood = (id: string) => {
    setSelectedNeighborhoodId(id);
    const found = currentCity.neighborhoods.find((n) => n.id === id);
    if (found) {
      setLatitude(found.latitude);
      setLongitude(found.longitude);
    }
  };

  const addVenueReview = (venueId: string, review: any) => {
    setVenues((prev) => {
      const updated = prev.map((v) => {
        if (v.id === venueId) {
          const currentCount = v.reviewsCount || 0;
          return {
            ...v,
            reviewsCount: currentCount + 1,
            verificationStatus: 'community_reported' as const,
            lastVerifiedAt: new Date().toISOString(),
            tags: Array.from(new Set([...v.tags, ...(review.quickTags || [])])),
            photos: review.photoDataUrl
              ? [
                  ...v.photos,
                  {
                    id: 'photo-' + Date.now(),
                    url: review.photoDataUrl,
                    altText: review.photoAltText || 'Photo contributed by community reviewer',
                    authorName: 'Community Contributor',
                    verifiedAt: new Date().toISOString().split('T')[0],
                  },
                ]
              : v.photos,
          };
        }
        return v;
      });
      localStorage.setItem('accesspath_venues', JSON.stringify(updated));
      return updated;
    });
  };

  // Compute live distances from current lat/lon
  const enrichedVenues = venues.map((v) => ({
    ...v,
    distanceMeters: calculateDistanceMeters(latitude, longitude, v.latitude, v.longitude),
  }));

  return (
    <LocationContext.Provider
      value={{
        latitude,
        longitude,
        radiusKm,
        setRadiusKm,
        permissionStatus,
        isLocating,
        requestGps,
        selectedCityId,
        selectCity,
        availableCities: SUPPORTED_CITIES,
        currentNeighborhoods: currentCity.neighborhoods,
        selectedNeighborhoodId,
        selectNeighborhood,
        selectedCategory,
        setSelectedCategory,
        searchQuery,
        setSearchQuery,
        venues: enrichedVenues,
        addVenueReview,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocationContext = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocationContext must be used within LocationProvider');
  }
  return context;
};
