import { View } from "react-native";
import { memo } from "react";
import AppText from "@/components/ui/AppText";

interface DateBubbleProps {
    date: string;
}

const DateBubble = memo(({ date }: DateBubbleProps) => {
    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);

        if (d.toDateString() === today.toDateString()) return "Today";
        if (d.toDateString() === yesterday.toDateString()) return "Yesterday";

        return d.toLocaleDateString([], {
            day: 'numeric',
            month: 'long',
            year: d.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
        });
    };

    return (
        <View className="items-center my-4">
            <View className="bg-white/70 px-4 py-1.5 rounded-full border border-gray-100 shadow-sm">
                <AppText className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">
                    {formatDate(date)}
                </AppText>
            </View>
        </View>
    );
});

export default DateBubble;
