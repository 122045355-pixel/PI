import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import theme from '../theme';

export default function TeamsScreen({ teams, documents, onSelectTeam, onOpenDocument, onNavigateHome, onNavigateToDocuments }) {
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
      {renderHeader('Equipos de trabajo', 'Entra a distintos grupos para ver solo lo que corresponde a cada uno.')}

      {teams.map((team) => {
        const teamDocuments = documents.filter((doc) => doc.teamId === team.id);
        return (
          <View key={team.id} style={styles.teamCard}>
            <View style={styles.teamCardHeader}>
              <View style={[styles.teamAvatar, { backgroundColor: `${team.color}20` }]}> 
                <Text style={[styles.teamAvatarText, { color: team.color }]}>👥</Text>
              </View>
              <View style={styles.teamTitleWrap}>
                <Text style={styles.sectionTitle}>{team.name}</Text>
                <Text style={styles.documentSubtitle}>{team.description}</Text>
              </View>
            </View>
            <View style={styles.memberWrap}>
              {team.members.map((member) => (
                <View key={member} style={styles.memberPill}>
                  <Text style={styles.memberText}>{member}</Text>
                </View>
              ))}
            </View>
            <View style={styles.teamActions}>
              <Pressable
                style={styles.primaryButton}
                onPress={() => {
                  onSelectTeam(team.id);
                  onNavigateToDocuments();
                }}
              >
                <Text style={styles.primaryButtonText}>Ver documentos</Text>
              </Pressable>
              <Pressable
                style={styles.secondaryButton}
                onPress={() => onOpenDocument(teamDocuments[0] || documents[0])}
              >
                <Text style={styles.secondaryButtonText}>Detalle</Text>
              </Pressable>
            </View>
          </View>
        );
      })}
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
  sectionTitle: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  documentSubtitle: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  teamCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 4,
  },
  teamCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  teamAvatar: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  teamAvatarText: {
    fontSize: 20,
  },
  teamTitleWrap: {
    flex: 1,
  },
  memberWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  memberPill: {
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  memberText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
  },
  teamActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
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
});
