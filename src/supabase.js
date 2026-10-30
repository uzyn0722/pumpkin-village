import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL || 'https://irwcgvipdkmiuqlalhgy.supabase.co';
const key = import.meta.env.VITE_SUPABASE_KEY || 'sb_publishable_Kc6fJ3UO982zWkej_vIQ3A_YZG27pxU';

export const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
  realtime: { params: { eventsPerSecond: 5 } },
});

export async function rpc(name, args) {
  const { data, error } = await supabase.rpc(name, args || {});
  if (error) throw error;
  return data;
}
