import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';

export const GLUCOSE_CURRENT_KEY = ['glucose', 'current'];
export const SIMULATOR_KEY = ['glucose', 'simulator'];

// Polls every 15 seconds. With one reading per minute, a new value appears
// on screen within 15 seconds of being generated.
export function useCurrentGlucose() {
  return useQuery({
    queryKey: GLUCOSE_CURRENT_KEY,
    queryFn: () => api.getGlucoseCurrent(),
    refetchInterval: 15000,
  });
}

// No retry: when the controls are disabled the route does not exist, and
// the panel should disappear immediately rather than after retries.
export function useSimulator() {
  return useQuery({
    queryKey: SIMULATOR_KEY,
    queryFn: () => api.getSimulator(),
    retry: false,
  });
}

export function useSetSimulator() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (controls) => api.setSimulator(controls),
    onSuccess: (data) => {
      queryClient.setQueryData(SIMULATOR_KEY, data);
      queryClient.invalidateQueries({ queryKey: GLUCOSE_CURRENT_KEY, exact: true });
    },
  });
}
