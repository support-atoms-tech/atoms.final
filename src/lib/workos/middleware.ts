import { NextResponse, type NextRequest } from 'next/server';

import workos from './workosClient';

/**
 * WorkOS Session Middleware
 *
 * Handles session validation, token refresh, and user data caching for WorkOS authentication.
 * This middleware validates WorkOS sessions on every server-side request and handles
 * session expiry/refresh automatically.
 */

const WORKOS_SESSION_COOKIE = 'wos-session';
const WORKOS_COOKIE_PASSWORD = process.env.WORKOS_COOKIE_PASSWORD || 'complex_password_at_least_32_characters';

/**
 * Updates and validates WorkOS session for the current request
 *
 * @param request - Next.js request object
 * @returns NextResponse with updated session cookies
 */
export async function updateWorkOSSession(request: NextRequest) {
    let workosResponse = NextResponse.next({
        request,
    });

    try {
        // Get session cookie
        const sessionCookie = request.cookies.get(WORKOS_SESSION_COOKIE);

        if (!sessionCookie?.value) {
            // No session cookie - proceed without authentication
            return handleUnauthenticatedRequest(request, workosResponse);
        }

        // Load and authenticate the session
        const session = workos.userManagement.loadSealedSession({
            sessionData: sessionCookie.value,
            cookiePassword: WORKOS_COOKIE_PASSWORD,
        });

        const authResult = await session.authenticate();

        if (!authResult.authenticated) {
            // Invalid or expired session - try to refresh
            const refreshResult = await session.refresh({
                cookiePassword: WORKOS_COOKIE_PASSWORD,
            });

            if (!refreshResult.authenticated) {
                // Refresh failed - clear cookies and redirect to login
                return handleUnauthenticatedRequest(request, workosResponse);
            }

            // Update cookie with refreshed session
            workosResponse.cookies.set(WORKOS_SESSION_COOKIE, refreshResult.sealedSession, {
                path: '/',
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 60 * 60 * 24 * 7, // 7 days
            });

            // Use refreshed session data
            const user = refreshResult.user;
            return handleAuthorization(request, workosResponse, user.id);
        }

        // Session is valid - update cookie to extend session
        const refreshResult = await session.refresh({
            cookiePassword: WORKOS_COOKIE_PASSWORD,
        });

        if (refreshResult.authenticated) {
            workosResponse.cookies.set(WORKOS_SESSION_COOKIE, refreshResult.sealedSession, {
                path: '/',
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 60 * 60 * 24 * 7, // 7 days
            });
        }

        // Proceed with authorization checks
        return handleAuthorization(request, workosResponse, authResult.user.id);
    } catch (error) {
        console.error('WorkOS session error:', error);
        return handleUnauthenticatedRequest(request, workosResponse);
    }
}

/**
 * Handle unauthenticated requests - redirect to login if needed
 */
function handleUnauthenticatedRequest(request: NextRequest, response: NextResponse) {
    // Ignore pages that don't need authentication
    if (
        request.nextUrl.pathname === '/' ||
        request.nextUrl.pathname === '/polarion' ||
        request.nextUrl.pathname === '/api/email/notify-new-unapproved' ||
        request.nextUrl.pathname.startsWith('/login') ||
        request.nextUrl.pathname.startsWith('/auth') ||
        request.nextUrl.pathname.startsWith('/signup')
    ) {
        return response;
    }

    // Redirect to login
    const url = request.nextUrl.clone();
    url.pathname = '/login';

    const redirectResponse = NextResponse.redirect(url);

    // Clear invalid session cookie
    redirectResponse.cookies.delete(WORKOS_SESSION_COOKIE);

    return redirectResponse;
}

/**
 * Handle authorization checks for authenticated users
 */
async function handleAuthorization(
    request: NextRequest,
    response: NextResponse,
    userId: string,
) {
    // Ignore pages that don't need authentication
    if (
        request.nextUrl.pathname === '/' ||
        request.nextUrl.pathname === '/polarion' ||
        request.nextUrl.pathname === '/api/email/notify-new-unapproved' ||
        request.nextUrl.pathname.startsWith('/login') ||
        request.nextUrl.pathname.startsWith('/auth') ||
        request.nextUrl.pathname.startsWith('/signup')
    ) {
        return response;
    }

    try {
        // We need to use Supabase for database queries until WorkOS integration is complete
        // This is temporary - in the future, profile data should be stored in WorkOS or a separate service
        const { createClient } = await import('@/lib/supabase/supabaseServer');
        const supabase = await createClient();

        // Check if user is approved
        const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('is_approved, job_title')
            .eq('id', userId)
            .single();

        // Redirect to /request-approval if not approved
        if (
            (profileError || !profileData?.is_approved) &&
            !request.nextUrl.pathname.startsWith('/request-approval')
        ) {
            const url = request.nextUrl.clone();
            url.pathname = '/request-approval';
            const redirectResponse = NextResponse.redirect(url);
            response.cookies.getAll().forEach(({ name, value }) => {
                redirectResponse.cookies.set(name, value);
            });
            return redirectResponse;
        }

        const segments = request.nextUrl.pathname.split('/').filter(Boolean);

        // Check if user is allowed in the admin page
        if (segments[0] === 'admin') {
            if (profileError || profileData?.job_title !== 'admin') {
                // unauthorized to see admin page
                const url = request.nextUrl.clone();
                url.pathname = '/home/user';
                const redirectResponse = NextResponse.redirect(url);
                response.cookies.getAll().forEach(({ name, value }) => {
                    redirectResponse.cookies.set(name, value);
                });
                return redirectResponse;
            }
        }

        // Check if user is allowed in the organization
        if (segments.length > 1 && segments[0] === 'org') {
            const { data: orgMemberData, error: orgError } = await supabase
                .from('organization_members')
                .select('role')
                .eq('organization_id', segments[1])
                .eq('user_id', userId)
                .single();

            if (orgError || !orgMemberData) {
                // unauthorized to see organization
                const url = request.nextUrl.clone();
                url.pathname = '/home/user';
                const redirectResponse = NextResponse.redirect(url);
                response.cookies.getAll().forEach(({ name, value }) => {
                    redirectResponse.cookies.set(name, value);
                });
                return redirectResponse;
            }
        }

        // Check if user is allowed in the project
        if (segments.length > 3 && segments[2] === 'project') {
            const { data: projectMemberData, error: projectError } = await supabase
                .from('project_members')
                .select('role')
                .eq('project_id', segments[3])
                .eq('user_id', userId)
                .single();

            if (projectError || !projectMemberData) {
                // unauthorized to see project
                const url = request.nextUrl.clone();
                url.pathname = '/org/' + segments[1];
                const redirectResponse = NextResponse.redirect(url);
                response.cookies.getAll().forEach(({ name, value }) => {
                    redirectResponse.cookies.set(name, value);
                });
                return redirectResponse;
            }
        }

        return response;
    } catch (error) {
        console.error('Authorization error:', error);
        return response;
    }
}

/**
 * Helper function to get user from WorkOS session cookie
 * Use this in API routes or server components that need user data
 *
 * @param sessionCookie - Session cookie value
 * @returns User object or null if not authenticated
 */
export async function getUserFromSession(sessionCookie: string | undefined) {
    if (!sessionCookie) {
        return null;
    }

    try {
        const session = workos.userManagement.loadSealedSession({
            sessionData: sessionCookie,
            cookiePassword: WORKOS_COOKIE_PASSWORD,
        });

        const authResult = await session.authenticate();

        if (!authResult.authenticated) {
            return null;
        }

        return authResult.user;
    } catch (error) {
        console.error('Error getting user from session:', error);
        return null;
    }
}

/**
 * Helper function to refresh WorkOS session
 * Use this when you need to extend the session or update organization context
 *
 * @param sessionCookie - Current session cookie value
 * @param organizationId - Optional organization ID to set in session
 * @returns Refreshed session data or null if refresh failed
 */
export async function refreshWorkOSSession(
    sessionCookie: string,
    organizationId?: string,
) {
    try {
        const session = workos.userManagement.loadSealedSession({
            sessionData: sessionCookie,
            cookiePassword: WORKOS_COOKIE_PASSWORD,
        });

        const refreshResult = await session.refresh({
            cookiePassword: WORKOS_COOKIE_PASSWORD,
            organizationId,
        });

        if (!refreshResult.authenticated) {
            return null;
        }

        return {
            sealedSession: refreshResult.sealedSession,
            user: refreshResult.user,
        };
    } catch (error) {
        console.error('Error refreshing session:', error);
        return null;
    }
}
