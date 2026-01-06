import { Stack } from "expo-router";

export default function UsersLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="[slug]"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}

