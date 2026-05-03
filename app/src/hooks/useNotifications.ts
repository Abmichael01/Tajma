import { useState, useEffect, useRef } from "react";
import { Platform } from "react-native";
import type * as ExpoNotifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationsApi } from "@/api/notifications";
import { authApi } from "@/api/auth";
import { useAuthStore } from "@/store/authStore";

// --- Push Notification Registration Logic ---

type NotificationsModule = typeof import("expo-notifications");

let hasConfiguredNotificationHandler = false;

const configureNotificationHandler = (Notifications: NotificationsModule) => {
  if (hasConfiguredNotificationHandler) {
    return;
  }

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
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
      if (shouldSkipPushNotifications()) {
        return;
      }

      const Notifications = await import("expo-notifications");
      if (!isMounted) {
        return;
      }

      configureNotificationHandler(Notifications);

      notificationListener.current =
        Notifications.addNotificationReceivedListener((notification) => {
          setNotification(notification);
        });

      responseListener.current =
        Notifications.addNotificationResponseReceivedListener((response) => {
          console.log(
            "Notification tapped:",
            response.notification.request.content.data,
          );
        });

      if (!isAuthenticated) {
        setExpoPushToken(undefined);
        return;
      }

      const token = await registerForPushNotificationsAsync(Notifications);
      if (isMounted) {
        setExpoPushToken(token);
        if (token && isAuthenticated) {
          authApi
            .updateFCMToken(token)
            .catch((error) => console.warn("Failed to sync FCM token:", error));
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
  if (!Device.isDevice) {
    return undefined;
  }

  if (Platform.OS !== "android") {
    return undefined;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  try {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      return undefined;
    }

    const devicePushToken = await Notifications.getDevicePushTokenAsync();
    if (devicePushToken.type !== "android") {
      return undefined;
    }

    return typeof devicePushToken.data === "string"
      ? devicePushToken.data
      : JSON.stringify(devicePushToken.data);
  } catch (error) {
    console.warn("Error getting FCM token:", error);
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
