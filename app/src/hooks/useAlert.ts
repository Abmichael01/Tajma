import { useState, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';

interface AlertButton {
    text: string;
    onPress?: () => void;
    style?: 'default' | 'cancel' | 'destructive';
}

interface AlertOptions {
    title: string;
    message?: string;
    icon?: keyof typeof Ionicons.glyphMap;
    iconColor?: string;
    buttons?: AlertButton[];
}

export function useAlert() {
    const [alertConfig, setAlertConfig] = useState<AlertOptions & { visible: boolean }>({
        visible: false,
        title: '',
    });

    const showAlert = useCallback((options: AlertOptions) => {
        setAlertConfig({
            ...options,
            visible: true,
        });
    }, []);

    const hideAlert = useCallback(() => {
        setAlertConfig(prev => ({ ...prev, visible: false }));
    }, []);

    return {
        alertConfig,
        showAlert,
        hideAlert,
    };
}
