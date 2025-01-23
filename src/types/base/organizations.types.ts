import {
    BillingPlan,
    OrganizationType,
    PricingPlanInterval,
    UserStatus
} from "./enums.types";
import { Json } from "./database.types";

export type Organization = {
    id: string;
    billing_cycle: PricingPlanInterval;
    billing_plan: BillingPlan;
    created_at: string | null;
    created_by: string;
    deleted_at: string | null;
    deleted_by: string | null;
    description: string | null;
    is_deleted: boolean | null;
    logo_url: string | null;
    max_members: number;
    max_monthly_requests: number;
    member_count: number | null;
    metadata: Json | null;
    name: string;
    settings: Json | null;
    slug: string;
    status: UserStatus | null;
    storage_used: number | null;
    type: OrganizationType;
    updated_at: string | null;
    updated_by: string;
};
