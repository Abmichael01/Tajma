import { TextInput, TextInputProps, View } from "react-native";
import { cn } from "@/utils/cn";

interface TextAreaProps extends TextInputProps {
    className?: string;
    error?: boolean;
    rows?: number;
}

export default function TextArea({
    className,
    error,
    rows = 4,
    ...props
}: TextAreaProps) {
    return (
        <View className="relative">
            <TextInput
                className={cn(
                    "px-5 py-4 w-full bg-gray-50 border text-gray-900 rounded-3xl text-base", // Updated to match
                    "h-32",
                    "text-top",
                    error ? "border-red-500" : "border-gray-200 focus:border-primary",
                    "disabled:opacity-50",
                    className
                )}
                multiline
                numberOfLines={rows}
                textAlignVertical="top"
                style={{
                    fontFamily: "WorkSans-Regular",
                }}
                placeholderTextColor="#9ca3af"
                {...props}
            />
        </View>
    );
}
