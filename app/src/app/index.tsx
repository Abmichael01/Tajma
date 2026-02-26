import { View, Image, FlatList, Dimensions, Animated } from "react-native";
import { Redirect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useRef, useState } from "react";
import AppText from "@/components/ui/AppText";
import WelcomeButtons from "@/components/welcome/WelcomeButtons";
import { useAuthStore } from "@/store/authStore";

const { width } = Dimensions.get('window');

const CAROUSEL_DATA = [
  {
    id: '1',
    title: 'Discover Local Items',
    subtitle: 'From tech gadgets to home furniture, find everything you need.',
    image: require("@/assets/images/carousel_2.png"),
  },
  {
    id: '2',
    title: 'Sell with Ease',
    subtitle: 'Reach thousands of buyers in your local community effortlessly.',
    image: require("@/assets/images/carousel_1.png"),
  },
  {
    id: '3',
    title: 'Trusted Community',
    subtitle: 'Buy and sell with peace of mind in our verified marketplace.',
    image: require("@/assets/images/carousel_3.png"),
  },
];

export default function WelcomeScreen() {
  const { isAuthenticated, hasHydrated } = useAuthStore();
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;

  // Don't render anything until hydration is complete
  if (!hasHydrated) {
    return null;
  }

  // Redirect to home tab if user is already logged in
  if (isAuthenticated) {
    return <Redirect href="/home" />;
  }

  const renderItem = ({ item }: { item: typeof CAROUSEL_DATA[0] }) => (
    <View style={{ width }} className="items-center">
      {/* Tall Image with slight bottom curve */}
      <View className="w-full h-[60%] overflow-hidden bg-gray-100">
        <Image
          source={item.image}
          className="w-full h-full"
          resizeMode="cover"
        />
      </View>

      <View className="px-10 mt-10 items-center">
        <AppText
          className="text-secondary text-center mb-4"
          style={{
            fontFamily: "BebasNeue-Regular",
            fontSize: 48,
            lineHeight: 52,
          }}
        >
          {item.title}
        </AppText>
        <AppText className="text-gray-500 text-center text-lg leading-6">
          {item.subtitle}
        </AppText>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />

      {/* Top Section - Logo (Very close to carousel) */}
      <View className="absolute top-12 left-0 right-0 z-50 items-center">
        <View className="bg-white/90 backdrop-blur-md rounded-2xl px-6 py-2 border border-gray-100 shadow-sm">
          <Image
            source={require("@/assets/images/logo.jpg")}
            className="w-24 h-8"
            resizeMode="contain"
          />
        </View>
      </View>

      {/* Middle Section - Carousel */}
      <View className="flex-1">
        <Animated.FlatList
          data={CAROUSEL_DATA}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: true }
          )}
          onMomentumScrollEnd={(e) => {
            const index = Math.round(e.nativeEvent.contentOffset.x / width);
            setActiveIndex(index);
          }}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
        />

        {/* Dot Indicators */}
        <View className="flex-row justify-center mb-4">
          {CAROUSEL_DATA.map((_, i) => {
            const opacity = scrollX.interpolate({
              inputRange: [(i - 1) * width, i * width, (i + 1) * width],
              outputRange: [0.3, 1, 0.3],
              extrapolate: 'clamp',
            });
            const scale = scrollX.interpolate({
              inputRange: [(i - 1) * width, i * width, (i + 1) * width],
              outputRange: [0.8, 1.2, 0.8],
              extrapolate: 'clamp',
            });
            return (
              <Animated.View
                key={i}
                className="w-2 h-2 rounded-full bg-primary mx-1.5"
                style={{ opacity, transform: [{ scale }] }}
              />
            );
          })}
        </View>
      </View>

      {/* Bottom Section - Buttons */}
      <View className="px-8 pb-12">
        <WelcomeButtons />
      </View>
    </View>
  );
}
