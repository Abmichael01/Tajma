import { View, TextInput, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppText from "@/components/ui/AppText";

// Search Bar Component (can be reused for sticky header)
export function SearchBar({
  searchQuery,
  setSearchQuery,
  selectedRegion,
  onRegionPress,
  onFilterPress,
  onSearch,
  showRegion = true,
  showFilter = true,
}: {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedRegion: string;
  onRegionPress: () => void;
  onFilterPress?: () => void;
  onSearch: () => void;
  showRegion?: boolean;
  showFilter?: boolean;
}) {
  return (
    <View className="flex-row gap-2">
      {/* Search Input Container */}
      <View className="flex-1 flex-row items-center bg-white border border-gray-300 rounded-full px-4 py-2">
        <Ionicons name="search-outline" size={20} color="#9ca3af" style={{ marginRight: 8 }} />
        <TextInput
          className="flex-1 text-base text-gray-900 py-1"
          placeholder="Search..."
          placeholderTextColor="#9ca3af"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={onSearch}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchQuery("")}
            className="ml-2"
          >
            <Ionicons name="close-circle" size={20} color="#9ca3af" />
          </TouchableOpacity>
        )}
      </View>

      {/* Region Selector Button */}
      {showRegion && (
        <TouchableOpacity
          className="flex-row items-center bg-white border border-gray-300 rounded-full px-4 h-12"
          onPress={onRegionPress}
        >
          <Ionicons name="location-outline" size={18} color="#FF4F18" style={{ marginRight: 4 }} />
          <AppText weight="medium" className="text-gray-700 text-xs" numberOfLines={1}>
            {selectedRegion}
          </AppText>
        </TouchableOpacity>
      )}

      {/* Filter Button */}
      {showFilter && (
        <TouchableOpacity
          className="flex-row items-center justify-center p-2.5 bg-white border border-gray-300 rounded-full w-12 h-12"
          onPress={onFilterPress}
        >
          <Ionicons name="options-outline" size={22} color="#FF4F18" />
        </TouchableOpacity>
      )}
    </View>
  );
}

interface HeroProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedRegion: string;
  onRegionPress: () => void;
  onFilterPress?: () => void;
  onSearch: () => void;
}

export default function Hero({
  searchQuery,
  setSearchQuery,
  selectedRegion,
  onRegionPress,
  onFilterPress,
  onSearch,
}: HeroProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="bg-primary rounded-b-[40px] py-8 px-4 relative overflow-hidden"
      style={{ paddingTop: insets.top + 60 }}
    >
      {/* Bottom gradient overlay - transparent to white */}
      {/* <LinearGradient
        colors={['transparent', 'white']}
        locations={[0, 0.75]}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 128,
        }}
      /> */}

      <View className="max-w-4xl mx-auto relative z-10">
        {/* Hero Text */}
        <View className="items-center mb-6">
          <AppText
            variant="heading"
            weight="semibold"
            className="text-center mb-2 text-white"
            style={{
              fontFamily: "BebasNeue-Regular",
              fontSize: 48,
              lineHeight: 56,
            }}
          >
            Find Everything You{" "}
            <AppText
              style={{
                fontFamily: "BebasNeue-Regular",
                fontSize: 48,
                color: "#2D2D2D",
              }}
            >
              Need
            </AppText>{" "}
            Right Here
          </AppText>
        </View>

        {/* Search Box with Region Selector */}
        <SearchBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedRegion={selectedRegion}
          onRegionPress={onRegionPress}
          onSearch={onSearch}
          showFilter={false}
        />
      </View>
    </View>
  );
}

