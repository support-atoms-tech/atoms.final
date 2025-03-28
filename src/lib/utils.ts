// lib/utils.ts
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines class names, merging Tailwind classes properly
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Debounces a function call
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
    fn: T,
    delay: number,
): (...args: Parameters<T>) => void {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    return function (...args: Parameters<T>): void {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }

        timeoutId = setTimeout(() => {
            fn(...args);
            timeoutId = null;
        }, delay);
    };
}

/**
 * Generates a unique ID
 */
export function generateId(prefix = ''): string {
    return `${prefix}${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Formats a date as a string
 */
export function formatDate(date: Date | string): string {
    if (typeof date === 'string') {
        date = new Date(date);
    }

    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    }).format(date);
}
