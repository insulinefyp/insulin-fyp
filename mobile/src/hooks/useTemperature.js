import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';

export const TEMP_HISTORY_KEY = ['temperature', 'history'];
export const TEMP_EXCURSIONS_KEY = ['temperature', 'excursions'];

// The current temperature arrives inside the device status, so there is no
// separate query for it. These two cover the detail screen only.
export function useTemperatureHistory(hours = 6) {
  return useQuery({
    queryKey: [...TEMP_HISTORY_KEY, hours],
    queryFn: () => api.getTemperatureHistory(hours),
    refetchInterval: 30000,
  });
}

export function useTemperatureExcursions(includeSimulated = false) {
  return useQuery({
    queryKey: [...TEMP_EXCURSIONS_KEY, includeSimulated],
    queryFn: () => api.getTemperatureExcursions(includeSimulated),
    refetchInterval: 30000,
  });
}
