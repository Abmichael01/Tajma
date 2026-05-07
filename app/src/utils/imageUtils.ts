import * as FileSystem from 'expo-file-system/legacy';

import { API_BASE_URL } from '@/api/apiClient';

/**
 * Converts a local image URI to a Base64 string
 * @param uri The local URI of the image
 * @returns A promise that resolves to a Base64 string with the proper data URI header
 */
export const uriToBase64 = async (uri: string): Promise<string> => {
    try {
        const base64 = await FileSystem.readAsStringAsync(uri, {
            encoding: 'base64',
        });

        // Determine the extension to add the correct header
        const extension = uri.split('.').pop()?.toLowerCase() || 'jpg';
        const mimeType = extension === 'png' ? 'image/png' : 'image/jpeg';

        return `data:${mimeType};base64,${base64}`;
    } catch (error) {
        console.error('Error converting URI to Base64:', error);
        throw error;
    }
};

/**
 * Resolves any image path/URL into a fully qualified URL ready for display.
 *
 * The backend serializers (via `build_full_image_url`) always return absolute URLs
 * using the request host. This function is a safety net for cases where a
 * relative path may slip through.
 *
 * Rules:
 *  1. If already an absolute http/https URL → return as-is
 *  2. If starts with /media/  → prepend API_BASE_URL/api
 *  3. If starts with /        → prepend API_BASE_URL/api/media
 *  4. Otherwise (bare path)   → prepend API_BASE_URL/api/media
 */
export const resolveImageUrl = (path: string | null | undefined): string | null => {
    if (!path) return null;

    // Already a full URL - return as-is (covers the normal backend case)
    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }

    const base = API_BASE_URL.replace(/\/$/, '');

    // If starts with /, just prepend the base (this handles /media/ and other absolute root paths)
    if (path.startsWith('/')) {
        return `${base}${path}`;
    }

    // Otherwise, assume it's a bare relative path needing /api/media/ prefix
    return `${base}/api/media/${path}`;
};
