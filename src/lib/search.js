import { parsePriceToNumber } from '@/lib/pricing';

export const DEFAULT_SEARCH_CENTER = {
  lat: 21.0059,
  lng: 105.8431
};

export const PRICE_FILTERS = {
  under50000: { label: 'Dưới 50.000đ', min: 0, max: 50000 },
  from50000to80000: { label: '50.000đ - 80.000đ', min: 50000, max: 80000 },
  over80000: { label: 'Trên 80.000đ', min: 80000, max: Infinity }
};

export function normalizeSearchParams(searchParams = {}) {
  const q = String(searchParams.q || '').trim();
  const price = String(searchParams.price || '').trim();
  const distance = Number(searchParams.distance || 0);
  const rating = Number(searchParams.rating || 0);

  return {
    q,
    price: PRICE_FILTERS[price] ? price : '',
    distance: Number.isFinite(distance) && distance > 0 ? distance : 0,
    rating: Number.isFinite(rating) && rating > 0 ? rating : 0
  };
}

export function hasActiveFilters(filters) {
  return Boolean(filters.q || filters.price || filters.distance || filters.rating);
}

export function normalizeText(value) {
  return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function parseMapLocation(value) {
  const [lat, lng] = String(value || '').split(',').map((item) => Number(item.trim()));

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  return { lat, lng };
}

export function calculateDistanceKm(mapLocation, center = DEFAULT_SEARCH_CENTER) {
  const location = parseMapLocation(mapLocation);
  if (!location) return null;

  const earthRadiusKm = 6371;
  const toRad = (degree) => degree * Math.PI / 180;
  const latDelta = toRad(location.lat - center.lat);
  const lngDelta = toRad(location.lng - center.lng);
  const startLat = toRad(center.lat);
  const endLat = toRad(location.lat);
  const a = Math.sin(latDelta / 2) ** 2
    + Math.cos(startLat) * Math.cos(endLat) * Math.sin(lngDelta / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusKm * c;
}

export function getStoreDistanceKm(store) {
  return calculateDistanceKm(store?.mapLocation);
}

export function getStoreRating(store) {
  const rating = Number(store?.rating);
  return Number.isFinite(rating) ? rating : 0;
}

export function storeMatchesQuery(store, query) {
  if (!query) return true;

  const needle = normalizeText(query);
  const haystack = normalizeText([
    store?.shopName,
    store?.address,
    store?.owner?.displayName
  ].join(' '));

  return haystack.includes(needle);
}

export function productMatchesQuery(product, query) {
  if (!query) return true;

  const needle = normalizeText(query);
  const haystack = normalizeText([
    product?.name,
    product?.desc,
    product?.category?.name,
    product?.owner?.displayName,
    product?.owner?.merchantProfile?.shopName
  ].join(' '));

  return haystack.includes(needle);
}

export function productMatchesPrice(product, priceFilterKey) {
  if (!priceFilterKey) return true;

  const range = PRICE_FILTERS[priceFilterKey];
  const price = parsePriceToNumber(product?.price);

  return price >= range.min && price < range.max;
}

export function storeMatchesFilters(store, filters) {
  const distance = getStoreDistanceKm(store);
  const distanceMatches = !filters.distance || (distance !== null && distance <= filters.distance);
  const ratingMatches = !filters.rating || getStoreRating(store) >= filters.rating;

  return storeMatchesQuery(store, filters.q) && distanceMatches && ratingMatches;
}

export function productMatchesFilters(product, filters) {
  const store = product?.owner?.merchantProfile;
  const productOrStoreMatchesQuery = productMatchesQuery(product, filters.q) || storeMatchesQuery(store, filters.q);
  const distance = getStoreDistanceKm(store);
  const distanceMatches = !filters.distance || (distance !== null && distance <= filters.distance);
  const ratingMatches = !filters.rating || getStoreRating(store) >= filters.rating;

  return productOrStoreMatchesQuery
    && productMatchesPrice(product, filters.price)
    && distanceMatches
    && ratingMatches;
}

export function sortTrendingProducts(products) {
  return [...products].sort((a, b) => {
    const aRating = getStoreRating(a?.owner?.merchantProfile);
    const bRating = getStoreRating(b?.owner?.merchantProfile);
    if (bRating !== aRating) return bRating - aRating;

    return parsePriceToNumber(a?.price) - parsePriceToNumber(b?.price);
  });
}
