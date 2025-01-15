// src/core/domain/models/user-profile.ts

import { BaseEntity, UUID } from './common';

export interface UserProfile extends BaseEntity {
    firebase_uid: string | null;
    display_name: string | null;
    avatar_url: string | null;
    job_title: string | null;
    department: string | null;
    bio: string | null;
    tags: string[] | null;
    organization_id: UUID | null;
}

export type UserProfileData = Partial<Omit<UserProfile, keyof BaseEntity>>;
