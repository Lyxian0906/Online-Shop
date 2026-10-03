import { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null); // { id, email, role } from /api/me
  const [loading, setLoading] = useState(true); // true until we know if someone is logged in

  // Keep the session in sync with Supabase (login, logout, token refresh).
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  // When a user logs in, ask our server who they are and what role they have.
  const userId = session?.user?.id;
  useEffect(() => {
    if (!userId) {
      setProfile(null);
      return;
    }
    axios.get('/api/me')
      .then((res) => setProfile(res.data))
      .catch(() => setProfile(null));
  }, [userId]);

  const value = {
    session,
    profile: profile ?? null,
    loading: loading || (Boolean(userId) && profile === undefined),
    isLoggedIn: Boolean(session),
    isAdmin: profile?.role === 'admin',
    signUp: (email, password) => supabase.auth.signUp({ email, password }),
    signIn: (email, password) => supabase.auth.signInWithPassword({ email, password }),
    signOut: () => supabase.auth.signOut()
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return context;
}
/*
This page only checks who is logged in and then tells the rest of the app
This part of the app remember 3 things

Line 13, the session that's basically if there's someone loggedd in or not :)
Line 28 that's the profile, that checks the role (admin or customer)
Line 38 there's a loadin part, that's the one that makes the app wait if it's still checking





*/