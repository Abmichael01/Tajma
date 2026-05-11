import { View, TouchableOpacity, Platform, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import AppText from "@/components/ui/AppText";
import { StatusBar } from "expo-status-bar";
import * as Haptics from "expo-haptics";

interface ScreenHeaderProps {
    title: string;
    subtitle?: string;
    onBackPress?: () => void;
    rightElement?: React.ReactNode;
    children?: React.ReactNode;
    variant?: 'primary' | 'white';
    showBackButton?: boolean;
}

export default function ScreenHeader({
    title,
    subtitle,
    onBackPress,
    rightElement,
    children,
    variant = 'primary',
    showBackButton = true
}: ScreenHeaderProps) {
    const router = useRouter();

    const bgColor = variant === 'primary' ? 'bg-primary' : 'bg-white';
    const textColor = variant === 'primary' ? 'text-white' : 'text-slate-900';
    const subtitleColor = variant === 'primary' ? 'text-white/70' : 'text-slate-400';
    const iconColor = variant === 'primary' ? '#FFFFFF' : '#1e293b';
    const backBtnBg = variant === 'primary' ? 'bg-white/10' : 'bg-slate-100';
    const backBtnBorder = variant === 'primary' ? 'border-white/20' : 'border-slate-200';

    const handleBack = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (onBackPress) {
            onBackPress();
        } else {
            router.back();
        }
    };

    const HeaderContent = () => (
        <View className="px-6 py-5">
            <View className="flex-row items-center">
                {showBackButton && (
                    <TouchableOpacity
                        onPress={handleBack}
                        className={`w-10 h-10 ${backBtnBg} border ${backBtnBorder} rounded-full items-center justify-center mr-4`}
                    >
                        <Ionicons name="chevron-back" size={24} color={iconColor} />
                    </TouchableOpacity>
                )}

                <View className="flex-1">
                    <AppText weight="semibold" className={`${textColor} text-2xl tracking-tight`} numberOfLines={1}>
                        {title}
                    </AppText>
                    {subtitle && (
                        <AppText className={`${subtitleColor} text-[13px] mt-1 font-medium`} numberOfLines={1}>
                            {subtitle}
                        </AppText>
                    )}
                </View>

                {rightElement && (
                    <View className="ml-4">
                        {rightElement}
                    </View>
                )}
            </View>
            {children && (
                <View className="mt-5">
                    {children}
                </View>
            )}
        </View>
    );

    if (variant === 'primary') {
        return (
            <View style={styles.shadow}>
                <StatusBar style="light" />
                <LinearGradient
                    colors={["#FF4F18", "#E63E0B"]}
                    style={{ width: '100%' }}
                >
                    <SafeAreaView edges={['top']}>
                        <HeaderContent />
                    </SafeAreaView>
                </LinearGradient>
            </View>
        );
    }

    return (
        <View className="bg-white border-b border-slate-50 z-50">
            <StatusBar style="dark" />
            <SafeAreaView edges={['top']}>
                <HeaderContent />
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    shadow: {
        zIndex: 50,
        ...Platform.select({
            ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
            },
            android: {
                elevation: 6,
            },
        }),
    }
});
