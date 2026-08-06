import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://gendczfxijosbebgsnth.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlbmRjemZ4aWpvc2JlYmdzbnRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5MjEwNjEsImV4cCI6MjEwMTQ5NzA2MX0.PZuaK97uCbYpTCfu7eNNzzONI2wbBarOd1uW4zC34ZA';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
