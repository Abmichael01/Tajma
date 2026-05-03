import React from 'react';
import { View, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScreenHeader from '@/components/ui/ScreenHeader';
import AppText from '@/components/ui/AppText';
import { useReports } from '@/hooks/useSupport';
import { format } from 'date-fns';
import * as Haptics from 'expo-haptics';

export default function SupportListScreen() {
  const router = useRouter();
  const { data: reports, isLoading, refetch } = useReports();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-orange-500 bg-orange-50 border-orange-100';
      case 'under_review': return 'text-blue-500 bg-blue-50 border-blue-100';
      case 'resolved': return 'text-green-500 bg-green-50 border-green-100';
      case 'dismissed': return 'text-gray-500 bg-gray-50 border-gray-100';
      default: return 'text-gray-500 bg-gray-50 border-gray-100';
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push(`/profile/support/${item.id}`);
      }}
      className="bg-white mx-6 my-2 p-5 rounded-[24px] border border-gray-50 shadow-sm"
    >
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-row items-center gap-2">
          <View className="w-8 h-8 rounded-full bg-slate-50 items-center justify-center">
            <Ionicons 
              name={item.report_type === 'support' ? 'help-circle' : 'alert-circle'} 
              size={18} 
              color="#64748B" 
            />
          </View>
          <AppText weight="bold" className="text-slate-900 text-base capitalize">
            {item.report_type.replace('_', ' ')}
          </AppText>
        </View>
        <View className={`px-3 py-1 rounded-full border ${getStatusColor(item.status)}`}>
          <AppText className="text-[10px] font-bold uppercase tracking-wider">
            {item.status.replace('_', ' ')}
          </AppText>
        </View>
      </View>

      <AppText className="text-slate-600 text-[14px] leading-5 mb-3" numberOfLines={2}>
        {item.description}
      </AppText>

      <View className="flex-row justify-between items-center pt-3 border-t border-gray-50">
        <AppText className="text-slate-400 text-[11px] font-medium">
          Ticket ID: {item.id.slice(0, 8).toUpperCase()}
        </AppText>
        <AppText className="text-slate-400 text-[11px] font-medium">
          {format(new Date(item.created_at), 'MMM dd, yyyy')}
        </AppText>
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-gray-50/50">
      <ScreenHeader 
        title="Support Tickets" 
        subtitle="Manage your reports and requests"
        rightElement={
          <TouchableOpacity
            onPress={() => router.push('/profile/support/create')}
            className="w-10 h-10 bg-white/20 rounded-full items-center justify-center"
          >
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        }
      />

      <FlatList
        data={reports || []}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF4F18" />
        }
        ListEmptyComponent={
          !isLoading ? (
            <View className="flex-1 items-center justify-center p-10 mt-20">
              <View className="w-20 h-20 bg-white rounded-full items-center justify-center mb-6 shadow-sm">
                <Ionicons name="chatbox-ellipses-outline" size={40} color="#CBD5E1" />
              </View>
              <AppText weight="bold" className="text-slate-900 text-xl text-center">No active tickets</AppText>
              <AppText className="text-slate-400 text-center mt-2">
                If you have an issue or feedback, feel free to create a new ticket.
              </AppText>
              <TouchableOpacity
                onPress={() => router.push('/profile/support/create')}
                className="mt-8 bg-primary px-10 py-4 rounded-full shadow-lg shadow-primary/30"
              >
                <AppText weight="bold" className="text-white text-base">Create Ticket</AppText>
              </TouchableOpacity>
            </View>
          ) : null
        }
      />
    </View>
  );
}
