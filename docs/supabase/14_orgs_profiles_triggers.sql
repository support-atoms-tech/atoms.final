-- ===================================================================================================
-- EXAMPLE USAGE
-- ===================================================================================================
-- For standard tables (full tracking):
-- CREATE TRIGGER handle_updates
--     BEFORE UPDATE ON your_table
--     FOR EACH ROW
--     EXECUTE FUNCTION handle_standard_table_update();

-- CREATE TRIGGER handle_audit_log
--     AFTER INSERT OR UPDATE OR DELETE ON your_table
--     FOR EACH ROW
--     EXECUTE FUNCTION handle_audit_log();


-- ===================================================================================================
-- TRIGGERS for organizations:
-- ===================================================================================================
CREATE TRIGGER tr_update_orgs
    BEFORE UPDATE ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_by();

CREATE TRIGGER tr_update_org_members
    BEFORE UPDATE ON organization_members
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_by();

CREATE TRIGGER tr_update_org_invites
    BEFORE UPDATE ON organization_invitations
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_by();

CREATE TRIGGER tr_log_orgs
    AFTER INSERT OR UPDATE OR DELETE ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION handle_audit_log();
-- ===================================================================================================
-- Trigger for profiles:
-- ===================================================================================================
CREATE TRIGGER tr_update_profiles
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER tr_log_profiles
    AFTER INSERT OR UPDATE OR DELETE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION handle_audit_log();