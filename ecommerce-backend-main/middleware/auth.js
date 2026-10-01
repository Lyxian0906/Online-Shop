import { createClient } from '@supabase/supabase-js';
import { Profile } from '../models/Profile.js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({ error: 'Not logged in' });
    }

    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // First time we see this user, create their profile (role = customer).
    const [profile] = await Profile.findOrCreate({
      where: { id: data.user.id },
      defaults: { email: data.user.email, role: 'customer' }
    });

    req.user = { id: profile.id, email: profile.email, role: profile.role };
    next();
  } catch (err) {
    next(err);
  }
}

// Use AFTER requireAuth on routes only admins may call.
export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admins only' });
  }
  next();
}

/*
 Use on any route that needs a logged-in user.
 Reads "Authorization: Bearer <token>", asks Supabase who it belongs to,
 and sets req.user = { id, email, role }.



 Explanation on this file:

 The folder name middleware is because middleware is a function that
 runs before our route hanfler, so it can let the sended request either 
 go through or stop.

 This file has 2 parts:
(SupaBase hash the passwords so whenever the user type their password
supa only compare the hashes)
  Token: Reads the Authorization Bearer token header, the frontend adds the
  header after the user logs in

  Then it sends this token to SupaBase with the
  supabase.auth.getUser(token) thaaaaaat's in line 18
  so supabase confirm is the token is real or is not and the returns the user

  Then it looks the user profile or create one if it's the first time

  Then it puts the results into the req.user so then the routes can use
  req.user.id and role

  If anything fails it will just send an error
*/