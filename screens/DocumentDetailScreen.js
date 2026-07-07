import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import theme from '../theme';

const statusStyles = {
  approved: { label: 'Aprobado', color: theme.colors.success, background: '#dcfce7' },
  pending_review: { label: 'En revisión', color: theme.colors.warning, background: '#fef3c7' },
  draft: { label: 'Borrador', color: theme.colors.muted, background: theme.colors.surfaceMuted },
};

export default function DocumentDetailScreen({ document, onNavigateBack, onNavigateToDocuments, onNavigateToTeams, onNavigateHome }) {
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

  if (!document) {
    return null;
  }

  const status = statusStyles[document.status];

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {renderHeader(document.title, 'Vista detallada con historial, flujo y firmas.')}

      <View style={styles.sectionCard}>
        <View style={styles.documentCardTop}>
          <View style={styles.documentTitleWrap}>
            <Text style={styles.documentTitle}>{document.title}</Text>
            <Text style={styles.documentSubtitle}>{document.description}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: status.background }]}>
            <Text style={[styles.statusBadgeText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>
        <View style={styles.documentMetaRow}>
          <Text style={styles.documentMeta}>{document.teamName}</Text>
          <Text style={styles.documentMeta}>•</Text>
          <Text style={styles.documentMeta}>{document.category}</Text>
          <Text style={styles.documentMeta}>•</Text>
          <Text style={styles.documentMeta}>v{document.currentVersion}</Text>
        </View>
        <View style={styles.detailActions}>
          <Pressable style={styles.primaryButton} onPress={onNavigateBack}>
            <Text style={styles.primaryButtonText}>Volver</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={onNavigateToTeams}>
            <Text style={styles.secondaryButtonText}>Equipos</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Historial de versiones</Text>
        {document.versions.map((version, index) => (
          <View key={version} style={styles.historyItem}>
            <Text style={styles.historyVersion}>Versión {version}</Text>
            <Text style={styles.historyText}>Cambio {index + 1} · {index === 0 ? 'Versión actual' : 'Modificación previa'}</Text>
          </View>
        ))}
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Flujo de validación</Text>
        {document.workflow.map((step, index) => (
          <View key={step} style={styles.timelineCard}>
            <Text style={styles.timelineTitle}>Paso {index + 1} · {step}</Text>
            <Text style={styles.timelineText}>Validación pendiente o aprobada según el flujo.</Text>
          </View>
        ))}
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Firmas digitales</Text>
        {document.signatures.length > 0 ? (
          document.signatures.map((signature) => (
            <View key={signature} style={styles.historyItem}>
              <Text style={styles.historyVersion}>{signature}</Text>
              <Text style={styles.historyText}>Firma verificada y registrada</Text>
            </View>
          ))
        ) : (
          <Text style={styles.timelineText}>Sin firmas aún. Se pueden agregar desde el flujo.</Text>
        )}
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
  detailActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
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
  sectionTitle: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  historyItem: {
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  historyVersion: {
    color: theme.colors.textPrimary,
    fontWeight: '700',
    marginBottom: 2,
  },
  historyText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
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
});
