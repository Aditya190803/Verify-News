'use client';

import { useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { getConvexHttpClient } from '@/services/convexClient';

/** Keeps ConvexHttpClient auth in sync for aggregationApi fetch helpers. */
export function ConvexAuthSync() {
  const { getToken, isSignedIn } = useAuth();

  useEffect(() => {
    const c = getConvexHttpClient();
    if (!c) return;
    void (async () => {
      if (!isSignedIn) {
        c.clearAuth();
        return;
      }
      const token = await getToken({ template: 'convex' });
      if (token) c.setAuth(token);
    })();
  }, [getToken, isSignedIn]);

  return null;
}