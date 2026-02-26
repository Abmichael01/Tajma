import * as FileSystem from 'expo-file-system/legacy';

/**
 * Converts a local image URI to a Base64 string
 * @param uri The local URI of the image
 * @returns A promise that resolves to a Base64 string with the proper data URI header
 */
export const uriToBase64 = async (uri: string): Promise<string> => {
    try {
        const base64 = await FileSystem.readAsStringAsync(uri, {
            encoding: FileSystem.EncodingType.Base64,
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
 * Resolves an image path to a full URL.
 * Handles:
 * - Full URLs (http/https)
 * - Backend media paths (/media/...)
 * - Frontend static assets (/...)
 * @param path The image path or URL
 * @returns The full URL or null
 */
export const resolveImageUrl = (path: string | null | undefined): string | null => {
    if (!path) return null;

    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }

    const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';
    // We assume the frontend dev server is on port 3014 as per USER metadata
    const frontendUrl = 'http://localhost:3014';

    // Handle backend media
    if (path.startsWith('/media/')) {
        return `${apiUrl}/api/media/${path.replace('/media/', '')}`;
    }

    // Handle common static assets we know are in the frontend public folder
    const staticAssets = [
        'car', 'cloth', 'cream', 'perf', 'plumbing', 'shoe', 'banner',
        'logo', 'icon', 'electronics', 'fashion', 'property', 'services', 'vehicles'
    ];

    if (path.startsWith('/') && staticAssets.some(asset => path.toLowerCase().includes(asset))) {
        return `${frontendUrl}${path}`;
    }

    // Default to backend media for other relative paths
    return `${apiUrl}/api/media/${path.replace(/^\//, '')}`;
};
