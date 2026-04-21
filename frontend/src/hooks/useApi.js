import { useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';

/**
 * Authenticated fetch — attaches Clerk bearer token to every request.
 * Use exactly like `fetch()`:
 *    const api = useApi();
 *    const res = await api('/api/chats');
 */
export function useApi() {
  const { getToken } = useAuth();

  return useCallback(
    async (url, options = {}) => {
      const token = await getToken();
      const headers = {
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`,
      };
      if (options.body && !(options.body instanceof FormData)) {
        headers['Content-Type'] = headers['Content-Type'] || 'application/json';
      }
      return fetch(url, { ...options, headers });
    },
    [getToken]
  );
}