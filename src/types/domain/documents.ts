import { z } from 'zod';
import {
  BaseEntitySchema,
  SlugSchema,
  TagsSchema,
} from '../shared/common';
import {
  PropertyTypeEnum,
} from '../shared/enums';

// Document schema
export const DocumentSchema = z.object({
  id: z.string().uuid(),
  project_id: z.string().uuid(),
  name: z.string().min(2).max(255),
  description: z.string().nullable(),
  slug: SlugSchema,
  tags: TagsSchema,
}).merge(BaseEntitySchema);

export type Document = z.infer<typeof DocumentSchema>;

// Document property schema
export const DocumentPropertySchema = z.object({
  id: z.string().uuid(),
  document_id: z.string().uuid(),
  name: z.string().min(2).max(255),
  data_type: PropertyTypeEnum,
}).merge(BaseEntitySchema);

export type DocumentProperty = z.infer<typeof DocumentPropertySchema>;

// Block schema
export const BlockSchema = z.object({
  id: z.string().uuid(),
  document_id: z.string().uuid(),
  type: z.enum(['text', 'image', 'table']),
  position: z.number().int().nonnegative(),
  content: z.record(z.unknown()).default({}),
}).merge(BaseEntitySchema);

export type Block = z.infer<typeof BlockSchema>;

// Block property schema
export const BlockPropertySchema = z.object({
  id: z.string().uuid(),
  block_id: z.string().uuid(),
  name: z.string().min(2).max(255),
  data_type: PropertyTypeEnum,
}).merge(BaseEntitySchema);

export type BlockProperty = z.infer<typeof BlockPropertySchema>;


