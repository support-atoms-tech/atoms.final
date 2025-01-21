import { z } from 'zod';
import {
  BaseEntitySchema,
  MetadataSchema,
  SlugSchema,
  EmailSchema,
  TagsSchema,
} from '../shared/common';
import {
  ProjectVisibilityEnum,
  ProjectStatusEnum,
  ProjectRoleEnum,
  UserStatusEnum,
  InvitationStatusEnum,
} from '../shared/enums';

// Project settings schema
export const ProjectSettingsSchema = z.object({
  default_branch: z.string().default('main'),
  allow_issues: z.boolean().default(true),
}).default({});
export type ProjectSettings = z.infer<typeof ProjectSettingsSchema>;

// Project schema
export const ProjectSchema = z.object({
  id: z.string().uuid(),
  organization_id: z.string().uuid(),
  name: z.string().min(2).max(255),
  slug: SlugSchema,
  description: z.string().nullable(),
  
  // Access control
  visibility: ProjectVisibilityEnum,
  status: ProjectStatusEnum,
  
  // Configuration
  settings: ProjectSettingsSchema,
  
  // Statistics and metadata
  star_count: z.number().int().nonnegative().default(0),
  tags: TagsSchema,
  metadata: MetadataSchema,
  
  // Ownership
  owned_by: z.string().uuid(),
}).merge(BaseEntitySchema);

export type Project = z.infer<typeof ProjectSchema>;

// Project member schema
export const ProjectMemberSchema = z.object({
  id: z.string().uuid(),
  project_id: z.string().uuid(),
  user_id: z.string().uuid(),
  
  // Access control
  role: ProjectRoleEnum,
  status: UserStatusEnum,
  
  // Custom permissions
  permissions: z.record(z.unknown()).default({}),
  
  // Stats
  last_accessed_at: z.string().datetime().nullable(),
}).merge(BaseEntitySchema);

export type ProjectMember = z.infer<typeof ProjectMemberSchema>;

// Project invitation schema
export const ProjectInvitationSchema = z.object({
  id: z.string().uuid(),
  project_id: z.string().uuid(),
  email: EmailSchema,
  
  // Invitation details
  role: ProjectRoleEnum,
  token: z.string().uuid(),
  status: InvitationStatusEnum,
  
  // Meta
  expires_at: z.string().datetime(),
  metadata: MetadataSchema,
}).merge(BaseEntitySchema);

export type ProjectInvitation = z.infer<typeof ProjectInvitationSchema>; 