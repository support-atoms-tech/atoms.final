import { z } from 'zod';

// User related enums
export const UserStatusEnum = z.enum(['active', 'inactive', 'suspended', 'pending']);
export type UserStatus = z.infer<typeof UserStatusEnum>;

export const UserRoleEnum = z.enum(['owner', 'admin', 'member', 'viewer']);
export type UserRole = z.infer<typeof UserRoleEnum>;

// Organization related enums
export const OrganizationTypeEnum = z.enum(['personal', 'team']);
export type OrganizationType = z.infer<typeof OrganizationTypeEnum>;

export const BillingPlanEnum = z.enum(['free', 'pro', 'enterprise']);
export type BillingPlan = z.infer<typeof BillingPlanEnum>;

export const PricingPlanIntervalEnum = z.enum(['none', 'monthly', 'yearly']);
export type PricingPlanInterval = z.infer<typeof PricingPlanIntervalEnum>;

// Project related enums
export const ProjectVisibilityEnum = z.enum(['public', 'private', 'organization']);
export type ProjectVisibility = z.infer<typeof ProjectVisibilityEnum>;

export const ProjectStatusEnum = z.enum(['active', 'archived', 'draft']);
export type ProjectStatus = z.infer<typeof ProjectStatusEnum>;

export const ProjectRoleEnum = z.enum(['owner', 'admin', 'maintainer', 'contributor', 'viewer']);
export type ProjectRole = z.infer<typeof ProjectRoleEnum>;

// Invitation related enums
export const InvitationStatusEnum = z.enum(['pending', 'accepted', 'rejected', 'expired']);
export type InvitationStatus = z.infer<typeof InvitationStatusEnum>;

// Subscription related enums
export const SubscriptionStatusEnum = z.enum(['active', 'inactive', 'trialing', 'past_due', 'canceled', 'paused']);
export type SubscriptionStatus = z.infer<typeof SubscriptionStatusEnum>;

// Document and requirement related enums
export const RequirementStatusEnum = z.enum(['active', 'draft', 'review', 'approved', 'rejected']);
export type RequirementStatus = z.infer<typeof RequirementStatusEnum>;

export const RequirementFormatEnum = z.enum(['incose', 'custom']);
export type RequirementFormat = z.infer<typeof RequirementFormatEnum>;

export const RequirementPriorityEnum = z.enum(['low', 'medium', 'high', 'critical']);
export type RequirementPriority = z.infer<typeof RequirementPriorityEnum>;

export const RequirementLevelEnum = z.enum(['system', 'subsystem', 'component']);
export type RequirementLevel = z.infer<typeof RequirementLevelEnum>;

export const EntityTypeEnum = z.enum(['document', 'requirement']);
export type EntityType = z.infer<typeof EntityTypeEnum>;

export const TraceLinkTypeEnum = z.enum(['parent_of', 'child_of', 'related_to', 'depends_on']);
export type TraceLinkType = z.infer<typeof TraceLinkTypeEnum>;

export const AssignmentRoleEnum = z.enum(['assignee', 'reviewer', 'approver']);
export type AssignmentRole = z.infer<typeof AssignmentRoleEnum>;

export const PropertyTypeEnum = z.enum(['string', 'number', 'boolean', 'date', 'enum']);
export type PropertyType = z.infer<typeof PropertyTypeEnum>;
