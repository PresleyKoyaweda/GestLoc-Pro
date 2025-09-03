import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: 'owner' | 'tenant';
  phone?: string;
  avatar?: string;
  address?: {
    street: string;
    apartment?: string;
    postalCode: string;
    city: string;
    province: string;
    country: string;
  };
  preferences?: {
    language: 'fr' | 'en';
    currency: 'CAD' | 'USD' | 'EUR';
    theme: 'light' | 'dark';
    notifications: boolean;
    aiCommunication?: 'email' | 'sms';
  };
}

interface AuthContextType {
  user: User | null;
  login: (
    email: string, 
    password: string,
    expectedRole: 'owner' | 'tenant'
  ) => Promise<{ success: boolean; error?: string }>;
  signup: (userData: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    role: 'owner' | 'tenant';
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profile) {
            const userData: User = {
              id: session.user.id,
              email: session.user.email!,
              first_name: profile.first_name || '',
              last_name: profile.last_name || '',
              role: profile.role || 'tenant',
              phone: profile.phone,
              address: profile.address,
              preferences: profile.preferences
            };
            setUser(userData);
          }
        }
      } catch (error) {
        console.error('Erreur lors de la vérification de session:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          const userData: User = {
            id: session.user.id,
            email: session.user.email!,
            first_name: profile.first_name || '',
            last_name: profile.last_name || '',
            role: profile.role || 'tenant'
          };
          setUser(userData);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  /*
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        const userData: User = {
          id: data.user.id,
          email: data.user.email!,
          first_name: profile?.first_name || '',
          last_name: profile?.last_name || '',
          role: profile?.role || 'tenant'
        };

        setUser(userData);
        return { success: true };
      }

      return { success: false, error: 'Email ou mot de passe incorrect' };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Erreur de connexion' };
    } finally {
      setLoading(false);
    }
  };

  */

    const signup = async (userData: {
      email: string;
      password: string;
      first_name: string;
      last_name: string;
      role: 'owner' | 'tenant';
    }): Promise<{ success: boolean; error?: string }> => {
      try {
        setLoading(true);

        const { data, error } = await supabase.auth.signUp({
          email: userData.email,
          password: userData.password,
          options: {
            data: {
              first_name: userData.first_name,
              last_name: userData.last_name,
              role: userData.role
            }
          }
        });

        if (error) {
          return { success: false, error: error.message };
        }

        if (data.user) {
          return { success: true };
        }

        return { success: false, error: 'Erreur lors de la création du compte' };
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Erreur lors de la création du compte' };
      } finally {
        setLoading(false);
      }
    };

    const logout = () => {
      setUser(null);
      supabase.auth.signOut();
    };


  const login = async (
  email: string,
  password: string,
  expectedRole: 'owner' | 'tenant'
): Promise<{ success: boolean; error?: string }> => {
  try {
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (data.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (!profile) {
        return { success: false, error: 'Profil utilisateur introuvable' };
      }

      if (profile.role !== expectedRole) {
        return {
          success: false,
          error: `Ce compte est enregistré comme ${profile.role}, pas comme ${expectedRole}.`
        };
      }

      const userData: User = {
        id: data.user.id,
        email: data.user.email!,
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        role: profile.role || 'tenant'
      };

      setUser(userData);
      return { success: true };
    }

    return { success: false, error: 'Email ou mot de passe incorrect' };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur de connexion'
    };
  } finally {
    setLoading(false);
  }
};


  const value: AuthContextType = {
    user,
    login,
    signup,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};