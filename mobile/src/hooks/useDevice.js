import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';

export const DEVICE_KEY = ['device'];

// The backend polls the device every 3 seconds and serves a cached snapshot,
// so polling faster than that here would return the same data. Five seconds
// means a device going offline appears within 10-20 seconds.
export function useDevice() {
  return useQuery({
    queryKey: DEVICE_KEY,
    queryFn: () => api.getDevice(),
    refetchInterval: 5000,
  });
}
