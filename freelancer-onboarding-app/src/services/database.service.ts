import { supabase } from './supabase';
import {
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

// Generic CRUD operations
class DatabaseService {
  // Organization operations
  organizations = {
    create: async (data: OrganizationInsert) => {
      const { data: org, error } = await supabase
        .from('organizations')
        .insert(data)
        .select()
        .single();
      
      if (error) throw error;
      return org;
    },

    getById: async (id: string) => {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
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

    update: async (id: string, data: OrganizationUpdate) => {
      const { data: org, error } = await supabase
        .from('organizations')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return org;
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
    create: async (data: UserInsert) => {
      const { data: user, error } = await supabase
        .from('users')
        .insert(data)
        .select()
        .single();
      
      if (error) throw error;
      return user;
    },

    getById: async (id: string) => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
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

    update: async (id: string, data: UserUpdate) => {
      const { data: user, error } = await supabase
        .from('users')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return user;
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
    create: async (data: PlatformInsert) => {
      const { data: platform, error } = await supabase
        .from('platforms')
        .insert(data)
        .select()
        .single();
      
      if (error) throw error;
      return platform;
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
    create: async (data: FreelancerInsert) => {
      const { data: freelancer, error } = await supabase
        .from('freelancers')
        .insert(data)
        .select()
        .single();
      
      if (error) throw error;
      
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

    listByOrganization: async (organizationId: string, filters?: { status?: string; search?: string }) => {
      let query = supabase
        .from('freelancers')
        .select('*')
        .eq('organization_id', organizationId);
      
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      
      if (filters?.search) {
        query = query.or(`email.ilike.%${filters.search}%,first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%`);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
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
    create: async (data: AuditLogInsert) => {
      const { error } = await supabase
        .from('audit_logs')
        .insert(data);
      
      if (error) {
        console.error('Failed to create audit log:', error);
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