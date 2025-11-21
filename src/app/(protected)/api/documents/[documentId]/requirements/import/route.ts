import { withAuth } from '@workos-inc/authkit-nextjs';
import { NextRequest, NextResponse } from 'next/server';

import { getOrCreateProfileForWorkOSUser } from '@/lib/auth/profile-sync';
import { getDocumentDataServer } from '@/lib/db/server/documents.server';
import { getSupabaseServiceRoleClient } from '@/lib/supabase/supabase-service-role';
import { Json, TablesInsert } from '@/types/base/database.types';
import {
    ERequirementPriority,
    ERequirementStatus,
    RequirementPriority,
    RequirementStatus,
} from '@/types/base/enums.types';

type EditableColumnType = 'text' | 'select' | 'multi_select' | 'number' | 'date';

type ImportColumn = {
    name: string;
    type: EditableColumnType;
    options?: string[];
};

type RequirementsMapping = Partial<
    Record<
        'External_ID' | 'Name' | 'Description' | 'Status' | 'Priority',
        string | '__leave_blank__' | '__auto_generate__'
    >
>;

/**
 * POST /api/documents/[documentId]/requirements/import
 *
 * Imports a requirements table:
 * - Creates a new table block with content.tableKind = 'requirements'
 * - Ensures default columns for native fields are present
 * - Creates additional properties/columns for all non-native incoming columns
 * - Inserts requirement rows with native fields mapped/validated and remaining data into properties
 */
export async function POST(
    request: NextRequest,
    context: { params: Promise<{ documentId: string }> },
) {
    try {
        const { documentId } = await context.params;
        if (!documentId) {
            return NextResponse.json(
                { error: 'Document ID is required' },
                { status: 400 },
            );
        }

        const { user } = await withAuth();
        if (!user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }
        const profile = await getOrCreateProfileForWorkOSUser(user);
        if (!profile) {
            return NextResponse.json(
                { error: 'Profile not provisioned' },
                { status: 409 },
            );
        }

        const body = (await request.json()) as {
            name: string;
            columns: ImportColumn[];
            rows: Array<Array<unknown>>;
            includeHeader?: boolean;
            mapping: RequirementsMapping;
        };

        if (!body?.name || !Array.isArray(body?.columns) || !Array.isArray(body?.rows)) {
            return NextResponse.json(
                { error: 'Invalid payload: name, columns, and rows are required' },
                { status: 400 },
            );
        }

        const supabase = getSupabaseServiceRoleClient();
        if (!supabase) {
            return NextResponse.json(
                { error: 'Supabase service client unavailable' },
                { status: 500 },
            );
        }

        // Ensure document exists and collect project/org scope
        const documents = await getDocumentDataServer(documentId);
        if (!documents || documents.length === 0) {
            return NextResponse.json({ error: 'Document not found' }, { status: 404 });
        }
        const document = documents[0];

        // Project membership enforcement
        const { data: membership, error: membershipError } = await supabase
            .from('project_members')
            .select('role')
            .eq('project_id', document.project_id)
            .eq('user_id', profile.id)
            .eq('status', 'active')
            .maybeSingle();
        if (membershipError) {
            return NextResponse.json(
                {
                    error: 'Failed to verify project membership',
                    details: membershipError.message,
                },
                { status: 500 },
            );
        }
        if (!membership) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Resolve organization id
        const { data: projectRow, error: projectErr } = await supabase
            .from('projects')
            .select('id, organization_id')
            .eq('id', document.project_id)
            .maybeSingle();
        if (projectErr) {
            return NextResponse.json(
                { error: 'Failed to resolve project', details: projectErr.message },
                { status: 500 },
            );
        }
        const organizationId = projectRow?.organization_id ?? null;
        if (!organizationId) {
            return NextResponse.json(
                { error: 'Project missing organization_id' },
                { status: 500 },
            );
        }

        // Compute next block position
        const { data: existingBlocks } = await supabase
            .from('blocks')
            .select('position')
            .eq('document_id', documentId);
        const maxPos = (existingBlocks || [])
            .map((r) => (typeof r.position === 'number' ? r.position : 0))
            .reduce((m, v) => (v > m ? v : m), -1);
        const blockPosition = maxPos + 1;

        // Create block with requirements table kind
        const { data: block, error: blockErr } = await supabase
            .from('blocks')
            .insert({
                document_id: documentId,
                type: 'table',
                name: body.name,
                position: blockPosition,
                content: {
                    tableKind: 'requirements',
                    columns: [],
                    rows: [],
                } as unknown as Json,
                created_by: profile.id,
                updated_by: profile.id,
                org_id: organizationId,
            })
            .select('*')
            .single();
        if (blockErr || !block) {
            return NextResponse.json(
                { error: 'Failed to create block', details: blockErr?.message },
                { status: 500 },
            );
        }

        // Ensure default columns for native properties exist (reuse logic similar to blocks route)
        const { data: baseProps, error: propsErr } = await supabase
            .from('properties')
            .select('*')
            .eq('org_id', organizationId)
            .eq('is_base', true)
            .is('document_id', null)
            .is('project_id', null);
        if (!propsErr && Array.isArray(baseProps) && baseProps.length > 0) {
            const order = ['external_id', 'name', 'description', 'status', 'priority'];
            const normalize = (s: unknown) =>
                typeof s === 'string' ? s.toLowerCase().trim() : '';
            const sorted = baseProps.slice().sort((a, b) => {
                const ia = order.indexOf(normalize(a.name));
                const ib = order.indexOf(normalize(b.name));
                const va = ia === -1 ? Number.MAX_SAFE_INTEGER : ia;
                const vb = ib === -1 ? Number.MAX_SAFE_INTEGER : ib;
                return va - vb || normalize(a.name).localeCompare(normalize(b.name));
            });
            let pos = 0;
            for (const prop of sorted) {
                // create column for each base property
                await supabase
                    .from('columns')
                    .insert({
                        block_id: block.id,
                        property_id: prop.id,
                        position: pos,
                        width: 200,
                        is_hidden: false,
                        is_pinned: false,
                        created_by: profile.id,
                        updated_by: profile.id,
                    })
                    .select('*')
                    .single();
                pos += 1;
            }
        }

        // Build a set of incoming column names that are used as native field mappings
        const nativeNameForMapping: Record<string, string> = {};
        for (const [nativeKey, mapped] of Object.entries(body.mapping || {})) {
            if (
                mapped &&
                typeof mapped === 'string' &&
                mapped !== '__leave_blank__' &&
                mapped !== '__auto_generate__'
            ) {
                nativeNameForMapping[(mapped as string).toLowerCase()] = nativeKey;
            }
        }

        // Helper to compute next column position
        const getNextColumnPosition = async (blockId: string) => {
            const { data: existing } = await supabase
                .from('columns')
                .select('position')
                .eq('block_id', blockId);
            const max = (existing || [])
                .map((r) => (typeof r.position === 'number' ? r.position : 0))
                .reduce((m, v) => (v > m ? v : m), -1);
            return max + 1;
        };

        // Check existing columns to prevent duplication
        const { data: existingColumns } = await supabase
            .from('columns')
            .select('property_id, property:properties(name)')
            .eq('block_id', block.id);
        const existingColumnNames = new Set(
            (existingColumns || [])
                .map((c) => {
                    const propName = (c as unknown as { property?: { name?: string } })
                        ?.property?.name;
                    return propName ? propName.toLowerCase() : null;
                })
                .filter(Boolean) as string[],
        );

        // Create additional properties/columns for all non-native incoming columns
        const incomingColumns = (body.columns || []).filter((c) => !!c?.name);
        // Canonical native names we must never duplicate as custom properties
        const NATIVE_NAMES = new Set([
            'external_id',
            'name',
            'description',
            'status',
            'priority',
        ]);
        for (const col of incomingColumns) {
            const nameLc = col.name.toLowerCase();
            // Skip if this incoming name is used as a mapping for a native field
            if (nameLc in nativeNameForMapping) {
                // Skip - this incoming column is mapped to a native requirement field
                continue;
            }
            // Also skip if the incoming column name collides with a native field name,
            // even when the user didn't explicitly map it. This prevents duplicate native columns.
            if (NATIVE_NAMES.has(nameLc)) {
                continue;
            }
            // Skip if a column with this name already exists (prevents duplicates)
            if (existingColumnNames.has(nameLc)) {
                continue;
            }
            const position = await getNextColumnPosition(block.id);
            const optionsJson = (() => {
                const values = col.options || [];
                if (Array.isArray(values) && values.length > 0) {
                    return col.type === 'multi_select'
                        ? ({ values, format: 'people' } as unknown as Json)
                        : ({ values } as unknown as Json);
                }
                return null;
            })();
            const { data: property, error: propertyErr } = await supabase
                .from('properties')
                .insert({
                    name: col.name,
                    property_type: mapEditableToDbType(col.type),
                    org_id: organizationId,
                    document_id: documentId,
                    is_base: false,
                    options: optionsJson,
                    scope: 'document',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    created_by: profile.id,
                    updated_by: profile.id,
                })
                .select('*')
                .single();
            if (!propertyErr && property) {
                await supabase
                    .from('columns')
                    .insert({
                        block_id: block.id,
                        property_id: property.id,
                        position,
                        width: 150,
                        is_hidden: false,
                        is_pinned: false,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                        created_by: profile.id,
                        updated_by: profile.id,
                    })
                    .select('*')
                    .single();
            }
        }

        // Index incoming column names for quick lookup
        const nameToIndex: Record<string, number> = {};
        incomingColumns.forEach((c, idx) => {
            nameToIndex[c.name.toLowerCase()] = idx;
        });

        // Pre-compute batch external IDs if needed
        const autoExternalId =
            (body.mapping?.External_ID as string | undefined) === '__auto_generate__';
        const autoCount = autoExternalId ? body.rows.length : 0;
        const externalIds: string[] = autoCount
            ? await generateBatchExternalIdsForOrg(supabase, organizationId, autoCount)
            : [];
        let externalIdPtr = 0;

        // Insert requirements, one per row
        const inserts: TablesInsert<'requirements'>[] = [];
        for (let i = 0; i < body.rows.length; i++) {
            const r = body.rows[i] || [];
            const nName = readMapped(r, nameToIndex, body.mapping?.Name);
            const nDescription = readMapped(r, nameToIndex, body.mapping?.Description);
            const nStatus = normalizeStatus(
                readMapped(r, nameToIndex, body.mapping?.Status),
            );
            const nPriority = normalizePriority(
                readMapped(r, nameToIndex, body.mapping?.Priority),
            );
            const nExternalId = (() => {
                const raw = body.mapping?.External_ID;
                if (raw === '__auto_generate__') {
                    const id = externalIds[externalIdPtr] || generateFallbackId();
                    externalIdPtr += 1;
                    return id;
                }
                const explicit = readMapped(r, nameToIndex, raw);
                // Allow empty to mean null (auto could have been chosen)
                return explicit || null;
            })();

            // Build properties JSON for non-native columns
            const props: Record<string, unknown> = {};
            for (let c = 0; c < incomingColumns.length; c++) {
                const col = incomingColumns[c];
                const nameLc = col.name.toLowerCase();
                // Skip native-mapped columns and any column that collides with native names
                if (nameLc in nativeNameForMapping) continue; // skip native columns that are mapped
                if (NATIVE_NAMES.has(nameLc)) continue; // skip native columns even if not mapped
                props[col.name] = transformCellValueByType(r[c], col.type);
            }

            const nameSafe = (nName || '').trim();
            inserts.push({
                block_id: block.id,
                document_id: documentId,
                organization_id: organizationId, // Add organization_id
                name: nameSafe.length >= 2 ? nameSafe : `Imported Requirement ${i + 1}`,
                description: nDescription || null,
                external_id: nExternalId,
                status: nStatus,
                priority: nPriority,
                properties: (Object.keys(props).length > 0
                    ? (props as Json)
                    : ({} as Json)) as Json,
                version: 1,
                position: i,
                created_by: profile.id,
                updated_by: profile.id,
            } as TablesInsert<'requirements'>);
        }

        // Insert in chunks to avoid payload limits
        const chunkSize = 200;
        for (let i = 0; i < inserts.length; i += chunkSize) {
            const slice = inserts.slice(i, i + chunkSize);
            const { error: insErr } = await supabase.from('requirements').insert(slice);
            if (insErr) {
                return NextResponse.json(
                    {
                        error: 'Failed to insert requirements',
                        details: insErr.message,
                        index: i,
                    },
                    { status: 500 },
                );
            }
        }

        // Finalize: update block content.columns metadata to reflect the real columns
        try {
            const { data: cols } = await supabase
                .from('columns')
                .select('id, position, width, property:properties(name)')
                .eq('block_id', block.id)
                .order('position', { ascending: true });

            // Read current content to merge
            const { data: blkContentRow } = await supabase
                .from('blocks')
                .select('content')
                .eq('id', block.id)
                .single();
            const currentContent = (blkContentRow?.content || {}) as unknown as {
                columns?: unknown[];
                rows?: unknown[];
                requirements?: unknown[];
                tableKind?: string;
            };

            const meta =
                (cols || []).map((c, idx) => ({
                    columnId: (c as { id: string }).id,
                    position:
                        typeof (c as { position?: number }).position === 'number'
                            ? (c as { position?: number }).position
                            : idx,
                    width: (c as { width?: number }).width ?? 200,
                    name:
                        ((c as unknown as { property?: { name?: string | null } })
                            ?.property?.name ||
                            '') ??
                        '',
                })) || [];

            await supabase
                .from('blocks')
                .update({
                    content: {
                        ...currentContent,
                        tableKind: 'requirements',
                        columns: meta,
                    } as unknown as Json,
                })
                .eq('id', block.id);
        } catch (e) {
            // Non-fatal; best-effort metadata sync
            console.error('Metadata finalize failed (columns):', e);
        }

        return NextResponse.json({
            blockId: block.id,
            inserted: inserts.length,
        });
    } catch (error) {
        console.error('Requirements import API error:', error);
        return NextResponse.json(
            {
                error: 'Failed to import requirements',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 },
        );
    }
}

function mapEditableToDbType(type: EditableColumnType): string {
    switch (type) {
        case 'select':
            return 'select';
        case 'multi_select':
            return 'multi_select';
        case 'number':
            return 'number';
        case 'date':
            return 'date';
        default:
            return 'text';
    }
}

function readMapped(
    row: unknown[],
    nameToIndex: Record<string, number>,
    mapped?: string | '__leave_blank__' | '__auto_generate__',
): string | null {
    if (!mapped || mapped === '__leave_blank__' || mapped === '__auto_generate__') {
        return null;
    }
    const idx = nameToIndex[(mapped || '').toLowerCase()];
    if (idx == null) return null;
    const v = row[idx];
    return v == null ? null : String(v);
}

function normalizeStatus(input: string | null): ERequirementStatus {
    if (!input) return RequirementStatus.draft;
    const value = input.toLowerCase().replace(/\s+/g, '_');
    const map: Record<string, ERequirementStatus> = {
        active: RequirementStatus.active,
        archived: RequirementStatus.archived,
        draft: RequirementStatus.draft,
        deleted: RequirementStatus.deleted,
        in_review: RequirementStatus.in_review,
        review: RequirementStatus.in_review,
        in_progress: RequirementStatus.in_progress,
        progress: RequirementStatus.in_progress,
        approved: RequirementStatus.approved,
        rejected: RequirementStatus.rejected,
    };
    return map[value] || RequirementStatus.draft;
}

function normalizePriority(input: string | null): ERequirementPriority {
    if (!input) return RequirementPriority.low as ERequirementPriority;
    const value = input.toLowerCase().replace(/\s+/g, '_');
    const map: Record<string, ERequirementPriority> = {
        low: RequirementPriority.low as ERequirementPriority,
        medium: RequirementPriority.medium as ERequirementPriority,
        high: RequirementPriority.high as ERequirementPriority,
        critical: RequirementPriority.critical as ERequirementPriority,
    };
    return map[value] || (RequirementPriority.low as ERequirementPriority);
}

function transformCellValueByType(
    raw: unknown,
    type: EditableColumnType,
    separators: string[] = [',', ';', '|'],
): unknown {
    const s = toStringSafe(raw);
    if (s === '') return '';
    switch (type) {
        case 'number': {
            const n = Number(s.replace(/,/g, ''));
            return isNaN(n) ? '' : n;
        }
        case 'date': {
            const d = new Date(s);
            return isNaN(d.getTime()) ? s : d.toISOString();
        }
        case 'multi_select': {
            const pattern = new RegExp(
                `[${escapeForCharClass(separators.join(''))}]`,
                'g',
            );
            return s
                .split(pattern)
                .map((t) => t.trim())
                .filter(Boolean);
        }
        default:
            return s;
    }
}

function toStringSafe(v: unknown): string {
    if (v == null) return '';
    if (v instanceof Date && !isNaN(v.getTime())) return v.toISOString();
    const s = String(v).trim();
    return s;
}

function escapeForCharClass(s: string): string {
    return s.replace(/[-\\^$*+?.()|[\]{}]/g, '\\$&');
}

async function generateBatchExternalIdsForOrg(
    supabase: NonNullable<ReturnType<typeof getSupabaseServiceRoleClient>>,
    organizationId: string,
    count: number,
): Promise<string[]> {
    // Compute prefix from org name
    const { data: org } = await supabase
        .from('organizations')
        .select('name')
        .eq('id', organizationId)
        .maybeSingle();
    const orgPrefix = (org?.name || 'ORG').substring(0, 3).toUpperCase();

    // Scan existing to find max
    const { data: reqs } = await supabase
        .from('requirements')
        .select(
            `external_id, documents!inner(project_id, projects!inner(organization_id))`,
        )
        .eq('documents.projects.organization_id', organizationId)
        .not('external_id', 'is', null)
        .order('created_at', { ascending: false });

    let maxNumber = 0;
    const prefix = `REQ-${orgPrefix}-`;
    for (const r of reqs ?? []) {
        const ext = (r as { external_id?: string | null }).external_id;
        if (ext && ext.startsWith(prefix)) {
            const num = parseInt(ext.substring(prefix.length), 10);
            if (!Number.isNaN(num) && num > maxNumber) maxNumber = num;
        }
    }
    const ids: string[] = [];
    for (let i = 1; i <= count; i++) {
        const nextNumber = maxNumber + i;
        const padded = String(nextNumber).padStart(3, '0');
        ids.push(`${prefix}${padded}`);
    }
    return ids;
}

function generateFallbackId(): string {
    const timestamp = Date.now().toString().slice(-6);
    return `REQ-${timestamp}`;
}
