-- Supabase Database Schema for Freelancer Onboarding App
-- Run this in your Supabase SQL editor to create the required tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE user_role AS ENUM ('owner', 'admin', 'member');
CREATE TYPE platform_category AS ENUM ('screen-sharing', 'file-sharing', 'collaboration', 'communication');
CREATE TYPE subscription_tier AS ENUM ('free', 'starter', 'pro', 'enterprise');
CREATE TYPE status AS ENUM ('active', 'inactive', 'pending', 'error');

-- Organizations table
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    subdomain VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    settings JSONB DEFAULT '{}',
    branding JSONB DEFAULT '{
        "company_name": "",
        "logo_url": null,
        "colors": {
            "primary": "#4f46e5",
            "secondary": "#059669",
            "accent": "#dc2626",
            "neutral": "#6b7280"
        }
    }',
    subscription_tier subscription_tier DEFAULT 'free',
    is_active BOOLEAN DEFAULT true
);

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    role user_role DEFAULT 'member',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    avatar_url TEXT
);

-- Platforms table (configured platforms per organization)
CREATE TABLE platforms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    platform_id VARCHAR(100) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    category platform_category NOT NULL,
    config JSONB DEFAULT '{}',
    is_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(organization_id, platform_id)
);

-- Freelancers table
CREATE TABLE freelancers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    username VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    created_by UUID NOT NULL REFERENCES users(id),
    status status DEFAULT 'active',
    metadata JSONB DEFAULT '{}',
    UNIQUE(organization_id, email)
);

-- Freelancer Platforms junction table
CREATE TABLE freelancer_platforms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    freelancer_id UUID NOT NULL REFERENCES freelancers(id) ON DELETE CASCADE,
    platform_id UUID NOT NULL REFERENCES platforms(id) ON DELETE CASCADE,
    platform_user_id VARCHAR(255) NOT NULL,
    status status DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    sync_status JSONB DEFAULT '{}',
    platform_metadata JSONB DEFAULT '{}',
    UNIQUE(freelancer_id, platform_id)
);

-- Audit logs table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID NOT NULL,
    changes JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for better performance
CREATE INDEX idx_users_organization ON users(organization_id);
CREATE INDEX idx_platforms_organization ON platforms(organization_id);
CREATE INDEX idx_freelancers_organization ON freelancers(organization_id);
CREATE INDEX idx_freelancers_email ON freelancers(email);
CREATE INDEX idx_freelancer_platforms_freelancer ON freelancer_platforms(freelancer_id);
CREATE INDEX idx_freelancer_platforms_platform ON freelancer_platforms(platform_id);
CREATE INDEX idx_audit_logs_organization ON audit_logs(organization_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);

-- Create views
CREATE OR REPLACE VIEW freelancer_platform_overview AS
SELECT 
    f.id as freelancer_id,
    f.email as freelancer_email,
    f.first_name || ' ' || f.last_name as freelancer_name,
    f.organization_id,
    p.id as platform_id,
    p.display_name as platform_name,
    p.category as platform_category,
    fp.status as platform_status,
    fp.created_at
FROM freelancers f
JOIN freelancer_platforms fp ON f.id = fp.freelancer_id
JOIN platforms p ON fp.platform_id = p.id;

-- Create functions
CREATE OR REPLACE FUNCTION get_organization_stats(org_id UUID)
RETURNS TABLE (
    total_users BIGINT,
    total_freelancers BIGINT,
    active_platforms BIGINT,
    total_platform_connections BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM users WHERE organization_id = org_id AND is_active = true),
        (SELECT COUNT(*) FROM freelancers WHERE organization_id = org_id AND status = 'active'),
        (SELECT COUNT(*) FROM platforms WHERE organization_id = org_id AND is_enabled = true),
        (SELECT COUNT(*) FROM freelancer_platforms fp 
         JOIN freelancers f ON fp.freelancer_id = f.id 
         WHERE f.organization_id = org_id AND fp.status = 'active');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION search_freelancers(org_id UUID, search_term TEXT)
RETURNS TABLE (
    id UUID,
    email VARCHAR,
    first_name VARCHAR,
    last_name VARCHAR,
    status status,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        f.id,
        f.email,
        f.first_name,
        f.last_name,
        f.status,
        f.created_at
    FROM freelancers f
    WHERE f.organization_id = org_id
    AND (
        f.email ILIKE '%' || search_term || '%' OR
        f.first_name ILIKE '%' || search_term || '%' OR
        f.last_name ILIKE '%' || search_term || '%' OR
        f.username ILIKE '%' || search_term || '%'
    )
    ORDER BY f.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Row Level Security (RLS) Policies
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE freelancers ENABLE ROW LEVEL SECURITY;
ALTER TABLE freelancer_platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Organizations policies
CREATE POLICY "Users can view their organization" ON organizations
    FOR SELECT USING (
        id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Admins can update their organization" ON organizations
    FOR UPDATE USING (
        id IN (
            SELECT organization_id FROM users 
            WHERE id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- Users policies
CREATE POLICY "Users can view members of their organization" ON users
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Admins can manage users in their organization" ON users
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM users 
            WHERE id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- Platforms policies
CREATE POLICY "Users can view platforms in their organization" ON platforms
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage platforms in their organization" ON platforms
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM users 
            WHERE id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- Freelancers policies
CREATE POLICY "Users can view freelancers in their organization" ON freelancers
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can create freelancers in their organization" ON freelancers
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can update freelancers in their organization" ON freelancers
    FOR UPDATE USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Admins can delete freelancers in their organization" ON freelancers
    FOR DELETE USING (
        organization_id IN (
            SELECT organization_id FROM users 
            WHERE id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- Freelancer platforms policies
CREATE POLICY "Users can view freelancer platforms in their organization" ON freelancer_platforms
    FOR SELECT USING (
        freelancer_id IN (
            SELECT id FROM freelancers 
            WHERE organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can manage freelancer platforms in their organization" ON freelancer_platforms
    FOR ALL USING (
        freelancer_id IN (
            SELECT id FROM freelancers 
            WHERE organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

-- Audit logs policies
CREATE POLICY "Users can view audit logs for their organization" ON audit_logs
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "System can insert audit logs" ON audit_logs
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_platforms_updated_at BEFORE UPDATE ON platforms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_freelancers_updated_at BEFORE UPDATE ON freelancers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_freelancer_platforms_updated_at BEFORE UPDATE ON freelancer_platforms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();