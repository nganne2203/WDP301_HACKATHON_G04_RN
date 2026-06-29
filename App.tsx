import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AppNavigator } from './src/navigation/AppNavigator';
import { AuthProvider } from './src/core/session/AuthContext';
import { SocketProvider } from './src/services/socket/socketProvider';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <SocketProvider>
          <NavigationContainer>
            <AppNavigator />
            <StatusBar style="dark" />
          </NavigationContainer>
        </SocketProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
