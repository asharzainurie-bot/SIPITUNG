import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Default Supabase project credentials provided by user as Vercel environment variables fallback
const DEFAULT_SUPABASE_URL = 'https://pumjlqdgpbhnzhhrtvdl.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1bWpscWRncGJobnpoaHJ0dmRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5OTY4NDksImV4cCI6MjEwMTU3Mjg0OX0.Fd7X9cvcYDgEuxdbl8vAtcE-cz9nNpCcS3mzaDSf3so';

export function getSupabaseCredentials(customSettings?: { supabaseUrl?: string; supabaseAnonKey?: string }) {
  const metaEnv = (import.meta as any).env || {};

  const url =
    (metaEnv.VITE_SUPABASE_URL as string)?.trim() ||
    (customSettings?.supabaseUrl)?.trim() ||
    (localStorage.getItem('SIPITUNG_SUPABASE_URL'))?.trim() ||
    DEFAULT_SUPABASE_URL;

  const key =
    (metaEnv.VITE_SUPABASE_ANON_KEY as string)?.trim() ||
    (customSettings?.supabaseAnonKey)?.trim() ||
    (localStorage.getItem('SIPITUNG_SUPABASE_ANON_KEY'))?.trim() ||
    DEFAULT_SUPABASE_ANON_KEY;

  return { url, key };
}

export function getSupabaseClient(customSettings?: { supabaseUrl?: string; supabaseAnonKey?: string }): SupabaseClient | null {
  const { url, key } = getSupabaseCredentials(customSettings);
  if (!url || !key || !url.startsWith('http')) {
    return null;
  }
  try {
    return createClient(url, key);
  } catch (e) {
    console.error('[Supabase Client Error]', e);
    return null;
  }
}
