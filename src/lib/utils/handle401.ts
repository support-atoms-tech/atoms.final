import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

// Public routes where we don't need to redirect on 401
const PUBLIC_ROUTES = ['/login', '/', '/signup', '/register', '/auth/callback'];

/**
 * Handles 401 (Unauthorized) responses by logging a warning and redirecting to signin on private pages.
 * Returns null to prevent React Query from logging as an error.
 *
 * @param response - The fetch Response object
 * @param pathname - Current pathname from usePathname()
 * @param router - Router instance from useRouter()
 * @returns null if 401, otherwise undefined (caller should handle other errors)
 */
export function handle401Response(
    response: Response,
    pathname: string | null,
    router: AppRouterInstance,
): null | undefined {
    if (response.status === 401) {
        const isPublicRoute =
            pathname &&
            PUBLIC_ROUTES.some(
                (route) => pathname === route || pathname.startsWith(route + '/'),
            );

        // Only redirect on private pages
        if (!isPublicRoute) {
            console.warn('User session expired. Logging out, redirecting to signin.');
            // Redirect to signin after a brief delay to allow the warning to be logged
            setTimeout(() => {
                router.push('/login');
            }, 100);
        }
        // Return null silently - don't throw to prevent React Query from logging as error
        return null;
    }
    return undefined;
}
