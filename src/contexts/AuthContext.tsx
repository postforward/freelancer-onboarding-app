import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
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
      console.log('🔄 AuthContext: Starting initialization...');
      try {
        // Get initial session
        const { data: { session } } = await supabase.auth.getSession();
        console.log('🔄 AuthContext: Got session:', !!session);
        
        if (mounted && session) {
          console.log('🔄 AuthContext: Setting session and loading user...');
          setSession(session);
          setAuthUser(session.user);
          await loadDatabaseUser(session.user.id);
          
          // Note: loading will be set to false in the finally block
        }
      } catch (err) {
        console.error('❌ AuthContext: Initialization error:', err);
        if (mounted) {
          setError('Failed to initialize authentication');
        }
      } finally {
        if (mounted) {
          console.log('✅ AuthContext: Initialization complete, setting loading to false');
          setLoading(false);
        }
      }
    };
    
    initializeAuth();
    
    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
      if (!mounted) return;
      
      console.log('🔄 AuthContext: Auth event:', event, 'Session:', !!session);
      setSession(session);
      setAuthUser(session?.user || null);
      
      if (session?.user) {
        console.log('🔄 AuthContext: Loading database user for auth change...');
        setLoading(true); // Set loading true when starting database lookup
        
        await loadDatabaseUser(session.user.id);
        
        // Always set loading to false after database lookup attempt
        if (mounted) {
          console.log('✅ AuthContext: Database lookup complete, setting loading to false');
          setLoading(false);
        }
        
        // Update last login
        if (event === 'SIGNED_IN') {
          try {
            await db.users.updateLastLogin(session.user.id);
          } catch (err) {
            console.error('❌ AuthContext: Failed to update last login:', err);
          }
        }
      } else {
        console.log('🔄 AuthContext: No session, clearing user data');
        setDbUser(null);
        setError(null);
        if (mounted) {
          setLoading(false);
        }
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
    console.log('🔄 AuthContext: Loading database user for ID:', userId);
    
    // Create timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Database query timeout after 10 seconds')), 10000);
    });
    
    try {
      // Race between database query and timeout
      const user = await Promise.race([
        db.users.getById(userId),
        timeoutPromise
      ]);
      
      if (user) {
        console.log('✅ AuthContext: Database user loaded successfully:', user.email);
        setDbUser(user);
        setError(null); // Clear any previous errors
      } else {
        // User exists in auth but not in database - this happens during signup
        console.error('❌ AuthContext: User not found in database for ID:', userId);
        console.error('❌ AuthContext: This means the user profile was not created during signup');
        setError('User profile setup incomplete. Please contact support or try signing up again.');
        setDbUser(null);
        
        // Force redirect to login to prevent infinite loading
        console.log('🔄 AuthContext: Redirecting to login in 3 seconds...');
        setTimeout(() => {
          window.location.href = '/login';
        }, 3000);
      }
    } catch (err) {
      console.error('❌ AuthContext: Failed to load user profile:', err);
      
      if (err instanceof Error && err.message.includes('timeout')) {
        setError('Database connection timeout. Please try refreshing the page.');
      } else {
        setError('Failed to load user profile: ' + (err instanceof Error ? err.message : 'Unknown error'));
      }
      
      setDbUser(null);
      
      // Force redirect to login after timeout
      console.log('🔄 AuthContext: Error occurred, redirecting to login in 3 seconds...');
      setTimeout(() => {
        window.location.href = '/login';
      }, 3000);
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
        const { error: authError } = await auth.signUp(email, password, {
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
      const { error } = await auth.updateUser({ password: newPassword });
      
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