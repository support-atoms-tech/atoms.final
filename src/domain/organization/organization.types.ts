// src/core/domain/models/organization.ts
import { BaseEntity } from '../shared/types/common';

export interface Organization extends BaseEntity {
    name: string;
    description: string | null;
    website: string | null;
    logo_url: string | null;
    tags: string[] | null;
}

export type OrganizationData = Partial<Omit<Organization, keyof BaseEntity>>;
