import { createClient } from '@supabase/supabase-js';

let _client = null;

export function getSupabase() {
  if (_client) return _client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    // During build-time prerender, return a stub that no-ops
    // so SSR doesn't crash. Real client is created in browser.
    if (typeof window === 'undefined') {
      return {
        from: () => ({
          select: () => ({ eq: () => ({ order: () => ({ then: () => {} }) }) }),
        }),
        storage: { from: () => ({}) },
      };
    }
  }
  _client = createClient(url, key);
  return _client;
}

// Backwards-compatible named export — a Proxy that lazily creates the client
export const supabase = new Proxy(
  {},
  {
    get(_, prop) {
      const client = getSupabase();
      const value = client[prop];
      return typeof value === 'function' ? value.bind(client) : value;
    },
  }
);