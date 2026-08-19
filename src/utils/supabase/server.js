import { createClient } from '@supabase/supabase-js';

// Create a server-side Supabase client with the Service Role Key
// This bypasses Row Level Security entirely, so it MUST ONLY be used securely in API routes after verification
export const createAdminClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY // fallback for testing if service key not set
  );
};
