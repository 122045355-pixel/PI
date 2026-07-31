import { useEffect, useMemo, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import DashboardScreen from './screens/DashboardScreen';
import DocumentsScreen from './screens/DocumentsScreen';
import TeamsScreen from './screens/TeamsScreen';
import DocumentDetailScreen from './screens/DocumentDetailScreen';
import LoginScreen from './screens/LoginScreen';
import RoleActionsScreen from './screens/RoleActionsScreen';
import {
  createApprovalRequest,
  createSignatureRequest,
  decideApprovalRequest,
  getCaseDocuments,
  getCases,
  getDocumentView,
  getProfile,
  login,
  logout,
  signSignatureRequest,
} from './services/apiClient';
import theme from './theme';

const rolePermissions = {
  interesado: ['Ver documentos personales propios', 'Ver libelos propios', 'Firmar cuando sea solicitado'],
  testigo: ['Ver identificacion propia', 'Ver libelos propios', 'Firmar cuando sea solicitado'],
  abogado: ['Ver libelos de clientes asignados', 'Consultar estado de expediente'],
  juez: ['Ver casos activos', 'Autorizar documentos', 'Firmar documentos asignados', 'Descarga solo en web'],
  notario: ['Acceso documental completo', 'Autorizar documentos', 'Firmar y solicitar multifirma', 'Descarga solo en web'],
  admin_ti: ['Gestion tecnica', 'Auditoria operativa', 'Sin descarga movil'],
  admin: ['Gestion tecnica', 'Auditoria operativa', 'Sin descarga movil'],
};

function normalizeDocument(document, caseItem) {
  return {
    id: String(document.id),
    apiId: document.id,
    title: document.title,
    description: document.description || 'Documento legal protegido por permisos de rol.',
    status: document.status || 'draft',
    currentVersion: String(document.current_version || 0),
    category: document.classification || 'legal',
    fileType: 'PDF',
    fileSize: 'Protegido',
    updatedAt: document.updated_at ? new Date(document.updated_at).toLocaleDateString() : 'Sin fecha',
    teamId: `case-${document.case_id}`,
    teamName: caseItem?.title || `Caso ${document.case_id}`,
    tags: [document.document_type || 'documento', document.classification || 'legal'],
    workflow: [
      document.requires_approval ? 'Requiere visto bueno' : 'Sin visto bueno requerido',
      document.requires_signature ? 'Requiere firma digital' : 'Sin firma requerida',
    ],
    signatures: document.status === 'signed' ? ['Firma registrada'] : [],
    versions: [String(document.current_version || 0)],
    downloadAllowed: false,
  };
}

export default function App() {
  const [activeView, setActiveView] = useState('dashboard');
  const [selectedTeamId, setSelectedTeamId] = useState('all');
  const [selectedDocumentId, setSelectedDocumentId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [cases, setCases] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadProtectedData = async () => {
    setLoading(true);
    setError('');

    try {
      const profile = await getProfile();
      const allowedCases = await getCases();
      const documentsByCase = await Promise.all(
        allowedCases.map(async (caseItem) => {
          const caseDocuments = await getCaseDocuments(caseItem.id);
          return caseDocuments.map((document) => normalizeDocument(document, caseItem));
        })
      );

      const visibleDocuments = documentsByCase.flat();
      setCurrentUser({
        id: profile.user_id,
        name: profile.name,
        email: profile.email,
        role: profile.role,
        permissions: rolePermissions[profile.role] || ['Consulta limitada por API'],
      });
      setCases(allowedCases);
      setDocuments(visibleDocuments);
      setSelectedDocumentId((currentSelectedId) => currentSelectedId || visibleDocuments[0]?.id || null);
      return visibleDocuments;
    } catch (loadError) {
      await logout();
      setCurrentUser(null);
      setCases([]);
      setDocuments([]);
      setError(loadError.message || 'No fue posible cargar la sesion.');
      return [];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProtectedData();
  }, []);

  const teams = useMemo(() => {
    return cases.map((caseItem) => ({
      id: `case-${caseItem.id}`,
      name: caseItem.title,
      description: caseItem.description || `Estado: ${caseItem.status}`,
      color: theme.colors.primary,
      members: [],
    }));
  }, [cases]);

  const filteredDocuments = useMemo(() => {
    if (selectedTeamId === 'all') {
      return documents;
    }

    return documents.filter((doc) => doc.teamId === selectedTeamId);
  }, [documents, selectedTeamId]);

  const selectedDocument = useMemo(() => {
    return documents.find((doc) => doc.id === selectedDocumentId) || filteredDocuments[0];
  }, [documents, filteredDocuments, selectedDocumentId]);

  const handleLogin = async (email, password) => {
    await login(email, password);
    await loadProtectedData();
  };

  const handleLogout = async () => {
    await logout();
    setCurrentUser(null);
    setCases([]);
    setDocuments([]);
    setSelectedDocumentId(null);
    setActiveView('dashboard');
  };

  const openDocument = async (doc) => {
    if (!doc) {
      return;
    }

    try {
      const viewData = await getDocumentView(doc.apiId);
      const enrichedDocument = {
        ...doc,
        downloadAllowed: viewData.download_allowed,
        currentFile: viewData.current_file,
      };

      setDocuments((currentDocuments) => currentDocuments.map((item) => (
        item.id === doc.id ? enrichedDocument : item
      )));
      setSelectedDocumentId(doc.id);
      setActiveView('detail');
    } catch (viewError) {
      setError(viewError.message || 'No tienes permiso para visualizar este documento.');
    }
  };

  const createApproval = async (documentId, payload) => {
    const result = await createApprovalRequest(documentId, payload);
    await loadProtectedData();
    return result;
  };

  const decideApproval = async (requestId, payload) => {
    const result = await decideApprovalRequest(requestId, payload);
    await loadProtectedData();
    return result;
  };

  const createSignature = async (documentId, payload) => {
    const result = await createSignatureRequest(documentId, payload);
    await loadProtectedData();
    return result;
  };

  const signRequest = async (requestId, payload) => {
    const result = await signSignatureRequest(requestId, payload);
    await loadProtectedData();
    return result;
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

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator color={theme.colors.primary} />
        <Text style={styles.loadingText}>Validando sesion segura</Text>
      </SafeAreaView>
    );
  }

  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.container}>
        {error ? (
          <Pressable style={styles.errorBanner} onPress={() => setError('')}>
            <Text style={styles.errorBannerText}>{error}</Text>
          </Pressable>
        ) : null}

        {activeView === 'dashboard' && (
          <DashboardScreen
            documents={documents}
            teams={teams}
            currentUser={currentUser}
            onLogout={handleLogout}
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
            currentUser={currentUser}
            onSelectTeam={setSelectedTeamId}
            onOpenDocument={openDocument}
            onNavigateHome={goHome}
          />
        )}

        {activeView === 'teams' && (
          <TeamsScreen
            teams={teams}
            documents={documents}
            onSelectTeam={setSelectedTeamId}
            onOpenDocument={openDocument}
            onNavigateHome={goHome}
            onNavigateToDocuments={goToDocuments}
          />
        )}

        {activeView === 'actions' && (
          <RoleActionsScreen
            currentUser={currentUser}
            documents={documents}
            onNavigateHome={goHome}
            onCreateApproval={createApproval}
            onDecideApproval={decideApproval}
            onCreateSignatureRequest={createSignature}
            onSignRequest={signRequest}
          />
        )}

        {activeView === 'detail' && selectedDocument && (
          <DocumentDetailScreen
            document={selectedDocument}
            currentUser={currentUser}
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
            { id: 'teams', label: 'Casos' },
            { id: 'actions', label: 'Acciones' },
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    color: theme.colors.textSecondary,
    marginTop: 10,
    fontWeight: '700',
  },
  errorBanner: {
    position: 'absolute',
    top: 8,
    left: 16,
    right: 16,
    zIndex: 20,
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 14,
    padding: 12,
  },
  errorBannerText: {
    color: theme.colors.danger,
    fontWeight: '700',
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
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
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  navItemActive: {
    backgroundColor: theme.colors.primary,
  },
  navItemText: {
    color: theme.colors.muted,
    fontWeight: '600',
    fontSize: 12,
  },
  navItemTextActive: {
    color: theme.colors.surface,
  },
});
