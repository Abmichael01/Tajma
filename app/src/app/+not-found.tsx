import { Redirect, Stack } from "expo-router";

/**
 * Fallback route for 404 / Not Found errors.
 * Automatically redirects the user back to the home screen.
 */
export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Oops!" }} />
      <Redirect href="/" />
    </>
  );
}
