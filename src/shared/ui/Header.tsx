import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Bell, LogOut, UserCircle } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../theme/colors';
import { initials } from '../../core/utils/format';
import type { User } from '../../core/api/types';

interface HeaderProps {
  title: string;
  subtitle?: string;
  user?: User | null;
  onProfilePress?: () => void;
  onNotificationsPress?: () => void;
  onLogoutPress?: () => void;
}

export function Header({
  title,
  subtitle,
  user,
  onProfilePress,
  onNotificationsPress,
  onLogoutPress,
}: HeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
      <View style={styles.textWrap}>
        <Text style={styles.title}>{title}</Text>
        {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      <View style={styles.actions}>
        {!!onNotificationsPress && (
          <TouchableOpacity style={styles.iconButton} onPress={onNotificationsPress}>
            <Bell color={Colors.textSecondary} size={19} />
          </TouchableOpacity>
        )}
        {!!onProfilePress && (
          <TouchableOpacity style={styles.avatar} onPress={onProfilePress}>
            <Text style={styles.avatarText}>{initials(user?.fullName, user?.email)}</Text>
          </TouchableOpacity>
        )}
        {!!onLogoutPress && (
          <TouchableOpacity style={styles.iconButton} onPress={onLogoutPress}>
            <LogOut color={Colors.textSecondary} size={18} />
          </TouchableOpacity>
        )}
        {!onProfilePress && !onNotificationsPress && !onLogoutPress && (
          <UserCircle color={Colors.textMuted} size={24} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderBottomColor: Colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 14,
    paddingHorizontal: 20,
  },
  textWrap: {
    flex: 1,
    paddingRight: 12,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  actions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    alignItems: 'center',
    borderColor: Colors.border,
    borderRadius: 18,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: Colors.blue100,
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  avatarText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '800',
  },
});
