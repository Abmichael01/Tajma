import { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { chatApi } from '@/api/chat';
import { useAuthStore } from '@/store/authStore';

export function usePresence() {
    const { isAuthenticated } = useAuthStore();

    useEffect(() => {
        if (!isAuthenticated) return;

        // Initial set online
        chatApi.setOnline().catch(err => console.error('Failed to set initial online status:', err));

        const handleAppStateChange = (nextAppState: AppStateStatus) => {
            if (nextAppState === 'active') {
                chatApi.setOnline().catch(err => console.error('Failed to set online status:', err));
            } else if (nextAppState === 'background' || nextAppState === 'inactive') {
                // We can set offline, or let the server handle it via heartbeat timeout
                // Setting it explicitly is safer for "instant" offline feel (like closing app)
                // but maybe we want to keep it "active" for a few minutes.
                // For now, let's keep it simple.
                chatApi.setOffline().catch(err => console.error('Failed to set offline status:', err));
            }
        };

        const subscription = AppState.addEventListener('change', handleAppStateChange);

        return () => {
            subscription.remove();
        };
    }, [isAuthenticated]);
}
