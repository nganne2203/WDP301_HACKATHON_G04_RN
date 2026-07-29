import { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { AppNavigator } from './src/navigation/AppNavigator';
import { AuthProvider } from './src/core/session/AuthContext';
import { SocketProvider } from './src/services/socket/socketProvider';
import { navigationRef } from './src/navigation/navigationRef';
import { PushNotificationProvider } from './src/services/notifications/PushNotificationProvider';

export default function App() {
  useEffect(() => {
    const frameId = requestAnimationFrame(() => {
      SplashScreen.hideAsync().catch(() => undefined);
    });

    return () => cancelAnimationFrame(frameId);
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <SocketProvider>
          <NavigationContainer ref={navigationRef}>
            <PushNotificationProvider>
              <AppNavigator />
            </PushNotificationProvider>
          </NavigationContainer>
        </SocketProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
