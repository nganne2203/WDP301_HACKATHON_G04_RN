import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  Bell,
  CalendarDays,
  ClipboardList,
  Presentation,
  UserCircle,
} from 'lucide-react-native';
import { Colors } from '../theme/colors';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { EventListScreen } from '../screens/EventListScreen';
import { EventDetailScreen } from '../screens/EventDetailScreen';
import { TimelineScreen } from '../screens/TimelineScreen';
import { WorkshopListScreen } from '../screens/WorkshopListScreen';
import { WorkshopDetailScreen } from '../screens/WorkshopDetailScreen';
import { NotificationCenterScreen } from '../screens/NotificationCenterScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { useAuth } from '../core/session/AuthContext';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  Events: undefined;
  Workshops: undefined;
  Notifications: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  MainTabs: undefined;
  EventDetail: { eventId: string };
  Timeline: { eventId: string; eventTitle?: string };
  WorkshopDetail: { workshopId: string };
};

export type AppNavigationParamList = AuthStackParamList & RootStackParamList;

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ color }) => {
          if (route.name === 'Events') return <CalendarDays color={color} size={20} />;
          if (route.name === 'Workshops') return <Presentation color={color} size={20} />;
          if (route.name === 'Notifications') return <Bell color={color} size={20} />;
          return <UserCircle color={color} size={20} />;
        },
      })}
    >
      <Tab.Screen name="Events" component={EventListScreen} />
      <Tab.Screen name="Workshops" component={WorkshopListScreen} />
      <Tab.Screen name="Notifications" component={NotificationCenterScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function AppStack() {
  return (
    <RootStack.Navigator>
      <RootStack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
      <RootStack.Screen name="EventDetail" component={EventDetailScreen} options={{ title: 'Event Detail' }} />
      <RootStack.Screen name="Timeline" component={TimelineScreen} options={{ title: 'Timeline' }} />
      <RootStack.Screen name="WorkshopDetail" component={WorkshopDetailScreen} options={{ title: 'Workshop Detail' }} />
    </RootStack.Navigator>
  );
}

function BootstrapScreen() {
  return (
    <View style={styles.bootstrap}>
      <ClipboardList color={Colors.primary} size={34} />
      <ActivityIndicator color={Colors.primary} style={styles.spinner} />
      <Text style={styles.bootstrapText}>Preparing your workspace...</Text>
    </View>
  );
}

export function AppNavigator() {
  const { isAuthenticated, isBootstrapping } = useAuth();

  if (isBootstrapping) return <BootstrapScreen />;
  return isAuthenticated ? <AppStack /> : <AuthNavigator />;
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.surface,
    borderTopColor: Colors.border,
    borderTopWidth: 1,
    height: 62,
    paddingBottom: 8,
    paddingTop: 8,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  bootstrap: {
    alignItems: 'center',
    backgroundColor: Colors.background,
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  spinner: {
    marginTop: 18,
  },
  bootstrapText: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginTop: 10,
  },
});
