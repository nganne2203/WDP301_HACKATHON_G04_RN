import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Radius, Shadow } from '../theme/colors';
import { myTeam, teamMembers } from '../data/mockData';

const avatarColors = [
  { bg: '#DBEAFE', text: '#1D4ED8' },
  { bg: '#DCFCE7', text: '#166534' },
  { bg: '#FEF3C7', text: '#92400E' },
];

export function TeamScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>My Team</Text>
          <Text style={s.headerSub}>Team details and member information</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 24 }]} showsVerticalScrollIndicator={false}>

        {/* Team Info */}
        <View style={s.card}>
          <View style={s.teamHeaderRow}>
            <View style={s.flex}>
              <Text style={s.teamName}>{myTeam.name}</Text>
              <Text style={s.teamTrack}>{myTeam.track}</Text>
            </View>
            <View style={s.boardBadge}>
              <Text style={s.boardBadgeText}>{myTeam.board}</Text>
            </View>
          </View>
          <View style={s.divider} />
          <View style={s.infoRow}><Text style={s.infoIcon}>🐙</Text><Text style={s.infoLink} numberOfLines={1}>{myTeam.repo}</Text></View>
          <View style={s.infoRow}><Text style={s.infoIcon}>👥</Text><Text style={s.infoText}>{myTeam.memberCount} members</Text></View>
        </View>

        {/* Members */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>Team Members</Text>
          <View style={{ height: 12 }} />
          {teamMembers.map((member, i) => (
            <View key={i} style={[s.memberRow, i < teamMembers.length - 1 && s.memberBorder]}>
              <View style={[s.avatar, { backgroundColor: avatarColors[i % avatarColors.length].bg }]}>
                <Text style={[s.avatarText, { color: avatarColors[i % avatarColors.length].text }]}>
                  {member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </Text>
              </View>
              <View style={s.memberInfo}>
                <View style={s.nameRow}>
                  <Text style={s.memberName}>{member.name}</Text>
                  {member.role === 'Team Leader' && <Text style={{ fontSize: 13 }}> 👑</Text>}
                  {member.isMe && (
                    <View style={s.youBadge}><Text style={s.youText}>You</Text></View>
                  )}
                </View>
                <Text style={s.memberEmail}>{member.email}</Text>
                <Text style={s.memberRole}>{member.role}</Text>
              </View>
              <View style={[s.checkinBadge, member.checkedIn ? s.checkinOn : s.checkinOff]}>
                <Text style={[s.checkinText, member.checkedIn ? s.checkinTextOn : s.checkinTextOff]}>
                  {member.checkedIn ? '✓ In' : 'Pending'}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Board Info */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>Judging Board</Text>
          <View style={{ height: 12 }} />
          <View style={s.statsRow}>
            <View style={s.statItem}>
              <Text style={s.statLabel}>Board</Text>
              <Text style={s.statValue}>{myTeam.board}</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statItem}>
              <Text style={s.statLabel}>Track</Text>
              <Text style={s.statValue} numberOfLines={1}>{myTeam.track}</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statItem}>
              <Text style={s.statLabel}>Members</Text>
              <Text style={s.statValue}>{myTeam.memberCount}</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>Quick Actions</Text>
          <View style={{ height: 12 }} />
          <TouchableOpacity style={s.actionRow} activeOpacity={0.7}>
            <Text style={s.actionIcon}>🐙</Text>
            <View style={s.flex}>
              <Text style={s.actionLabel}>View Repository</Text>
              <Text style={s.actionSub} numberOfLines={1}>{myTeam.repo}</Text>
            </View>
            <Text style={s.actionArrow}>›</Text>
          </TouchableOpacity>
          <View style={s.actionDivider} />
          <TouchableOpacity style={s.actionRow} activeOpacity={0.7}>
            <Text style={s.actionIcon}>📬</Text>
            <View style={s.flex}>
              <Text style={s.actionLabel}>Contact Team Leader</Text>
              <Text style={s.actionSub}>alice.chen@fpt.edu.vn</Text>
            </View>
            <Text style={s.actionArrow}>›</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: Colors.background },
  header: { backgroundColor: Colors.surface, paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  headerSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  scroll: { padding: 16, gap: 14 },

  card: { backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, padding: 16, ...Shadow.sm },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },

  teamHeaderRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 },
  teamName: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  teamTrack: { fontSize: 13, color: Colors.textSecondary, marginTop: 3 },
  boardBadge: { backgroundColor: Colors.gray100, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 4 },
  boardBadgeText: { fontSize: 12, fontWeight: '600', color: Colors.textPrimary },
  divider: { height: 1, backgroundColor: Colors.border, marginBottom: 14 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  infoIcon: { fontSize: 15, marginRight: 8 },
  infoText: { fontSize: 14, color: Colors.textPrimary },
  infoLink: { fontSize: 13, color: Colors.primary, flex: 1 },

  memberRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  memberBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarText: { fontSize: 14, fontWeight: '700' },
  memberInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  memberName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  youBadge: { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.sm, paddingHorizontal: 6, paddingVertical: 1, marginLeft: 5 },
  youText: { fontSize: 10, color: Colors.textSecondary, fontWeight: '500' },
  memberEmail: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  memberRole: { fontSize: 11, color: Colors.textMuted, marginTop: 1 },
  checkinBadge: { borderRadius: Radius.sm, paddingHorizontal: 8, paddingVertical: 4, minWidth: 58, alignItems: 'center' },
  checkinOn: { backgroundColor: Colors.greenLight },
  checkinOff: { backgroundColor: Colors.gray100 },
  checkinText: { fontSize: 11, fontWeight: '600' },
  checkinTextOn: { color: Colors.greenDark },
  checkinTextOff: { color: Colors.textMuted },

  statsRow: { flexDirection: 'row', borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, overflow: 'hidden' },
  statItem: { flex: 1, padding: 12, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: Colors.border },
  statLabel: { fontSize: 11, color: Colors.textMuted, marginBottom: 4 },
  statValue: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center' },

  actionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  actionIcon: { fontSize: 20, marginRight: 12 },
  actionLabel: { fontSize: 14, fontWeight: '500', color: Colors.textPrimary },
  actionSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
  actionArrow: { fontSize: 22, color: Colors.textMuted },
  actionDivider: { height: 1, backgroundColor: Colors.border },
});
