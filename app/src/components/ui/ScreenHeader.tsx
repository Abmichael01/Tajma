import { View, TouchableOpacity, ScrollView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import AppText from "@/components/ui/AppText";
import { StatusBar } from "expo-status-bar";

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
    const textColor = variant === 'primary' ? 'text-white' : 'text-gray-900';
    const subtitleColor = variant === 'primary' ? 'text-white/70' : 'text-gray-500';
    const iconColor = variant === 'primary' ? '#FFFFFF' : '#0f172b';
    const backBtnBg = variant === 'primary' ? 'bg-white/10' : 'bg-gray-100';

    const handleBack = () => {
        if (onBackPress) {
            onBackPress();
        } else {
            router.back();
        }
    };

    return (
        <View className={`${bgColor} shadow-sm z-50`}>
            <StatusBar style={variant === 'primary' ? "light" : "dark"} />
            <SafeAreaView edges={['top']}>
                <View className="px-6 py-4">
                    <View className="flex-row items-center">
                        {showBackButton && (
                            <TouchableOpacity
                                onPress={handleBack}
                                className={`w-10 h-10 ${backBtnBg} rounded-full items-center justify-center mr-4`}
                            >
                                <Ionicons name="arrow-back" size={22} color={iconColor} />
                            </TouchableOpacity>
                        )}

                        <View className="flex-1">
                            <AppText weight="bold" className={`${textColor} text-3xl`} numberOfLines={1}>
                                {title}
                            </AppText>
                            {subtitle && (
                                <AppText className={`${subtitleColor} text-xs mt-0.5`} numberOfLines={1}>
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
                        <View className="mt-4">
                            {children}
                        </View>
                    )}
                </View>
            </SafeAreaView>
        </View>
    );
}
