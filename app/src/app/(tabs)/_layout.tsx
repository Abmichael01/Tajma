import { Tabs, useRouter } from "expo-router";
import { TabBar } from "@/components/navigation/TabBar";
import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";

export default function TabsLayout() {
  const { isAuthenticated, hasHydrated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (hasHydrated && !isAuthenticated) {
      router.replace("/");
    }
  }, [isAuthenticated, hasHydrated, router]);

  if (hasHydrated && !isAuthenticated) return null;
  return (
    <Tabs
      initialRouteName="home"
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="alerts" />
      <Tabs.Screen name="add" />
      <Tabs.Screen name="chat" />
      <Tabs.Screen name="profile" />
      <Tabs.Screen name="search" />
    </Tabs>
  );
}