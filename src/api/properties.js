import { useQuery } from '@tanstack/react-query';
import api from './client';

function buildPropertyQuery(params) {
  const q = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return;
    if (Array.isArray(v) && v.length === 0) return;
    if (Array.isArray(v)) q.set(k, v.join(','));
    else q.set(k, String(v));
  });
  return q.toString();
}

export function usePropertiesQuery(params, options) {
  const query = buildPropertyQuery(params);
  return useQuery({
    queryKey: ['properties', query],
    queryFn: () => api.get(`/api/properties?${query}`),
    ...options,
  });
}

export function usePropertyQuery(id, options) {
  return useQuery({
    queryKey: ['property', String(id)],
    queryFn: () => api.get(`/api/properties/${id}`),
    enabled: !!id,
    ...options,
  });
}

export function useFeaturedPropertiesQuery(options) {
  return usePropertiesQuery({ limit: 3 }, options);
}
