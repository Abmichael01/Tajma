import { View } from "react-native";
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
      return <AppText variant="default" className="text-gray-400 font-medium">N/A</AppText>;
    }

    // Handle arrays
    if (Array.isArray(value)) {
      if (value.length === 0) {
        return <AppText variant="default" className="text-gray-400 font-medium">None</AppText>;
      }

      // Array of objects (e.g., array type fields with sub-fields)
      if (value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
        return (
          <View className="space-y-2 mt-1">
            {value.map((item: any, idx: number) => (
              <View key={idx} className="border-l-2 border-slate-200 pl-3 py-2 bg-slate-50 rounded-r-xl">
                {Object.entries(item).map(([k, v]) => {
                  const childLabel = k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                  return (
                    <View key={k} className="flex-row items-center gap-2 mb-1">
                      <AppText variant="default" weight="medium" className="text-slate-500 text-xs">{childLabel}:</AppText>
                      <AppText variant="default" weight="medium" className="text-slate-900 text-xs">{String(v)}</AppText>
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
        <View className="flex-row flex-wrap gap-2 mt-1">
          {value.map((item: any, idx: number) => (
            <View
              key={idx}
              className="bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200/50"
            >
              <AppText variant="default" weight="medium" className="text-slate-700 text-xs">{String(item)}</AppText>
            </View>
          ))}
        </View>
      );
    }

    // Handle objects (nested objects)
    if (typeof value === 'object') {
      return (
        <View className="space-y-2 mt-1">
          {Object.entries(value).map(([k, v]) => {
            const childLabel = k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            return (
              <View key={k} className="flex-row items-center gap-2">
                <AppText variant="default" weight="medium" className="text-slate-500 min-w-[100px] text-xs">{childLabel}:</AppText>
                <AppText variant="default" weight="medium" className="text-slate-900 flex-1 text-xs">{String(v)}</AppText>
              </View>
            );
          })}
        </View>
      );
    }

    // Handle booleans
    if (typeof value === 'boolean') {
      return (
        <View className={`px-3 py-1 rounded-lg border ${value ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
          <AppText variant="default" weight="medium" className={`text-xs ${value ? 'text-emerald-700' : 'text-slate-600'}`}>
            {value ? 'Yes' : 'No'}
          </AppText>
        </View>
      );
    }

    // Handle numbers with formatting
    if (typeof value === 'number') {
      return <AppText variant="default" weight="medium" className="text-slate-900">{value >= 1000 ? value.toLocaleString() : String(value)}</AppText>;
    }

    // Handle strings
    return <AppText variant="default" weight="medium" className="text-slate-900">{String(value)}</AppText>;
  };

  return (
    <View className={`bg-white border-b border-slate-100 px-6 py-8 ${className}`}>
      <AppText variant="subheading" weight="medium" className="text-slate-900 mb-6">
        Ad Information
      </AppText>
      <View className="flex flex-col gap-5">
        {Object.entries(attributes).map(([key, value]) => {
          if (key === 'cv_file_name') return null;

          const formattedKey = key
            .replace(/_/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());

          return (
            <View key={key} className="space-y-2.5">
              <AppText variant="default" weight="medium" className="text-slate-400 text-[10px] uppercase tracking-wider">
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


