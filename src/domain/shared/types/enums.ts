// src/core/domain/models/enums.ts
export enum EntityStatus {
    DRAFT = 'draft',
    ACTIVE = 'active',
    ON_HOLD = 'on_hold',
    COMPLETED = 'completed',
    ARCHIVED = 'archived',
}

export enum RequirementStatus {
    DRAFT = 'draft',
    PENDING_REVIEW = 'pending_review',
    APPROVED = 'approved',
    IN_PROGRESS = 'in_progress',
    TESTING = 'testing',
    COMPLETED = 'completed',
    REJECTED = 'rejected',
}

export enum RequirementPriority {
    CRITICAL = 'critical',
    HIGH = 'high',
    MEDIUM = 'medium',
    LOW = 'low',
}

export enum AccessLevel {
    PRIVATE = 'private',
    PROJECT = 'project',
    ORGANIZATION = 'organization',
    PUBLIC = 'public',
}

export enum TraceLinkType {
    DERIVES_FROM = 'derives_from',
    IMPLEMENTS = 'implements',
    RELATES_TO = 'relates_to',
    CONFLICTS_WITH = 'conflicts_with',
    IS_RELATED_TO = 'is_related_to',
    PARENT_OF = 'parent_of',
    CHILD_OF = 'child_of',
}

export enum MemberRole {
    OWNER = 'owner',
    MANAGER = 'manager',
    CONTRIBUTOR = 'contributor',
    VIEWER = 'viewer',
}

export enum DocumentType {
    SPECIFICATION = 'specification',
    REFERENCE = 'reference',
    DOCUMENTATION = 'documentation',
    STANDARD = 'standard',
    GUIDELINE = 'guideline',
    REPORT = 'report',
}

export enum RequirementLevel {
    SYSTEM = 'system',
    SUB_SYSTEM = 'sub_system',
    COMPONENT = 'component',
}

export enum UserTheme {
    LIGHT = 'light',
    DARK = 'dark',
    SYSTEM = 'system',
}

export enum NotificationPreference {
    ALL = 'all',
    IMPORTANT = 'important',
    NONE = 'none',
}

export enum RequirementFormat {
    EARS = 'ears',
    INCOSE = 'incose',
}

export enum AssignmentRole {
    ASSIGNEE = 'assignee',
    REVIEWER = 'reviewer',
    OBSERVER = 'observer',
}

export type PropertyType =
    | 'text'
    | 'number'
    | 'boolean'
    | 'date'
    | 'enum'
    | 'multi_enum'
    | 'rich_text'
    | 'url'
    | 'user_reference'
    | 'requirement_reference'
    | 'component_reference';
