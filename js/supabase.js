import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://rvgcniaowzmsudzliozf.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_N_xCS0lbbTvG7qWTpAw0ag_vlg1lbHb";

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);
