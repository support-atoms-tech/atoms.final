import { z } from 'zod';

export type UUID = string;
export type ISODateTime = string;


// Base timestamp fields that most tables have
export const TimestampFieldsSchema = z.object({
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});
export type TimestampFields = z.infer<typeof TimestampFieldsSchema>;

// Base audit fields that track who created/updated
export const AuditFieldsSchema = z.object({
  created_by: z.string().uuid(),
  updated_by: z.string().uuid(),
}).merge(TimestampFieldsSchema);
export type AuditFields = z.infer<typeof AuditFieldsSchema>;

// Soft delete fields present in most tables
export const SoftDeleteFieldsSchema = z.object({
  is_deleted: z.boolean().default(false),
  deleted_at: z.string().datetime().nullable(),
  deleted_by: z.string().uuid().nullable(),
});
export type SoftDeleteFields = z.infer<typeof SoftDeleteFieldsSchema>;

// Version field for optimistic locking
export const VersionFieldSchema = z.object({
  version: z.number().int().positive(),
});
export type VersionField = z.infer<typeof VersionFieldSchema>;

// Base entity fields that most tables inherit from
export const BaseEntitySchema = AuditFieldsSchema
  .merge(SoftDeleteFieldsSchema)
  .merge(VersionFieldSchema);
export type BaseEntity = z.infer<typeof BaseEntitySchema>;

// Common validation patterns
export const slugRegex = /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/;
export const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
export const urlRegex = /^https?:\/\/.+/;

// Common validation schemas
export const SlugSchema = z.string().regex(slugRegex, 'Invalid slug format');
export const EmailSchema = z.string().regex(emailRegex, 'Invalid email format');
export const UrlSchema = z.string().regex(urlRegex, 'Invalid URL format');

// Common metadata and settings schemas
export const MetadataSchema = z.record(z.unknown()).default({});
export type Metadata = z.infer<typeof MetadataSchema>;

export const TagsSchema = z.array(z.string()).default([]);
export type Tags = z.infer<typeof TagsSchema>;
