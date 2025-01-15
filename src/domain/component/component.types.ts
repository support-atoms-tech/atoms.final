// src/core/domain/models/component.ts
import { BaseEntity } from './common';
import { EntityStatus } from './enums';
import { Json } from './supabase';

export interface Component extends BaseEntity {
    name: string;
    description: string | null;
    status: EntityStatus;
    tags: string[] | null;
    default_property_values: Json | null; // Default values for new requirements
}

export type ComponentData = Partial<Omit<Component, keyof BaseEntity>>;
