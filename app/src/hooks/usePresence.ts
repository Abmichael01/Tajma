import { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { chatApi } from '@/api/chat';
import { useAuthStore } from '@/store/authStore';

export function usePresence() {
    const { isAuthenticated } = useAuthStore();

    useEffect(() => {
        if (!isAuthenticated) return;

        let retryCount = 0;
        const maxRetries = 3;

        const updateStatus = async (online: boolean) => {
            try {
                if (online) {
                    await chatApi.setOnline();
                    console.log('[Presence] Successfully set status to ONLINE');
                } else {
                    await chatApi.setOffline();
                    console.log('[Presence] Successfully set status to OFFLINE');
                }
                retryCount = 0; // Reset on success
            } catch (err) {
                console.error(`[Presence] Failed to set status to ${online ? 'ONLINE' : 'OFFLINE'}:`, err);
                if (retryCount < maxRetries) {
                    retryCount++;
                    setTimeout(() => updateStatus(online), 2000 * retryCount);
                }
            }
        };

        // Initial set online
        updateStatus(true);

        const handleAppStateChange = (nextAppState: AppStateStatus) => {
            if (nextAppState === 'active') {
                updateStatus(true);
            } else if (nextAppState === 'background' || nextAppState === 'inactive') {
                updateStatus(false);
            }
        };

        const subscription = AppState.addEventListener('change', handleAppStateChange);

        return () => {
            subscription.remove();
        };
    }, [isAuthenticated]);
}
