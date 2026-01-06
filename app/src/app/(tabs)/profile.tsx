import { View, ScrollView, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AppText from "@/components/ui/AppText";
import Avatar from "@/components/ui/Avatar";
import { useAuthStore } from "@/store/authStore";
import { useLogout } from "@/hooks/useAuth";
import { useCurrentUser } from "@/hooks/useAuth";

export default function ProfileScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { data: currentUser, isLoading } = useCurrentUser();
  const logoutMutation = useLogout();

  // Use currentUser from API if available, otherwise fall back to store user
  const displayUser = currentUser || user;

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: () => {
            logoutMutation.mutate();
          },
        },
      ]
    );
  };

  const handleNavigateToProfile = () => {
    if (displayUser?.username) {
      router.push(`/users/${displayUser.username}`);
    }
  };

  if (!displayUser) {
    return (
      <View className="flex-1 bg-white justify-center items-center px-4">
        <AppText variant="heading" weight="semibold" className="text-gray-900 mb-4">
          Not Logged In
        </AppText>
        <TouchableOpacity
          className="bg-primary px-6 py-3 rounded-full"
          onPress={() => router.push("/(auth)/login")}
        >
          <AppText variant="default" weight="semibold" className="text-white">
            Sign In
          </AppText>
        </TouchableOpacity>
      </View>
    );
  }

  const fullName = displayUser.first_name && displayUser.last_name
    ? `${displayUser.first_name} ${displayUser.last_name}`
    : displayUser.first_name || displayUser.last_name || displayUser.username || displayUser.email || "User";

  const initials = displayUser.first_name && displayUser.last_name
    ? `${displayUser.first_name[0]}${displayUser.last_name[0]}`
    : displayUser.first_name?.[0] || displayUser.last_name?.[0] || displayUser.username?.[0] || displayUser.email?.[0] || "U";

  return (
    <ScrollView className="flex-1 bg-gray-50" showsVerticalScrollIndicator={false}>
      {/* Header Section */}
      <View className="bg-primary pt-16 pb-8 px-4">
        <View className="items-center">
          <Avatar
            source={displayUser.avatar ? { uri: displayUser.avatar } : undefined}
            size={100}
            fallbackText={initials.toUpperCase()}
            onPress={handleNavigateToProfile}
          />
          <AppText
            variant="heading"
            weight="semibold"
            className="text-white mt-4 text-center"
          >
            {fullName}
          </AppText>
          {displayUser.email && (
            <AppText variant="default" className="text-white/80 mt-1 text-center">
              {displayUser.email}
            </AppText>
          )}
          {displayUser.location && (
            <View className="flex-row items-center mt-2">
              <Ionicons name="location-outline" size={16} color="rgba(255,255,255,0.8)" />
              <AppText variant="default" className="text-white/80 ml-1">
                {displayUser.location}
              </AppText>
            </View>
          )}
        </View>
      </View>

      {/* Profile Actions */}
      <View className="px-4 py-6">
        {/* View Profile */}
        <TouchableOpacity
          className="bg-white rounded-xl p-4 mb-3 flex-row items-center justify-between border border-gray-200"
          onPress={handleNavigateToProfile}
          activeOpacity={0.7}
        >
          <View className="flex-row items-center flex-1">
            <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center mr-3">
              <Ionicons name="person-outline" size={20} color="#cb234a" />
            </View>
            <View className="flex-1">
              <AppText variant="default" weight="semibold" className="text-gray-900">
                View Profile
              </AppText>
              <AppText variant="default" className="text-gray-500 text-sm mt-0.5">
                See your public profile
              </AppText>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
        </TouchableOpacity>

        {/* My Ads */}
        <TouchableOpacity
          className="bg-white rounded-xl p-4 mb-3 flex-row items-center justify-between border border-gray-200"
          onPress={() => router.push("/profile/my-ads")}
          activeOpacity={0.7}
        >
          <View className="flex-row items-center flex-1">
            <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center mr-3">
              <Ionicons name="grid-outline" size={20} color="#cb234a" />
            </View>
            <View className="flex-1">
              <AppText variant="default" weight="semibold" className="text-gray-900">
                My Ads
              </AppText>
              <AppText variant="default" className="text-gray-500 text-sm mt-0.5">
                Manage your listings
              </AppText>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
        </TouchableOpacity>
        
        {/* My Reviews */}
        <TouchableOpacity
          className="bg-white rounded-xl p-4 mb-3 flex-row items-center justify-between border border-gray-200"
          onPress={() => router.push("/profile/reviews")}
          activeOpacity={0.7}
        >
          <View className="flex-row items-center flex-1">
            <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center mr-3">
              <Ionicons name="star-outline" size={20} color="#cb234a" />
            </View>
            <View className="flex-1">
              <AppText variant="default" weight="semibold" className="text-gray-900">
                My Reviews
              </AppText>
              <AppText variant="default" className="text-gray-500 text-sm mt-0.5">
                See what others say
              </AppText>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
        </TouchableOpacity>

        {/* Saved Ads */}
        <TouchableOpacity
          className="bg-white rounded-xl p-4 mb-3 flex-row items-center justify-between border border-gray-200"
          onPress={() => router.push("/profile/saved")}
          activeOpacity={0.7}
        >
          <View className="flex-row items-center flex-1">
            <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center mr-3">
              <Ionicons name="heart-outline" size={20} color="#cb234a" />
            </View>
            <View className="flex-1">
              <AppText variant="default" weight="semibold" className="text-gray-900">
                Saved Ads
              </AppText>
              <AppText variant="default" className="text-gray-500 text-sm mt-0.5">
                Your favorite listings
              </AppText>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
        </TouchableOpacity>

        {/* Settings */}
        <TouchableOpacity
          className="bg-white rounded-xl p-4 mb-3 flex-row items-center justify-between border border-gray-200"
          onPress={() => {
            if (displayUser.username) {
              router.push(`/users/${displayUser.username}?tab=settings`);
            }
          }}
          activeOpacity={0.7}
        >
          <View className="flex-row items-center flex-1">
            <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center mr-3">
              <Ionicons name="settings-outline" size={20} color="#cb234a" />
            </View>
            <View className="flex-1">
              <AppText variant="default" weight="semibold" className="text-gray-900">
                Settings
              </AppText>
              <AppText variant="default" className="text-gray-500 text-sm mt-0.5">
                Account preferences
              </AppText>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
        </TouchableOpacity>

        {/* Divider */}
        <View className="h-px bg-gray-200 my-4" />

        {/* Logout Button */}
        <TouchableOpacity
          className="bg-white rounded-xl p-4 flex-row items-center justify-center border border-red-200"
          onPress={handleLogout}
          activeOpacity={0.7}
          disabled={logoutMutation.isPending}
        >
          <Ionicons name="log-out-outline" size={20} color="#dc2626" />
          <AppText variant="default" weight="semibold" className="text-red-600 ml-2">
            {logoutMutation.isPending ? "Logging out..." : "Logout"}
          </AppText>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
