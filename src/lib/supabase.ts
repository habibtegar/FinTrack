import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validasi environment variable URL Supabase
if (!supabaseUrl || typeof supabaseUrl !== 'string' || supabaseUrl.trim() === '') {
  throw new Error(
    'Konfigurasi Supabase Error: VITE_SUPABASE_URL belum diatur. Harap tambahkan VITE_SUPABASE_URL pada file .env atau .env.local.'
  );
}

// Validasi environment variable Anon Key Supabase
if (!supabaseAnonKey || typeof supabaseAnonKey !== 'string' || supabaseAnonKey.trim() === '') {
  throw new Error(
    'Konfigurasi Supabase Error: VITE_SUPABASE_ANON_KEY belum diatur. Harap tambahkan VITE_SUPABASE_ANON_KEY pada file .env atau .env.local.'
  );
}

// Inisialisasi Supabase Client menggunakan createClient dengan schema Database
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
