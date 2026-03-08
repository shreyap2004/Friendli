// Haversine formula to calculate distance between two lat/lng points in miles
export function getDistanceMiles(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 3958.8; // Earth's radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

// Geocode a US zip code to lat/lng using the free zippopotam.us API
export async function geocodeZip(zip: string): Promise<{ lat: number; lng: number } | null> {
  const cleaned = zip.trim().replace(/\D/g, "");
  if (cleaned.length !== 5) return null;

  try {
    const res = await fetch(`https://api.zippopotam.us/us/${cleaned}`);
    if (!res.ok) return null;
    const data = await res.json();
    const place = data.places?.[0];
    if (!place) return null;
    return {
      lat: parseFloat(place.latitude),
      lng: parseFloat(place.longitude),
    };
  } catch {
    return null;
  }
}
