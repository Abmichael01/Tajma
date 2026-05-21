// Receives data-only FCM messages from the backend (chat summary payloads)
// and builds the local notification with the inline-reply action attached.
//
// Why this exists: FCM `notification` messages don't carry expo-notifications
// categories to Android, so the reply button can't render. The workaround is
// to send data-only, intercept the payload here, and call scheduleNotification
// with `categoryIdentifier: "chat-message"` so the OS attaches the reply UI
// we registered via setNotificationCategoryAsync.
//
// Loaded once at app startup via a side-effect import in app/_layout.tsx.

let handlerInstalled = false;

export function installFcmBackgroundHandler(): void {
  if (handlerInstalled) {
    return;
  }
  handlerInstalled = true;

  // Dynamic imports so the file doesn't crash on older builds that lack
  // @react-native-firebase/messaging — useNotifications.ts uses the same
  // guard for token registration.
  (async () => {
    const messagingModule = await import(
      "@react-native-firebase/messaging"
    ).catch(() => null);
    const Notifications = await import("expo-notifications").catch(() => null);
    if (!messagingModule || !Notifications) {
      console.log("[fcm] handler skipped (firebase/messaging or notifications missing)");
      return;
    }
    const messaging = messagingModule.default;

    // Register the reply category BEFORE the handler runs — otherwise a push
    // arriving on cold-launch can render its local notification before the
    // category exists, and the reply button silently disappears.
    try {
      await Notifications.setNotificationCategoryAsync("chat-message", [
        {
          identifier: "REPLY",
          buttonTitle: "Reply",
          textInput: {
            submitButtonTitle: "Send",
            placeholder: "Type a reply…",
          },
          options: { opensAppToForeground: false },
        },
      ]);
    } catch (error: any) {
      console.warn(
        "[fcm] setNotificationCategoryAsync failed:",
        error?.message ?? error,
      );
    }

    const presentLocal = async (remoteMessage: any) => {
      const data = (remoteMessage?.data ?? {}) as Record<string, string>;
      if (data.type !== "chat_summary") {
        return;
      }
      const collapseId = data.collapse_id || "chat-summary";
      try {
        // Same identifier across collapsing pushes = OS replaces the existing
        // card instead of stacking — mirrors what collapse_key does upstream.
        // sound: false → no OS sound. The in-chat ding (useChatSounds) handles
        // audio feedback when the user is actually viewing the conversation,
        // which is the only context the user wants to hear a chime in.
        await Notifications.scheduleNotificationAsync({
          identifier: collapseId,
          content: {
            title: data.title || "New message",
            body: data.body || "",
            data,
            categoryIdentifier: "chat-message",
            sound: false,
            badge: data.badge ? Number(data.badge) : undefined,
          },
          // ChannelAwareTriggerInput: lets us route this immediate-delivery
          // notification through the silent "messages_v2" channel on Android
          // instead of the default channel. iOS ignores channelId.
          trigger: { channelId: "messages_v2" },
        });
      } catch (error: any) {
        console.warn("[fcm] schedule local failed:", error?.message ?? error);
      }
    };

    // Background / quit: handler signature must return a Promise per RNFirebase.
    messaging().setBackgroundMessageHandler(presentLocal);

    // Foreground: FCM doesn't auto-display data-only messages while the app
    // is open; the in-app banner store handles UX in that case (see
    // useNotifications.ts), but we still mirror to a local notification so
    // multi-window users on tablets see something.
    messaging().onMessage(presentLocal);

    console.log("[fcm] background + foreground handlers installed");
  })().catch((error) => {
    console.warn("[fcm] handler install failed:", error?.message ?? error);
  });
}
