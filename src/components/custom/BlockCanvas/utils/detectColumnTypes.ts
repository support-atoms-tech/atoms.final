'use client';

import { EditableColumnType } from '@/components/custom/BlockCanvas/components/EditableTable/types';

export type DetectedColumn = {
    name: string;
    type: EditableColumnType;
    options?: string[];
};

type DetectOptions = {
    sampleSize?: number;
    multiValueSeparators?: string[];
    maxSelectCardinality?: number;
};

const DEFAULT_DETECT_OPTIONS: DetectOptions = {
    sampleSize: 200,
    multiValueSeparators: [',', ';', '|'],
    maxSelectCardinality: 50,
};

export function autoDetectColumns(
    headers: string[],
    rows: Array<Array<unknown>>,
    opts?: Partial<DetectOptions>,
): DetectedColumn[] {
    const options = { ...DEFAULT_DETECT_OPTIONS, ...(opts || {}) };
    const samples = sampleRows(rows, options.sampleSize || 200);

    return headers.map((name, colIdx) => {
        const values = samples
            .map((r) => r[colIdx])
            .filter((v) => v != null) as unknown[];
        const type = inferColumnType(values, options);
        const out: DetectedColumn = { name, type };
        if (type === 'select' || type === 'multi_select') {
            out.options = detectOptions(values, type, options);
        }
        return out;
    });
}

function sampleRows(
    rows: Array<Array<unknown>>,
    sampleSize: number,
): Array<Array<unknown>> {
    if (!rows || rows.length === 0) return [];
    if (rows.length <= sampleSize) return rows;
    const step = Math.max(1, Math.floor(rows.length / sampleSize));
    const sampled: Array<Array<unknown>> = [];
    for (let i = 0; i < rows.length && sampled.length < sampleSize; i += step) {
        sampled.push(rows[i] || []);
    }
    return sampled;
}

function inferColumnType(values: unknown[], options: DetectOptions): EditableColumnType {
    const strings = values
        .map((v) => toStringSafe(v))
        .filter((s) => s !== '')
        .slice(0, options.sampleSize || 200);

    if (strings.length === 0) return 'text';

    const numericRatio = ratio(strings, isNumeric);
    const dateRatio = ratio(strings, isDateLike);
    const hasMultiSeparators = ratio(strings, (s) =>
        containsAnySeparator(s, options.multiValueSeparators || []),
    );

    if (numericRatio >= 0.85) return 'number';
    if (dateRatio >= 0.7) return 'date';

    // Detect multi-select if many cells contain separators and token diversity is reasonable
    if (hasMultiSeparators >= 0.4) {
        const tokens = tokenized(strings, options.multiValueSeparators || []);
        const uniqueTokens = new Set(tokens.map((t) => t.toLowerCase()));
        if (
            uniqueTokens.size > 1 &&
            uniqueTokens.size <= (options.maxSelectCardinality || 50)
        ) {
            return 'multi_select';
        }
    }

    // Detect single select if cardinality is low and values are short
    const uniq = new Set(strings.map((s) => s.toLowerCase()));
    const avgLen =
        strings.reduce((sum, s) => sum + s.length, 0) / Math.max(strings.length, 1);
    if (
        uniq.size > 1 &&
        uniq.size <= (options.maxSelectCardinality || 50) &&
        avgLen <= 50
    ) {
        return 'select';
    }

    return 'text';
}

function detectOptions(
    values: string[] | unknown[],
    type: EditableColumnType,
    options: DetectOptions,
): string[] {
    const strings = (values as string[])
        .map((v) => toStringSafe(v))
        .filter((s) => s !== '');

    if (type === 'multi_select') {
        const tokens = tokenized(strings, options.multiValueSeparators || []);
        return topUnique(tokens, options.maxSelectCardinality || 50);
    }
    // select
    return topUnique(strings, options.maxSelectCardinality || 50);
}

function toStringSafe(v: unknown): string {
    if (v == null) return '';
    if (v instanceof Date && !isNaN(v.getTime())) return v.toISOString();
    const s = String(v).trim();
    return s;
}

function ratio(arr: string[], predicate: (s: string) => boolean): number {
    if (!arr.length) return 0;
    let count = 0;
    for (const s of arr) if (predicate(s)) count++;
    return count / arr.length;
}

function isNumeric(s: string): boolean {
    if (s === '') return false;
    // Allow integers and decimals, optional leading +/-
    const num = Number(s.replace(/,/g, ''));
    return !isNaN(num) && isFinite(num);
}

// Very lightweight date inference for common formats
function isDateLike(s: string): boolean {
    if (s.length < 6 || s.length > 40) return false;
    // ISO-like
    if (/^\d{4}-\d{1,2}-\d{1,2}([ T]\d{1,2}:\d{2}(:\d{2})?)?/.test(s)) return true;
    // US mm/dd/yyyy or dd/mm/yyyy
    if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/.test(s)) return true;
    // Month day, year
    if (/^[A-Za-z]{3,9}\s+\d{1,2},\s*\d{4}$/.test(s)) return true;
    const parsed = Date.parse(s);
    return !isNaN(parsed);
}

function containsAnySeparator(s: string, seps: string[]): boolean {
    return seps.some((sep) => s.includes(sep));
}

function tokenized(strings: string[], seps: string[]): string[] {
    const pattern = new RegExp(`[${escapeForCharClass(seps.join(''))}]`, 'g');
    const tokens: string[] = [];
    for (const s of strings) {
        for (const t of s.split(pattern)) {
            const v = t.trim();
            if (v) tokens.push(v);
        }
    }
    return tokens;
}

function escapeForCharClass(s: string): string {
    // Escape regex special chars used in char classes
    return s.replace(/[-\\^$*+?.()|[\]{}]/g, '\\$&');
}

function topUnique(values: string[], cap: number): string[] {
    const freq = new Map<string, number>();
    for (const v of values) {
        const key = v.trim();
        if (!key) continue;
        freq.set(key, (freq.get(key) ?? 0) + 1);
    }
    return [...freq.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, cap)
        .map((e) => e[0]);
}

export function transformCellValueByType(
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
            // Store ISO string; renderer/editor can parse
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
