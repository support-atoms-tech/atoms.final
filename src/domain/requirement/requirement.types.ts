// src/core/domain/models/requirement.ts
import { BaseEntity, UUID } from '../shared/types/common';
import {
    RequirementStatus,
    RequirementPriority,
    RequirementLevel,
    RequirementFormat,
} from '../shared/types/enums';
import { Json } from '../shared/types/supabase';

export interface Requirement extends BaseEntity {
    component_id: UUID;
    title: string | null;
    description: string | null;

    // Classification
    priority: RequirementPriority;
    status: RequirementStatus;
    level: RequirementLevel;

    // Content
    original_content: string; // Original requirement text
    enhanced_content: Json | null; // AI-enhanced version
    selected_format: RequirementFormat | null;

    // metadata
    tags: string[] | null;
}

// Requirement version history
export interface RequirementVersion extends BaseEntity {
    requirement_id: UUID;
    content: Json;
    change_reason: string | null;
    changed_by: UUID;
}

// Db query helper type for requirement with properties
export type RequirementWithProperties = Requirement & {
    property_values: {
        id: UUID;
        schema_id: UUID;
        value: Json;
        is_valid: boolean;
        last_validated: string;
    }[];
};

export type RequirementData = Partial<Omit<Requirement, keyof BaseEntity>>;
