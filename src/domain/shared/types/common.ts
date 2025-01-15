import { Json } from './supabase';

export type UUID = string;
export type ISODateTime = string;

export interface BaseEntity {
    id: UUID;
    created_at: ISODateTime | null;
    updated_at: ISODateTime | null;
    created_by: UUID | null;
    updated_by: UUID | null;
    metadata: Json | null;
    version: number;
    is_deleted: boolean; // Soft delete flag
}
