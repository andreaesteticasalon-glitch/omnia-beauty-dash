import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = 'https://attksylwlxiuzkirrjhn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0dGtzeWx3bHhpdXpraXJyamhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzMjk1NjgsImV4cCI6MjA5MzkwNTU2OH0.2iDzzGXW2hGgqZ0BAtwvxfE6JyMzOMTXF0m00cm6tLg';

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
