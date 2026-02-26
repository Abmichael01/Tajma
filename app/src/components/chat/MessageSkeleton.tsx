import React from 'react';
import { View, ActivityIndicator } from 'react-native';

export default function MessageSkeleton() {
    return (
        <View className="flex-1 items-center justify-center bg-[#E5DDD5]">
            <ActivityIndicator size="large" color="#FF4F18" />
        </View>
    );
}
