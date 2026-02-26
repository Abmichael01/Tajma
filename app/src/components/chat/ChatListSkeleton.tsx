import { View } from "react-native";
import Skeleton from "@/components/ui/Skeleton";

export default function ChatListSkeleton() {
    return (
        <View className="flex-1">
            {Array.from({ length: 8 }).map((_, idx) => (
                <View key={idx} className="p-6 border-b border-border">
                    <View className="flex-row gap-5 items-center">
                        {/* Avatar/Ad image placeholder */}
                        <View className="relative">
                            <Skeleton className="w-14 h-14 rounded-full" variant="circular" />
                            <View className="absolute -bottom-1 -right-1">
                                <Skeleton className="w-6 h-6 rounded-full border-2 border-white" variant="circular" />
                            </View>
                        </View>

                        {/* Content Detail Placeholder */}
                        <View className="flex-1">
                            <View className="flex-row justify-between items-center mb-2">
                                <Skeleton variant="text" className="w-1/3 h-5" />
                                <Skeleton variant="text" className="w-12 h-3" />
                            </View>
                            <Skeleton variant="text" className="w-1/2 h-4 mb-2" />
                            <Skeleton variant="text" className="w-3/4 h-3" />
                        </View>
                    </View>
                </View>
            ))}
        </View>
    );
}
