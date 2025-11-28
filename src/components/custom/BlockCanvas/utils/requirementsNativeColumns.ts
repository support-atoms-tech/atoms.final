import { naturalFieldOrder, uiNameToDbKey } from './naturalFields';

export type MetadataColumn = {
    name?: string;
    columnId?: string;
    position?: number;
    width?: number;
};

const isVirtualColumnId = (columnId?: string | null): boolean => {
    if (!columnId) return false;
    return columnId.startsWith('virtual-');
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

export const getCanonicalNaturalFieldName = (name?: string | null): string | null => {
    if (!name) return null;
    return CANONICAL_NATURAL_FIELD_MAP.get(name.toLowerCase()) ?? null;
};

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

        const existing = seenNatural.get(canonical);
        if (!existing) {
            seenNatural.set(canonical, { index: result.length, isVirtual: false });
            result.push(entry);
            return;
        }

        // Keep the first entry encountered for a natural field; later ones are ignored
    });

    return result;
};

interface ColumnLike {
    id?: string;
    header?: string;
    name?: string;
}

export const dedupeNaturalColumns = <T extends ColumnLike>(columns: T[]): T[] => {
    if (!Array.isArray(columns) || columns.length === 0) {
        return [];
    }

    const result: T[] = [];
    const seenCanonical = new Map<string, { index: number; isVirtual: boolean }>();

    columns.forEach((column) => {
        const canonical = getCanonicalNaturalFieldName(column.header ?? column.name);
        if (!canonical) {
            result.push(column);
            return;
        }

        const existing = seenCanonical.get(canonical);
        const isVirtual = isVirtualColumnId(column.id);

        if (!existing) {
            seenCanonical.set(canonical, { index: result.length, isVirtual });
            result.push(column);
            return;
        }

        // Prefer non-virtual columns over virtual placeholders
        if (existing.isVirtual && !isVirtual) {
            result[existing.index] = column;
            seenCanonical.set(canonical, { index: existing.index, isVirtual: false });
        }
        // Otherwise ignore duplicates and keep the first entry encountered
    });

    return result;
};
