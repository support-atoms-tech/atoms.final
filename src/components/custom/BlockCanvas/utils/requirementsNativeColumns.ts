import { Column, Property } from '@/components/custom/BlockCanvas/types';
import { Database } from '@/types/base/database.types';

import {
    naturalFieldOrder,
    synthesizeNaturalColumns,
    uiNameToDbKey,
} from './naturalFields';

type BlockRow = Database['public']['Tables']['blocks']['Row'];

export type MetadataColumn = {
    name?: string;
    columnId?: string;
    position?: number;
    width?: number;
};

const buildCanonicalNaturalFieldMap = () => {
    const map = new Map<string, string>();
    for (const uiName of naturalFieldOrder) {
        const dbKey = uiNameToDbKey[uiName] ?? uiName.toLowerCase();
        map.set(uiName.toLowerCase(), dbKey);
        map.set(dbKey.toLowerCase(), dbKey);
    }
    return map;
};

const CANONICAL_NATURAL_FIELD_MAP = buildCanonicalNaturalFieldMap();

const isVirtualColumnId = (columnId?: string | null) =>
    typeof columnId === 'string' && columnId.startsWith('virtual-');

export const getCanonicalNaturalFieldName = (name?: string | null): string | null => {
    if (!name) return null;
    return CANONICAL_NATURAL_FIELD_MAP.get(name.toLowerCase()) ?? null;
};

export const getMetadataColumnsFromBlock = (block: BlockRow): MetadataColumn[] => {
    const content = block?.content as unknown;
    const isObj = typeof content === 'object' && content !== null;
    const cols =
        isObj && Array.isArray((content as { columns?: unknown[] })?.columns)
            ? ((content as { columns?: unknown[] })?.columns as MetadataColumn[])
            : [];
    return cols;
};

export const hasVirtualNativePlaceholders = (
    metadataColumns: MetadataColumn[],
): boolean => {
    return metadataColumns.some(
        (mc) =>
            (mc.columnId || '').startsWith('virtual-') ||
            ['external_id', 'name', 'description', 'status', 'priority'].includes(
                (mc.name || '').toLowerCase(),
            ),
    );
};

export const dedupeNaturalColumns = (columns: Column[]): Column[] => {
    if (!Array.isArray(columns) || columns.length === 0) {
        return [];
    }

    const uniqueById: Column[] = [];
    const seenIds = new Set<string>();
    for (const col of columns) {
        const id = typeof col.id === 'string' ? col.id : undefined;
        if (id) {
            if (seenIds.has(id)) {
                continue;
            }
            seenIds.add(id);
        }
        uniqueById.push(col);
    }

    const result: Column[] = [];
    const seenNatural = new Map<string, { index: number; isVirtual: boolean }>();

    uniqueById.forEach((col) => {
        const rawName =
            (col.property?.name || (col as unknown as { name?: string }).name || '') ??
            '';
        const canonical = getCanonicalNaturalFieldName(
            typeof rawName === 'string' ? rawName : '',
        );
        if (!canonical) {
            result.push(col);
            return;
        }

        const columnId = typeof col.id === 'string' ? col.id : undefined;
        const isVirtual = isVirtualColumnId(columnId);
        const entry = seenNatural.get(canonical);
        if (!entry) {
            seenNatural.set(canonical, { index: result.length, isVirtual });
            result.push(col);
            return;
        }

        if (entry.isVirtual && !isVirtual) {
            result[entry.index] = col;
            seenNatural.set(canonical, { index: entry.index, isVirtual });
        }
        // Otherwise keep the first (non-virtual wins, or first virtual if only placeholders exist)
    });

    return result;
};

export const mergeNaturalColumnsFromPlaceholders = (
    block: BlockRow,
    existingColumns: Column[] | undefined,
    orgProperties: Property[],
) => {
    const metadataColumns = getMetadataColumnsFromBlock(block);
    const shouldMerge = hasVirtualNativePlaceholders(metadataColumns);
    if (!shouldMerge) {
        return { mergedColumns: existingColumns || [], persistColumns: [] as Column[] };
    }

    const synthesized: Column[] = synthesizeNaturalColumns(block.id, orgProperties);
    const blockColumns = existingColumns || [];

    const existingNames = new Set(
        blockColumns.map((c) =>
            (
                (c.property?.name ||
                    (c as unknown as { name?: string }).name ||
                    '') as string
            ).toLowerCase(),
        ),
    );

    const nameToMeta = new Map<string, { position?: number; width?: number }>();
    for (const mc of metadataColumns) {
        const key = (mc.name || '').toLowerCase();
        if (key) nameToMeta.set(key, { position: mc.position, width: mc.width });
    }

    const toAdd: Column[] = [];
    for (const s of synthesized) {
        const sName = (s.property?.name || (s as unknown as { name?: string }).name || '')
            .toString()
            .toLowerCase();
        if (!existingNames.has(sName)) {
            const meta = nameToMeta.get(sName);
            toAdd.push({
                ...s,
                position:
                    typeof meta?.position === 'number' ? meta?.position : s.position,
                width: typeof meta?.width === 'number' ? meta?.width : s.width,
            });
        }
    }

    const mergedColumns = [...blockColumns, ...toAdd].sort(
        (a, b) => (a.position ?? 0) - (b.position ?? 0),
    );
    const dedupedColumns = dedupeNaturalColumns(mergedColumns);

    // Persist the deduped set so metadata replaces virtual entries with real ids.
    const persistColumns = dedupedColumns;
    return { mergedColumns: dedupedColumns, persistColumns };
};

export const buildColumnMetadataPayload = (columns: Column[]) =>
    dedupeNaturalColumns(columns).map((c, idx) => ({
        columnId: c.id,
        position: typeof c.position === 'number' ? c.position : idx,
        width: c.width ?? 200,
        name: (c.property?.name ||
            (c as unknown as { name?: string }).name ||
            '') as string,
    }));

export const dedupeColumnMetadataEntries = <T extends MetadataColumn>(
    metadata: T[],
): T[] => {
    if (!Array.isArray(metadata) || metadata.length === 0) {
        return [];
    }

    const result: T[] = [];
    const seenIds = new Set<string>();
    const seenNatural = new Map<string, { index: number; isVirtual: boolean }>();

    metadata.forEach((entry) => {
        const columnId = entry.columnId ?? '';
        if (columnId && seenIds.has(columnId)) {
            return;
        }
        if (columnId) {
            seenIds.add(columnId);
        }

        const canonical = getCanonicalNaturalFieldName(entry.name);
        if (!canonical) {
            result.push(entry);
            return;
        }

        const isVirtual = isVirtualColumnId(columnId);
        const existing = seenNatural.get(canonical);
        if (!existing) {
            seenNatural.set(canonical, { index: result.length, isVirtual });
            result.push(entry);
            return;
        }

        if (existing.isVirtual && !isVirtual) {
            result[existing.index] = entry;
            seenNatural.set(canonical, { index: existing.index, isVirtual });
        }
        // Otherwise keep the first entry
    });

    return result;
};
