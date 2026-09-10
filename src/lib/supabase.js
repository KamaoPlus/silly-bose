import { createClient } from '@supabase/supabase-js';

// Default fallback valid Supabase URL & Anon Key
const DEFAULT_SUPABASE_URL = 'https://gsactdpoyhlampexhcsw.supabase.co';
const DEFAULT_SUPABASE_KEY = 'sb_publishable_bG14O0KtYsp8pKzPC36G-A_H47C8wtR';

/**
 * Robust URL Sanitizer:
 * Handles copy-pasted markdown links: [https://xyz.supabase.co](https://xyz.supabase.co)
 * Handles brackets, parentheses, spaces, quotes, and invalid formatting.
 */
export function sanitizeSupabaseUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return DEFAULT_SUPABASE_URL;

  let cleaned = rawUrl.trim();

  // If user pasted Markdown format: [url](url) or similar, take the URL inside parentheses or brackets
  const markdownMatch = cleaned.match(/\[.*?\]\((https?:\/\/[^\s\)]+)\)/i);
  if (markdownMatch && markdownMatch[1]) {
    cleaned = markdownMatch[1].trim();
  }

  // Regex extract strictly the clean Supabase endpoint: https://[subdomain].supabase.co
  const exactMatch = cleaned.match(/(https:\/\/[a-z0-9_-]+\.supabase\.co)/i);
  if (exactMatch && exactMatch[1]) {
    return exactMatch[1].toLowerCase();
  }

  // Generic https URL extract if non-standard domain
  const genericMatch = cleaned.match(/(https?:\/\/[^\s"'<>\(\)\[\]]+)/i);
  if (genericMatch && genericMatch[1]) {
    return genericMatch[1].replace(/\/+$/, '');
  }

  return DEFAULT_SUPABASE_URL;
}

export function sanitizeAnonKey(rawKey) {
  if (!rawKey || typeof rawKey !== 'string') return DEFAULT_SUPABASE_KEY;
  let cleaned = rawKey.trim();
  // Strip enclosing quotes or brackets if present
  cleaned = cleaned.replace(/^["'\[\(]+|["'\]\)]+$/g, '');
  return cleaned || DEFAULT_SUPABASE_KEY;
}

// Extract and sanitize environment or fallback values
const rawEnvUrl = typeof import.meta !== 'undefined' && import.meta?.env ? import.meta.env.VITE_SUPABASE_URL : '';
const rawEnvKey = typeof import.meta !== 'undefined' && import.meta?.env ? import.meta.env.VITE_SUPABASE_ANON_KEY : '';

const sanitizedUrl = sanitizeSupabaseUrl(rawEnvUrl);
const sanitizedKey = sanitizeAnonKey(rawEnvKey);

console.log('[Supabase Config] Raw URL:', rawEnvUrl, '=> Sanitized URL:', sanitizedUrl);

/**
 * Safe fallback client that logs warnings instead of throwing uncaught errors and crashing the app
 */
function createSafeSupabaseClient() {
  try {
    return createClient(sanitizedUrl, sanitizedKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  } catch (err) {
    console.warn('[Supabase Init Warning] Failed to initialize client with primary URL, falling back to default:', err.message);
    try {
      return createClient(DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_KEY, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
    } catch (fallbackErr) {
      console.error('[Supabase Fatal] Fallback client initialization failed:', fallbackErr.message);
      // Dummy no-op proxy to prevent any downstream null pointer exceptions
      return {
        from: () => ({
          select: async () => ({ data: [], error: { message: 'Supabase client unavailable' } }),
          insert: async () => ({ data: [], error: { message: 'Supabase client unavailable' } }),
          upsert: async () => ({ data: [], error: { message: 'Supabase client unavailable' } }),
          delete: async () => ({ data: [], error: { message: 'Supabase client unavailable' } }),
        }),
      };
    }
  }
}

export const supabase = createSafeSupabaseClient();
