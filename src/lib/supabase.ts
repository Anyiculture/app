import { createClient } from '@supabase/supabase-js';
import { mockSupabase } from './mockSupabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// RADICAL FIX: Force Mock Mode if connection is failing or explicitly requested
// Set this to true to bypass backend completely
const USE_MOCK_MODE = false; 

let client: any;

if (USE_MOCK_MODE) {
  console.warn('⚠️  RUNNING IN MOCK MODE: Backend connection is disabled. Data is local-only. ⚠️');
  client = mockSupabase;
} else {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('⚠️ Supabase environment variables are not set. Please create a .env file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  }
  client = createClient(supabaseUrl || '', supabaseAnonKey || '');
}

export const supabase = client;
