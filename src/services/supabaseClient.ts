import { supabase } from './supabase';

// Re-export the shared singleton client so auth/session state stays consistent.
export default supabase;
