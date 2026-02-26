import React, { useState } from 'react';
import { View, Modal, StyleSheet, TouchableOpacity, Image, TextInput, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppText from '@/components/ui/AppText';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

interface MediaPreviewModalProps {
    visible: boolean;
    media: {
        type: 'image' | 'document';
        asset: ImagePicker.ImagePickerAsset | DocumentPicker.DocumentPickerAsset;
    } | null;
    onClose: () => void;
    onSend: (caption: string) => void;
}

export default function MediaPreviewModal({ visible, media, onClose, onSend }: MediaPreviewModalProps) {
    const [caption, setCaption] = useState('');

    if (!media) return null;

    const handleSend = () => {
        onSend(caption);
        setCaption('');
    };

    const isImage = media.type === 'image';
    const asset = media.asset;

    // Format file size
    const formatSize = (bytes?: number) => {
        if (!bytes) return '0 KB';
        const kb = bytes / 1024;
        if (kb < 1024) return `${kb.toFixed(1)} KB`;
        const mb = kb / 1024;
        return `${mb.toFixed(1)} MB`;
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <SafeAreaView className="flex-1 bg-black">
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    className="flex-1"
                >
                    {/* Header */}
                    <View className="flex-row items-center justify-between px-4 py-4 z-10">
                        <TouchableOpacity onPress={onClose} className="p-2">
                            <Ionicons name="close" size={28} color="white" />
                        </TouchableOpacity>

                        {isImage && (
                            <View className="flex-row gap-4">
                                <TouchableOpacity className="p-2" onPress={() => console.log('Crop/Edit')}>
                                    <Ionicons name="crop-outline" size={24} color="white" />
                                </TouchableOpacity>
                                <TouchableOpacity className="p-2">
                                    <Ionicons name="text-outline" size={24} color="white" />
                                </TouchableOpacity>
                                <TouchableOpacity className="p-2">
                                    <Ionicons name="happy-outline" size={24} color="white" />
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>

                    {/* Main Content */}
                    <View className="flex-1 justify-center items-center">
                        {isImage ? (
                            <Image
                                source={{ uri: asset.uri }}
                                className="w-full h-full"
                                resizeMode="contain"
                            />
                        ) : (
                            <View className="items-center bg-gray-900/50 p-8 rounded-3xl border border-gray-800">
                                <Ionicons name="document-text" size={80} color="#FF4F18" />
                                <AppText weight="bold" className="text-white mt-4 text-center px-4" numberOfLines={2}>
                                    {(asset as DocumentPicker.DocumentPickerAsset).name}
                                </AppText>
                                <AppText className="text-gray-400 mt-2">
                                    {formatSize((asset as DocumentPicker.DocumentPickerAsset).size)}
                                </AppText>
                            </View>
                        )}
                    </View>

                    {/* Bottom Caption Bar */}
                    <View className="p-4 bg-black/50">
                        <View className="flex-row items-end bg-gray-900 rounded-3xl px-4 py-2 border border-gray-800">
                            <TouchableOpacity className="p-2">
                                <Ionicons name="add" size={24} color="#FF4F18" />
                            </TouchableOpacity>

                            <TextInput
                                value={caption}
                                onChangeText={setCaption}
                                placeholder="Add a caption..."
                                placeholderTextColor="#9ca3af"
                                multiline
                                className="flex-1 text-white text-[16px] px-2 min-h-[40px] max-h-[120px]"
                                style={{ textAlignVertical: 'center' }}
                            />

                            <TouchableOpacity
                                onPress={handleSend}
                                className="bg-[#FF4F18] w-12 h-12 rounded-full items-center justify-center ml-2"
                            >
                                <Ionicons name="send" size={22} color="white" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </Modal>
    );
}
