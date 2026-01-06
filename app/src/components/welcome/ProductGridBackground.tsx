import { View, Image } from "react-native";

export default function ProductGridBackground() {
  // Product images from Unsplash - marketplace/product themed
  const productImages = [
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop", // Headphones
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop", // Watch
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop", // Shoes
    "https://images.unsplash.com/photo-1491637639811-60e2756cc1c7?w=400&h=400&fit=crop", // Backpack
    "https://images.unsplash.com/photo-1560343090-f0409e92791a?w=400&h=400&fit=crop", // Phone
    "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=400&h=400&fit=crop", // Camera
    "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=400&h=400&fit=crop", // Laptop
    "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop", // Jacket
    "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop", // Smartwatch
    "https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=400&h=400&fit=crop", // Keyboard
    "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=400&fit=crop", // Bag
    "https://images.unsplash.com/photo-1503602642458-232111445657?w=400&h=400&fit=crop", // Speaker
  ];

  return (
    <View className="absolute inset-0 z-0">
      <View className="flex-1 flex-row flex-wrap">
        {productImages.map((imageUrl, index) => (
          <View
            key={index}
            className="w-1/3 h-1/4 border border-gray-200 overflow-hidden"
          >
            <Image
              source={{ uri: imageUrl }}
              className="w-full h-full"
              resizeMode="cover"
            />
          </View>
        ))}
      </View>
    </View>
  );
}

