'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { memo, useEffect, useState } from 'react';

import BaseToggle from '@/components/custom/toggles/BaseToggle';

export const ThemeToggle = memo(() => {
    const [mounted, setMounted] = useState(false);
    const { resolvedTheme, setTheme } = useTheme();

    useEffect(() => {
        setMounted(true);
    }, []);

    // Handle theme toggle
    const toggleTheme = () => {
        setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
    };

    // For SSR, show a placeholder until mounted
    if (!mounted) {
        return (
            <div className="h-9 w-9 flex items-center justify-center">
                <span className="h-[1.2rem] w-[1.2rem]" />
            </div>
        );
    }

    // Custom icon with transitions
    const themeIcon = (
        <div className="relative w-[1.2rem] h-[1.2rem] flex items-center justify-center">
            <Sun className="h-[1.2rem] w-[1.2rem] absolute inset-0 m-auto rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="h-[1.2rem] w-[1.2rem] absolute inset-0 m-auto rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </div>
    );

    return (
        <BaseToggle
            icon={themeIcon}
            tooltip={
                resolvedTheme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'
            }
            onClick={toggleTheme}
            isActive={resolvedTheme === 'dark'}
        />
    );
});

// Display name for debugging
ThemeToggle.displayName = 'ThemeToggle';

export default ThemeToggle;
