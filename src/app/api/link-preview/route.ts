import { NextRequest, NextResponse } from 'next/server';

// Extract meta tag content from HTML
function extractMeta(html: string, property: string): string | null {
    // Try og: property first
    const ogMatch = html.match(
        new RegExp(
            `<meta[^>]*property=["']og:${property}["'][^>]*content=["']([^"']+)["']`,
            'i',
        ),
    );
    if (ogMatch) return ogMatch[1];

    // Try content first pattern
    const contentFirstMatch = html.match(
        new RegExp(
            `<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:${property}["']`,
            'i',
        ),
    );
    if (contentFirstMatch) return contentFirstMatch[1];

    // Try name attribute for description
    if (property === 'description') {
        const nameMatch = html.match(
            /<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i,
        );
        if (nameMatch) return nameMatch[1];

        const nameMatch2 = html.match(
            /<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i,
        );
        if (nameMatch2) return nameMatch2[1];
    }

    return null;
}

// Extract title tag content
function extractTitle(html: string): string | null {
    const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    return match ? match[1].trim() : null;
}

// Extract favicon URL
function extractFavicon(html: string, baseUrl: string): string | null {
    // Try link rel="icon" first
    const iconMatch = html.match(
        /<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']+)["']/i,
    );
    if (iconMatch) {
        const href = iconMatch[1];
        if (href.startsWith('http')) return href;
        if (href.startsWith('//')) return 'https:' + href;
        if (href.startsWith('/')) {
            try {
                const url = new URL(baseUrl);
                return `${url.protocol}//${url.host}${href}`;
            } catch {
                return null;
            }
        }
    }

    // Fallback to /favicon.ico
    try {
        const url = new URL(baseUrl);
        return `${url.protocol}//${url.host}/favicon.ico`;
    } catch {
        return null;
    }
}

export interface LinkPreviewData {
    title: string | null;
    description: string | null;
    image: string | null;
    siteName: string | null;
    favicon: string | null;
    url: string;
}

export async function GET(request: NextRequest) {
    const url = request.nextUrl.searchParams.get('url');

    if (!url) {
        return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
    }

    // Validate URL
    try {
        new URL(url);
    } catch {
        return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

        const response = await fetch(url, {
            headers: {
                'User-Agent':
                    'Mozilla/5.0 (compatible; AtomsLinkPreview/1.0; +https://atoms.tech)',
                Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
            },
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            return NextResponse.json(
                { error: `Failed to fetch URL: ${response.status}` },
                { status: 502 },
            );
        }

        const contentType = response.headers.get('content-type') || '';
        if (
            !contentType.includes('text/html') &&
            !contentType.includes('application/xhtml')
        ) {
            // Not HTML, return basic info
            return NextResponse.json({
                title: null,
                description: null,
                image: null,
                siteName: null,
                favicon: extractFavicon('', url),
                url,
            } satisfies LinkPreviewData);
        }

        const html = await response.text();

        const metadata: LinkPreviewData = {
            title: extractMeta(html, 'title') || extractTitle(html),
            description: extractMeta(html, 'description'),
            image: extractMeta(html, 'image'),
            siteName: extractMeta(html, 'site_name'),
            favicon: extractFavicon(html, url),
            url,
        };

        // Resolve relative image URLs
        if (metadata.image && !metadata.image.startsWith('http')) {
            try {
                const baseUrl = new URL(url);
                if (metadata.image.startsWith('//')) {
                    metadata.image = baseUrl.protocol + metadata.image;
                } else if (metadata.image.startsWith('/')) {
                    metadata.image = `${baseUrl.protocol}//${baseUrl.host}${metadata.image}`;
                } else {
                    metadata.image = `${baseUrl.protocol}//${baseUrl.host}/${metadata.image}`;
                }
            } catch {
                metadata.image = null;
            }
        }

        return NextResponse.json(metadata);
    } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
            return NextResponse.json({ error: 'Request timeout' }, { status: 504 });
        }

        console.error('[link-preview] Error fetching URL:', error);
        return NextResponse.json({ error: 'Failed to fetch URL' }, { status: 502 });
    }
}
