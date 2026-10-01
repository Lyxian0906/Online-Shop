import { createClient } from '@supabase/supabase-js';


export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

/*
These two values are safe to expose in the browser (publishable key only!).
Never put the secret key here dumbass.
This file is the one that create the conexion with supabase
So every login and logout call goes through it

*/