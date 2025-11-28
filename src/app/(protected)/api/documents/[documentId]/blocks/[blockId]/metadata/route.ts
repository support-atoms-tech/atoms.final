import { withAuth } from '@workos-inc/authkit-nextjs';
import { NextRequest, NextResponse } from 'next/server';

import type { BlockTableMetadata } from '@/components/custom/BlockCanvas/hooks/useBlockMetadataActions';
import { dedupeColumnMetadataEntries } from '@/components/custom/BlockCanvas/utils/requirementsNativeColumns';
import { getOrCreateProfileForWorkOSUser } from '@/lib/auth/profile-sync';
import { getDocumentDataServer } from '@/lib/db/server/documents.server';
import { getSupabaseServiceRoleClient } from '@/lib/supabase/supabase-service-role';
import { Json } from '@/types/base/database.types';

type RouteParams = {
    documentId: string;
    blockId: string;
};

const metadataKeys = ['columns', 'requirements', 'rows', 'tableKind'] as const;

const hasMetadataPayload = (payload: Partial<BlockTableMetadata>): boolean => {
    return metadataKeys.some((key) => key in payload);
};

async function getAuthorizedContext(context: { params: Promise<RouteParams> }) {
    const { documentId, blockId } = await context.params;

    if (!documentId || !blockId) {
        return {
            errorResponse: NextResponse.json(
                { error: 'documentId and blockId are required' },
                { status: 400 },
            ),
        };
    }

    const { user } = await withAuth();
    if (!user) {
        return {
            errorResponse: NextResponse.json(
                { error: 'Not authenticated' },
                { status: 401 },
            ),
        };
    }

    const profile = await getOrCreateProfileForWorkOSUser(user);
    if (!profile) {
        return {
            errorResponse: NextResponse.json(
                { error: 'Profile not provisioned' },
                { status: 409 },
            ),
        };
    }

    const supabase = getSupabaseServiceRoleClient();
    if (!supabase) {
        return {
            errorResponse: NextResponse.json(
                { error: 'Supabase service client unavailable' },
                { status: 500 },
            ),
        };
    }

    const documents = await getDocumentDataServer(documentId);
    if (!documents || documents.length === 0) {
        return {
            errorResponse: NextResponse.json(
                { error: 'Document not found' },
                { status: 404 },
            ),
        };
    }
    const document = documents[0];

    const { data: membership, error: membershipError } = await supabase
        .from('project_members')
        .select('role')
        .eq('project_id', document.project_id)
        .eq('user_id', profile.id)
        .eq('status', 'active')
        .maybeSingle();

    if (membershipError) {
        return {
            errorResponse: NextResponse.json(
                {
                    error: 'Failed to verify membership',
                    details: membershipError.message,
                },
                { status: 500 },
            ),
        };
    }
    if (!membership) {
        return {
            errorResponse: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
        };
    }

    return { documentId, blockId, supabase };
}

const sanitizeMetadata = (
    content: Record<string, unknown> | null,
): BlockTableMetadata | null => {
    if (!content) return null;

    const columnsRaw = Array.isArray(content.columns) ? content.columns : [];
    const requirementsRaw = Array.isArray(content.requirements)
        ? content.requirements
        : [];
    const rowsRaw = Array.isArray(content.rows) ? content.rows : undefined;

    const columns = dedupeColumnMetadataEntries(
        columnsRaw.filter(
            (col): col is BlockTableMetadata['columns'][number] =>
                typeof col === 'object' &&
                col !== null &&
                'columnId' in col &&
                typeof col.columnId === 'string',
        ),
    );

    const requirements = requirementsRaw.filter(
        (req): req is BlockTableMetadata['requirements'][number] =>
            typeof req === 'object' &&
            req !== null &&
            'requirementId' in req &&
            typeof req.requirementId === 'string',
    );

    const rows = rowsRaw
        ? rowsRaw.filter(
              (row): row is NonNullable<BlockTableMetadata['rows']>[number] =>
                  typeof row === 'object' &&
                  row !== null &&
                  'rowId' in row &&
                  typeof row.rowId === 'string',
          )
        : undefined;

    if (!columns.length && !requirements.length && !rows?.length) {
        return null;
    }

    const tableKind =
        typeof content.tableKind === 'string' &&
        (content.tableKind === 'genericTable' || content.tableKind === 'requirements')
            ? content.tableKind
            : undefined;

    return {
        columns,
        requirements,
        ...(rows ? { rows } : {}),
        ...(tableKind ? { tableKind } : {}),
    };
};

export async function GET(
    _request: NextRequest,
    context: { params: Promise<RouteParams> },
) {
    try {
        const authContext = await getAuthorizedContext(context);
        if ('errorResponse' in authContext) {
            return authContext.errorResponse;
        }

        const { documentId, blockId, supabase } = authContext;

        const { data: blockRecord, error: blockError } = await supabase
            .from('blocks')
            .select('id, document_id, content')
            .eq('id', blockId)
            .maybeSingle();

        if (blockError) {
            return NextResponse.json(
                { error: 'Failed to fetch block', details: blockError.message },
                { status: 500 },
            );
        }
        if (!blockRecord || blockRecord.document_id !== documentId) {
            return NextResponse.json({ error: 'Block not found' }, { status: 404 });
        }

        const sanitized = sanitizeMetadata(
            blockRecord.content as Record<string, unknown>,
        );

        return NextResponse.json({ metadata: sanitized });
    } catch (error) {
        console.error('Metadata API GET error:', error);
        return NextResponse.json(
            {
                error: 'Failed to fetch block metadata',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 },
        );
    }
}

export async function PATCH(
    request: NextRequest,
    context: { params: Promise<RouteParams> },
) {
    try {
        const authContext = await getAuthorizedContext(context);
        if ('errorResponse' in authContext) {
            return authContext.errorResponse;
        }

        const { documentId, blockId, supabase } = authContext;

        const payload = (await request.json()) as Partial<BlockTableMetadata>;
        if (!payload || !hasMetadataPayload(payload)) {
            return NextResponse.json(
                { error: 'No metadata fields provided' },
                { status: 400 },
            );
        }

        const { data: blockRecord, error: blockError } = await supabase
            .from('blocks')
            .select('id, document_id, content')
            .eq('id', blockId)
            .maybeSingle();

        if (blockError) {
            return NextResponse.json(
                { error: 'Failed to fetch block', details: blockError.message },
                { status: 500 },
            );
        }
        if (!blockRecord || blockRecord.document_id !== documentId) {
            return NextResponse.json({ error: 'Block not found' }, { status: 404 });
        }

        const currentContent = sanitizeMetadata(
            (blockRecord.content as Record<string, unknown>) ?? null,
        ) ?? { columns: [], requirements: [], tableKind: 'requirements' };

        const sanitizedColumns = Array.isArray(payload.columns)
            ? dedupeColumnMetadataEntries(payload.columns)
            : undefined;

        const updatedContent: Partial<BlockTableMetadata> = {
            ...currentContent,
            ...(sanitizedColumns ? { columns: sanitizedColumns } : {}),
            ...(Array.isArray(payload.requirements)
                ? { requirements: payload.requirements }
                : {}),
            ...(Array.isArray(payload.rows) ? { rows: payload.rows } : {}),
            ...(payload.tableKind ? { tableKind: payload.tableKind } : {}),
        };

        const { data: updateResult, error: updateError } = await supabase
            .from('blocks')
            .update({
                content: updatedContent as unknown as Json,
            })
            .eq('id', blockId)
            .eq('document_id', documentId)
            .select('content')
            .single();

        if (updateError) {
            return NextResponse.json(
                {
                    error: 'Failed to update block metadata',
                    details: updateError.message,
                },
                { status: 500 },
            );
        }

        return NextResponse.json({ metadata: updateResult?.content ?? updatedContent });
    } catch (error) {
        console.error('Metadata API PATCH error:', error);
        return NextResponse.json(
            {
                error: 'Failed to update block metadata',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 },
        );
    }
}
