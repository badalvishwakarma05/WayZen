/**
 * Overpass API Seeder Script for AccessPath
 * Queries OpenStreetMap for venues across major Indian metro cities:
 * - Bengaluru (MG Road, Church Street, Indiranagar, Koramangala)
 * - Mumbai (Colaba, Fort, Lower Parel, Bandra West)
 * - Delhi (Connaught Place, Lodhi Road, Hauz Khas, Aerocity)
 * - Chennai (Central Metro, T. Nagar, Anna Nagar, Besant Nagar)
 *
 * Maps OSM accessibility tags into structured Phase 1 pillar features:
 * - wheelchair=yes|no|limited
 * - toilets:wheelchair=yes|no
 * - ramp=yes|no | ramp:wheelchair=yes
 * - elevator=yes|no
 * - tactile_paving=yes|no
 * - door:width=*
 */

import { Venue, VenueFeatures } from '../src/types/accessibility';

export type SupportedCityKey = 'bengaluru' | 'mumbai' | 'delhi' | 'chennai';

export interface CityBboxConfig {
  key: SupportedCityKey;
  cityName: string;
  state: string;
  bbox: [number, number, number, number]; // [south, west, north, east]
  defaultCenter: { lat: number; lon: number };
}

export const CITY_BOUNDING_BOXES: Record<SupportedCityKey, CityBboxConfig> = {
  bengaluru: {
    key: 'bengaluru',
    cityName: 'Bengaluru',
    state: 'Karnataka',
    bbox: [12.92, 77.58, 12.99, 77.65],
    defaultCenter: { lat: 12.9756, lon: 77.6066 },
  },
  mumbai: {
    key: 'mumbai',
    cityName: 'Mumbai',
    state: 'Maharashtra',
    bbox: [18.90, 72.80, 19.10, 72.88],
    defaultCenter: { lat: 18.9401, lon: 72.8347 },
  },
  delhi: {
    key: 'delhi',
    cityName: 'Delhi',
    state: 'Delhi NCR',
    bbox: [28.52, 77.18, 28.65, 77.25],
    defaultCenter: { lat: 28.6315, lon: 77.2167 },
  },
  chennai: {
    key: 'chennai',
    cityName: 'Chennai',
    state: 'Tamil Nadu',
    bbox: [12.98, 80.20, 13.09, 80.28],
    defaultCenter: { lat: 13.0827, lon: 80.2707 },
  },
};

export interface OverpassElement {
  id: number;
  type: 'node' | 'way';
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

export function generateOverpassQuery(cityKey: SupportedCityKey): string {
  const city = CITY_BOUNDING_BOXES[cityKey];
  const [s, w, n, e] = city.bbox;
  return `
[out:json][timeout:25];
(
  node["wheelchair"](${s},${w},${n},${e});
  way["wheelchair"](${s},${w},${n},${e});
  node["toilets:wheelchair"="yes"](${s},${w},${n},${e});
  node["ramp"="yes"](${s},${w},${n},${e});
  node["elevator"="yes"](${s},${w},${n},${e});
);
out center tags;
  `.trim();
}

export function mapOsmTagsToVenueFeatures(tags: Record<string, string> = {}): {
  features: VenueFeatures;
  tagsSummary: string[];
} {
  const features: VenueFeatures = {};
  const tagsSummary: string[] = [];

  // 1. Step-Free Access
  if (tags['wheelchair'] === 'yes') {
    features.entrance_has_steps = false;
    features.ramp_available = true;
    features.ramp_gradient_ratio = 12; // compliant if tagged wheelchair=yes
    features.entrance_door_width_cm = 85;
    tagsSummary.push('Wheelchair Accessible (OSM)');
  } else if (tags['wheelchair'] === 'limited') {
    features.entrance_has_steps = true;
    features.ramp_available = true;
    features.ramp_gradient_ratio = 8;
    features.entrance_door_width_cm = 78;
    tagsSummary.push('Limited Wheelchair Access (OSM)');
  } else if (tags['wheelchair'] === 'no') {
    features.entrance_has_steps = true;
    features.entrance_step_count = 2;
    features.ramp_available = false;
    tagsSummary.push('Inaccessible Steps (OSM)');
  }

  if (tags['ramp'] === 'yes' || tags['ramp:wheelchair'] === 'yes') {
    features.ramp_available = true;
    if (!features.ramp_gradient_ratio) features.ramp_gradient_ratio = 12;
  } else if (tags['ramp'] === 'no') {
    features.ramp_available = false;
  }

  if (tags['door:width']) {
    const parsedWidth = parseFloat(tags['door:width']);
    if (!isNaN(parsedWidth)) {
      features.entrance_door_width_cm = parsedWidth > 10 ? parsedWidth : parsedWidth * 100;
    }
  }

  // 2. Lifts & Vertical Transit
  if (tags['level'] && tags['level'].includes(';')) {
    features.multiple_levels = true;
  }
  if (tags['elevator'] === 'yes' || tags['lift'] === 'yes') {
    features.multiple_levels = true;
    features.lift_available = true;
    features.lift_door_width_cm = 85;
    tagsSummary.push('Lift Available (OSM)');
  } else if (tags['elevator'] === 'no') {
    features.lift_available = false;
  }

  // 3. Accessible Washrooms
  if (tags['toilets:wheelchair'] === 'yes') {
    features.accessible_washroom_available = true;
    features.grab_rails_present = true;
    features.wheelchair_turning_radius_cm = 150;
    tagsSummary.push('Accessible Toilet (OSM)');
  } else if (tags['toilets:wheelchair'] === 'no') {
    features.accessible_washroom_available = false;
  }

  // 4. Wayfinding & Sensory
  if (tags['tactile_paving'] === 'yes') {
    features.tactile_paving = true;
    tagsSummary.push('Tactile Paving (OSM)');
  }
  if (tags['braille'] === 'yes') {
    features.braille_signage = true;
    tagsSummary.push('Braille (OSM)');
  }

  return { features, tagsSummary };
}

export function transformOverpassElementToVenue(
  el: OverpassElement,
  cityKey: SupportedCityKey = 'bengaluru'
): Venue | null {
  const cityConfig = CITY_BOUNDING_BOXES[cityKey] || CITY_BOUNDING_BOXES.bengaluru;
  const tags = el.tags || {};
  const name = tags['name:en'] || tags['name'] || tags['brand'];
  if (!name) return null;

  const lat = el.lat ?? el.center?.lat;
  const lon = el.lon ?? el.center?.lon;
  if (!lat || !lon) return null;

  const { features, tagsSummary } = mapOsmTagsToVenueFeatures(tags);

  let category: Venue['category'] = 'cafe';
  const amenity = tags['amenity'] || '';
  const shop = tags['shop'] || '';
  const tourism = tags['tourism'] || '';

  if (amenity === 'cafe' || amenity === 'fast_food') category = 'cafe';
  else if (amenity === 'restaurant') category = 'restaurant';
  else if (amenity === 'hospital' || amenity === 'clinic' || amenity === 'pharmacy') category = 'healthcare';
  else if (amenity === 'subway_entrance' || tags['railway'] === 'station' || amenity === 'bus_station') category = 'transit';
  else if (shop) category = 'shopping';
  else if (tourism === 'museum' || tourism === 'gallery' || amenity === 'theatre') category = 'culture';

  return {
    id: `osm-${cityKey}-${el.type}-${el.id}`,
    name,
    category,
    address: [tags['addr:street'], tags['addr:suburb'] || cityConfig.cityName].filter(Boolean).join(', ') || `${cityConfig.cityName}, ${cityConfig.state}`,
    neighborhood: tags['addr:suburb'] || `Central ${cityConfig.cityName}`,
    city: cityConfig.cityName,
    latitude: lat,
    longitude: lon,
    verificationStatus: 'unverified_imported',
    lastVerifiedAt: new Date().toISOString(),
    features,
    reviewsCount: 0,
    photos: [],
    tags: tagsSummary.length ? tagsSummary : ['Imported from OpenStreetMap'],
  };
}
