import { Linking } from 'react-native';

/**
 * Regex to detect URLs.
 * Matches starting with http/https, or standard domains like google.com
 * This is a simplified regex for common cases.
 */
const URL_REGEX = /((?:https?:\/\/)?(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&//=]*))/gi;

/**
 * Extracts URLs from a text string.
 */
export const extractUrls = (text: string): string[] => {
    return text.match(URL_REGEX) || [];
};

/**
 * Normalizes a URL by adding https:// if missing.
 */
export const normalizeUrl = (url: string): string => {
    if (!url) return '';
    const trimmed = url.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        return trimmed;
    }
    return `https://${trimmed}`;
};

/**
 * Opens a URL in the browser, ensuring it has a scheme.
 */
export const openLink = async (url: string) => {
    const normalized = normalizeUrl(url);
    try {
        const supported = await Linking.canOpenURL(normalized);
        if (supported) {
            await Linking.openURL(normalized);
        } else {
            console.warn(`Don't know how to open this URL: ${normalized}`);
        }
    } catch (error) {
        console.error('An error occurred opening the link:', error);
    }
};
