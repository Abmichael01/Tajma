import { View, TextInput, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AppText from "@/components/ui/AppText";

// Search Bar Component (can be reused for sticky header)
export function SearchBar({ 
  searchQuery, 
  setSearchQuery, 
  selectedRegion, 
  setSelectedRegion,
  onSearch 
}: {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedRegion: string;
  setSelectedRegion: (region: string) => void;
  onSearch: () => void;
}) {
  return (
    <View className="flex-row gap-2">
      {/* Region Selector Button */}
      <TouchableOpacity
        className="flex-row items-center justify-between gap-2 px-4 py-3 bg-white border border-gray-300 rounded-full min-w-[140px]"
        onPress={() => {
          // TODO: Open region selector modal
          console.log("Open region selector");
        }}
      >
        <View className="flex-row items-center gap-2 flex-1">
          <Ionicons name="location-outline" size={20} color="#cb234a" />
          <AppText variant="default" className="text-gray-700" numberOfLines={1}>
            {selectedRegion}
          </AppText>
        </View>
        <Ionicons name="chevron-down" size={16} color="#9ca3af" />
      </TouchableOpacity>

      {/* Search Input */}
      <View className="flex-1 flex-row items-center bg-white border border-gray-300 rounded-full px-4 py-3">
        <Ionicons name="search-outline" size={20} color="#9ca3af" style={{ marginRight: 8 }} />
        <TextInput
          className="flex-1 text-base text-gray-900 py-2"
          placeholder="What are you looking for today?"
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
    </View>
  );
}

interface HeroProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedRegion: string;
  setSelectedRegion: (region: string) => void;
  onSearch: () => void;
}

export default function Hero({
  searchQuery,
  setSearchQuery,
  selectedRegion,
  setSelectedRegion,
  onSearch,
}: HeroProps) {
  return (
    <View className="bg-primary rounded-b-[40px] py-8 pt-28 px-4 relative overflow-hidden">
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
                lineHeight: 56,
                color: "#cb234a",
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
          setSelectedRegion={setSelectedRegion}
          onSearch={onSearch}
        />
      </View>
    </View>
  );
}

