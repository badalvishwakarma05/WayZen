import { describe, it, expect } from 'vitest';
import { SUPPORTED_CITIES } from '../context/LocationContext';
import {
  BENGALURU_VENUES,
  MUMBAI_VENUES,
  DELHI_VENUES,
  CHENNAI_VENUES,
  ALL_SEEDED_VENUES,
} from '../db/mockData';
import {
  CITY_BOUNDING_BOXES,
  generateOverpassQuery,
  SupportedCityKey,
} from '../../scripts/seed-osm-overpass';
import { calculateVenueScore } from './engine';

describe('Multi-City Datasets and Overpass Seeders (Bengaluru, Mumbai, Delhi, Chennai)', () => {
  it('configures all 4 metro cities with valid Indian coordinates and neighborhoods', () => {
    expect(SUPPORTED_CITIES).toHaveLength(4);
    const cityIds = SUPPORTED_CITIES.map((c) => c.id);
    expect(cityIds).toEqual(['bengaluru', 'mumbai', 'delhi', 'chennai']);

    SUPPORTED_CITIES.forEach((city) => {
      expect(city.defaultLat).toBeGreaterThan(8); // Indian sub-continent lat
      expect(city.defaultLat).toBeLessThan(35);
      expect(city.defaultLon).toBeGreaterThan(68); // Indian sub-continent lon
      expect(city.defaultLon).toBeLessThan(90);
      expect(city.neighborhoods.length).toBeGreaterThanOrEqual(4);
    });
  });

  it('contains verified seed venues for each of the 4 cities', () => {
    expect(BENGALURU_VENUES.length).toBeGreaterThan(0);
    expect(MUMBAI_VENUES.length).toBe(4);
    expect(DELHI_VENUES.length).toBe(4);
    expect(CHENNAI_VENUES.length).toBe(4);
    expect(ALL_SEEDED_VENUES.length).toBe(
      BENGALURU_VENUES.length + MUMBAI_VENUES.length + DELHI_VENUES.length + CHENNAI_VENUES.length
    );

    // Verify Mumbai venues
    expect(MUMBAI_VENUES.some((v) => v.name.includes('Chhatrapati Shivaji'))).toBe(true);
    expect(MUMBAI_VENUES.some((v) => v.name.includes('Prithvi Theatre'))).toBe(true);
    expect(MUMBAI_VENUES.some((v) => v.name.includes('Bandstand'))).toBe(true);
    expect(MUMBAI_VENUES.some((v) => v.name.includes('Palladium'))).toBe(true);

    // Verify Delhi venues
    expect(DELHI_VENUES.some((v) => v.name.includes('Rajiv Chowk'))).toBe(true);
    expect(DELHI_VENUES.some((v) => v.name.includes('Habitat Centre'))).toBe(true);
    expect(DELHI_VENUES.some((v) => v.name.includes('Dilli Haat'))).toBe(true);
    expect(DELHI_VENUES.some((v) => v.name.includes('Lodhi Garden'))).toBe(true);

    // Verify Chennai venues
    expect(CHENNAI_VENUES.some((v) => v.name.includes('Central Metro'))).toBe(true);
    expect(CHENNAI_VENUES.some((v) => v.name.includes('Semmozhi Poonga'))).toBe(true);
    expect(CHENNAI_VENUES.some((v) => v.name.includes('Amethyst'))).toBe(true);
    expect(CHENNAI_VENUES.some((v) => v.name.includes("Elliot's Beach"))).toBe(true);
  });

  it('all multi-city venues calculate clean 5-pillar composite scores', () => {
    ALL_SEEDED_VENUES.forEach((venue) => {
      const scores = calculateVenueScore(venue.features);
      expect(scores.compositeScore).toBeGreaterThanOrEqual(0);
      expect(scores.compositeScore).toBeLessThanOrEqual(100);
      expect(['High', 'Medium', 'Low', 'Unverified']).toContain(scores.confidenceLabel);
      expect(['green', 'yellow', 'red', 'unknown']).toContain(scores.pillars.step_free.status);
      expect(['green', 'yellow', 'red', 'unknown']).toContain(scores.pillars.washrooms.status);
    });
  });

  it('generates valid Overpass queries with non-empty bounding boxes for all 4 cities', () => {
    const cities: SupportedCityKey[] = ['bengaluru', 'mumbai', 'delhi', 'chennai'];

    cities.forEach((cityKey) => {
      const query = generateOverpassQuery(cityKey);
      expect(query).toContain('[out:json]');
      expect(query).toContain('node["wheelchair"]');
      expect(query).toContain('out center tags;');

      const bbox = CITY_BOUNDING_BOXES[cityKey].bbox;
      expect(bbox[0]).toBeLessThan(bbox[2]); // South < North
      expect(bbox[1]).toBeLessThan(bbox[3]); // West < East
    });
  });
});
