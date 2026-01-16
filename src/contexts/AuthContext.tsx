import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session, AuthChangeEvent, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Profile } from '../services/profileService';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  connectionError: boolean;
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState(false);

  useEffect(() => {
    // Initial session fetch - let Supabase handle timeouts naturally
    supabase.auth.getSession()
      .then(async ({ data: { session }, error }: { data: { session: Session | null }; error: AuthError | null }) => {
        if (error) {
          console.error('Session error:', error);
          setUser(null);
          setProfile(null);
          // If the error is network related, set connectionError
          if (error.message && (error.message.includes('fetch') || error.message.includes('network'))) {
            setConnectionError(true);
          }
        } else {
          setConnectionError(false);
          setUser(session?.user ?? null);
          if (session?.user) {
            const { data } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .maybeSingle();
            setProfile(data);
          }
        }
        setLoading(false);
      })
      .catch((err: unknown) => {
        console.error('Failed to get session:', err);
        setUser(null);
        setProfile(null);
        setLoading(false);
        setConnectionError(true);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      setUser(session?.user ?? null);

      if (event === 'SIGNED_IN' && session?.user) {
        // Background profile operations - don't block auth state
        (async () => {
          try {
            const { data: profileData, error: fetchError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .maybeSingle();

            if (fetchError) {
              console.error('Error fetching profile:', fetchError);
              return;
            }
            
            setProfile(profileData);

            if (!profileData) {
              const { error: insertError } = await supabase.from('profiles').insert({
                id: session.user.id,
                email: session.user.email,
                onboarding_completed: false,
                is_first_login: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              });
              
              if (insertError) {
                console.error('Error creating profile:', insertError);
              }
            } else {
              const { error: updateError } = await supabase.from('profiles').update({
                last_login_at: new Date().toISOString()
              }).eq('id', session.user.id);
              
              if (updateError) {
                console.error('Error updating last login:', updateError);
              }
            }

            // Sync to public.users table as well (for FKs)
            try {
              const { error: userSyncError } = await supabase.from('users').upsert({
                 id: session.user.id,
                 email: session.user.email,
                 updated_at: new Date().toISOString()
              });
               if (userSyncError && userSyncError.code !== '42P01' && userSyncError.code !== '42501') {
                 console.warn('Warning: Could not sync to public.users (RLS or Schema issue). Some features may be limited.', userSyncError.message);
               }
            } catch (err) {
               // Ignore network/other errors during background sync
            }
          } catch (err) {
            console.error('Profile operation failed:', err);
          }
        })();
      } else if (event === 'SIGNED_OUT') {
        setProfile(null);
      }
    });

    return () => subscription?.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, firstName: string, lastName: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;

    if (data.user) {
      // Create user record in public.users if it exists (for FK constraints)
      try {
        const { error: userError } = await supabase.from('users').upsert({
          id: data.user.id,
          email: email,
          full_name: `${firstName} ${lastName}`.trim(),
          avatar_url: null,
          created_at: new Date().toISOString()
        });
        if (userError && userError.code !== '42P01' && userError.code !== '42501') { // Ignore if table doesn't exist or RLS blocks
           console.warn('Warning: Could not sync to public.users:', userError);
        }
      } catch (e) {
        // Ignore error if table doesn't exist
      }

      await supabase.from('profiles').upsert({
        id: data.user.id,
        email: email,
        first_name: firstName,
        last_name: lastName,
        onboarding_completed: false,
        is_first_login: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`
      }
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    // Clear user state and redirect to landing page
    setUser(null);
    setProfile(null);
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, connectionError, signUp, signIn, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be within AuthProvider');
  return context;
}
