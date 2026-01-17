'use client';

import { Loader2, Menu, User, X } from 'lucide-react';
import { useCookies } from 'next-client-cookies';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { useAuthenticatedSupabase } from '@/hooks/useAuthenticatedSupabase';
import { useSignOut } from '@/hooks/useSignOut';

import { GridBackground } from './grid-background';

export function Navbar() {
    const pathName = usePathname();
    const cookies = useCookies();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [activeSection, setActiveSection] = useState('');
    const [hasAnimated, setHasAnimated] = useState(false);
    const { isAuthenticated, isLoading, userProfile } = useAuth();
    const { signOut, isLoading: isSigningOut } = useSignOut();
    const router = useRouter();
    const [loadingStates, setLoadingStates] = useState({
        dashboard: false,
        signIn: false,
        billing: false,
    });
    const [, setPreferredOrgId] = useState<string | null>(null);
    const [_showLoadingSkeleton, _setShowLoadingSkeleton] = useState(false);
    const { getClientOrThrow } = useAuthenticatedSupabase();

    // Trigger logo animation on first load
    useEffect(() => {
        // Set hasAnimated to true after animation completes (1 second)
        const timer = setTimeout(() => {
            setHasAnimated(true);
        }, 1000);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        const cookieOrgId = cookies.get('preferred_org_id');
        if (cookieOrgId) {
            setPreferredOrgId(cookieOrgId);

            if (isAuthenticated) {
                router.prefetch(`/org/${cookieOrgId}`);
            }
        }
    }, [router, isAuthenticated, cookies]);

    useEffect(() => {
        router.prefetch('/login');
        router.prefetch('/home');
    }, [router]);

    const navLinks = [
        { href: '/#features', label: 'Features', section: 'features' },
        { href: '/#industries', label: 'Industries', section: 'industries' },
        { href: '/', label: 'Polarion', section: 'polarion' },
        { href: '/#contact', label: 'Contact', section: 'contact' },
    ];

    useEffect(() => {
        const handleScroll = () => {
            // Only check scroll sections if we're on the home page
            if (pathName === '/') {
                const sections = ['features', 'industries', 'contact'];
                const scrollPosition = window.scrollY + 150; // Offset from top

                let currentSection = '';
                let closestSection = '';
                let closestDistance = Infinity;

                // Find which section is currently in view or closest
                for (const section of sections) {
                    const element = document.getElementById(section);
                    if (element) {
                        const { offsetTop, offsetHeight } = element;
                        const sectionMiddle = offsetTop + offsetHeight / 2;
                        const distance = Math.abs(scrollPosition - sectionMiddle);

                        // Check if scroll position is within section
                        if (
                            scrollPosition >= offsetTop &&
                            scrollPosition < offsetTop + offsetHeight
                        ) {
                            currentSection = section;
                            break;
                        }

                        // Track closest section
                        if (distance < closestDistance) {
                            closestDistance = distance;
                            closestSection = section;
                        }
                    }
                }

                // Use current section if found, otherwise use closest
                setActiveSection(currentSection || closestSection);
            }
        };

        handleScroll();
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [pathName]);

    const NavLink = ({
        href,
        label,
        section,
    }: {
        href: string;
        label: string;
        section: string;
    }) => {
        const isActive = activeSection === section;

        return (
            <Link
                href={href}
                scroll={true}
                className={`relative group text-lg uppercase font-bold whitespace-nowrap transition-colors ${
                    isActive ? 'text-[#9B51E0]' : 'text-white hover:text-white'
                }`}
                onClick={() => setIsMenuOpen(false)}
            >
                {label}
                <div
                    className={`absolute bottom-0 left-0 h-0.5 bg-[#9B51E0] transition-all duration-300 ${
                        isActive ? 'w-full' : 'w-0 group-hover:w-full'
                    }`}
                />
            </Link>
        );
    };

    const setLoading = useCallback(
        (key: keyof typeof loadingStates, isLoading: boolean) => {
            setLoadingStates((prev) => ({ ...prev, [key]: isLoading }));
        },
        [],
    );

    const handleSignIn = () => {
        if (pathName === '/login') return;
        setLoading('signIn', true);
        router.push('/login');
    };

    const handleDashboard = useCallback(async () => {
        setLoading('dashboard', true);

        try {
            const supabase = getClientOrThrow();
            // Fetch the user's profile to get pinned_organization_id and personal_organization_id
            const { data, error } = await supabase
                .from('profiles')
                .select('pinned_organization_id, personal_organization_id')
                .eq('id', userProfile?.id || '')
                .single();

            if (error) {
                console.error('Error fetching user profile:', error);
                setLoading('dashboard', false);
                return;
            }

            if (data) {
                let targetOrgId = data.pinned_organization_id;

                if (!targetOrgId && data.personal_organization_id) {
                    // If no pinned organization, set it to personal_organization_id by default
                    const { error: updateError } = await supabase
                        .from('profiles')
                        .update({
                            pinned_organization_id: data.personal_organization_id,
                        })
                        .eq('id', userProfile?.id || '');

                    if (!updateError) {
                        targetOrgId = data.personal_organization_id;
                    } else {
                        console.error('Error updating pinned organization:', updateError);
                        setLoading('dashboard', false);
                        return;
                    }
                }

                if (targetOrgId) {
                    console.log('Navigating to pinned organization:', targetOrgId);
                    router.push(`/org/${targetOrgId}`);
                } else {
                    console.log('No pinned or personal organization found');
                    router.push('/home'); // Fallback to home if no organization is found
                }
            }
        } catch (err) {
            console.error('Unexpected error:', err);
        } finally {
            setLoading('dashboard', false);
        }
    }, [getClientOrThrow, router, setLoading, userProfile?.id]);

    const handleBilling = () => {
        setLoading('billing', true);
        router.push('/billing');
    };

    const handleSignOut = () => {
        signOut();
    };

    // Cleanup loading states when component unmounts
    useEffect(() => {
        return () => {
            setLoadingStates({
                dashboard: false,
                signIn: false,
                billing: false,
            });
        };
    }, []);

    return (
        <>
            {loadingStates.dashboard && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center z-50">
                    <div className="flex flex-col items-center space-y-4 text-center px-4">
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                            Loading dashboard...
                        </h2>
                        <p className="text-sm sm:text-base text-muted-foreground">
                            We&apos;re preparing your organization workspace
                        </p>
                    </div>
                </div>
            )}
            <header className="fixed top-0 left-0 right-0 h-16 bg-black/90 backdrop-blur-md text-white border-b border-white shadow-[0_1px_8px_0_rgba(255,255,255,0.3)] z-50">
                {/* Show full-screen loading overlay when navigating to dashboard */}

                <div className="relative h-full">
                    <div className="container mx-auto flex justify-between items-center h-full">
                        <Link
                            href="/"
                            className="atoms-logo flex items-center group justify-center"
                        >
                            <div className="flex items-center justify-center relative mx-1 sm:mx-2 h-10 w-10 aspect-square overflow-hidden bg-transparent">
                                <Image
                                    src="/atom.png"
                                    alt="Atoms logo"
                                    width={40}
                                    height={40}
                                    className={`object-contain invert object-center w-full h-full ${
                                        !hasAnimated ? 'animate-logo-spin' : ''
                                    }`}
                                    priority
                                />
                            </div>
                            <span className="font-semibold text-base sm:text-lg md:text-2xl tracking-wide">
                                ATOMS
                            </span>
                        </Link>

                        {/* Desktop Navigation */}
                        <nav className="hidden lg:flex lg:space-x-8 xl:space-x-16">
                            {navLinks.map((link) => (
                                <NavLink key={link.href} {...link} />
                            ))}
                        </nav>

                        {/* Mobile Menu Button */}
                        <div className="flex items-center gap-2 sm:gap-4">
                            {isLoading ? (
                                <div className="h-9 w-24 bg-muted/30 animate-pulse rounded hidden lg:block"></div>
                            ) : isAuthenticated ? (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="btn-secondary bg-black hover:bg-white hover:text-black hidden lg:flex gap-2"
                                            size="sm"
                                        >
                                            <User size={16} />
                                            <span className="max-w-24 lg:max-w-32 truncate">
                                                {userProfile?.full_name || 'Account'}
                                            </span>
                                            {loadingStates.dashboard && (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            )}
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                        align="end"
                                        className="w-[200px]"
                                    >
                                        <DropdownMenuItem
                                            onClick={handleDashboard}
                                            disabled={loadingStates.dashboard}
                                            className="py-2"
                                        >
                                            {loadingStates.dashboard ? (
                                                <div className="flex items-center">
                                                    <span className="mr-2">
                                                        Dashboard
                                                    </span>
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                </div>
                                            ) : (
                                                'Dashboard'
                                            )}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={handleBilling}
                                            disabled={loadingStates.billing}
                                            className="py-2"
                                        >
                                            {loadingStates.billing ? (
                                                <div className="flex items-center">
                                                    <span className="mr-2">Billing</span>
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                </div>
                                            ) : (
                                                'Billing'
                                            )}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={handleSignOut}
                                            disabled={isSigningOut}
                                            className="py-2"
                                        >
                                            {isSigningOut ? (
                                                <div className="flex items-center">
                                                    <span className="mr-2">
                                                        Signing out
                                                    </span>
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                </div>
                                            ) : (
                                                'Sign Out'
                                            )}
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            ) : (
                                <Button
                                    variant="outline"
                                    className="btn-secondary bg-black hover:bg-white hover:text-black hidden lg:flex"
                                    onClick={handleSignIn}
                                    disabled={loadingStates.signIn}
                                    size="sm"
                                >
                                    {loadingStates.signIn ? (
                                        <div className="flex items-center gap-2">
                                            <span>SIGNING IN</span>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        </div>
                                    ) : (
                                        'SIGN IN'
                                    )}
                                </Button>
                            )}
                            <button
                                type="button"
                                className="lg:hidden text-white p-1.5 sm:p-2 hover:bg-white/10 transition-colors touch-manipulation"
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
                            >
                                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                            </button>
                        </div>
                    </div>

                    {/* Mobile Navigation */}
                    {isMenuOpen && (
                        <div
                            className="absolute top-full left-0 right-0 bg-black border-t border-white lg:hidden
                        animate-in slide-in-from-right duration-300 ease-in-out z-40 max-h-[calc(100vh-64px)] overflow-y-auto"
                        >
                            <nav className="flex flex-col space-y-4 p-4">
                                {navLinks.map((link) => (
                                    <NavLink key={link.href} {...link} />
                                ))}
                                {isAuthenticated ? (
                                    <>
                                        <Button
                                            variant="outline"
                                            className="btn-secondary bg-black hover:bg-white hover:text-black w-full mt-2"
                                            onClick={handleDashboard}
                                            disabled={loadingStates.dashboard}
                                        >
                                            {loadingStates.dashboard ? (
                                                <div className="flex items-center justify-center gap-2">
                                                    <span>LOADING</span>
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                </div>
                                            ) : (
                                                'DASHBOARD'
                                            )}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="btn-secondary bg-black hover:bg-white hover:text-black w-full"
                                            onClick={handleBilling}
                                            disabled={loadingStates.billing}
                                        >
                                            {loadingStates.billing ? (
                                                <div className="flex items-center justify-center gap-2">
                                                    <span>LOADING</span>
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                </div>
                                            ) : (
                                                'BILLING'
                                            )}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="btn-secondary bg-black hover:bg-white hover:text-black w-full"
                                            onClick={handleSignOut}
                                            disabled={isSigningOut}
                                        >
                                            {isSigningOut ? (
                                                <div className="flex items-center justify-center gap-2">
                                                    <span>SIGNING OUT</span>
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                </div>
                                            ) : (
                                                'SIGN OUT'
                                            )}
                                        </Button>
                                    </>
                                ) : (
                                    <Button
                                        variant="outline"
                                        className="btn-secondary bg-black hover:bg-white hover:text-black w-full px-0 py-0 pt-0 pb-0"
                                        onClick={handleSignIn}
                                        disabled={loadingStates.signIn}
                                    >
                                        {loadingStates.signIn ? (
                                            <div className="flex items-center justify-center gap-2">
                                                <span>SIGNING IN</span>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            </div>
                                        ) : (
                                            'SIGN IN'
                                        )}
                                    </Button>
                                )}
                            </nav>
                        </div>
                    )}
                    <GridBackground />
                </div>
            </header>
        </>
    );
}
