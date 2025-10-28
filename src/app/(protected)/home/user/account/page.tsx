'use client';

import { motion } from 'framer-motion';
import { Maximize2, Minimize2, Moon, Pencil, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuthenticatedSupabase } from '@/hooks/useAuthenticatedSupabase';
import { useLayout } from '@/lib/providers/layout.provider';
import { useUser } from '@/lib/providers/user.provider';

import SettingsSection from './SettingsSection';

export default function AccountPage() {
    const { user, profile, refreshUser } = useUser();
    const { theme, setTheme } = useTheme();
    const [editingName, setEditingName] = useState(false);
    const [newName, setNewName] = useState(profile?.full_name || '');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { layoutViewMode: layout, setLayoutViewMode: setLayout } = useLayout();
    const [mounted, setMounted] = useState(false);
    const { getClientOrThrow } = useAuthenticatedSupabase();

    useEffect(() => {
        setMounted(true);

        // Load initial layout state from localStorage
        const savedLayout = localStorage.getItem('layoutViewMode');
        if (savedLayout === 'wide' || savedLayout === 'standard') {
            setLayout(savedLayout as 'wide' | 'standard');
        }
    }, [setLayout]);

    const handleNameUpdate = async () => {
        if (!newName || newName.length < 3) {
            setError('Name must be at least 3 characters long.');
            return;
        }

        if (!/^[a-zA-Z0-9\s]+$/.test(newName)) {
            setError('Name can only contain alphanumeric characters and spaces.');
            return;
        }

        setLoading(true);
        try {
            const client = getClientOrThrow();
            const { error: updateError } = await client
                .from('profiles')
                .update({
                    full_name: newName,
                    pinned_organization_id: profile?.pinned_organization_id || null,
                })
                .eq('id', user?.id || '');

            if (updateError) {
                setError('Failed to update name. Please try again.');
            } else {
                setError('');
                setEditingName(false);
                await refreshUser();
            }
        } catch (clientError) {
            console.error('Failed to obtain Supabase client', clientError);
            setError('Unable to update profile at this time. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const toggleTheme = () => {
        setTheme(theme === 'light' ? 'dark' : 'light');
    };

    const toggleLayout = () => {
        const newLayout = layout === 'standard' ? 'wide' : 'standard';
        setLayout(newLayout);
        localStorage.setItem('layoutViewMode', newLayout); // Persist state
    };

    if (!mounted) {
        // Placeholder for SSR
        return (
            <div className="container mx-auto p-6 space-y-6">
                <div className="space-y-4">
                    <div className="flex flex-col items-center">
                        <h2 className="text-3xl font-bold mb-4">Account</h2>
                        <div className="relative flex flex-col items-center p-6">
                            <Avatar className="cursor-pointer w-24 h-24">
                                <AvatarImage
                                    src={profile?.avatar_url || undefined}
                                    alt="avatar"
                                />
                                <AvatarFallback className="bg-primary text-white">
                                    {profile?.full_name ? profile?.full_name[0] : ''}
                                </AvatarFallback>
                            </Avatar>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="space-y-4">
                <div className="flex flex-col items-center">
                    <h2 className="text-3xl font-bold mb-4">Account</h2>
                    <div className="relative flex flex-col items-center p-6">
                        <Avatar className="cursor-pointer w-24 h-24">
                            <AvatarImage
                                src={profile?.avatar_url || undefined}
                                alt="avatar"
                            />
                            <AvatarFallback className="bg-primary text-white text-5xl">
                                {profile?.full_name ? profile?.full_name[0] : ''}
                            </AvatarFallback>
                        </Avatar>
                    </div>
                    <div className="flex items-center mt-4">
                        {editingName ? (
                            <div className="flex flex-col items-center space-y-2">
                                <Input
                                    type="text"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder="Enter your name"
                                    className="w-64"
                                />
                                <div className="flex space-x-2">
                                    <Button
                                        onClick={handleNameUpdate}
                                        disabled={loading}
                                        className="bg-primary text-white"
                                    >
                                        {loading ? 'Saving...' : 'Save'}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setEditingName(false);
                                            setNewName(profile?.full_name || '');
                                            setError('');
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                                {error && <p className="text-red-500 text-sm">{error}</p>}
                            </div>
                        ) : (
                            <div className="flex items-center space-x-2">
                                <h2 className="text-2xl font-semibold">
                                    {profile?.full_name || 'Full Name'}
                                </h2>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setEditingName(true)}
                                >
                                    <Pencil className="h-4 w-4 text-gray-600" />
                                </Button>
                            </div>
                        )}
                    </div>
                    <p className="text-gray-600 text-sm mt-2">{user?.email || 'Email'}</p>
                </div>

                <div className="w-3/5 mx-auto">
                    <h2 className="text-xl font-medium pl-2 mb-2">Account Settings</h2>
                    <Card className="p-5">
                        <SettingsSection
                            title="Display Settings"
                            description="Customize your theme and layout preferences"
                        >
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">
                                        Switch between light and dark modes.
                                    </span>
                                    <div className="relative flex space-x-0 border rounded-md overflow-hidden w-21 ml-6">
                                        <motion.div
                                            className="absolute inset-0 bg-primary"
                                            layout
                                            transition={{
                                                type: 'spring',
                                                stiffness: 300,
                                                damping: 30,
                                            }}
                                            style={{
                                                left: theme === 'light' ? 0 : '50%',
                                                width: '50%',
                                            }}
                                        />
                                        <Button
                                            variant="link"
                                            className={`w-9 h-9 relative z-10 ${
                                                theme === 'light'
                                                    ? 'text-white'
                                                    : 'text-gray-500'
                                            }`}
                                            onClick={toggleTheme}
                                        >
                                            <Sun className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="link"
                                            className={`w-9 h-9 relative z-10 ${
                                                theme === 'dark'
                                                    ? 'text-white'
                                                    : 'text-gray-500'
                                            }`}
                                            onClick={toggleTheme}
                                        >
                                            <Moon className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">
                                        Switch between standard and wide layouts.
                                    </span>
                                    <div className="relative flex space-x-0 border rounded-md overflow-hidden w-21 ml-6">
                                        <motion.div
                                            className="absolute inset-0 bg-primary"
                                            layout
                                            transition={{
                                                type: 'spring',
                                                stiffness: 300,
                                                damping: 30,
                                            }}
                                            style={{
                                                left: layout === 'standard' ? 0 : '50%',
                                                width: '50%',
                                            }}
                                        />
                                        <Button
                                            variant="link"
                                            className={`w-9 h-9 relative z-10 ${
                                                layout === 'standard'
                                                    ? 'text-white'
                                                    : 'text-gray-500'
                                            }`}
                                            onClick={toggleLayout}
                                        >
                                            <Minimize2 className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="link"
                                            className={`w-9 h-9 relative z-10 ${
                                                layout === 'wide'
                                                    ? 'text-white'
                                                    : 'text-gray-500'
                                            }`}
                                            onClick={toggleLayout}
                                        >
                                            <Maximize2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </SettingsSection>
                    </Card>
                </div>
            </div>
        </div>
    );
}
