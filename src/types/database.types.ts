// Database schema type definitions for Supabase
// This file defines the structure of our database tables

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          subdomain: string
          created_at: string
          updated_at: string
          settings: Json
          branding: {
            company_name: string
            logo_url?: string
            colors: {
              primary: string
              secondary: string
              accent: string
              neutral: string
            }
          }
          subscription_tier: 'free' | 'starter' | 'pro' | 'enterprise'
          is_active: boolean
        }
        Insert: {
          id?: string
          name: string
          subdomain: string
          created_at?: string
          updated_at?: string
          settings?: Json
          branding?: {
            company_name: string
            logo_url?: string
            colors: {
              primary: string
              secondary: string
              accent: string
              neutral: string
            }
          }
          subscription_tier?: 'free' | 'starter' | 'pro' | 'enterprise'
          is_active?: boolean
        }
        Update: {
          id?: string
          name?: string
          subdomain?: string
          created_at?: string
          updated_at?: string
          settings?: Json
          branding?: {
            company_name: string
            logo_url?: string
            colors: {
              primary: string
              secondary: string
              accent: string
              neutral: string
            }
          }
          subscription_tier?: 'free' | 'starter' | 'pro' | 'enterprise'
          is_active?: boolean
        }
      }
      users: {
        Row: {
          id: string
          email: string
          first_name: string
          last_name: string
          organization_id: string
          role: 'owner' | 'admin' | 'member'
          created_at: string
          updated_at: string
          last_login?: string
          is_active: boolean
          avatar_url?: string
        }
        Insert: {
          id?: string
          email: string
          first_name: string
          last_name: string
          organization_id: string
          role?: 'owner' | 'admin' | 'member'
          created_at?: string
          updated_at?: string
          last_login?: string
          is_active?: boolean
          avatar_url?: string
        }
        Update: {
          id?: string
          email?: string
          first_name?: string
          last_name?: string
          organization_id?: string
          role?: 'owner' | 'admin' | 'member'
          created_at?: string
          updated_at?: string
          last_login?: string
          is_active?: boolean
          avatar_url?: string
        }
      }
      platforms: {
        Row: {
          id: string
          organization_id: string
          platform_id: string
          display_name: string
          category: 'screen-sharing' | 'file-sharing' | 'collaboration' | 'communication'
          config: Json
          is_enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          platform_id: string
          display_name: string
          category: 'screen-sharing' | 'file-sharing' | 'collaboration' | 'communication'
          config: Json
          is_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          platform_id?: string
          display_name?: string
          category?: 'screen-sharing' | 'file-sharing' | 'collaboration' | 'communication'
          config?: Json
          is_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      freelancers: {
        Row: {
          id: string
          organization_id: string
          email: string
          first_name: string
          last_name: string
          username?: string
          created_at: string
          updated_at: string
          created_by: string
          status: 'active' | 'inactive' | 'pending'
          metadata?: Json
        }
        Insert: {
          id?: string
          organization_id: string
          email: string
          first_name: string
          last_name: string
          username?: string
          created_at?: string
          updated_at?: string
          created_by: string
          status?: 'active' | 'inactive' | 'pending'
          metadata?: Json
        }
        Update: {
          id?: string
          organization_id?: string
          email?: string
          first_name?: string
          last_name?: string
          username?: string
          created_at?: string
          updated_at?: string
          created_by?: string
          status?: 'active' | 'inactive' | 'pending'
          metadata?: Json
        }
      }
      freelancer_platforms: {
        Row: {
          id: string
          freelancer_id: string
          platform_id: string
          platform_user_id: string
          status: 'active' | 'inactive' | 'error' | 'pending'
          created_at: string
          updated_at: string
          sync_status?: Json
          platform_metadata?: Json
        }
        Insert: {
          id?: string
          freelancer_id: string
          platform_id: string
          platform_user_id: string
          status?: 'active' | 'inactive' | 'error' | 'pending'
          created_at?: string
          updated_at?: string
          sync_status?: Json
          platform_metadata?: Json
        }
        Update: {
          id?: string
          freelancer_id?: string
          platform_id?: string
          platform_user_id?: string
          status?: 'active' | 'inactive' | 'error' | 'pending'
          created_at?: string
          updated_at?: string
          sync_status?: Json
          platform_metadata?: Json
        }
      }
      audit_logs: {
        Row: {
          id: string
          organization_id: string
          user_id: string
          action: string
          entity_type: string
          entity_id: string
          changes?: Json
          ip_address?: string
          user_agent?: string
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          user_id: string
          action: string
          entity_type: string
          entity_id: string
          changes?: Json
          ip_address?: string
          user_agent?: string
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          user_id?: string
          action?: string
          entity_type?: string
          entity_id?: string
          changes?: Json
          ip_address?: string
          user_agent?: string
          created_at?: string
        }
      }
    }
    Views: {
      freelancer_platform_overview: {
        Row: {
          freelancer_id: string
          freelancer_email: string
          freelancer_name: string
          organization_id: string
          platform_id: string
          platform_name: string
          platform_category: string
          platform_status: string
          created_at: string
        }
      }
    }
    Functions: {
      get_organization_stats: {
        Args: {
          org_id: string
        }
        Returns: {
          total_users: number
          total_freelancers: number
          active_platforms: number
          total_platform_connections: number
        }
      }
      search_freelancers: {
        Args: {
          org_id: string
          search_term: string
        }
        Returns: {
          id: string
          email: string
          first_name: string
          last_name: string
          status: string
          created_at: string
        }[]
      }
    }
    Enums: {
      user_role: 'owner' | 'admin' | 'member'
      platform_category: 'screen-sharing' | 'file-sharing' | 'collaboration' | 'communication'
      subscription_tier: 'free' | 'starter' | 'pro' | 'enterprise'
      status: 'active' | 'inactive' | 'pending' | 'error'
    }
  }
}

// Helper types for easier usage
export type Organization = Database['public']['Tables']['organizations']['Row']
export type User = Database['public']['Tables']['users']['Row']

// Helper function to get full name from user
export const getUserFullName = (user: User): string => {
  return `${user.first_name} ${user.last_name}`.trim();
};
export type Platform = Database['public']['Tables']['platforms']['Row']
export type Freelancer = Database['public']['Tables']['freelancers']['Row']
export type FreelancerPlatform = Database['public']['Tables']['freelancer_platforms']['Row']
export type AuditLog = Database['public']['Tables']['audit_logs']['Row']

// Insert types
export type OrganizationInsert = Database['public']['Tables']['organizations']['Insert']
export type UserInsert = Database['public']['Tables']['users']['Insert']
export type PlatformInsert = Database['public']['Tables']['platforms']['Insert']
export type FreelancerInsert = Database['public']['Tables']['freelancers']['Insert']
export type FreelancerPlatformInsert = Database['public']['Tables']['freelancer_platforms']['Insert']
export type AuditLogInsert = Database['public']['Tables']['audit_logs']['Insert']

// Update types
export type OrganizationUpdate = Database['public']['Tables']['organizations']['Update']
export type UserUpdate = Database['public']['Tables']['users']['Update']
export type PlatformUpdate = Database['public']['Tables']['platforms']['Update']
export type FreelancerUpdate = Database['public']['Tables']['freelancers']['Update']
export type FreelancerPlatformUpdate = Database['public']['Tables']['freelancer_platforms']['Update']
export type AuditLogUpdate = Database['public']['Tables']['audit_logs']['Update']