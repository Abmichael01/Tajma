import React from 'react';
import { View, TouchableOpacity, Linking, Platform, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import AppText from '../ui/AppText';
import { Ionicons } from '@expo/vector-icons';

interface LinkPreviewProps {
    url: string;
    title?: string;
    description?: string;
    image?: string;
    isMe?: boolean;
}

export default function LinkPreview({ url, title, description, image, isMe }: LinkPreviewProps) {
    const [aspectRatio, setAspectRatio] = React.useState<number | null>(null);

    // ── LINK FIX ─────────────────────────────────────────────────────────────
    // openLink util may silently fail if URL has no scheme.
    // We handle it directly here and ensure https:// is always present.
    const handlePress = async () => {
        try {
            let finalUrl = url.trim();
            if (!/^https?:\/\//i.test(finalUrl)) {
                finalUrl = `https://${finalUrl}`;
            }
            const supported = await Linking.canOpenURL(finalUrl);
            if (supported) {
                await Linking.openURL(finalUrl);
            } else {
                // Fallback: try opening anyway (some devices report false for canOpenURL)
                await Linking.openURL(finalUrl);
            }
        } catch (e) {
            console.warn('LinkPreview: could not open URL', url, e);
        }
    };

    if (!title && !description) return null;

    const domain = (() => {
        try {
            const u = url.replace(/^https?:\/\//i, '').split('/')[0];
            return u;
        } catch {
            return url;
        }
    })();

    return (
        <TouchableOpacity
            onPress={handlePress}
            activeOpacity={0.85}
            style={[
                styles.container,
                isMe ? styles.containerMe : styles.containerOther
            ]}
        >
            {image ? (
                <Image
                    source={{ uri: image }}
                    style={[styles.previewImage, { aspectRatio: aspectRatio || 16 / 9 }]}
                    contentFit="cover"
                    transition={200}
                    onLoad={(e) => {
                        const { width, height } = e.source;
                        if (width && height) setAspectRatio(width / height);
                    }}
                />
            ) : null}

            <View style={styles.textBlock}>
                {/* Domain row */}
                <View style={styles.domainRow}>
                    <Ionicons
                        name="globe-outline"
                        size={11}
                        color={isMe ? 'rgba(255,255,255,0.5)' : '#9CA3AF'}
                    />
                    <AppText
                        style={[styles.domain, { color: isMe ? 'rgba(255,255,255,0.5)' : '#9CA3AF' }]}
                        numberOfLines={1}
                    >
                        {domain}
                    </AppText>
                </View>

                {title ? (
                    <AppText
                        weight="bold"
                        style={[styles.title, { color: isMe ? '#FFFFFF' : '#111827' }]}
                        numberOfLines={2}
                    >
                        {title}
                    </AppText>
                ) : null}

                {description ? (
                    <AppText
                        style={[styles.description, { color: isMe ? 'rgba(255,255,255,0.65)' : '#6B7280' }]}
                        numberOfLines={2}
                    >
                        {description}
                    </AppText>
                ) : null}
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        marginTop: 4,
        borderRadius: 12,
        overflow: 'hidden',
        minWidth: 200,
        maxWidth: 300,
        borderWidth: 1,
    },
    containerMe: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderColor: 'rgba(255,255,255,0.2)',
    },
    containerOther: {
        backgroundColor: '#F9FAFB',
        borderColor: '#E5E7EB',
    },
    previewImage: {
        width: '100%',
    },
    textBlock: {
        padding: 10,
        gap: 3,
    },
    domainRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 3,
    },
    domain: {
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: 0.4,
        flex: 1,
    },
    title: {
        fontSize: 13,
        lineHeight: 18,
    },
    description: {
        fontSize: 12,
        lineHeight: 17,
        marginTop: 2,
    },
});