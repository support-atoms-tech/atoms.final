//src/core/domain/models/property.ts

import { BaseEntity, ISODateTime, UUID } from './common';
import { PropertyType } from './enums';
import { Json } from './supabase';

// Defines the schema for properties at component level
export interface ComponentPropertySchema extends BaseEntity {
    component_id: UUID;
    key: string;
    display_name: string;
    type: PropertyType;
    default_value: Json | null;
    validation_rules: PropertyValidation | null;
    options: PropertyOptions | null;
    description: string | null;
}

// Stores the actual property values for requirements
export interface RequirementPropertyValue extends BaseEntity {
    requirement_id: UUID;
    schema_id: UUID; // References ComponentPropertySchema
    value: Json;
    is_valid: boolean;
    last_validated: ISODateTime | null;
}

// TODO: Add PropertySchemaVersion for versioning & Add Propagation Rules

export interface PropertyOptions {
    placeholder?: string;
    visible_in_table?: boolean;
    visible_in_card?: boolean;
    searchable?: boolean;
    filterable?: boolean;
    groupable?: boolean;
    readonly?: boolean;
    required?: boolean;
    default_value?: string | number | boolean | Date;
    pinned?: boolean;
    options?: string[];
    order?: number;
    icon?: string;
}

export interface PropertyValidation {
    type: PropertyType;
    // Text validation
    min_length?: number;
    max_length?: number;
    pattern?: string;
    // Number validation
    min_value?: number;
    max_value?: number;
    step?: number;
    // Date validation
    min_date?: ISODateTime;
    max_date?: ISODateTime;
    // Enum validation
    allowed_values?: string[];
    // Common
    custom_validator?: string; // Name of registered validator function
}
