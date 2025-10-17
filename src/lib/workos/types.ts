/**
 * WorkOS Authentication Types
 */

export interface WorkOSUser {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    emailVerified: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface WorkOSAuthResponse {
    user: WorkOSUser;
    accessToken?: string;
    refreshToken?: string;
}

export interface WorkOSSession {
    userId: string;
    accessToken: string;
    refreshToken?: string;
    expiresAt: number;
}

export interface SupabaseUserExport {
    id: string;
    email: string;
    user_metadata?: {
        full_name?: string;
        first_name?: string;
        last_name?: string;
    };
    email_confirmed_at?: string;
    created_at: string;
    last_sign_in_at?: string;
}

export interface ProfileExport {
    id: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
    job_title?: string;
    is_approved: boolean;
    status?: string;
    created_at?: string;
    updated_at?: string;
}
