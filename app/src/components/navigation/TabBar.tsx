import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMemo } from 'react';
import { useChats } from '@/hooks/useChat';
import AppText from '@/components/ui/AppText';
import { BlurView } from 'expo-blur';

export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
    const insets = useSafeAreaInsets();
    const { data: chats } = useChats();

    const totalUnreadCount = useMemo(() => {
        if (!chats) return 0;
        const chatList = Array.isArray(chats) ? chats : [];
        return chatList.reduce((acc: number, chat: any) => acc + (chat.unread_count || 0), 0);
    }, [chats]);

    const routeOrder = ['home', 'alerts', 'add', 'chat', 'profile'];

    const brandPrimary = '#FF4F18'; // OneFood Orange
    const brandSecondary = '#2D2D2D'; // Charcoal
    const grayColor = '#94a3b8';

    const labels: Record<string, string> = {
        home: 'Home',
        alerts: 'Alerts',
        add: 'Post',
        chat: 'Chats',
        profile: 'Profile'
    };

    return (
        <View
            style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: 70 + (insets.bottom > 0 ? insets.bottom : 12),
                paddingBottom: insets.bottom,
                borderTopLeftRadius: 32,
                borderTopRightRadius: 32,
                backgroundColor: '#ffffff',
                borderWidth: 1,
                borderColor: '#e2e8f0',
                borderBottomWidth: 0,
                overflow: 'hidden',
                elevation: 0,
            }}
        >
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10 }}>
                {state.routes.map((route, index) => {
                    const { options } = descriptors[route.key];
                    if (!routeOrder.includes(route.name)) return null;

                    const isFocused = state.index === index;

                    const onPress = () => {
                        const event = navigation.emit({
                            type: 'tabPress',
                            target: route.key,
                            canPreventDefault: true,
                        });

                        if (!isFocused && !event.defaultPrevented) {
                            navigation.navigate(route.name, route.params);
                        }
                    };

                    const onLongPress = () => {
                        navigation.emit({
                            type: 'tabLongPress',
                            target: route.key,
                        });
                    };

                    let iconName: any = 'home';
                    if (route.name === 'home') iconName = isFocused ? 'home' : 'home-outline';
                    else if (route.name === 'alerts') iconName = isFocused ? 'notifications' : 'notifications-outline';
                    else if (route.name === 'add') iconName = 'add';
                    else if (route.name === 'chat') iconName = isFocused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline';
                    else if (route.name === 'profile') iconName = isFocused ? 'person' : 'person-outline';

                    if (route.name === 'add') {
                        return (
                            <View key={route.key} style={{ alignItems: 'center', justifyContent: 'center', width: '20%' }}>
                                <TouchableOpacity
                                    onPress={onPress}
                                    onLongPress={onLongPress}
                                    style={{
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        width: 52,
                                        height: 52,
                                        borderRadius: 26,
                                        backgroundColor: brandPrimary,
                                        elevation: 0,
                                    }}
                                >
                                    <Ionicons name="add" size={28} color="white" />
                                </TouchableOpacity>
                                <AppText
                                    variant="label"
                                    weight="medium"
                                    style={{
                                        fontSize: 10,
                                        color: isFocused ? brandPrimary : grayColor,
                                        marginTop: 2,
                                    }}
                                >
                                    {labels[route.name]}
                                </AppText>
                            </View>
                        );
                    }

                    return (
                        <TouchableOpacity
                            key={route.key}
                            accessibilityRole="button"
                            accessibilityState={isFocused ? { selected: true } : {}}
                            onPress={onPress}
                            onLongPress={onLongPress}
                            style={{
                                flex: 1,
                                alignItems: 'center',
                                justifyContent: 'center',
                                height: '100%',
                                paddingTop: 4
                            }}
                        >
                            <View
                                style={{
                                    width: 38, // Adjusted
                                    height: 38, // Adjusted
                                    borderRadius: 19,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: isFocused ? 'rgba(255, 79, 24, 0.1)' : 'transparent',
                                    borderWidth: isFocused ? 1 : 0,
                                    borderColor: isFocused ? 'rgba(255, 79, 24, 0.2)' : 'transparent',
                                    position: 'relative',
                                }}
                            >
                                <Ionicons
                                    name={iconName}
                                    size={22} // Slightly smaller
                                    color={isFocused ? brandPrimary : grayColor}
                                />
                                {route.name === 'chat' && totalUnreadCount > 0 && (
                                    <View style={styles.badge}>
                                        <AppText
                                            variant="label"
                                            style={styles.badgeText}
                                        >
                                            {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                                        </AppText>
                                    </View>
                                )}
                            </View>
                            <AppText
                                variant="label"
                                weight={isFocused ? 'bold' : 'medium'}
                                numberOfLines={1}
                                style={{
                                    fontSize: 10,
                                    color: isFocused ? brandPrimary : grayColor,
                                    marginTop: 2,
                                    flexShrink: 0,
                                }}
                            >
                                {labels[route.name]}
                            </AppText>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    badge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: '#FF4F18',
        borderRadius: 12,
        minWidth: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'white',
        paddingHorizontal: 4,
        zIndex: 10,
    },
    badgeText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '900',
        textAlign: 'center',
        textAlignVertical: 'center',
        lineHeight: 16,
    }
});
