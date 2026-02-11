
import { createClient } from '@supabase/supabase-js';

// Credentials from the user provided image
const supabaseUrl = 'https://qxprndvfoepnhpyladyh.supabase.co';
const supabaseKey = 'sb_publishable_gNGHo8xcIUet0vHQev08_A_N58';

export const supabase = createClient(supabaseUrl, supabaseKey);
