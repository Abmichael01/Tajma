import { View, TouchableOpacity } from "react-native";
import { useState } from "react";
import AppText from "@/components/ui/AppText";

interface AdDescriptionProps {
  description: string;
  className?: string;
}

const MAX_LENGTH = 200;

export default function AdDescription({ description, className = "" }: AdDescriptionProps) {
  const [expanded, setExpanded] = useState(false);
  const text = description || 'No description provided.';
  const shouldTruncate = text.length > MAX_LENGTH;
  const displayText = shouldTruncate && !expanded ? text.substring(0, MAX_LENGTH) + '...' : text;

  return (
    <View className={`bg-white border-b border-gray-200 px-4 py-6 ${className}`}>
      <AppText variant="subheading" weight="semibold" className="text-gray-900 mb-4">
        Description
      </AppText>
      <AppText variant="default" className="text-gray-600 leading-relaxed">
        {displayText}
      </AppText>
      {shouldTruncate && (
        <TouchableOpacity onPress={() => setExpanded(!expanded)} className="mt-2">
          <AppText variant="default" weight="semibold" className="text-primary">
            {expanded ? 'See Less' : 'See More'}
          </AppText>
        </TouchableOpacity>
      )}
    </View>
  );
}

