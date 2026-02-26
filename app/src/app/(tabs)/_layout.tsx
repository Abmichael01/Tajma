import { Tabs } from "expo-router";
import { TabBar } from "@/components/navigation/TabBar";

export default function TabsLayout() {
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
    </Tabs>
  );
}