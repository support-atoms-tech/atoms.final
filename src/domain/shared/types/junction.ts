// src/core/domain/models/junction.ts
import { BaseEntity, UUID } from './common';
import {
    AssignmentRole,
    MemberRole,
    NotificationPreference,
    RequirementPriority,
    TraceLinkType,
    UserTheme,
} from './enums';

export interface RequirementDocument extends BaseEntity {
    requirement_id: UUID;
    document_id: UUID;
}

export interface RequirementCollection extends BaseEntity {
    requirement_id: UUID;
    collection_id: UUID;
}

export interface ComponentDocument extends BaseEntity {
    component_id: UUID;
    document_id: UUID;
}

export interface ComponentCollection extends BaseEntity {
    component_id: UUID;
    collection_id: UUID;
}

export interface ProjectComponent extends BaseEntity {
    project_id: UUID;
    component_id: UUID;
    order: number;
}

export interface CollectionExternalDoc extends BaseEntity {
    collection_id: UUID;
    external_doc_id: UUID;
}

export interface EntityMember extends BaseEntity {
    entity_id: UUID;
    user_id: UUID;
    role: MemberRole;
}

export interface EntityAssignment extends BaseEntity {
    entity_id: UUID;
    user_id: UUID;
    role: AssignmentRole;
    priority: RequirementPriority | null;
}

export interface Relationship extends BaseEntity {
    source_id: UUID;
    target_id: UUID;
    relationship_type: TraceLinkType;
    description: string | null;
    source_type: 'requirement' | 'component';
    target_type: 'requirement' | 'component';
}

export interface UserPreferences extends BaseEntity {
    user_id: UUID; // Links to user_profile.id
    theme: UserTheme;
    notification_preferences: NotificationPreference;
    email_notifications: boolean;
    timezone: string | null;
    language: string;
    // TODO: add accessibility settings
}
