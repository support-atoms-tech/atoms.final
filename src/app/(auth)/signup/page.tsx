'use client';

import { SiGithub } from '@icons-pack/react-simple-icons';
import { AlertCircle, Loader2, Mail } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

import { getSignUpUrl } from '@/app/(auth)/auth/actions';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

// Create a separate client component for the signup form
function SignupForm() {
    const _searchParams = useSearchParams();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSignUp = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const signUpUrl = await getSignUpUrl();
            if (signUpUrl) {
                window.location.href = signUpUrl;
            } else {
                setError('Failed to initialize sign up');
            }
        } catch (err) {
            console.error('Error initiating sign up:', err);
            setError('An error occurred. Please try again.');
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[url('/../../../nodesbackground.jpg')] bg-cover bg-center bg-black px-4 py-12 relative">
            {/* Background overlay */}
            <div className="pointer-events-none absolute inset-0 bg-black opacity-80" />
            {/* Card container */}
            <Card className="w-full max-w-md bg-background dark:bg-black/40 backdrop-blur-md shadow-sm dark:shadow-lg relative z-10">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center text-gray-900 dark:text-gray-100">
                        Create your account
                    </CardTitle>
                    <CardDescription className="text-center text-gray-500 dark:text-muted-foreground">
                        Sign up with WorkOS to get started
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {error && (
                        <div className="flex items-center gap-2 p-3 text-sm text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-800">
                            <AlertCircle className="h-4 w-4 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <Button
                        onClick={handleSignUp}
                        disabled={isLoading}
                        className="w-full"
                        size="lg"
                    >
                        {isLoading ? (
                            <div className="flex items-center justify-center">
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                <span>Signing up...</span>
                            </div>
                        ) : (
                            'Continue with WorkOS'
                        )}
                    </Button>

                    <div className="relative my-4">
                        <div className="absolute inset-0 flex items-center">
                            <Separator className="w-full" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-background dark:bg-black/40 text-gray-500 dark:text-muted-foreground">
                                Or continue with OAuth
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <Button
                            variant="outline"
                            onClick={() => {
                                window.location.href = '/auth/sso/google';
                            }}
                        >
                            <Mail className="mr-2 h-4 w-4" />
                            Google
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => {
                                window.location.href = '/auth/sso/github';
                            }}
                        >
                            <SiGithub className="mr-2 h-4 w-4" />
                            GitHub
                        </Button>
                    </div>
                </CardContent>
                <CardFooter>
                    <p className="text-center w-full text-sm text-gray-600 dark:text-muted-foreground">
                        Already have an account?{' '}
                        <Link
                            href="/login"
                            className="text-primary hover:text-primary/80 font-medium focus:outline-none focus:ring-2 focus:ring-offset-2"
                        >
                            Sign in
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}

// Main page component with Suspense boundary
export default function SignupPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <SignupForm />
        </Suspense>
    );
}
