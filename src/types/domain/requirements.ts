import { z } from "zod";
import {
    RequirementFormatEnum,
    RequirementStatusEnum,
    RequirementPriorityEnum,
    RequirementLevelEnum
} from "../shared/enums";
import { TagsSchema, BaseEntitySchema } from "../shared/common";

// Requirement schema
export const RequirementSchema = z.object({
    id: z.string().uuid(),
    document_id: z.string().uuid(),
    block_id: z.string().uuid(),
    external_id: z.string().nullable(),
    name: z.string().min(2).max(255),
    description: z.string().nullable(),

    // Status and metadata
    status: RequirementStatusEnum,
    format: RequirementFormatEnum,
    priority: RequirementPriorityEnum,
    level: RequirementLevelEnum,
    tags: TagsSchema,

    // Requirement content
    original_requirement: z.string().nullable(),
    enchanced_requirement: z.string().nullable(),

    // AI analysis
    ai_analysis: z.record(z.unknown()).default({}),
}).merge(BaseEntitySchema);

export type Requirement = z.infer<typeof RequirementSchema>;

// Requirement property key-value schema
export const RequirementPropertyKVSchema = z.object({
    id: z.string().uuid(),
    block_id: z.string().uuid(),
    requirement_id: z.string().uuid(),
    property_name: z.string(),
    property_value: z.string(),
    position: z.number().int().nonnegative(),
}).merge(BaseEntitySchema);

export type RequirementPropertyKV = z.infer<typeof RequirementPropertyKVSchema>;