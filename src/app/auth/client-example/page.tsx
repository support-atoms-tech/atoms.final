'use client';

import { useAuth } from '@workos-inc/authkit-nextjs/components';
import Link from 'next/link';

/**
 * Example: Protected Client Component with AuthKit
 *
 * This component uses useAuth to:
 * 1. Get the authenticated user on the client
 * 2. Manage loading state
 * 3. Implement client-side redirects
 *
 * Usage:
 * - Copy this file to your client-side protected routes
 * - Use useAuth() to get user data
 * - Handle loading state while session is being verified
 * - For mandatory authentication, use Suspense with server component instead
 */
export default function ClientExamplePage() {
    const { user, isLoading } = useAuth();

    // Show loading state while checking authentication
    if (isLoading) {
        return (
            <div className="p-8">
                <p className="text-gray-600">Loading...</p>
            </div>
        );
    }

    // Show login prompt if not authenticated
    if (!user) {
        return (
            <div className="p-8">
                <h1 className="text-2xl font-bold mb-4">Not Authenticated</h1>
                <p className="text-gray-600 mb-4">
                    Please sign in to access this page.
                </p>
                <Link
                    href="/auth/login"
                    className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    Sign In
                </Link>
            </div>
        );
    }

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Welcome, {user.firstName}!</h1>

            <div className="bg-gray-100 p-6 rounded-lg mb-6">
                <h2 className="text-xl font-semibold mb-4">Your Profile</h2>
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
                </ul>
            </div>

            <Link
                href="/auth/logout"
                className="inline-block px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
                Sign Out
            </Link>
        </div>
    );
}
