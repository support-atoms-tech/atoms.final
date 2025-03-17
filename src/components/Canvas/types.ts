// Base entity with shared audit fields
export interface BaseEntity {
    id: string;
    created_at: string | null;
    updated_at: string | null;
    created_by?: string | null;
    updated_by?: string | null;
    deleted_at?: string | null;
    deleted_by?: string | null;
    is_deleted?: boolean | null;
    version?: number;
  }
  
  // Organization type
  export interface Organization extends BaseEntity {
    name: string;
    description: string | null;
    slug: string;
    owner_id: string | null;
    logo_url: string | null;
    settings: Record<string, any> | null;
    metadata: Record<string, any> | null;
    type: OrganizationType;
    status: UserStatus | null;
    billing_cycle: PricingPlanInterval;
    billing_plan: BillingPlan;
    max_members: number;
    max_monthly_requests: number;
    member_count: number | null;
    storage_used: number | null;
  }
  
  // Project type
  export interface Project extends BaseEntity {
    name: string;
    description: string | null;
    organization_id: string;
    owned_by: string;
    slug: string;
    settings: Record<string, any> | null;
    metadata: Record<string, any> | null;
    star_count: number | null;
    status: ProjectStatus;
    tags: string[] | null;
    visibility: Visibility;
  }
  
  // Document type
  export interface Document extends BaseEntity {
    name: string;
    description: string | null;
    project_id: string;
    slug: string;
    tags: string[] | null;
  }
  
  // Document creation data
  export interface DocumentCreateData {
    name: string;
    description?: string | null;
    project_id: string;
    slug: string;
    tags?: string[] | null;
    createBaseProperties?: boolean;
  }
  
  // Block type
  export interface Block extends BaseEntity {
    document_id: string;
    type: string;
    position: number;
    content: Record<string, any> | null;
  }
  
  // Block creation data
  export interface BlockCreateData {
    document_id: string;
    type: string;
    position: number;
    content?: Record<string, any> | null;
  }
  
  // Property type
  export interface Property {
    id: string;
    name: string;
    property_type: string;
    org_id: string;
    project_id: string | null;
    document_id: string | null;
    is_base: boolean | null;
    options: PropertyOptions | null;
    created_at: string | null;
    updated_at: string | null;
  }
  
  // Property options
  export interface PropertyOptions {
    values?: string[];
    default?: any;
    format?: string;
    validation?: PropertyValidation;
    [key: string]: any;
  }
  
  // Property validation
  export interface PropertyValidation {
    required?: boolean;
    min?: number;
    max?: number;
    pattern?: string;
    [key: string]: any;
  }
  
  // Property creation data
  export interface PropertyCreateData {
    name: string;
    property_type: string;
    org_id: string;
    project_id?: string | null;
    document_id?: string | null;
    is_base?: boolean;
    options?: PropertyOptions | null;
  }
  
  // Column type
  export interface Column {
    id: string;
    block_id: string | null;
    property_id: string;
    position: number;
    width: number | null;
    is_hidden: boolean | null;
    is_pinned: boolean | null;
    created_at: string | null;
    updated_at: string | null;
    property?: Property; // Join property data
  }
  
  // Column creation data
  export interface ColumnCreateData {
    block_id: string;
    property_id: string;
    position: number;
    width?: number | null;
    is_hidden?: boolean | null;
    is_pinned?: boolean | null;
  }
  
  // Requirement type
  export interface Requirement extends BaseEntity {
    block_id: string;
    document_id: string;
    name: string;
    description: string | null;
    external_id: string | null;
    position: number;
    properties: Record<string, any> | null;
    status: RequirementStatus;
    priority: RequirementPriority;
    level: RequirementLevel;
    format: RequirementFormat;
    original_requirement: string | null;
    enchanced_requirement: string | null;
    ai_analysis: Record<string, any> | null;
    tags: string[] | null;
  }
  
  // Requirement creation data
  export interface RequirementCreateData {
    block_id: string;
    document_id: string;
    name: string;
    description?: string | null;
    external_id?: string | null;
    position: number;
    properties?: Record<string, any> | null;
    status?: RequirementStatus;
    priority?: RequirementPriority;
    level?: RequirementLevel;
    format?: RequirementFormat;
    tags?: string[] | null;
  }
  
  // Assignment type
  export interface Assignment extends BaseEntity {
    entity_id: string;
    entity_type: EntityType;
    assignee_id: string;
    role: AssignmentRole;
    status: RequirementStatus;
    due_date: string | null;
    comment: string | null;
    completed_at: string | null;
  }
  
  // Assignment creation data
  export interface AssignmentCreateData {
    entity_id: string;
    entity_type: EntityType;
    assignee_id: string;
    role: AssignmentRole;
    status?: RequirementStatus;
    due_date?: string | null;
    comment?: string | null;
  }
  
  // User profile type
  export interface Profile {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
    job_title: string | null;
    current_organization_id: string | null;
    personal_organization_id: string | null;
    preferences: Record<string, any> | null;
    status: UserStatus | null;
    last_login_at: string | null;
    login_count: number | null;
    created_at: string | null;
    updated_at: string | null;
    deleted_at: string | null;
    deleted_by: string | null;
    is_deleted: boolean | null;
  }
  
  // Organization member type
  export interface OrganizationMember {
    id: string;
    organization_id: string;
    user_id: string;
    role: UserRoleType;
    permissions: Record<string, any> | null;
    status: UserStatus | null;
    last_active_at: string | null;
    created_at: string | null;
    updated_at: string | null;
    deleted_at: string | null;
    deleted_by: string | null;
    is_deleted: boolean | null;
  }
  
  // Project member type
  export interface ProjectMember {
    id: string;
    project_id: string;
    user_id: string;
    org_id: string | null;
    role: ProjectRole;
    permissions: Record<string, any> | null;
    status: UserStatus | null;
    last_accessed_at: string | null;
    created_at: string | null;
    updated_at: string | null;
    deleted_at: string | null;
    deleted_by: string | null;
    is_deleted: boolean | null;
  }
  
  // Invitation type
  export interface Invitation extends BaseEntity {
    email: string;
    token: string;
    status: InvitationStatus;
    expires_at: string;
    metadata: Record<string, any> | null;
  }
  
  // Organization invitation extends invitation
  export interface OrganizationInvitation extends Invitation {
    organization_id: string;
    role: UserRoleType;
  }
  
  // Project invitation extends invitation
  export interface ProjectInvitation extends Invitation {
    project_id: string;
    role: ProjectRole;
    invited_by: string;
  }
  
  // Notification type
  export interface Notification {
    id: string;
    user_id: string;
    title: string;
    message: string | null;
    type: NotificationType;
    metadata: Record<string, any> | null;
    unread: boolean | null;
    read_at: string | null;
    created_at: string | null;
  }
  
  // Trace link type
  export interface TraceLink extends BaseEntity {
    source_id: string;
    source_type: EntityType;
    target_id: string;
    target_type: EntityType;
    link_type: TraceLinkType;
    description: string | null;
  }
  
  // User roles type
  export interface UserRole {
    id: string;
    user_id: string;
    org_id: string | null;
    admin_role: UserRoleType | null;
    project_id: string | null;
    project_role: ProjectRole | null;
    document_id: string | null;
    document_role: ProjectRole | null;
    created_at: string;
    updated_at: string;
  }
  
  // External document type
  export interface ExternalDocument extends BaseEntity {
    name: string;
    organization_id: string;
    owned_by: string;
    type: string | null;
    url: string | null;
    size: number | null;
  }
  
  // Usage log type
  export interface UsageLog {
    id: string;
    organization_id: string;
    user_id: string;
    feature: string;
    quantity: number;
    unit_type: string;
    metadata: Record<string, any> | null;
    created_at: string | null;
  }
  
  // Audit log type
  export interface AuditLog {
    id: string;
    entity_id: string;
    entity_type: string;
    action: string;
    actor_id: string;
    old_data: Record<string, any> | null;
    new_data: Record<string, any> | null;
    metadata: Record<string, any> | null;
    created_at: string;
  }
  
  // Billing cache type
  export interface BillingCache {
    organization_id: string;
    billing_status: Record<string, any>;
    current_period_usage: Record<string, any>;
    period_start: string;
    period_end: string;
    synced_at: string;
  }
  
  // Stripe customer type
  export interface StripeCustomer {
    id: string;
    organization_id: string | null;
    stripe_customer_id: string | null;
    stripe_subscription_id: string | null;
    subscription_status: SubscriptionStatus;
    price_id: string | null;
    current_period_start: string | null;
    current_period_end: string | null;
    cancel_at_period_end: boolean | null;
    payment_method_brand: string | null;
    payment_method_last4: string | null;
    created_at: string | null;
    updated_at: string | null;
  }
  
  // Enums
  export type RequirementStatus = 'active' | 'archived' | 'draft' | 'deleted' | 'in_review' | 'in_progress' | 'approved' | 'rejected';
  export type RequirementPriority = 'low' | 'medium' | 'high' | 'critical';
  export type RequirementLevel = 'component' | 'system' | 'subsystem';
  export type RequirementFormat = 'ears' | 'incose' | 'other';
  
  export type EntityType = 'document' | 'requirement' | 'project' | 'organization';
  export type AssignmentRole = 'assignee' | 'reviewer' | 'approver';
  export type UserStatus = 'active' | 'inactive' | 'pending' | 'suspended';
  export type UserRoleType = 'owner' | 'admin' | 'member' | 'guest';
  export type ProjectRole = 'owner' | 'editor' | 'viewer' | 'guest';
  export type ProjectStatus = 'active' | 'archived' | 'draft';
  export type Visibility = 'public' | 'private' | 'organization';
  export type InvitationStatus = 'pending' | 'accepted' | 'rejected' | 'expired';
  export type NotificationType = 'system' | 'mention' | 'assignment' | 'update';
  export type TraceLinkType = 'related' | 'depends_on' | 'parent_of' | 'child_of' | 'reference';
  export type OrganizationType = 'personal' | 'team' | 'enterprise';
  export type PricingPlanInterval = 'none' | 'month' | 'year';
  export type BillingPlan = 'free' | 'starter' | 'pro' | 'enterprise';
  export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid';