'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Profile } from '@/types/base/profiles.types';

interface AutocompleteInputProps {
    orgId: string;
    value: string;
    onChange: (value: string) => void;
    currentUserId?: string;
    existingMemberIds?: string[];
}

export function OrgMemberAutocomplete({
    orgId,
    value,
    onChange,
    currentUserId,
    existingMemberIds = [],
}: AutocompleteInputProps) {
    const [open, setOpen] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const [orgMembers, setOrgMembers] = useState<Profile[]>([]);

    useEffect(() => {
        if (!orgId) {
            return;
        }

        const fetchMembers = async () => {
            try {
                const response = await fetch(`/api/organizations/${orgId}/members`, {
                    method: 'GET',
                    cache: 'no-store',
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch organization members');
                }

                const data = await response.json();
                setOrgMembers(data.members || []);
            } catch (error) {
                console.error('Error fetching organization members:', error);
                setOrgMembers([]);
            }
        };

        fetchMembers();
    }, [orgId]);

    const filteredMembers = useMemo(() => {
        if (!orgMembers) {
            return;
        }

        // Filter out current user and existing members
        const availableMembers = orgMembers.filter((profile) => {
            // Exclude current user
            if (currentUserId && profile.id === currentUserId) {
                return false;
            }
            // Exclude existing project members
            if (existingMemberIds && existingMemberIds.includes(profile.id)) {
                return false;
            }
            return true;
        });

        const searchValue = value.toLowerCase().trim();
        if (!searchValue) {
            return availableMembers;
        }

        // Apply search filter
        const filteredMembers = availableMembers.filter(
            (profile) =>
                profile.full_name?.toLowerCase().startsWith(searchValue) ||
                profile.email?.toLowerCase().startsWith(searchValue),
        );

        return filteredMembers;
    }, [orgMembers, value, currentUserId, existingMemberIds]);

    const handleSelect = (value: string) => {
        onChange(value);
        setOpen(false);
        requestAnimationFrame(() => {
            inputRef.current?.setSelectionRange(value.length, value.length);
        });
    };

    return (
        <Popover
            open={open && filteredMembers && filteredMembers.length > 0}
            onOpenChange={setOpen}
        >
            <PopoverTrigger asChild>
                <Input
                    ref={inputRef}
                    type="text"
                    value={value}
                    onClick={() => setOpen(true)}
                    onChange={(e) => {
                        onChange(e.target.value);
                        setOpen(true);
                    }}
                    placeholder="Add Org Member"
                />
            </PopoverTrigger>
            {filteredMembers && filteredMembers.length > 0 && (
                <PopoverContent
                    className={cn(
                        'z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md',
                        'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
                    )}
                    align="end"
                    onOpenAutoFocus={(e) => e.preventDefault()}
                >
                    {filteredMembers.map((member, index) => (
                        <li
                            key={index}
                            className={cn(
                                'hover:bg-muted relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-secondary focus:text-primary data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&>svg]:size-4 [&>svg]:shrink-0',
                            )}
                            onClick={() => handleSelect(member?.email || '')}
                        >
                            <div>
                                <div className="font-medium">
                                    {member.full_name || 'User'}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    {member.email}
                                </div>
                            </div>
                        </li>
                    ))}
                </PopoverContent>
            )}
        </Popover>
    );
}
// The classname of PopoverContent comes from DropdownMenuContent
// The classname of li comes from DropdownMenuItem
