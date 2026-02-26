import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppText from '@/components/ui/AppText';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import TextArea from '@/components/ui/TextArea';
import Avatar from '@/components/ui/Avatar';
import CustomAlert from '@/components/ui/CustomAlert';
import { useAlert } from '@/hooks/useAlert';
import { useAuthStore } from '@/store/authStore';
import { useUpdateProfile } from '@/hooks/useAuth';
import * as ImagePicker from 'expo-image-picker';

export default function EditProfileForm() {
    const { user } = useAuthStore();
    const updateProfileMutation = useUpdateProfile();
    const { alertConfig, showAlert, hideAlert } = useAlert();

    const [formData, setFormData] = useState({
        first_name: user?.first_name || '',
        last_name: user?.last_name || '',
        username: user?.username || '',
        phone: user?.phone || '',
        bio: user?.bio || '',
        address: user?.address || '',
        website: user?.website || '',
    });

    const [avatar, setAvatar] = useState<string | null>(user?.avatar || null);

    const handlePickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
            base64: true,
        });

        if (!result.canceled && result.assets && result.assets[0].base64) {
            const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
            setAvatar(base64Image);
        }
    };

    const handleSubmit = () => {
        updateProfileMutation.mutate({
            ...formData,
            ...(avatar && avatar.startsWith('data:') ? { avatar } : {}),
        }, {
            onSuccess: () => {
                showAlert({
                    title: 'Success',
                    message: 'Profile updated successfully',
                    icon: 'checkmark-circle-outline',
                    iconColor: '#10b981',
                    buttons: [{ text: 'Great!' }]
                });
            },
            onError: (error: any) => {
                const message = error.response?.data?.message || 'Failed to update profile';
                showAlert({
                    title: 'Error',
                    message: message,
                    icon: 'alert-circle-outline',
                    iconColor: '#ef4444',
                    buttons: [{ text: 'Try Again' }]
                });
            }
        });
    };

    return (
        <View className="flex-1">
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                <View className="items-center py-8">
                    <View className="relative">
                        <Avatar
                            src={avatar}
                            size={120}
                            fallback={user?.username?.[0]?.toUpperCase() || 'U'}
                            className="border-4 border-white shadow-lg"
                        />
                        <TouchableOpacity
                            onPress={handlePickImage}
                            className="absolute bottom-0 right-0 bg-primary w-10 h-10 rounded-full items-center justify-center border-4 border-white shadow-sm"
                        >
                            <Ionicons name="camera" size={18} color="white" />
                        </TouchableOpacity>
                    </View>
                    <AppText weight="bold" className="text-gray-900 mt-4 text-lg">Profile Picture</AppText>
                </View>

                <View className="px-6 pb-12">
                    <AppText weight="bold" className="text-gray-400 text-[11px] uppercase tracking-widest mb-3 ml-2">Personal Information</AppText>

                    <View className="bg-white border border-gray-100 rounded-[32px] p-6 mb-6 shadow-sm">
                        <AppText weight="semibold" className="text-gray-700 mb-2 ml-1">First Name</AppText>
                        <Input
                            value={formData.first_name}
                            onChangeText={(text) => setFormData(prev => ({ ...prev, first_name: text }))}
                            placeholder="First Name"
                            className="mb-4"
                        />

                        <AppText weight="semibold" className="text-gray-700 mb-2 ml-1">Last Name</AppText>
                        <Input
                            value={formData.last_name}
                            onChangeText={(text) => setFormData(prev => ({ ...prev, last_name: text }))}
                            placeholder="Last Name"
                            className="mb-4"
                        />

                        <AppText weight="semibold" className="text-gray-700 mb-2 ml-1">Username</AppText>
                        <Input
                            value={formData.username}
                            onChangeText={(text) => setFormData(prev => ({ ...prev, username: text }))}
                            placeholder="Username"
                            autoCapitalize="none"
                            className="mb-4"
                        />
                    </View>

                    <AppText weight="bold" className="text-gray-400 text-[11px] uppercase tracking-widest mt-4 mb-3 ml-2">Contact & Bio</AppText>

                    <View className="bg-white border border-gray-100 rounded-[32px] p-6 mb-6 shadow-sm">
                        <AppText weight="semibold" className="text-gray-700 mb-2 ml-1">Phone Number</AppText>
                        <Input
                            value={formData.phone}
                            onChangeText={(text) => setFormData(prev => ({ ...prev, phone: text }))}
                            placeholder="+123 456 7890"
                            keyboardType="phone-pad"
                            className="mb-4"
                        />

                        <AppText weight="semibold" className="text-gray-700 mb-2 ml-1">Bio / Description</AppText>
                        <TextArea
                            value={formData.bio}
                            onChangeText={(text) => setFormData(prev => ({ ...prev, bio: text }))}
                            placeholder="Tell people about yourself..."
                            className="mb-4"
                        />

                        <AppText weight="semibold" className="text-gray-700 mb-2 ml-1">Address / Location</AppText>
                        <Input
                            value={formData.address}
                            onChangeText={(text) => setFormData(prev => ({ ...prev, address: text }))}
                            placeholder="City, Country"
                            className="mb-4"
                        />

                        <AppText weight="semibold" className="text-gray-700 mb-2 ml-1">Website</AppText>
                        <Input
                            value={formData.website}
                            onChangeText={(text) => setFormData(prev => ({ ...prev, website: text }))}
                            placeholder="https://example.com"
                            autoCapitalize="none"
                            className="mb-4"
                        />
                    </View>

                    <Button
                        onPress={handleSubmit}
                        loading={updateProfileMutation.isPending}
                        className="mt-6 py-4 rounded-2xl shadow-xl"
                    >
                        <AppText weight="bold" className="text-white text-lg">Save Changes</AppText>
                    </Button>
                </View>
            </ScrollView>

            <CustomAlert
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                icon={alertConfig.icon}
                iconColor={alertConfig.iconColor}
                buttons={alertConfig.buttons}
                onDismiss={hideAlert}
            />
        </View>
    );
}
