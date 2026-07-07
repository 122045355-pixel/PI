import { useMemo, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import DashboardScreen from './screens/DashboardScreen';
import DocumentsScreen from './screens/DocumentsScreen';
import TeamsScreen from './screens/TeamsScreen';
import DocumentDetailScreen from './screens/DocumentDetailScreen';
import theme from './theme';

const teams = [
  {
    id: 'team-legal',
    name: 'Legal & Compliance',
    description: 'Contratos, políticas y aprobaciones regulatorias.',
    color: '#6366f1',
    members: ['Ana Torres', 'Luis Vega', 'Marta Ruiz'],
  },
  {
    id: 'team-sales',
    name: 'Ventas',
    description: 'Ofertas, acuerdos comerciales y documentación de cierre.',
    color: '#0f766e',
    members: ['Diego Mora', 'Paula Sol', 'Nico Díaz'],
  },
  {
    id: 'team-ops',
    name: 'Operaciones',
    description: 'Procesos internos, SOPs y trazabilidad de cambios.',
    color: '#dc2626',
    members: ['Sofía Lee', 'Tomás Cruz', 'Elena Paredes'],
  },
];

const initialDocuments = [
  {
    id: 'doc-1',
    title: 'Contrato de Proveedor',
    description: 'Documento legal con aprobación de comité y firma digital pendiente.',
    status: 'pending_review',
    currentVersion: '2.1',
    category: 'Legal',
    fileType: 'PDF',
    fileSize: '2.4 MB',
    updatedAt: 'Hace 2 h',
    teamId: 'team-legal',
    teamName: 'Legal & Compliance',
    tags: ['contrato', 'firma'],
    workflow: ['Revisión jurídica', 'Aprobación ejecutiva'],
    signatures: ['Ana Torres'],
    versions: ['2.1', '2.0', '1.9'],
  },
  {
    id: 'doc-2',
    title: 'Plan de Lanzamiento',
    description: 'Resumen operativo para el lanzamiento del nuevo producto.',
    status: 'approved',
    currentVersion: '4.0',
    category: 'Operaciones',
    fileType: 'DOCX',
    fileSize: '1.1 MB',
    updatedAt: 'Hoy',
    teamId: 'team-sales',
    teamName: 'Ventas',
    tags: ['lanzamiento', 'ventas'],
    workflow: ['Aprobación comercial', 'Validación marketing'],
    signatures: ['Diego Mora', 'Paula Sol'],
    versions: ['4.0', '3.8', '3.4'],
  },
  {
    id: 'doc-3',
    title: 'Manual de Calidad',
    description: 'Procedimiento actualizado para auditorías internas y validaciones.',
    status: 'draft',
    currentVersion: '1.3',
    category: 'Operaciones',
    fileType: 'PDF',
    fileSize: '860 KB',
    updatedAt: 'Ayer',
    teamId: 'team-ops',
    teamName: 'Operaciones',
    tags: ['calidad', 'revision'],
    workflow: ['Revisión de procesos'],
    signatures: [],
    versions: ['1.3', '1.2', '1.1'],
  },
];

export default function App() {
  const [activeView, setActiveView] = useState('dashboard');
  const [selectedTeamId, setSelectedTeamId] = useState('all');
  const [selectedDocumentId, setSelectedDocumentId] = useState(initialDocuments[0].id);

  const filteredDocuments = useMemo(() => {
    if (selectedTeamId === 'all') {
      return initialDocuments;
    }

    return initialDocuments.filter((doc) => doc.teamId === selectedTeamId);
  }, [selectedTeamId]);

  const selectedDocument = useMemo(() => {
    return initialDocuments.find((doc) => doc.id === selectedDocumentId) || filteredDocuments[0];
  }, [filteredDocuments, selectedDocumentId]);

  const openDocument = (doc) => {
    if (!doc) {
      return;
    }

    setSelectedDocumentId(doc.id);
    setActiveView('detail');
  };

  const goToDocuments = () => {
    setActiveView('documents');
  };

  const goToTeams = () => {
    setActiveView('teams');
  };

  const goHome = () => {
    setActiveView('dashboard');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.container}>
        {activeView === 'dashboard' && (
          <DashboardScreen
            documents={initialDocuments}
            teams={teams}
            onNavigateHome={goHome}
            onNavigateToDocuments={goToDocuments}
            onNavigateToTeams={goToTeams}
            onOpenDocument={openDocument}
          />
        )}

        {activeView === 'documents' && (
          <DocumentsScreen
            documents={filteredDocuments}
            teams={teams}
            selectedTeamId={selectedTeamId}
            onSelectTeam={setSelectedTeamId}
            onOpenDocument={openDocument}
            onNavigateHome={goHome}
          />
        )}

        {activeView === 'teams' && (
          <TeamsScreen
            teams={teams}
            documents={initialDocuments}
            onSelectTeam={setSelectedTeamId}
            onOpenDocument={openDocument}
            onNavigateHome={goHome}
            onNavigateToDocuments={goToDocuments}
          />
        )}

        {activeView === 'detail' && selectedDocument && (
          <DocumentDetailScreen
            document={selectedDocument}
            onNavigateBack={goToDocuments}
            onNavigateToDocuments={goToDocuments}
            onNavigateToTeams={goToTeams}
            onNavigateHome={goHome}
          />
        )}

        <View style={styles.bottomNav}>
          {[
            { id: 'dashboard', label: 'Inicio' },
            { id: 'documents', label: 'Documentos' },
            { id: 'teams', label: 'Equipos' },
          ].map((item) => (
            <Pressable
              key={item.id}
              style={[styles.navItem, activeView === item.id && styles.navItemActive]}
              onPress={() => setActiveView(item.id)}
            >
              <Text style={[styles.navItemText, activeView === item.id && styles.navItemTextActive]}>{item.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 8,
  },
  navItem: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
  },
  navItemActive: {
    backgroundColor: theme.colors.primary,
  },
  navItemText: {
    color: theme.colors.muted,
    fontWeight: '600',
  },
  navItemTextActive: {
    color: theme.colors.surface,
  },
});
