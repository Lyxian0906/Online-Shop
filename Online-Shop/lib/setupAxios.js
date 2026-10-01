import axios from 'axios';
import { supabase } from './supabase';


axios.interceptors.request.use(async (config) => {
  // Only send the token to your own API, never to other websites.
  if (config.url?.startsWith('/api')) {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

/*
Runs before every axios request. If the user is logged in, it adds the token
so your Express server knows who is asking. Your existing axios.get/post/put/delete
calls don't need to change.

*/