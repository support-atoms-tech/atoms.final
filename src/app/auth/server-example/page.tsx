import { withAuth } from '@workos-inc/authkit-nextjs';
import Link from 'next/link';

/**
 * Example: Protected Server Component with AuthKit
 *
 * This component uses withAuth to:
 * 1. Get the authenticated user
 * 2. Ensure user is signed in
 * 3. Access user data server-side
 *
 * Usage:
 * - Copy this file to your protected routes
 * - Replace ensureSignedIn: false with true to require authentication
 * - Access user data like: user.email, user.firstName, user.lastName
 *
 * For a public version, set ensureSignedIn: false (or omit it)
 */
export default async function ServerExamplePage() {
    // Get authenticated user
    const { user } = await withAuth({
        // Set to true to require authentication
        // If not authenticated, user will be redirected to login
        ensureSignedIn: true,
    });

    // If ensureSignedIn is false and user is not authenticated, user will be null
    if (!user) {
        return (
            <div className="p-8">
                <h1 className="text-2xl font-bold mb-4">Not Authenticated</h1>
                <Link href="/auth/login" className="text-blue-600 hover:underline">
                    Sign in to continue
                </Link>
            </div>
        );
    }

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Welcome, {user.firstName}!</h1>

            <div className="bg-gray-100 p-6 rounded-lg mb-6">
                <h2 className="text-xl font-semibold mb-4">Your Information</h2>
                <ul className="space-y-2">
                    <li>
                        <strong>Email:</strong> {user.email}
                    </li>
                    <li>
                        <strong>First Name:</strong> {user.firstName || 'Not set'}
                    </li>
                    <li>
                        <strong>Last Name:</strong> {user.lastName || 'Not set'}
                    </li>
                    <li>
                        <strong>User ID:</strong> {user.id}
                    </li>
                </ul>
            </div>

            <div className="space-y-2">
                <Link
                    href="/auth/logout"
                    className="inline-block px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                    Sign Out
                </Link>
            </div>
        </div>
    );
}
