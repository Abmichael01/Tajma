import { View, TouchableOpacity } from "react-native";
import AppText from "@/components/ui/AppText";

interface AdInfoProps {
  attributes: Record<string, any>;
  className?: string;
}

export default function AdInfo({ attributes, className = "" }: AdInfoProps) {
  if (!attributes || Object.keys(attributes).length === 0) {
    return null;
  }

  const formatValue = (value: any): React.ReactNode => {
    if (value === null || value === undefined || value === '') {
      return <AppText variant="default" className="text-gray-400">N/A</AppText>;
    }

    // Handle arrays
    if (Array.isArray(value)) {
      if (value.length === 0) {
        return <AppText variant="default" className="text-gray-400">None</AppText>;
      }
      
      // Array of objects (e.g., array type fields with sub-fields)
      if (value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
        return (
          <View className="space-y-2">
            {value.map((item: any, idx: number) => (
              <View key={idx} className="border-l-2 border-secondary/30 pl-3 py-2 bg-gray-50 rounded">
                {Object.entries(item).map(([k, v]) => {
                  const childLabel = k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                  return (
                    <View key={k} className="flex-row items-center gap-2 mb-1">
                      <AppText variant="default" weight="medium" className="text-gray-700">{childLabel}:</AppText>
                      <View>{formatValue(v)}</View>
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        );
      }
      
      // Simple array (e.g., tags, skills)
      return (
        <View className="flex-row flex-wrap gap-2">
          {value.map((item: any, idx: number) => (
            <View
              key={idx}
              className="bg-secondary/10 px-3 py-1.5 rounded-full"
            >
              <AppText variant="default" className="text-secondary">{String(item)}</AppText>
            </View>
          ))}
        </View>
      );
    }

    // Handle objects (nested objects)
    if (typeof value === 'object') {
      return (
        <View className="space-y-2">
          {Object.entries(value).map(([k, v]) => {
            const childLabel = k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            return (
              <View key={k} className="flex-row items-center gap-2">
                <AppText variant="default" weight="medium" className="text-gray-600 min-w-[100px]">{childLabel}:</AppText>
                <View className="flex-1">{formatValue(v)}</View>
              </View>
            );
          })}
        </View>
      );
    }

    // Handle booleans
    if (typeof value === 'boolean') {
      return (
        <View className={`px-3 py-1.5 rounded-full ${value ? 'bg-green-100' : 'bg-gray-100'}`}>
          <AppText variant="default" weight="medium" className={value ? 'text-green-700' : 'text-gray-600'}>
            {value ? 'Yes' : 'No'}
          </AppText>
        </View>
      );
    }

    // Handle numbers with formatting
    if (typeof value === 'number') {
      if (value >= 1000) {
        return <AppText variant="default" className="text-gray-900">{value.toLocaleString()}</AppText>;
      }
      return <AppText variant="default" className="text-gray-900">{String(value)}</AppText>;
    }

    // Handle strings
    return <AppText variant="default" className="text-gray-900">{String(value)}</AppText>;
  };

  return (
    <View className={`bg-white border-b border-gray-200 px-4 py-6 ${className}`}>
      <AppText variant="subheading" weight="semibold" className="text-gray-900 mb-5">
        Ad Information
      </AppText>
      <View className="flex flex-col gap-4">
        {Object.entries(attributes).map(([key, value]) => {
          // Skip cv_file_name as it's usually shown elsewhere
          if (key === 'cv_file_name') return null;
          
          // Format key: replace underscores with spaces and capitalize
          const formattedKey = key
            .replace(/_/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());
          
          return (
            <View key={key} className="space-y-3 border border-gray-200 rounded-xl p-5">
              <AppText variant="subheading" weight="semibold" className="text-gray-700">
                {formattedKey}
              </AppText>
              <View>
                {formatValue(value)}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

