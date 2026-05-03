import { View } from "react-native";
import Skeleton from "@/components/ui/Skeleton";

export default function ChatListSkeleton() {
    return (
        <View className="flex-1 bg-white">
            {Array.from({ length: 10 }).map((_, idx) => (
                <View key={idx} className="px-5 py-4 border-b border-gray-50">
                    <View className="flex-row gap-4 items-center">
                        {/* Avatar/Ad image placeholder */}
                        <View className="relative">
                            <Skeleton className="w-[60px] h-[60px] rounded-2xl" />
                            <View className="absolute -bottom-1 -right-1">
                                <Skeleton className="w-8 h-8 rounded-full border-2 border-white" variant="circular" />
                            </View>
                        </View>

                        {/* Content Detail Placeholder */}
                        <View className="flex-1">
                            <View className="flex-row justify-between items-center mb-2">
                                <Skeleton variant="text" className="w-1/3 h-5 rounded-lg" />
                                <Skeleton variant="text" className="w-10 h-3 rounded-md" />
                            </View>
                            <Skeleton variant="text" className="w-1/4 h-4 mb-2 rounded-md" />
                            <Skeleton variant="text" className="w-2/3 h-3 rounded-md" />
                        </View>
                    </View>
                </View>
            ))}
        </View>
    );
}
