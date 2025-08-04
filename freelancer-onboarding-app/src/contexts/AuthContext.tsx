import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { supabase, auth } from '../services/supabase';
import type { User } from '../types/database.types';
import { db } from '../services/database.service';

interface AuthContextType {
  // Authentication state
  session: Session | null;
  authUser: SupabaseUser | null;
  dbUser: User | null;
  loading: boolean;
  error: string | null;
  
  // Authentication methods
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, fullName: string, organizationName?: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  
  // User methods
  refreshUser: () => Promise<void>;
  hasRole: (roles: User['role'][]) => boolean;
  isAdmin: () => boolean;
  isOwner: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [authUser, setAuthUser] = useState<SupabaseUser | null>(null);
  const [dbUser, setDbUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize auth state
  useEffect(() => {
    let mounted = true;
    
    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (mounted && session) {
          setSession(session);
          setAuthUser(session.user);
          await loadDatabaseUser(session.user.id);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        if (mounted) {
          setError('Failed to initialize authentication');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };
    
    initializeAuth();
    
    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      console.log('Auth event:', event);
      setSession(session);
      setAuthUser(session?.user || null);
      
      if (session?.user) {
        await loadDatabaseUser(session.user.id);
        
        // Update last login
        if (event === 'SIGNED_IN') {
          try {
            await db.users.updateLastLogin(session.user.id);
          } catch (err) {
            console.error('Failed to update last login:', err);
          }
        }
      } else {
        setDbUser(null);
      }
      
      if (event === 'PASSWORD_RECOVERY') {
        // Handle password recovery
      }
    });
    
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);
  
  const loadDatabaseUser = async (userId: string) => {
    try {
      const user = await db.users.getById(userId);
      if (user) {
        setDbUser(user);
      } else {
        // User exists in auth but not in database - this shouldn't happen
        console.error('User not found in database');
        setError('User profile not found');
      }
    } catch (err) {
      console.error('Failed to load user profile:', err);
      setError('Failed to load user profile');
    }
  };
  
  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      const { data, error } = await auth.signIn(email, password);
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      if (data.session) {
        setSession(data.session);
        setAuthUser(data.session.user);
        await loadDatabaseUser(data.session.user.id);
      }
      
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to sign in';
      return { success: false, error: message };
    }
  };
  
  const signUp = async (email: string, password: string, fullName: string, organizationName?: string) => {
    try {
      setError(null);
      
      // If organizationName is provided, create a new organization
      // Otherwise, this is a user joining an existing organization
      if (organizationName) {
        // Create organization first
        const subdomain = organizationName
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '');
        
        // Check subdomain availability
        const isAvailable = await db.utils.checkSubdomainAvailability(subdomain);
        if (!isAvailable) {
          return { success: false, error: 'Organization name is already taken' };
        }
        
        // Sign up the user
        const { data: authData, error: authError } = await auth.signUp(email, password, {
          full_name: fullName,
        });
        
        if (authError) {
          return { success: false, error: authError.message };
        }
        
        if (!authData.user) {
          return { success: false, error: 'Failed to create user account' };
        }
        
        // Create organization
        const org = await db.organizations.create({
          name: organizationName,
          subdomain,
          branding: {
            company_name: organizationName,
            colors: {
              primary: '#4f46e5',
              secondary: '#059669',
              accent: '#dc2626',
              neutral: '#6b7280',
            },
          },
        });
        
        // Create user profile
        await db.users.create({
          id: authData.user.id,
          email,
          full_name: fullName,
          organization_id: org.id,
          role: 'owner', // First user is the owner
        });
        
        return { success: true };
      } else {
        // Just sign up - admin will need to add to organization
        const { data: authData, error: authError } = await auth.signUp(email, password, {
          full_name: fullName,
        });
        
        if (authError) {
          return { success: false, error: authError.message };
        }
        
        return { success: true };
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to sign up';
      return { success: false, error: message };
    }
  };
  
  const signOut = async () => {
    try {
      setError(null);
      const { error } = await auth.signOut();
      if (error) throw error;
      
      setSession(null);
      setAuthUser(null);
      setDbUser(null);
    } catch (err) {
      console.error('Sign out error:', err);
      setError('Failed to sign out');
      throw err;
    }
  };
  
  const resetPassword = async (email: string) => {
    try {
      setError(null);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send reset email';
      return { success: false, error: message };
    }
  };
  
  const updatePassword = async (newPassword: string) => {
    try {
      setError(null);
      const { data, error } = await auth.updateUser({ password: newPassword });
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update password';
      return { success: false, error: message };
    }
  };
  
  const refreshUser = async () => {
    if (authUser) {
      await loadDatabaseUser(authUser.id);
    }
  };
  
  const hasRole = (roles: User['role'][]) => {
    if (!dbUser) return false;
    return roles.includes(dbUser.role);
  };
  
  const isAdmin = () => hasRole(['admin', 'owner']);
  const isOwner = () => hasRole(['owner']);
  
  return (
    <AuthContext.Provider
      value={{
        session,
        authUser,
        dbUser,
        loading,
        error,
        signIn,
        signUp,
        signOut,
        resetPassword,
        updatePassword,
        refreshUser,
        hasRole,
        isAdmin,
        isOwner,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};