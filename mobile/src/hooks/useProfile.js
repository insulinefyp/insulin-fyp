import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const PROFILE_KEY = ['profile'];
export const PROFILE_CHANGES_KEY = ['profile', 'changes'];

export function useProfile() {
  return useQuery({
    queryKey: PROFILE_KEY,
    queryFn: () => api.getProfile(),
  });
}

export function useProfileChanges() {
  return useQuery({
    queryKey: PROFILE_CHANGES_KEY,
    queryFn: () => api.getProfileChanges(),
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { updateUser } = useAuth();

  return useMutation({
    mutationFn: (changes) => api.updateProfile(changes),
    onSuccess: (data) => {
      // The response already holds the fresh profile, so write it straight
      // into the cache instead of refetching.
      queryClient.setQueryData(PROFILE_KEY, {
        user: data.user,
        profile: data.profile,
      });
      updateUser(data.user);

      if (data.logged && data.logged.length > 0) {
        queryClient.invalidateQueries({ queryKey: PROFILE_CHANGES_KEY });
      }
    },
  });
}
