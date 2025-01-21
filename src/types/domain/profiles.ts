import { z } from 'zod';
import {
  BaseEntitySchema,
  EmailSchema,
  UrlSchema,
} from '../shared/common';
import { UserStatusEnum } from '../shared/enums';

// Profile preferences schema
export const ProfilePreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).default('light'),
  notifications: z.enum(['all', 'important', 'none']).default('all'),
  email_frequency: z.enum(['daily', 'weekly', 'never']).default('daily'),
}).default({});
export type ProfilePreferences = z.infer<typeof ProfilePreferencesSchema>;

// Profile schema
export const ProfileSchema = z.object({
  id: z.string().uuid(),
  full_name: z.string().min(2).max(255).nullable(),
  avatar_url: UrlSchema.nullable(),
  
  // Core fields
  email: EmailSchema,
  personal_organization_id: z.string().uuid().nullable(),
  current_organization_id: z.string().uuid().nullable(),
  job_title: z.string().nullable(),
  
  // Preferences and settings
  preferences: ProfilePreferencesSchema,
  
  // Status and activity
  status: UserStatusEnum,
  last_login_at: z.string().datetime().nullable(),
  login_count: z.number().int().nonnegative().default(0),
}).merge(BaseEntitySchema);

export type Profile = z.infer<typeof ProfileSchema>;
