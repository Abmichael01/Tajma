import React, { useState } from 'react';
import { View, TouchableOpacity, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AppText from '@/components/ui/AppText';
import EditProfileForm from '@/components/settings/EditProfileForm';
import ChangePasswordForm from '@/components/settings/ChangePasswordForm';

import ScreenHeader from '@/components/ui/ScreenHeader';

type SettingsTab = 'profile' | 'security';

export default function SettingsScreen() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

    return (
        <View className="flex-1 bg-white">
            <ScreenHeader
                title="Account Settings"
                subtitle="Manage your profile and security"
            />

            {/* Tab Selector */}
            <View className="flex-row px-6 border-b border-gray-100 bg-white">
                {[
                    { id: 'profile', label: 'Edit Profile', icon: 'person-outline' },
                    { id: 'security', label: 'Security', icon: 'shield-checkmark-outline' },
                ].map((tab) => (
                    <TouchableOpacity
                        key={tab.id}
                        onPress={() => setActiveTab(tab.id as SettingsTab)}
                        className={`flex-1 flex-row items-center justify-center py-4 border-b-2 ${activeTab === tab.id ? 'border-secondary' : 'border-transparent'
                            }`}
                    >
                        <Ionicons
                            name={tab.icon as any}
                            size={18}
                            color={activeTab === tab.id ? '#FF4F18' : '#9ca3af'}
                        />
                        <AppText
                            weight={activeTab === tab.id ? 'bold' : 'medium'}
                            className={`ml-2 ${activeTab === tab.id ? 'text-secondary' : 'text-gray-400'}`}
                        >
                            {tab.label}
                        </AppText>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Form Content */}
            <View className="flex-1">
                {activeTab === 'profile' ? (
                    <EditProfileForm />
                ) : (
                    <ChangePasswordForm />
                )}
            </View>
        </View>
    );
}
