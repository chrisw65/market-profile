-- Add indexes for better query performance
-- Created: 2025-12-16

-- Index on community_profiles for faster slug lookups
CREATE INDEX IF NOT EXISTS idx_community_profiles_slug
ON community_profiles(slug);

-- Index on community_profiles for organization queries
CREATE INDEX IF NOT EXISTS idx_community_profiles_org_id
ON community_profiles(organization_id);

-- Composite index for faster org + slug queries
CREATE INDEX IF NOT EXISTS idx_community_profiles_org_slug
ON community_profiles(organization_id, slug);

-- Index on saved_campaigns for faster slug lookups
CREATE INDEX IF NOT EXISTS idx_saved_campaigns_slug
ON saved_campaigns(slug);

-- Index on saved_campaigns for organization queries
CREATE INDEX IF NOT EXISTS idx_saved_campaigns_org_id
ON saved_campaigns(organization_id);

-- Composite index for campaigns by org + slug
CREATE INDEX IF NOT EXISTS idx_saved_campaigns_org_slug
ON saved_campaigns(organization_id, slug);

-- Index on saved_campaigns for ordering by created_at
CREATE INDEX IF NOT EXISTS idx_saved_campaigns_created_at
ON saved_campaigns(created_at DESC);

-- Index on organization_members for user lookups
CREATE INDEX IF NOT EXISTS idx_organization_members_user_id
ON organization_members(user_id);

-- Composite index for org member queries
CREATE INDEX IF NOT EXISTS idx_organization_members_org_user
ON organization_members(organization_id, user_id);

-- Index on organizations for created_at (for admin queries)
CREATE INDEX IF NOT EXISTS idx_organizations_created_at
ON organizations(created_at DESC);

COMMENT ON INDEX idx_community_profiles_slug IS 'Faster slug-based profile lookups';
COMMENT ON INDEX idx_saved_campaigns_org_slug IS 'Optimized for campaign queries by org and slug';
COMMENT ON INDEX idx_organization_members_org_user IS 'Optimized for membership validation queries';
