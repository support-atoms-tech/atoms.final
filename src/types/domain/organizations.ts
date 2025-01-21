import { z } from 'zod';
import {
  BaseEntitySchema,
  MetadataSchema,
  SlugSchema,
  EmailSchema,
  TagsSchema,
} from '../shared/common';
import {
  OrganizationTypeEnum,
  BillingPlanEnum,
  PricingPlanIntervalEnum,
  UserStatusEnum,
  UserRoleEnum,
  InvitationStatusEnum,
} from '../shared/enums';

// Organization settings schema
export const OrganizationSettingsSchema = z.object({
  default_access_level: z.enum(['private', 'public']).default('private'),
  allow_public_projects: z.boolean().default(false),
  require_2fa: z.boolean().default(false),
}).default({});
export type OrganizationSettings = z.infer<typeof OrganizationSettingsSchema>;

// Organization schema
export const OrganizationSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2).max(255),
  slug: SlugSchema,
  description: z.string().nullable(),
  type: OrganizationTypeEnum,
  logo_url: z.string().url().nullable(),
  
  // Billing
  billing_plan: BillingPlanEnum,
  billing_cycle: PricingPlanIntervalEnum,
  max_members: z.number().int().positive(),
  max_monthly_requests: z.number().int().positive(),
  
  // Settings and metadata
  settings: OrganizationSettingsSchema,
  metadata: MetadataSchema,
  
  // Stats
  member_count: z.number().int().nonnegative(),
  storage_used: z.number().int().nonnegative(),
  
  status: UserStatusEnum,
}).merge(BaseEntitySchema);

export type Organization = z.infer<typeof OrganizationSchema>;

// Organization member schema
export const OrganizationMemberSchema = z.object({
  id: z.string().uuid(),
  organization_id: z.string().uuid(),
  user_id: z.string().uuid(),
  
  // Access control
  role: UserRoleEnum,
  status: UserStatusEnum,
  
  // Activity and permissions
  last_active_at: z.string().datetime().nullable(),
  permissions: z.record(z.unknown()).default({}),
}).merge(BaseEntitySchema);

export type OrganizationMember = z.infer<typeof OrganizationMemberSchema>;

// Organization invitation schema
export const OrganizationInvitationSchema = z.object({
  id: z.string().uuid(),
  organization_id: z.string().uuid(),
  email: EmailSchema,
  
  // Invitation details
  role: UserRoleEnum,
  token: z.string().uuid(),
  status: InvitationStatusEnum,
  
  // Meta
  expires_at: z.string().datetime(),
  metadata: MetadataSchema,
}).merge(BaseEntitySchema);

export type OrganizationInvitation = z.infer<typeof OrganizationInvitationSchema>;
