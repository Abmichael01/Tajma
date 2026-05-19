import { useState, useEffect, useRef } from "react";
import { AppState } from "react-native";
import type * as ExpoNotifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationsApi } from "@/api/notifications";
import { deviceTokensApi } from "@/api/deviceTokens";
import { useAuthStore } from "@/store/authStore";
import { useInAppNotificationStore } from "@/store/inAppNotificationStore";

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

  hasConfiguredNotificationHandler = true;
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
          );
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

  await Notifications.setNotificationChannelAsync("default", {
    name: "default",
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#FF231F7C",
    // Custom notification sound bundled via expo-notifications plugin in app.json.
    // The file is at assets/sounds/notification.wav — Expo prebuild copies it
    // into android/app/src/main/res/raw/ so Android can find it by filename.
    sound: "notification.wav",
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
