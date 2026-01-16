// Geolocation utilities for marketplace distance calculations

export interface Coordinates {
  latitude: number;
  longitude: number;
}

// Calculate distance between two points using Haversine formula
export function calculateDistance(
  point1: Coordinates,
  point2: Coordinates
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(point2.latitude - point1.latitude);
  const dLon = toRad(point2.longitude - point1.longitude);
  
  const lat1 = toRad(point1.latitude);
  const lat2 = toRad(point2.latitude);

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// Format distance for display
export function formatDistance(km: number, language: 'en' | 'zh' = 'en'): string {
  if (km < 1) {
    const meters = Math.round(km * 1000);
    return language === 'zh' ? `${meters}米` : `${meters}m`;
  } else {
    return language === 'zh' ? `${km}公里` : `${km}km`;
  }
}

// Get user's current location
export async function getCurrentLocation(): Promise<Coordinates | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      (error) => {
        console.error('Error getting location:', error);
        resolve(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 300000 // Cache for 5 minutes
      }
    );
  });
}

// Major Chinese cities approximate coordinates (for demonstration)
// In production, you'd have a complete database
export const CITY_COORDINATES: Record<string, Coordinates> = {
  // Municipalities
  'Beijing': { latitude: 39.9042, longitude: 116.4074 },
  'Shanghai': { latitude: 31.2304, longitude: 121.4737 },
  'Tianjin': { latitude: 39.3434, longitude: 117.3616 },
  'Chongqing': { latitude: 29.4316, longitude: 106.9123 },
  
  // Major cities
  'Guangzhou': { latitude: 23.1291, longitude: 113.2644 },
  'Shenzhen': { latitude: 22.5431, longitude: 114.0579 },
  'Chengdu': { latitude: 30.5728, longitude: 104.0668 },
  'Wuhan': { latitude: 30.5928, longitude: 114.3055 },
  'Hangzhou': { latitude: 30.2741, longitude: 120.1551 },
  'Nanjing': { latitude: 32.0603, longitude: 118.7969 },
  'Xi\'an': { latitude: 34.3416, longitude: 108.9398 },
  'Suzhou': { latitude: 31.2989, longitude: 120.5853 },
  'Qingdao': { latitude: 36.0671, longitude: 120.3826 },
  'Dalian': { latitude: 38.9140, longitude: 121.6147 },
  'Harbin': { latitude: 45.8038, longitude: 126.5340 },
  'Shenyang': { latitude: 41.8057, longitude: 123.4328 },
  'Jinan': { latitude: 36.6512, longitude: 117.1205 },
  'Changsha': { latitude: 28.2280, longitude: 112.9388 },
  'Zhengzhou': { latitude: 34.7466, longitude: 113.6254 },
  'Kunming': { latitude: 25.0406, longitude: 102.7129 },

  // Add more as needed
  'Other': { latitude: 0, longitude: 0 } // Placeholder
};

// Get coordinates for a city
export function getCityCoordinates(city: string): Coordinates | null {
  return CITY_COORDINATES[city] || null;
}

// Check if item is within distance range
export function isWithinRange(
  userLocation: Coordinates,
  itemLocation: Coordinates,
  maxDistanceKm: number
): boolean {
  const distance = calculateDistance(userLocation, itemLocation);
  return distance <= maxDistanceKm;
}
