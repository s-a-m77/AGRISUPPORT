import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import { api } from "@/lib/api";

/**
 * Signs the farmer out and leaves the protected area.
 * Cached data is dropped first so the back button cannot restore a signed-in shell.
 */
export function useSignOut() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await api.auth.signOut();
    await navigate({ to: "/auth", replace: true });
  };
}
