import { useState, useEffect, useRef } from "react";
import { AppState } from "react-native";
import type * as ExpoNotifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationsApi } from "@/api/notifications";
import { deviceTokensApi } from "@/api/deviceTokens";
import { chatApi } from "@/api/chat";
import { useAuthStore } from "@/store/authStore";
import { useInAppNotificationStore } from "@/store/inAppNotificationStore";

// Notification category identifier shared with the FCM payload
// (apns.payload.aps.category in push_service.py). Defines the inline-reply
// action attached to every chat notification.
const CHAT_NOTIFICATION_CATEGORY = "chat-message";
const REPLY_ACTION_IDENTIFIER = "REPLY";

// --- Push Notification Registration Logic ---

type NotificationsModule = typeof import("expo-notifications");

let hasConfiguredNotificationHandler = false;

const configureNotificationHandler = (Notifications: NotificationsModule) => {
  if (hasConfiguredNotificationHandler) {
    return;
  }

  // Foreground suppression: when the app is in the foreground, the in-app
  // banner shown by InAppNotificationBanner handles the UX. Returning
  // shouldShowBanner/shouldPlaySound false here prevents a duplicate OS-level
  // toast on top of our own banner.
  Notifications.setNotificationHandler({
    handleNotification: async () => {
      const isActive = AppState.currentState === "active";
      return {
        shouldShowAlert: !isActive,
        shouldPlaySound: !isActive,
        shouldSetBadge: true,
        shouldShowBanner: !isActive,
        shouldShowList: true,
      };
    },
  });

  // Inline reply action attached to chat notifications. iOS renders this as
  // a text input on the notification card; Android renders a Reply button
  // that opens a text input inline (via NotificationCompat RemoteInput).
  // The category id MUST match what push_service.py sets on apns.aps.category.
  Notifications.setNotificationCategoryAsync(CHAT_NOTIFICATION_CATEGORY, [
    {
      identifier: REPLY_ACTION_IDENTIFIER,
      buttonTitle: "Reply",
      textInput: {
        submitButtonTitle: "Send",
        placeholder: "Type a reply…",
      },
      options: {
        opensAppToForeground: false,
      },
    },
  ]).catch((error) => {
    console.warn("[push] setNotificationCategoryAsync failed:", error);
  });

  hasConfiguredNotificationHandler = true;
};

// Handle an inline-reply response: extract the typed text + chat id from the
// notification, POST it to the chat send-message endpoint. Fires whether the
// app is foregrounded or backgrounded — Notifications.addNotificationResponseReceivedListener
// delivers in both cases.
const handleNotificationReply = async (
  response: ExpoNotifications.NotificationResponse,
) => {
  if (response.actionIdentifier !== REPLY_ACTION_IDENTIFIER) {
    return;
  }
  const typed = (response as any).userText as string | undefined;
  const data = (response.notification.request.content.data ?? {}) as Record<
    string,
    any
  >;
  const chatId = typeof data.chat_id === "string" ? data.chat_id : undefined;
  const notifId = response.notification.request.identifier;
  if (!typed || !chatId) {
    console.warn("[push] reply: missing text or chat_id", { typed, chatId });
    return;
  }
  try {
    await chatApi.sendMessage({
      chat: chatId,
      content: typed,
      message_type: "text",
    });
    console.log("[push] reply sent for chat", chatId);
    // If you replied, you've seen the messages — match WhatsApp by clearing
    // the unread state for this chat. Fire-and-forget; a failure here just
    // leaves the chat looking unread, which is recoverable in-app.
    chatApi
      .markAsRead(chatId)
      .catch((error) =>
        console.warn(
          "[push] mark-as-read after reply failed:",
          error?.response?.status,
          error?.message,
        ),
      );
  } catch (error: any) {
    console.warn(
      "[push] reply send failed:",
      error?.response?.status,
      error?.message,
    );
  }
  // Dismiss the notification regardless of send success — the OS spinner on
  // the Reply action keeps animating until the notification goes away, and
  // leaving a failed-send notification stuck on the lockscreen is worse than
  // clearing it (the user can retry from inside the chat).
  try {
    const Notifications = await import("expo-notifications");
    await Notifications.dismissNotificationAsync(notifId);
  } catch (error: any) {
    console.warn("[push] dismiss after reply failed:", error?.message ?? error);
  }
};

const shouldSkipPushNotifications = () => Constants.appOwnership === "expo";

export const usePushNotifications = () => {
  const [expoPushToken, setExpoPushToken] = useState<string | undefined>();
  const [notification, setNotification] = useState<
    ExpoNotifications.Notification | undefined
  >();
  const notificationListener = useRef<
    ExpoNotifications.EventSubscription | undefined
  >(undefined);
  const responseListener = useRef<
    ExpoNotifications.EventSubscription | undefined
  >(undefined);
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    let isMounted = true;

    const setupNotifications = async () => {
      console.log("[push] setupNotifications start, isAuthenticated=", isAuthenticated);
      if (shouldSkipPushNotifications()) {
        console.log("[push] BAIL: running in Expo Go (appOwnership=expo)");
        return;
      }

      const Notifications = await import("expo-notifications");
      if (!isMounted) {
        console.log("[push] BAIL: unmounted before Notifications loaded");
        return;
      }

      configureNotificationHandler(Notifications);
      console.log("[push] notification handler configured");

      notificationListener.current =
        Notifications.addNotificationReceivedListener((notification) => {
          setNotification(notification);
          // Belt-and-suspenders: if a push lands while foregrounded and the
          // WS event hasn't arrived yet, we still surface the banner. The
          // store dedupes on notification_id so we never show twice.
          if (AppState.currentState === "active") {
            const content = notification.request.content;
            const data = (content.data ?? {}) as Record<string, any>;
            const chatId = typeof data.chat_id === "string" && data.chat_id ? data.chat_id : undefined;
            useInAppNotificationStore.getState().show({
              id: String(data.notification_id ?? notification.request.identifier),
              title: content.title ?? "Tajma",
              body: content.body ?? "",
              type: String(data.type ?? "other"),
              chatId,
              deepLink: typeof data.deep_link === "string" ? data.deep_link : undefined,
            });
          }
        });

      responseListener.current =
        Notifications.addNotificationResponseReceivedListener((response) => {
          console.log(
            "Notification tapped:",
            response.notification.request.content.data,
            "action:",
            response.actionIdentifier,
          );
          if (response.actionIdentifier === REPLY_ACTION_IDENTIFIER) {
            void handleNotificationReply(response);
          }
        });

      if (!isAuthenticated) {
        console.log("[push] BAIL: isAuthenticated=false, skipping token register");
        setExpoPushToken(undefined);
        return;
      }

      console.log("[push] requesting Expo push token...");
      const token = await registerForPushNotificationsAsync(Notifications);
      console.log("[push] token result:", token ? token.slice(0, 40) + "..." : "<undefined>");
      if (isMounted) {
        setExpoPushToken(token);
        if (token && isAuthenticated) {
          console.log("[push] POST /device-tokens/ ...");
          deviceTokensApi
            .register(token, "expo")
            .then((r) => console.log("[push] register OK:", r))
            .catch((error) => {
              console.warn("[push] register FAILED:", error?.response?.status, error?.response?.data, error?.message);
            });
        } else {
          console.log("[push] NOT posting (token empty or auth dropped)");
        }
      }

      // FCM token for chat notifications (collapse + thread grouping). Dynamic
      // import so the app still boots if @react-native-firebase/messaging
      // isn't installed yet (e.g. running an older dev client build).
      try {
        const fcmToken = await registerForFcmTokenAsync();
        if (isMounted && fcmToken && isAuthenticated) {
          console.log("[push] POST /device-tokens/ (fcm) ...");
          deviceTokensApi
            .register(fcmToken, "fcm")
            .then((r) => console.log("[push] register OK (fcm):", r))
            .catch((error) => {
              console.warn(
                "[push] register FAILED (fcm):",
                error?.response?.status,
                error?.response?.data,
                error?.message,
              );
            });
        }
      } catch (error: any) {
        console.warn("[push] FCM registration skipped:", error?.message ?? error);
      }
    };

    setupNotifications().catch((error) => {
      console.warn("Push notification setup skipped:", error);
    });

    return () => {
      isMounted = false;
      notificationListener.current?.remove();
      responseListener.current?.remove();
      notificationListener.current = undefined;
      responseListener.current = undefined;
    };
  }, [isAuthenticated]);

  return { expoPushToken, notification };
};

async function registerForPushNotificationsAsync(
  Notifications: NotificationsModule,
) {
  console.log("[push] Device.isDevice=", Device.isDevice);
  if (!Device.isDevice) {
    console.log("[push] BAIL: not a physical device (emulator?)");
    return undefined;
  }

  // Omitting `sound` -> Android uses the user's OS-chosen tone. Channel sound is
  // immutable after creation, so the "_v2" suffix forces a fresh channel for
  // installs that already had the old custom-sound channel cached.
  await Notifications.setNotificationChannelAsync("default_v2", {
    name: "General",
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#FF231F7C",
  });
  // Chat channel: NO SOUND (set null). The user wants chat audio only when
  // they're actively viewing the conversation — that's handled by the
  // in-chat ding (useChatSounds.ts), not the OS notification. Channel sound
  // is immutable after creation, hence the "_v2" suffix to force a fresh
  // channel for installs that had the earlier sound-enabled "messages" one.
  await Notifications.setNotificationChannelAsync("messages_v2", {
    name: "Messages",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#FF231F7C",
    sound: null,
  });

  try {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    console.log("[push] existing permission status:", existingStatus);
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      console.log("[push] requesting permission...");
      const { status } = await Notifications.requestPermissionsAsync();
      console.log("[push] permission result:", status);
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      console.log("[push] BAIL: permission not granted, status=", finalStatus);
      return undefined;
    }

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;
    console.log("[push] projectId=", projectId);
    if (!projectId) {
      console.warn("[push] BAIL: Expo project ID missing");
      return undefined;
    }

    const expoToken = await Notifications.getExpoPushTokenAsync({ projectId });
    console.log("[push] Expo token obtained:", expoToken.data?.slice(0, 40) + "...");
    return expoToken.data;
  } catch (error: any) {
    console.warn("[push] EXCEPTION getting Expo push token:", error?.message ?? error);
    return undefined;
  }
}

// Fetch a native FCM registration token via @react-native-firebase/messaging.
// Used in addition to (not instead of) the Expo token — backend routes chat
// notifications via FCM (for collapse + thread-id) and everything else via
// Expo Push. Dynamic import keeps the app bootable when the firebase package
// isn't installed yet (e.g. older dev clients during the rollout).
async function registerForFcmTokenAsync(): Promise<string | undefined> {
  if (!Device.isDevice) {
    return undefined;
  }
  try {
    const messagingModule = await import(
      "@react-native-firebase/messaging"
    ).catch(() => null);
    if (!messagingModule) {
      console.log("[push] @react-native-firebase/messaging not installed; skipping FCM");
      return undefined;
    }
    const messaging = messagingModule.default;

    // iOS: explicit permission gate. Android auto-grants until target SDK 33;
    // expo-notifications already prompted earlier so this is a no-op there.
    const authStatus = await messaging().requestPermission();
    const granted =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;
    if (!granted) {
      console.log("[push] FCM permission denied, status=", authStatus);
      return undefined;
    }

    const fcmToken = await messaging().getToken();
    console.log("[push] FCM token obtained:", fcmToken?.slice(0, 40) + "...");
    return fcmToken;
  } catch (error: any) {
    console.warn("[push] EXCEPTION getting FCM token:", error?.message ?? error);
    return undefined;
  }
}

// --- Notification List & Action Hooks ---

export const useNotifications = (params?: { is_read?: boolean }) => {
  return useQuery({
    queryKey: ["notifications", params],
    queryFn: () => notificationsApi.list(params),
    staleTime: 60 * 1000,
  });
};

export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: string) =>
      notificationsApi.markAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({
        queryKey: ["notifications-unread-count"],
      });
    },
  });
};

export const useMarkAllNotificationsAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({
        queryKey: ["notifications-unread-count"],
      });
    },
  });
};

export const useDeleteNotification = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: string) =>
      notificationsApi.remove(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({
        queryKey: ["notifications-unread-count"],
      });
    },
  });
};

export const useCreateNotification = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      recipient: number;
      type: string;
      title: string;
      message: string;
      related_ad?: string;
      related_user?: number;
    }) => notificationsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({
        queryKey: ["notifications-unread-count"],
      });
    },
  });
};

export const useUnreadNotificationsCount = () => {
  return useQuery({
    queryKey: ["notifications-unread-count"],
    queryFn: () => notificationsApi.getUnreadCount(),
    staleTime: 60 * 1000,
  });
};
