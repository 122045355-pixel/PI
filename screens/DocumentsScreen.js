import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import theme from '../theme';

const statusStyles = {
  approved: { label: 'Aprobado', color: theme.colors.success, background: '#dcfce7' },
  pending_review: { label: 'En revisión', color: theme.colors.warning, background: '#fef3c7' },
  draft: { label: 'Borrador', color: theme.colors.muted, background: theme.colors.surfaceMuted },
};

export default function DocumentsScreen({
  documents,
  teams,
  selectedTeamId,
  onSelectTeam,
  onOpenDocument,
  onNavigateHome,
}) {
  const filteredDocuments = selectedTeamId === 'all'
    ? documents
    : documents.filter((doc) => doc.teamId === selectedTeamId);

  const renderHeader = (title, subtitle) => (
    <View style={styles.headerCard}>
      <View>
        <Text style={styles.headerEyebrow}>Gestión documental</Text>
        <Text style={styles.headerTitle}>{title}</Text>
        <Text style={styles.headerSubtitle}>{subtitle}</Text>
      </View>
      <Pressable style={styles.ghostButton} onPress={onNavigateHome}>
        <Text style={styles.ghostButtonText}>Inicio</Text>
      </Pressable>
    </View>
  );

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {renderHeader('Documentos', 'Filtra por equipo y revisa el estado de cada documento.')}

      <View style={styles.searchBox}>
        <Text style={styles.searchPlaceholder}>Buscar documentos o etiquetas</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.teamFilters}>
        <Pressable
          style={[styles.filterChip, selectedTeamId === 'all' && styles.filterChipActive]}
          onPress={() => onSelectTeam('all')}
        >
          <Text style={[styles.filterChipText, selectedTeamId === 'all' && styles.filterChipTextActive]}>Todos</Text>
        </Pressable>
        {teams.map((team) => (
          <Pressable
            key={team.id}
            style={[styles.filterChip, selectedTeamId === team.id && styles.filterChipActive]}
            onPress={() => onSelectTeam(team.id)}
          >
            <Text style={[styles.filterChipText, selectedTeamId === team.id && styles.filterChipTextActive]}>{team.name}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.sectionCard}>
        {filteredDocuments.map((doc) => {
          const status = statusStyles[doc.status];
          return (
            <Pressable key={doc.id} style={styles.documentCard} onPress={() => onOpenDocument(doc)}>
              <View style={styles.documentCardTop}>
                <View style={styles.documentTitleWrap}>
                  <Text style={styles.documentTitle}>{doc.title}</Text>
                  <Text style={styles.documentSubtitle}>{doc.description}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: status.background }]}>
                  <Text style={[styles.statusBadgeText, { color: status.color }]}>{status.label}</Text>
                </View>
              </View>
              <View style={styles.documentMetaRow}>
                <Text style={styles.documentMeta}>{doc.teamName}</Text>
                <Text style={styles.documentMeta}>•</Text>
                <Text style={styles.documentMeta}>v{doc.currentVersion}</Text>
                <Text style={styles.documentMeta}>•</Text>
                <Text style={styles.documentMeta}>{doc.fileType}</Text>
              </View>
              <View style={styles.documentActions}>
                <Text style={styles.tagText}>{doc.tags.join(' · ')}</Text>
                <Pressable style={styles.outlineButton} onPress={() => onOpenDocument(doc)}>
                  <Text style={styles.outlineButtonText}>Abrir</Text>
                </Pressable>
              </View>
            </Pressable>
          );
        })}
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
  headerEyebrow: {
    color: theme.colors.primary,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
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
  searchBox: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchPlaceholder: {
    color: theme.colors.muted,
  },
  teamFilters: {
    marginBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: theme.colors.surfaceMuted,
    marginRight: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  filterChipActive: {
    backgroundColor: theme.colors.primary,
  },
  filterChipText: {
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: theme.colors.surface,
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
  documentCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 14,
    marginTop: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  documentCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  documentTitleWrap: {
    flex: 1,
    marginRight: 8,
  },
  documentTitle: {
    color: theme.colors.textPrimary,
    fontWeight: '700',
    marginBottom: 4,
  },
  documentSubtitle: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  documentMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
    alignItems: 'center',
  },
  documentMeta: {
    color: theme.colors.muted,
    fontSize: 12,
  },
  documentActions: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tagText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    flex: 1,
    marginRight: 8,
  },
  outlineButton: {
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  outlineButtonText: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
});
