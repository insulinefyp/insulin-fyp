import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';

export const TREATMENT_KEY = ['treatment'];
export const TREATMENT_LIMITS_KEY = ['treatment', 'limits'];
export const TREATMENT_HISTORY_KEY = ['treatment', 'history'];

export function useTreatment() {
  return useQuery({
    queryKey: TREATMENT_KEY,
    queryFn: () => api.getTreatment(),
  });
}

// System limits are constants on the server, so they are fetched once per
// session rather than refetched on every screen.
export function useTreatmentLimits() {
  return useQuery({
    queryKey: TREATMENT_LIMITS_KEY,
    queryFn: () => api.getTreatmentLimits(),
    staleTime: Infinity,
  });
}

export function useTreatmentHistory() {
  return useQuery({
    queryKey: TREATMENT_HISTORY_KEY,
    queryFn: () => api.getTreatmentHistory(),
  });
}

export function useCreateTreatment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values) => api.createTreatmentVersion(values),
    onSuccess: (data) => {
      queryClient.setQueryData(TREATMENT_KEY, (prev) => ({
        isSet: true,
        glucoseUnit: prev?.glucoseUnit ?? 'mg/dL',
        parameters: data.parameters,
      }));
      queryClient.invalidateQueries({ queryKey: TREATMENT_HISTORY_KEY, exact: true });
    },
  });
}
