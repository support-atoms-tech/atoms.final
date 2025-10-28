'use client';

import type { HTMLAttributes, RefObject } from 'react';

import { cn } from '@/lib/utils';

const Card = ({
    ref,
    className,
    ...props
}: HTMLAttributes<HTMLDivElement> & {
    ref?: RefObject<HTMLDivElement>;
}) => (
    <div
        ref={ref}
        className={cn('border rounded-md bg-card text-card-foreground shadow', className)}
        {...props}
    />
);
Card.displayName = 'Card';

const CardHeader = ({
    ref,
    className,
    ...props
}: HTMLAttributes<HTMLDivElement> & {
    ref?: RefObject<HTMLDivElement>;
}) => (
    <div ref={ref} className={cn('flex flex-col space-y-2 p-6', className)} {...props} />
);
CardHeader.displayName = 'CardHeader';

const CardTitle = ({
    ref,
    className,
    ...props
}: HTMLAttributes<HTMLDivElement> & {
    ref?: RefObject<HTMLDivElement>;
}) => (
    <div
        ref={ref}
        className={cn('font-semibold leading-none tracking-tight', className)}
        {...props}
    />
);
CardTitle.displayName = 'CardTitle';

const CardDescription = ({
    ref,
    className,
    ...props
}: HTMLAttributes<HTMLDivElement> & {
    ref?: RefObject<HTMLDivElement>;
}) => (
    <div
        ref={ref}
        className={cn('text-sm text-muted-foreground', className)}
        {...props}
    />
);
CardDescription.displayName = 'CardDescription';

const CardContent = ({
    ref,
    className,
    ...props
}: HTMLAttributes<HTMLDivElement> & {
    ref?: RefObject<HTMLDivElement>;
}) => <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />;
CardContent.displayName = 'CardContent';

const CardFooter = ({
    ref,
    className,
    ...props
}: HTMLAttributes<HTMLDivElement> & {
    ref?: RefObject<HTMLDivElement>;
}) => (
    <div ref={ref} className={cn('flex items-center p-6 pt-0', className)} {...props} />
);
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
