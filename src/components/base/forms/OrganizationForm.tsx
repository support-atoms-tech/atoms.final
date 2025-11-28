'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { useCreateBaseOrgProperties } from '@/hooks/mutations/useDocumentMutations';
import { useAuthenticatedSupabase } from '@/hooks/useAuthenticatedSupabase';
import { useUser } from '@/lib/providers/user.provider';
import { debugConfig } from '@/lib/utils/env-validation';
import {
    BillingPlan,
    OrganizationType,
    PricingPlanInterval,
} from '@/types/base/enums.types';

const formSchema = z.object({
    name: z
        .string()
        .trim()
        .min(2, {
            message: 'Organization name must be at least 2 characters.',
        })
        .max(255, {
            message: 'Organization name must be at most 255 characters.',
        }),
    slug: z
        .string()
        .min(2, {
            message: 'Slug must be at least 2 characters.',
        })
        .max(63, {
            message: 'Slug name must be at most 63 characters.',
        })
        .regex(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/, {
            // Can't have '-' on ends. In line with db schema.
            message:
                'Slug can only contain lowercase letters, numbers, and hyphens (not at the beginning or end).',
        }),
    description: z
        .string()
        .trim()
        .max(512, { message: 'Description must be 512 characters or fewer.' })
        .optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface OrganizationFormProps {
    onSuccess?: () => void;
}

export default function OrganizationForm({ onSuccess }: OrganizationFormProps) {
    const { toast, dismiss } = useToast();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { user } = useUser();
    const createBaseOrgProperties = useCreateBaseOrgProperties();
    const { getClientOrThrow } = useAuthenticatedSupabase();

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            slug: '',
            description: '',
        },
    });

    const onSubmit = async (values: FormValues) => {
        if (!user) {
            toast({
                title: 'Error',
                description: 'You must be logged in to create an organization.',
                variant: 'destructive',
            });
            return;
        }

        // Validate user.id is a valid UUID format
        const uuidRegex =
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(user.id)) {
            console.error('Invalid user ID format:', user.id);
            toast({
                title: 'Error',
                description: 'Invalid user ID format. Please log out and log back in.',
                variant: 'destructive',
            });
            return;
        }

        setIsSubmitting(true);

        try {
            const supabase = getClientOrThrow();

            // Create the organization
            // Note: We skip slug uniqueness check and let the database unique constraint handle it
            // This avoids RLS issues and simplifies the code
            const insertPayload = {
                name: values.name,
                slug: values.slug,
                description: values.description || null,
                created_by: user.id, // Should be UUID string
                updated_by: user.id, // Should be UUID string
                type: OrganizationType.enterprise,
                billing_plan: BillingPlan.free, // Default to free plan
                billing_cycle: PricingPlanInterval.month,
                max_members: 5, // Default values
                max_monthly_requests: 1000, // Default values
            };

            // Debug logging
            if (debugConfig.debugRLSQueries()) {
                console.log('=== ORGANIZATION INSERT DEBUG ===');
                console.log('User ID:', user.id);
                console.log('User ID type:', typeof user.id);
                console.log('User ID length:', user.id.length);
                console.log('Insert payload:', JSON.stringify(insertPayload, null, 2));
                console.log('================================');
            }

            const { data: orgData, error: orgError } = await supabase
                .from('organizations')
                .insert(insertPayload)
                .select('id')
                .single();

            if (orgError || !orgData) {
                // Handle unique constraint violation on slug
                if (
                    orgError?.code === '23505' &&
                    (orgError?.message?.includes('slug') ||
                        orgError?.message?.includes('organizations_slug_key'))
                ) {
                    // Slug is taken, suggest an alternative
                    const suggestedSlug = `${values.slug}-${Date.now().toString().slice(-4)}`;
                    form.setValue('slug', suggestedSlug);
                    form.setError('slug', {
                        type: 'manual',
                        message: `Slug "${values.slug}" is already taken. Suggested: "${suggestedSlug}". You can use this or choose a new one.`,
                    });
                    setIsSubmitting(false);
                    return;
                }

                // Handle COALESCE type mismatch error (database trigger issue)
                if (
                    orgError?.message?.includes('COALESCE types') ||
                    orgError?.message?.includes('cannot be matched')
                ) {
                    console.error('Database trigger error - COALESCE type mismatch:', {
                        error: orgError,
                        errorCode: orgError?.code,
                        errorMessage: orgError?.message,
                        errorDetails: orgError?.details,
                        errorHint: orgError?.hint,
                        user_id: user.id,
                        user_id_type: typeof user.id,
                        user_workos_id: user.workosId,
                        insertPayload,
                    });
                    toast({
                        title: 'Database Error',
                        description:
                            'A database trigger configuration issue was detected. The trigger is trying to mix UUID and text types. Please check the auto_add_org_owner trigger function. Error: ' +
                            (orgError?.message || 'Unknown error'),
                        variant: 'destructive',
                    });
                    setIsSubmitting(false);
                    return;
                }

                throw new Error(
                    `Failed to create org, Supabase insert error: '${orgError?.message || 'Insert returned no data'}`,
                );
            }

            // Create base organization properties
            await createBaseOrgProperties.mutateAsync({
                orgId: orgData.id,
                userId: user.id,
            });

            // Note: The database trigger 'auto_add_org_owner' automatically adds
            // the creator as an owner member, so we don't need to insert manually.
            // This prevents duplicate key conflicts and keeps RLS consistent.

            toast({
                title: 'Success',
                description: 'Organization created successfully!',
                variant: 'default',
            });

            // Auto-dismiss the toast after 3 seconds
            setTimeout(() => {
                dismiss(); // Dismiss all toasts (there's only one due to TOAST_LIMIT)
            }, 3000);

            if (onSuccess) {
                onSuccess();
            }

            // Navigate to the new organization
            router.push(`/org/${orgData.id}`);
        } catch (error) {
            console.error('Error creating organization:', error, {
                name: values.name,
                slug: values.slug,
                description: values.description,
            });

            toast({
                title: 'Error',
                description: 'Failed to create organization. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Auto-generate slug from name
    const handleNameChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const name = e.target.value;
        form.setValue('name', name);

        // Generate slug from name (lowercase, replace spaces with hyphens, remove special chars)
        const slug = name
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '')
            .slice(0, 63); // Stop auto-generating slug after max length.

        // Slug unique check moved to OnSubmit to cut down on API calls. Could also use lodash.debounce if we want similar functionality with less overhead.
        form.setValue('slug', slug);
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Organization Name</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="Acme Corporation"
                                    {...field}
                                    onChange={handleNameChange}
                                />
                            </FormControl>
                            <FormDescription>
                                The name of your enterprise organization.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Organization Slug</FormLabel>
                            <FormControl>
                                <Input placeholder="acme-corporation" {...field} />
                            </FormControl>
                            <FormDescription>
                                Used in URLs. Only lowercase letters, numbers, and
                                hyphens.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Description (Optional)</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="A brief description of your organization"
                                    {...field}
                                />
                            </FormControl>
                            <FormDescription>
                                Describe what your organization does. (
                                {form.watch('description')?.length || 0}/512)
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Creating...' : 'Create Organization'}
                </Button>
            </form>
        </Form>
    );
}
