import dotenv from 'dotenv';
dotenv.config();

// Configurable office coordinates (default New Delhi office / HQ, configurable via env)
export const DEFAULT_OFFICE_LATITUDE = parseFloat(process.env.OFFICE_LATITUDE || '28.613939');
export const DEFAULT_OFFICE_LONGITUDE = parseFloat(process.env.OFFICE_LONGITUDE || '77.209021');
export const DEFAULT_ALLOWED_RADIUS_METERS = parseFloat(process.env.OFFICE_ALLOWED_RADIUS_METERS || '500');

/**
 * Calculate the great-circle distance between two points on the Earth
 * using the Haversine formula (returns distance in meters)
 *
 * @param {number} lat1 - Latitude of point 1 in degrees
 * @param {number} lon1 - Longitude of point 1 in degrees
 * @param {number} lat2 - Latitude of point 2 in degrees
 * @param {number} lon2 - Longitude of point 2 in degrees
 * @returns {number} Distance in meters
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth's radius in meters
  const toRad = (deg) => (deg * Math.PI) / 180;

  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);
  const deltaPhi = toRad(lat2 - lat1);
  const deltaLambda = toRad(lon2 - lon1);

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Number((R * c).toFixed(2));
};

/**
 * Get configured office / site coordinates and allowed geofence radius
 */
export const getOfficeCoordinates = () => {
  return {
    latitude: parseFloat(process.env.OFFICE_LATITUDE || String(DEFAULT_OFFICE_LATITUDE)),
    longitude: parseFloat(process.env.OFFICE_LONGITUDE || String(DEFAULT_OFFICE_LONGITUDE)),
    allowedRadiusMeters: parseFloat(process.env.OFFICE_ALLOWED_RADIUS_METERS || String(DEFAULT_ALLOWED_RADIUS_METERS))
  };
};

/**
 * Perform on-site geolocation geofence verification
 *
 * @param {number|string} latitude - Client provided GPS latitude
 * @param {number|string} longitude - Client provided GPS longitude
 * @param {object} [customOffice] - Optional custom site location
 * @returns {{ isWithinRadius: boolean, distanceMeters: number, allowedRadiusMeters: number, office: object }}
 */
export const verifyGeofenceLocation = (latitude, longitude, customOffice = null) => {
  const lat = parseFloat(latitude);
  const lon = parseFloat(longitude);

  if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    const error = new Error('Invalid GPS coordinates provided. Latitude must be [-90, 90] and Longitude [-180, 180].');
    error.statusCode = 400;
    error.code = 'INVALID_GEOLOCATION';
    throw error;
  }

  const office = customOffice || getOfficeCoordinates();
  const distanceMeters = calculateDistance(lat, lon, office.latitude, office.longitude);
  const isWithinRadius = distanceMeters <= (office.allowedRadiusMeters || DEFAULT_ALLOWED_RADIUS_METERS);

  return {
    isWithinRadius,
    distanceMeters,
    allowedRadiusMeters: office.allowedRadiusMeters || DEFAULT_ALLOWED_RADIUS_METERS,
    office
  };
};

export default {
  calculateDistance,
  getOfficeCoordinates,
  verifyGeofenceLocation,
  DEFAULT_OFFICE_LATITUDE,
  DEFAULT_OFFICE_LONGITUDE,
  DEFAULT_ALLOWED_RADIUS_METERS
};
