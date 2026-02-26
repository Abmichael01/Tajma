import React, { useEffect } from 'react';
import { View, Dimensions, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withDelay,
    withSpring,
    Easing,
    runOnJS,
} from 'react-native-reanimated';
import AppText from './AppText';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
    onAnimationComplete: () => void;
}

export default function AppSplashScreen({ onAnimationComplete }: SplashScreenProps) {
    // Glow pulse
    const glowScale = useSharedValue(0.6);
    const glowOpacity = useSharedValue(0);

    // Logo
    const logoScale = useSharedValue(0.4);
    const logoOpacity = useSharedValue(0);
    const logoY = useSharedValue(30);

    // Brand name
    const nameOpacity = useSharedValue(0);
    const nameY = useSharedValue(16);

    // Tagline
    const taglineOpacity = useSharedValue(0);
    const taglineY = useSharedValue(10);

    // Exit shroud
    const shroudOpacity = useSharedValue(0);

    useEffect(() => {
        // ── Phase 1: Glow expands ─────────────────────────────────────────
        glowOpacity.value = withTiming(0.35, { duration: 700 });
        glowScale.value = withTiming(1, { duration: 900, easing: Easing.out(Easing.quad) });

        // ── Phase 2: Logo springs in ──────────────────────────────────────
        logoOpacity.value = withDelay(200, withTiming(1, { duration: 500 }));
        logoScale.value = withDelay(200, withSpring(1, { damping: 14, stiffness: 160 }));
        logoY.value = withDelay(200, withTiming(0, { duration: 500, easing: Easing.out(Easing.quad) }));

        // ── Phase 3: Brand name slides up ─────────────────────────────────
        nameOpacity.value = withDelay(650, withTiming(1, { duration: 450 }));
        nameY.value = withDelay(650, withTiming(0, { duration: 450, easing: Easing.out(Easing.quad) }));

        // ── Phase 4: Tagline fades in ─────────────────────────────────────
        taglineOpacity.value = withDelay(950, withTiming(1, { duration: 400 }));
        taglineY.value = withDelay(950, withTiming(0, { duration: 400, easing: Easing.out(Easing.quad) }));

        // ── Phase 5: Exit ─────────────────────────────────────────────────
        const exitTimer = setTimeout(() => {
            shroudOpacity.value = withTiming(1, { duration: 450 }, (finished) => {
                if (finished) runOnJS(onAnimationComplete)();
            });
        }, 2400);

        return () => clearTimeout(exitTimer);
    }, []);

    const glowStyle = useAnimatedStyle(() => ({
        opacity: glowOpacity.value,
        transform: [{ scale: glowScale.value }],
    }));

    const logoContainerStyle = useAnimatedStyle(() => ({
        opacity: logoOpacity.value,
        transform: [{ scale: logoScale.value }, { translateY: logoY.value }],
    }));

    const nameStyle = useAnimatedStyle(() => ({
        opacity: nameOpacity.value,
        transform: [{ translateY: nameY.value }],
    }));

    const taglineStyle = useAnimatedStyle(() => ({
        opacity: taglineOpacity.value,
        transform: [{ translateY: taglineY.value }],
    }));

    const shroudStyle = useAnimatedStyle(() => ({
        opacity: shroudOpacity.value,
    }));

    return (
        <View style={styles.root}>
            {/* Dark Background */}
            <View style={StyleSheet.absoluteFill} className="bg-[#111111]" />

            {/* Radial orange glow */}
            <Animated.View style={[styles.glow, glowStyle]} />

            {/* Content */}
            <View style={styles.center}>
                {/* Logo Card */}
                <Animated.View style={logoContainerStyle}>
                    <View style={styles.logoCard}>
                        <Image
                            source={require('../../assets/images/logo.jpg')}
                            style={styles.logoImage}
                            contentFit="contain"
                            transition={100}
                        />
                    </View>
                </Animated.View>

                {/* Brand name */}
                <Animated.View style={[styles.nameRow, nameStyle]}>
                    <AppText
                        weight="bold"
                        style={styles.brandName}
                    >
                        TAJMA
                    </AppText>
                </Animated.View>

                {/* Tagline */}
                <Animated.View style={taglineStyle}>
                    <AppText style={styles.tagline}>
                        Le marché de tous
                    </AppText>
                </Animated.View>
            </View>

            {/* Bottom watermark */}
            <View style={styles.footer}>
                <AppText style={styles.footerText}>tajma.com</AppText>
            </View>

            {/* Exit shroud */}
            <Animated.View style={[StyleSheet.absoluteFill, styles.shroud, shroudStyle]} />
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: '#111111',
    },
    glow: {
        position: 'absolute',
        width: width * 1.6,
        height: width * 1.6,
        borderRadius: width * 0.8,
        top: height * 0.5 - width * 0.8,
        left: width * 0.5 - width * 0.8,
        backgroundColor: '#FF4F18',
        // soften it
        opacity: 0,
    },
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoCard: {
        width: 140,
        height: 140,
        borderRadius: 36,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#FF4F18',
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.5,
        shadowRadius: 32,
        elevation: 20,
        marginBottom: 28,
    },
    logoImage: {
        width: 100,
        height: 100,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    brandName: {
        color: '#FFFFFF',
        fontSize: 40,
        letterSpacing: 12,
        fontFamily: 'Poppins-Bold',
    },
    tagline: {
        color: 'rgba(255,255,255,0.45)',
        fontSize: 14,
        letterSpacing: 2,
        fontFamily: 'Poppins-Medium',
        textTransform: 'uppercase' as const,
    },
    footer: {
        paddingBottom: 40,
        alignItems: 'center',
    },
    footerText: {
        color: 'rgba(255,255,255,0.2)',
        fontSize: 12,
        letterSpacing: 1.5,
    },
    shroud: {
        backgroundColor: '#111111',
    },
});
