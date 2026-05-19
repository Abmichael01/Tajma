/**
 * Hook wrapper around <CustomAlert> so callers can fire alerts imperatively,
 * the same way they would with React Native's `Alert.alert(...)`.
 *
 * Usage:
 *   const { alert, AlertHost } = useCustomAlert();
 *
 *   alert({
 *     title: "Delete chat",
 *     message: "Hide from your list?",
 *     icon: "trash-outline",
 *     buttons: [
 *       { text: "Cancel", style: "cancel" },
 *       { text: "Delete", style: "destructive", onPress: () => doIt() },
 *     ],
 *   });
 *
 *   // Render this anywhere inside your component tree (usually at the end):
 *   {AlertHost}
 *
 * Notes:
 * - Each button's onPress runs THEN the alert dismisses (matches CustomAlert).
 * - Only one alert visible at a time — calling alert() while another is open
 *   replaces the previous options (last-write-wins).
 */
import React, { useCallback, useState } from "react";
import type { Ionicons } from "@expo/vector-icons";

import CustomAlert from "@/components/ui/CustomAlert";

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: "default" | "cancel" | "destructive";
}

export interface AlertOptions {
  title: string;
  message?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  buttons?: AlertButton[];
}

export function useCustomAlert() {
  const [options, setOptions] = useState<AlertOptions | null>(null);

  const alert = useCallback((opts: AlertOptions) => {
    setOptions(opts);
  }, []);

  const dismiss = useCallback(() => setOptions(null), []);

  const AlertHost = options ? (
    <CustomAlert
      visible
      title={options.title}
      message={options.message}
      icon={options.icon}
      iconColor={options.iconColor}
      buttons={options.buttons}
      onDismiss={dismiss}
    />
  ) : null;

  return { alert, dismiss, AlertHost };
}
