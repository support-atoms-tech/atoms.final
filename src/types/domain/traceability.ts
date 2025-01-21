import { z } from 'zod';
import { BaseEntitySchema } from '../shared/common';
import {
  EntityTypeEnum,
  TraceLinkTypeEnum,
  AssignmentRoleEnum,
  RequirementStatusEnum,
} from '../shared/enums';

// Trace link schema
export const TraceLinkSchema = z.object({
  id: z.string().uuid(),
  source_id: z.string().uuid(),
  target_id: z.string().uuid(),
  source_type: EntityTypeEnum,
  target_type: EntityTypeEnum,
  link_type: TraceLinkTypeEnum,
  
  // Metadata
  description: z.string().nullable(),
}).merge(BaseEntitySchema);

export type TraceLink = z.infer<typeof TraceLinkSchema>;

// Assignment schema
export const AssignmentSchema = z.object({
  id: z.string().uuid(),
  entity_id: z.string().uuid(),
  entity_type: EntityTypeEnum,
  assignee_id: z.string().uuid(),
  role: AssignmentRoleEnum,
  status: RequirementStatusEnum,
  
  // Review/Approval metadata
  comment: z.string().nullable(),
  due_date: z.string().datetime().nullable(),
  completed_at: z.string().datetime().nullable(),
}).merge(BaseEntitySchema);

export type Assignment = z.infer<typeof AssignmentSchema>; 