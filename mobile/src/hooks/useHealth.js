import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';

export function useHealth() {
  return useQuery({
    queryKey: ['health'],
    queryFn: () => api.getHealth(),
    refetchInterval: 10000,
    retry: 1,
  });
}
