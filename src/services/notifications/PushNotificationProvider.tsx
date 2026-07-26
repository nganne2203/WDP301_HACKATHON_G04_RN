import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useAuth } from '../../core/session/AuthContext';
import { notificationsApi } from '../../features/notifications/api/notificationsApi';
import { useNotificationStore } from '../../features/notifications/model/notificationStore';
import { navigationRef } from '../../navigation/navigationRef';

type PushData = Record<string, unknown> & {
  action?: string;
  competitionId?: string;
  roundId?: string;
  boardId?: string;
  teamId?: string;
  workshopId?: string;
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function stringValue(value: unknown) {
  return typeof value === 'string' && value ? value : undefined;
}

function navigateFromPush(data: PushData, retries = 5) {
  if (!navigationRef.isReady()) {
    if (retries > 0) setTimeout(() => navigateFromPush(data, retries - 1), 300);
    return;
  }

  const action = stringValue(data.action);
  const workshopId = stringValue(data.workshopId);
  const competitionId = stringValue(data.competitionId);
  const teamId = stringValue(data.teamId);

  if (action === 'RESULTS_PUBLISHED') {
    navigationRef.navigate('MainTabs', { screen: 'Results' });
    return;
  }

  if (action?.startsWith('JUDGE_')) {
    navigationRef.navigate('MainTabs', { screen: 'Judging' });
    return;
  }

  if (action === 'WORKSHOP_SPEAKER_ASSIGNED' && workshopId) {
    navigationRef.navigate('WorkshopDetail', { workshopId });
    return;
  }

  if (action?.startsWith('WORKSHOP_')) {
    navigationRef.navigate('MainTabs', { screen: 'Workshops' });
    return;
  }

  if (action === 'SUBMISSION_REVIEWED' && competitionId && teamId) {
    navigationRef.navigate('Submissions', { competitionId, teamId });
    return;
  }

  if (action?.startsWith('TEAM_') || action === 'MENTOR_BOARD_ASSIGNED') {
    navigationRef.navigate('MainTabs', { screen: 'Team' });
    return;
  }

  navigationRef.navigate('MainTabs', { screen: 'Notifications' });
}

async function registerDevicePushToken() {
  if (!Device.isDevice || (Platform.OS !== 'android' && Platform.OS !== 'ios')) return;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('business-updates', {
      name: 'Competition updates',
      description: 'Team, workshop, judging, deadline and result updates',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#2563EB',
      sound: 'default',
    });
  }

  const currentPermissions = await Notifications.getPermissionsAsync();
  const permissions = currentPermissions.status === 'granted'
    ? currentPermissions
    : await Notifications.requestPermissionsAsync();
  if (permissions.status !== 'granted') return;

  const configuredProjectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID;
  const easProjectId = Constants.easConfig?.projectId;
  const extraProjectId = Constants.expoConfig?.extra?.eas?.projectId;
  const projectId = configuredProjectId || easProjectId || extraProjectId;

  if (!projectId) {
    console.warn('Expo push token was not registered because the EAS project ID is missing.');
    return;
  }

  const token = await Notifications.getExpoPushTokenAsync({ projectId });
  await notificationsApi.registerPushToken(token.data, Platform.OS);
}

export function PushNotificationProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) return;

    registerDevicePushToken().catch((error) => {
      console.warn('Unable to register Expo push token.', error);
    });
  }, [isAuthenticated]);

  useEffect(() => {
    const receivedSubscription = Notifications.addNotificationReceivedListener(() => {
      useNotificationStore.getState().requestRefresh();
    });
    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      useNotificationStore.getState().requestRefresh();
      navigateFromPush(response.notification.request.content.data as PushData);
      Notifications.clearLastNotificationResponseAsync().catch(() => undefined);
    });

    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (response) {
          navigateFromPush(response.notification.request.content.data as PushData);
          return Notifications.clearLastNotificationResponseAsync();
        }
        return undefined;
      })
      .catch(() => undefined);
  }, [isAuthenticated]);

  return children;
}
