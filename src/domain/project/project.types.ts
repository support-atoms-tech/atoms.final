// src/core/domain/models/project.ts
import { BaseEntity, UUID, ISODateTime } from '../shared/types/common';
import { AccessLevel, EntityStatus } from '../shared/types/enums';

export interface Project extends BaseEntity {
    name: string;
    description: string | null;
    status: EntityStatus;
    start_date: ISODateTime | null;
    target_end_date: ISODateTime | null;
    actual_end_date: ISODateTime | null;
    tags: string[] | null;
    access_level: AccessLevel;
    organization_id: UUID | null; // Links to the organization
    project_owner_id: UUID; // Links to user_profile.id
}

export type ProjectData = Partial<Omit<Project, keyof BaseEntity>>;
