/**
 * ogRenderer.ts
 * Generates Open Graph and Twitter Card meta tag HTML strings
 * for server-side injection into the SPA shell.
 */

export interface OgData {
    title: string;
    description: string;
    imageUrl: string;
    imageAlt: string;
    pageUrl: string;
    siteName?: string;
    type?: string;
}

function escapeHtml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

/**
 * Trims a description to a max character length, breaking at a word boundary.
 */
export function trimDescription(text: string, maxLength = 200): string {
    const cleaned = text.replace(/\s+/g, ' ').trim();
    if (cleaned.length <= maxLength) return cleaned;
    const truncated = cleaned.slice(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    return (lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated) + '…';
}

/**
 * Builds the full set of OG + Twitter Card + description meta tags as an HTML string.
 */
export function renderOgTags(data: OgData): string {
    const title = escapeHtml(data.title);
    const description = escapeHtml(trimDescription(data.description));
    const image = escapeHtml(data.imageUrl);
    const imageAlt = escapeHtml(data.imageAlt || data.title);
    const url = escapeHtml(data.pageUrl);
    const siteName = escapeHtml(data.siteName || 'Tiny Ark');
    const type = escapeHtml(data.type || 'article');

    return [
        // Standard meta
        `<meta name="description" content="${description}" />`,
        // Open Graph
        `<meta property="og:title" content="${title}" />`,
        `<meta property="og:description" content="${description}" />`,
        `<meta property="og:image" content="${image}" />`,
        `<meta property="og:image:alt" content="${imageAlt}" />`,
        `<meta property="og:url" content="${url}" />`,
        `<meta property="og:type" content="${type}" />`,
        `<meta property="og:site_name" content="${siteName}" />`,
        // Twitter Card
        `<meta name="twitter:card" content="summary_large_image" />`,
        `<meta name="twitter:title" content="${title}" />`,
        `<meta name="twitter:description" content="${description}" />`,
        `<meta name="twitter:image" content="${image}" />`,
    ].join('\n  ');
}
