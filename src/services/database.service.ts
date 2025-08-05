import { supabase } from './supabase';
import { debugLog } from '../config/environment';
import type {
  Organization,
  OrganizationInsert,
  OrganizationUpdate,
  User,
  UserInsert,
  UserUpdate,
  Platform,
  PlatformInsert,
  PlatformUpdate,
  Freelancer,
  FreelancerInsert,
  FreelancerUpdate,
  FreelancerPlatform,
  FreelancerPlatformInsert,
  FreelancerPlatformUpdate,
  AuditLogInsert,
} from '../types/database.types';
import type { PostgrestError } from '@supabase/supabase-js';

// Custom error class for database operations
export class DatabaseError extends Error {
  code?: string;
  details?: any;
  hint?: string;

  constructor(
    message: string,
    code?: string,
    details?: any,
    hint?: string
  ) {
    super(message);
    this.name = 'DatabaseError';
    this.code = code;
    this.details = details;
    this.hint = hint;
  }

  static fromPostgrestError(error: PostgrestError): DatabaseError {
    return new DatabaseError(
      error.message,
      error.code,
      error.details,
      error.hint
    );
  }
}

// Generic CRUD operations
class DatabaseService {
  // Organization operations
  organizations = {
    create: async (data: OrganizationInsert): Promise<Organization> => {
      try {
        debugLog('Creating organization:', data);
        const { data: org, error } = await supabase
          .from('organizations')
          .insert(data)
          .select()
          .single();
        
        if (error) throw DatabaseError.fromPostgrestError(error);
        if (!org) throw new DatabaseError('Failed to create organization');
        
        debugLog('Organization created:', org);
        return org;
      } catch (error) {
        debugLog('Error creating organization:', error);
        throw error;
      }
    },

    getById: async (id: string): Promise<Organization | null> => {
      try {
        const { data, error } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) {
          if (error.code === 'PGRST116') return null; // Not found
          throw DatabaseError.fromPostgrestError(error);
        }
        return data;
      } catch (error) {
        debugLog('Error getting organization by id:', error);
        throw error;
      }
    },

    getBySubdomain: async (subdomain: string) => {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('subdomain', subdomain)
        .single();
      
      if (error) throw error;
      return data;
    },

    update: async (id: string, data: OrganizationUpdate): Promise<Organization> => {
      try {
        debugLog('Updating organization:', id, data);
        const { data: org, error } = await supabase
          .from('organizations')
          .update(data)
          .eq('id', id)
          .select()
          .single();
        
        if (error) throw DatabaseError.fromPostgrestError(error);
        if (!org) throw new DatabaseError('Failed to update organization');
        
        return org;
      } catch (error) {
        debugLog('Error updating organization:', error);
        throw error;
      }
    },

    delete: async (id: string) => {
      const { error } = await supabase
        .from('organizations')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },

    list: async (filters?: { is_active?: boolean }) => {
      let query = supabase.from('organizations').select('*');
      
      if (filters?.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  };

  // User operations
  users = {
    create: async (data: UserInsert): Promise<User> => {
      try {
        debugLog('Creating user:', { ...data, password: '***' });
        const { data: user, error } = await supabase
          .from('users')
          .insert(data)
          .select()
          .single();
        
        if (error) throw DatabaseError.fromPostgrestError(error);
        if (!user) throw new DatabaseError('Failed to create user');
        
        return user;
      } catch (error) {
        debugLog('Error creating user:', error);
        throw error;
      }
    },

    getById: async (id: string): Promise<User | null> => {
      try {
        debugLog('Getting user by id:', id);
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) {
          if (error.code === 'PGRST116') {
            debugLog('User not found:', id);
            return null; // Not found
          }
          debugLog('Database error getting user:', error);
          throw DatabaseError.fromPostgrestError(error);
        }
        
        debugLog('User found:', data?.email);
        return data;
      } catch (error) {
        debugLog('Error getting user by id:', error);
        throw error;
      }
    },

    getByEmail: async (email: string) => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();
      
      if (error) throw error;
      return data;
    },

    update: async (id: string, data: UserUpdate): Promise<User> => {
      try {
        const { data: user, error } = await supabase
          .from('users')
          .update(data)
          .eq('id', id)
          .select()
          .single();
        
        if (error) throw DatabaseError.fromPostgrestError(error);
        if (!user) throw new DatabaseError('Failed to update user');
        
        return user;
      } catch (error) {
        debugLog('Error updating user:', error);
        throw error;
      }
    },

    delete: async (id: string) => {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },

    listByOrganization: async (organizationId: string) => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },

    updateLastLogin: async (id: string) => {
      const { error } = await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', id);
      
      if (error) throw error;
    },
  };

  // Platform operations
  platforms = {
    create: async (data: PlatformInsert): Promise<Platform> => {
      try {
        debugLog('Creating platform:', data);
        const { data: platform, error } = await supabase
          .from('platforms')
          .insert(data)
          .select()
          .single();
        
        if (error) throw DatabaseError.fromPostgrestError(error);
        if (!platform) throw new DatabaseError('Failed to create platform');
        
        return platform;
      } catch (error) {
        debugLog('Error creating platform:', error);
        throw error;
      }
    },

    getById: async (id: string) => {
      const { data, error } = await supabase
        .from('platforms')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },

    update: async (id: string, data: PlatformUpdate) => {
      const { data: platform, error } = await supabase
        .from('platforms')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return platform;
    },

    delete: async (id: string) => {
      const { error } = await supabase
        .from('platforms')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },

    listByOrganization: async (organizationId: string, filters?: { is_enabled?: boolean; category?: string }) => {
      let query = supabase
        .from('platforms')
        .select('*')
        .eq('organization_id', organizationId);
      
      if (filters?.is_enabled !== undefined) {
        query = query.eq('is_enabled', filters.is_enabled);
      }
      
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }
      
      const { data, error } = await query.order('display_name');
      
      if (error) throw error;
      return data || [];
    },

    updateConfig: async (id: string, config: any) => {
      const { error } = await supabase
        .from('platforms')
        .update({ 
          config,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
      
      if (error) throw error;
    },
  };

  // Freelancer operations
  freelancers = {
    create: async (data: FreelancerInsert): Promise<Freelancer> => {
      try {
        debugLog('Creating freelancer:', data);
        const { data: freelancer, error } = await supabase
          .from('freelancers')
          .insert(data)
          .select()
          .single();
        
        if (error) throw DatabaseError.fromPostgrestError(error);
        if (!freelancer) throw new DatabaseError('Failed to create freelancer');
        
        // Log audit event
        await this.auditLogs.create({
          organization_id: data.organization_id,
          user_id: data.created_by,
          action: 'create',
          entity_type: 'freelancer',
          entity_id: freelancer.id,
          changes: { created: data },
        });
        
        return freelancer;
      } catch (error) {
        debugLog('Error creating freelancer:', error);
        throw error;
      }
    },

    getById: async (id: string) => {
      const { data, error } = await supabase
        .from('freelancers')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },

    update: async (id: string, data: FreelancerUpdate, userId: string) => {
      const { data: freelancer, error } = await supabase
        .from('freelancers')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      // Log audit event
      if (freelancer) {
        await this.auditLogs.create({
          organization_id: freelancer.organization_id,
          user_id: userId,
          action: 'update',
          entity_type: 'freelancer',
          entity_id: id,
          changes: { updated: data },
        });
      }
      
      return freelancer;
    },

    delete: async (id: string, userId: string, organizationId: string) => {
      const { error } = await supabase
        .from('freelancers')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Log audit event
      await this.auditLogs.create({
        organization_id: organizationId,
        user_id: userId,
        action: 'delete',
        entity_type: 'freelancer',
        entity_id: id,
      });
    },

    listByOrganization: async (organizationId: string, filters?: { status?: string; search?: string }): Promise<Freelancer[]> => {
      try {
        let query = supabase
          .from('freelancers')
          .select('*')
          .eq('organization_id', organizationId);
        
        if (filters?.status) {
          query = query.eq('status', filters.status);
        }
        
        if (filters?.search) {
          // Escape special characters in search term for safety
          const escapedSearch = filters.search.replace(/[%_]/g, '\\$&');
          query = query.or(`email.ilike.%${escapedSearch}%,first_name.ilike.%${escapedSearch}%,last_name.ilike.%${escapedSearch}%`);
        }
        
        const { data, error } = await query.order('created_at', { ascending: false });
        
        if (error) throw DatabaseError.fromPostgrestError(error);
        return data || [];
      } catch (error) {
        debugLog('Error listing freelancers:', error);
        throw error;
      }
    },

    getWithPlatforms: async (id: string) => {
      const { data, error } = await supabase
        .from('freelancers')
        .select(`
          *,
          freelancer_platforms (
            *,
            platform:platforms (*)
          )
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
  };

  // Freelancer Platform operations
  freelancerPlatforms = {
    create: async (data: FreelancerPlatformInsert) => {
      const { data: fp, error } = await supabase
        .from('freelancer_platforms')
        .insert(data)
        .select()
        .single();
      
      if (error) throw error;
      return fp;
    },

    update: async (id: string, data: FreelancerPlatformUpdate) => {
      const { data: fp, error } = await supabase
        .from('freelancer_platforms')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return fp;
    },

    delete: async (id: string) => {
      const { error } = await supabase
        .from('freelancer_platforms')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },

    listByFreelancer: async (freelancerId: string) => {
      const { data, error } = await supabase
        .from('freelancer_platforms')
        .select(`
          *,
          platform:platforms (*)
        `)
        .eq('freelancer_id', freelancerId);
      
      if (error) throw error;
      return data || [];
    },

    updateStatus: async (id: string, status: FreelancerPlatform['status'], syncStatus?: any) => {
      const update: FreelancerPlatformUpdate = {
        status,
        updated_at: new Date().toISOString(),
      };
      
      if (syncStatus !== undefined) {
        update.sync_status = syncStatus;
      }
      
      const { error } = await supabase
        .from('freelancer_platforms')
        .update(update)
        .eq('id', id);
      
      if (error) throw error;
    },
  };

  // Audit log operations
  auditLogs = {
    create: async (data: AuditLogInsert): Promise<void> => {
      try {
        const { error } = await supabase
          .from('audit_logs')
          .insert(data);
        
        if (error) {
          // Don't throw for audit logs - just log the error
          console.error('Failed to create audit log:', error);
          debugLog('Audit log error details:', { data, error });
        }
      } catch (error) {
        // Audit logs should not break the main operation
        console.error('Unexpected error creating audit log:', error);
      }
    },

    listByOrganization: async (organizationId: string, filters?: { 
      entity_type?: string;
      user_id?: string;
      limit?: number;
      offset?: number;
    }) => {
      let query = supabase
        .from('audit_logs')
        .select(`
          *,
          user:users (
            email,
            full_name
          )
        `)
        .eq('organization_id', organizationId);
      
      if (filters?.entity_type) {
        query = query.eq('entity_type', filters.entity_type);
      }
      
      if (filters?.user_id) {
        query = query.eq('user_id', filters.user_id);
      }
      
      query = query.order('created_at', { ascending: false });
      
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }
      
      if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    },
  };

  // Utility functions
  utils = {
    checkSubdomainAvailability: async (subdomain: string) => {
      const { data, error } = await supabase
        .from('organizations')
        .select('id')
        .eq('subdomain', subdomain)
        .maybeSingle();
      
      if (error) throw error;
      return !data; // Available if no data found
    },

    getOrganizationStats: async (organizationId: string) => {
      const { data, error } = await supabase
        .rpc('get_organization_stats', { org_id: organizationId });
      
      if (error) throw error;
      return data;
    },

    searchFreelancers: async (organizationId: string, searchTerm: string) => {
      const { data, error } = await supabase
        .rpc('search_freelancers', { 
          org_id: organizationId,
          search_term: searchTerm,
        });
      
      if (error) throw error;
      return data || [];
    },
  };
}

// Export singleton instance
export const db = new DatabaseService();

// Export for type usage
export type { DatabaseService };

// Helper function to handle database errors in UI components
export const handleDatabaseError = (error: any): string => {
  if (error instanceof DatabaseError) {
    // Return user-friendly message based on error code
    switch (error.code) {
      case '23505': // Unique violation
        return 'This record already exists.';
      case '23503': // Foreign key violation
        return 'Cannot perform this operation due to related records.';
      case '42501': // Insufficient privilege
        return 'You do not have permission to perform this action.';
      case 'PGRST116': // Not found
        return 'Record not found.';
      default:
        return error.message || 'An unexpected database error occurred.';
    }
  }
  
  // Generic error
  return error?.message || 'An unexpected error occurred.';
};