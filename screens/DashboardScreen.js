import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import theme from '../theme';

const statusStyles = {
  approved: { label: 'Aprobado', color: theme.colors.success, background: '#dcfce7' },
  pending_review: { label: 'En revision', color: theme.colors.warning, background: '#fef3c7' },
  under_review: { label: 'En revision', color: theme.colors.warning, background: '#fef3c7' },
  uploaded: { label: 'Cargado', color: theme.colors.info, background: '#ccfbf1' },
  signature_pending: { label: 'Firma pendiente', color: theme.colors.warning, background: '#fef3c7' },
  signed: { label: 'Firmado', color: theme.colors.success, background: '#dcfce7' },
  rejected: { label: 'Rechazado', color: theme.colors.danger, background: '#fee2e2' },
  draft: { label: 'Borrador', color: theme.colors.muted, background: theme.colors.surfaceMuted },
};

export default function DashboardScreen({
  documents,
  teams,
  currentUser,
  onLogout,
  onNavigateHome,
  onNavigateToDocuments,
  onNavigateToTeams,
  onOpenDocument,
}) {
  const approvedCount = documents.filter((doc) => doc.status === 'approved').length;
  const pendingCount = documents.filter((doc) => ['pending_review', 'under_review', 'signature_pending'].includes(doc.status)).length;
  const signedCount = documents.filter((doc) => doc.status === 'signed' || doc.signatures.length > 0).length;
  const recentDocuments = [...documents].slice(0, 4);

  const renderHeader = (title, subtitle) => (
    <View style={styles.headerCard}>
      <View style={styles.headerCopy}>
        <Text style={styles.headerEyebrow}>Gestion documental</Text>
        <Text style={styles.headerTitle}>{title}</Text>
        <Text style={styles.headerSubtitle}>{subtitle}</Text>
      </View>
      <Pressable style={styles.ghostButton} onPress={onLogout || onNavigateHome}>
        <Text style={styles.ghostButtonText}>Salir</Text>
      </Pressable>
    </View>
  );

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {renderHeader('Panel de control', 'Documentos permitidos por rol y expediente.')}

      <View style={styles.heroCard}>
        <View style={styles.heroTextWrap}>
          <Text style={styles.heroEyebrow}>Sesion autorizada</Text>
          <Text style={styles.heroTitle}>{currentUser?.name}</Text>
          <Text style={styles.heroText}>{currentUser?.email}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>Rol: {currentUser?.role}</Text>
          </View>
        </View>
        <View style={styles.permissionList}>
          {(currentUser?.permissions || []).map((permission) => (
            <Text key={permission} style={styles.permissionText}>• {permission}</Text>
          ))}
          <Text style={styles.permissionText}>• Descarga de archivos bloqueada en movil</Text>
        </View>
        <View style={styles.heroActions}>
          <Pressable style={styles.primaryButton} onPress={onNavigateToDocuments}>
            <Text style={styles.primaryButtonText}>Ver documentos</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={onNavigateToTeams}>
            <Text style={styles.secondaryButtonText}>Ver casos</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.statsRow}>
        {[
          { label: 'Visibles', value: documents.length, accent: theme.colors.primary },
          { label: 'Aprobados', value: approvedCount, accent: theme.colors.success },
          { label: 'Pendientes', value: pendingCount, accent: theme.colors.warning },
          { label: 'Firmados', value: signedCount, accent: theme.colors.secondary },
        ].map((item) => (
          <View key={item.label} style={styles.statCard}>
            <Text style={[styles.statValue, { color: item.accent }]}>{item.value}</Text>
            <Text style={styles.statLabel}>{item.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Documentos recientes</Text>
          <Pressable onPress={onNavigateToDocuments}>
            <Text style={styles.linkText}>Ver todos</Text>
          </Pressable>
        </View>
        {recentDocuments.length === 0 ? (
          <Text style={styles.emptyText}>La API no devolvio documentos visibles para este rol.</Text>
        ) : recentDocuments.map((doc) => {
          const status = statusStyles[doc.status] || statusStyles.draft;
          return (
            <Pressable key={doc.id} style={styles.listItem} onPress={() => onOpenDocument(doc)}>
              <View style={styles.listItemInfo}>
                <Text style={styles.listItemTitle}>{doc.title}</Text>
                <Text style={styles.listItemSubtitle}>{doc.teamName} · v{doc.currentVersion}</Text>
              </View>
              <Text style={[styles.listItemMeta, { color: status.color }]}>{status.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Casos visibles</Text>
          <Text style={styles.linkText}>{teams.length} casos</Text>
        </View>
        {teams.map((team) => (
          <View key={team.id} style={styles.timelineCard}>
            <Text style={styles.timelineTitle}>{team.name}</Text>
            <Text style={styles.timelineText}>{team.description}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 120,
    backgroundColor: theme.colors.background,
  },
  headerCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 6,
  },
  headerCopy: {
    flex: 1,
    marginRight: 10,
  },
  headerEyebrow: {
    color: theme.colors.primary,
    fontSize: 12,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  headerTitle: {
    color: theme.colors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    marginTop: 4,
  },
  ghostButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: theme.colors.surfaceMuted,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  ghostButtonText: {
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
  heroCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 6,
  },
  heroTextWrap: {
    marginBottom: 14,
  },
  heroEyebrow: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  heroTitle: {
    color: theme.colors.textPrimary,
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 6,
  },
  heroText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    marginTop: 10,
    backgroundColor: theme.colors.primaryLight,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  roleBadgeText: {
    color: theme.colors.primary,
    fontWeight: '800',
  },
  permissionList: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 14,
    padding: 12,
    backgroundColor: theme.colors.surfaceMuted,
    marginBottom: 14,
  },
  permissionText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  heroActions: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  primaryButtonText: {
    color: theme.colors.surface,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  secondaryButtonText: {
    color: theme.colors.textPrimary,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flexBasis: '48%',
    backgroundColor: theme.colors.surface,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 4,
  },
  statValue: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 4,
    color: theme.colors.textPrimary,
  },
  statLabel: {
    color: theme.colors.textSecondary,
    fontSize: 13,
  },
  sectionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  linkText: {
    color: theme.colors.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  listItemInfo: {
    flex: 1,
    marginRight: 12,
  },
  listItemTitle: {
    color: theme.colors.textPrimary,
    fontWeight: '700',
    marginBottom: 4,
  },
  listItemSubtitle: {
    color: theme.colors.textSecondary,
    fontSize: 12,
  },
  listItemMeta: {
    color: theme.colors.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  timelineCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  timelineTitle: {
    color: theme.colors.textPrimary,
    fontWeight: '700',
    marginBottom: 2,
  },
  timelineText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
  },
  emptyText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
});
