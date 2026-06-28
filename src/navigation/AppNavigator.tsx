import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  Bell,
  CalendarDays,
  ClipboardList,
  Images,
  Presentation,
  Scale,
  Trophy,
  UsersRound,
  UserCircle,
} from 'lucide-react-native';
import { Colors } from '../theme/colors';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { ForgotPasswordScreen } from '../screens/ForgotPasswordScreen';
import { EventListScreen } from '../screens/EventListScreen';
import { EventDetailScreen } from '../screens/EventDetailScreen';
import { TimelineScreen } from '../screens/TimelineScreen';
import { WorkshopListScreen } from '../screens/WorkshopListScreen';
import { WorkshopDetailScreen } from '../screens/WorkshopDetailScreen';
import { NotificationCenterScreen } from '../screens/NotificationCenterScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { TeamHomeScreen } from '../screens/TeamHomeScreen';
import { EventRegistrationScreen } from '../screens/EventRegistrationScreen';
import { CreateTeamScreen } from '../screens/CreateTeamScreen';
import { InviteMembersScreen } from '../screens/InviteMembersScreen';
import { InvitationDecisionScreen } from '../screens/InvitationDecisionScreen';
import { CheckInScreen } from '../screens/CheckInScreen';
import { AttendanceHistoryScreen } from '../screens/AttendanceHistoryScreen';
import { SubmissionsScreen } from '../screens/SubmissionsScreen';
import { SubmissionEditorScreen } from '../screens/SubmissionEditorScreen';
import { RepositoryViewerScreen } from '../screens/RepositoryViewerScreen';
import { RepositoryDetailScreen } from '../screens/RepositoryDetailScreen';
import { AiReviewDetailScreen } from '../screens/AiReviewDetailScreen';
import { JudgeWorkspaceScreen } from '../screens/JudgeWorkspaceScreen';
import { ScoreSheetScreen } from '../screens/ScoreSheetScreen';
import { ResultsScreen } from '../screens/ResultsScreen';
import { MediaHomeScreen } from '../screens/MediaHomeScreen';
import { MediaUploadScreen } from '../screens/MediaUploadScreen';
import { MediaDetailScreen } from '../screens/MediaDetailScreen';
import { useAuth } from '../core/session/AuthContext';
import type { MediaItem } from '../core/api/types';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type MainTabParamList = {
  Events: undefined;
  Workshops: undefined;
  Team: undefined;
  Media: undefined;
  Judging: undefined;
  Results: undefined;
  Notifications: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  MainTabs: undefined;
  EventDetail: { eventId: string };
  Timeline: { eventId: string; eventTitle?: string };
  WorkshopDetail: { workshopId: string };
  EventRegistration: { eventId: string };
  TeamHome: { eventId?: string };
  CreateTeam: { eventId: string };
  InviteMembers: { teamId: string; eventId: string };
  InvitationDecision: undefined;
  CheckIn: { eventId: string };
  AttendanceHistory: { eventId: string };
  Submissions: { eventId: string; teamId: string; eventTitle?: string; teamName?: string };
  SubmissionEditor: { eventId: string; teamId: string; roundId?: string; submissionId?: string };
  RepositoryViewer: { eventId: string; teamId: string; eventTitle?: string; teamName?: string };
  RepositoryDetail: { repositoryId: string };
  AiReviewDetail: { reviewId: string };
  MediaUpload: { eventId: string };
  MediaDetail: { media: MediaItem };
  ScoreSheet: {
    eventId: string;
    roundId: string;
    boardId: string;
    teamId: string;
    teamName: string;
    submissionId?: string;
    rubricId?: string;
    scoreSheetId?: string;
    repositoryId?: string;
  };
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
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </AuthStack.Navigator>
  );
}

function MainTabs() {
  const { hasPermission } = useAuth();
  const canScore = hasPermission('SCORE_VIEW') || hasPermission('SCORE_CREATE') || hasPermission('JUDGING_ASSIGN');
  const canViewResults = hasPermission('SCORE_VIEW') || hasPermission('RESULT_PUBLISH');
  const canUseMedia = hasPermission('EVENT_VIEW') || hasPermission('EVENT_UPDATE');

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
          if (route.name === 'Team') return <UsersRound color={color} size={20} />;
          if (route.name === 'Media') return <Images color={color} size={20} />;
          if (route.name === 'Judging') return <Scale color={color} size={20} />;
          if (route.name === 'Results') return <Trophy color={color} size={20} />;
          if (route.name === 'Notifications') return <Bell color={color} size={20} />;
          return <UserCircle color={color} size={20} />;
        },
      })}
    >
      <Tab.Screen name="Events" component={EventListScreen} />
      <Tab.Screen name="Workshops" component={WorkshopListScreen} />
      <Tab.Screen name="Team" component={TeamHomeScreen} />
      {canUseMedia && <Tab.Screen name="Media" component={MediaHomeScreen} />}
      {canScore && <Tab.Screen name="Judging" component={JudgeWorkspaceScreen} />}
      {canViewResults && <Tab.Screen name="Results" component={ResultsScreen} />}
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
      <RootStack.Screen name="EventRegistration" component={EventRegistrationScreen} options={{ title: 'Register' }} />
      <RootStack.Screen name="TeamHome" component={TeamHomeScreen} options={{ title: 'Team' }} />
      <RootStack.Screen name="CreateTeam" component={CreateTeamScreen} options={{ title: 'Create Team' }} />
      <RootStack.Screen name="InviteMembers" component={InviteMembersScreen} options={{ title: 'Invitations' }} />
      <RootStack.Screen name="InvitationDecision" component={InvitationDecisionScreen} options={{ title: 'Join Team' }} />
      <RootStack.Screen name="CheckIn" component={CheckInScreen} options={{ title: 'Check-in' }} />
      <RootStack.Screen name="AttendanceHistory" component={AttendanceHistoryScreen} options={{ title: 'Attendance' }} />
      <RootStack.Screen name="Submissions" component={SubmissionsScreen} options={{ title: 'Submissions' }} />
      <RootStack.Screen name="SubmissionEditor" component={SubmissionEditorScreen} options={{ title: 'Submission' }} />
      <RootStack.Screen name="RepositoryViewer" component={RepositoryViewerScreen} options={{ title: 'Repositories' }} />
      <RootStack.Screen name="RepositoryDetail" component={RepositoryDetailScreen} options={{ title: 'Repository Evidence' }} />
      <RootStack.Screen name="AiReviewDetail" component={AiReviewDetailScreen} options={{ title: 'AI Review' }} />
      <RootStack.Screen name="MediaUpload" component={MediaUploadScreen} options={{ title: 'Upload Media' }} />
      <RootStack.Screen name="MediaDetail" component={MediaDetailScreen} options={{ title: 'Media Detail' }} />
      <RootStack.Screen name="ScoreSheet" component={ScoreSheetScreen} options={{ title: 'Score Sheet' }} />
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
