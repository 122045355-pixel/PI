import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import theme from '../theme';

const approverRoles = new Set(['juez', 'notario', 'admin', 'admin_ti', 'aprobador', 'revisor']);
const signatureRequesterRoles = new Set(['juez', 'notario', 'admin', 'admin_ti', 'aprobador']);
const signerRoles = new Set(['juez', 'notario', 'abogado']);

export default function RoleActionsScreen({
  currentUser,
  documents,
  onNavigateHome,
  onCreateApproval,
  onDecideApproval,
  onCreateSignatureRequest,
  onSignRequest,
}) {
  const [selectedDocumentId, setSelectedDocumentId] = useState(documents[0]?.apiId ? String(documents[0].apiId) : '');
  const [approvalReviewerId, setApprovalReviewerId] = useState('');
  const [approvalComment, setApprovalComment] = useState('');
  const [approvalRequestId, setApprovalRequestId] = useState('');
  const [approvalDecision, setApprovalDecision] = useState('approved');
  const [signatureSignerId, setSignatureSignerId] = useState('');
  const [signatureOrder, setSignatureOrder] = useState('1');
  const [signatureMode, setSignatureMode] = useState('sequential');
  const [signatureRequestId, setSignatureRequestId] = useState('');
  const [signatureVersionId, setSignatureVersionId] = useState('');
  const [signatureHash, setSignatureHash] = useState('');
  const [loadingAction, setLoadingAction] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const role = currentUser?.role;
  const canApprove = approverRoles.has(role);
  const canRequestSignature = signatureRequesterRoles.has(role);
  const canSign = signerRoles.has(role) || role === 'admin' || role === 'admin_ti';

  const selectedDocument = useMemo(() => {
    return documents.find((document) => String(document.apiId) === selectedDocumentId);
  }, [documents, selectedDocumentId]);

  const runAction = async (actionName, callback) => {
    setError('');
    setResult(null);
    setLoadingAction(actionName);

    try {
      const payload = await callback();
      setResult(payload);
    } catch (actionError) {
      setError(actionError.message || 'No fue posible completar la accion.');
    } finally {
      setLoadingAction('');
    }
  };

  const renderHeader = () => (
    <View style={styles.headerCard}>
      <View style={styles.headerCopy}>
        <Text style={styles.headerEyebrow}>Acciones moviles</Text>
        <Text style={styles.headerTitle}>Flujo documental</Text>
        <Text style={styles.headerSubtitle}>Rol activo: {role}</Text>
      </View>
      <Pressable style={styles.ghostButton} onPress={onNavigateHome}>
        <Text style={styles.ghostButtonText}>Inicio</Text>
      </Pressable>
    </View>
  );

  const renderDocumentPicker = () => (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>Documento seleccionado</Text>
      <TextInput
        value={selectedDocumentId}
        onChangeText={setSelectedDocumentId}
        keyboardType="number-pad"
        placeholder="ID de documento"
        placeholderTextColor={theme.colors.muted}
        style={styles.input}
      />
      <Text style={styles.helperText}>
        {selectedDocument ? `${selectedDocument.title} · ${selectedDocument.teamName}` : 'Escribe el ID de un documento visible por tu rol.'}
      </Text>
    </View>
  );

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {renderHeader()}
      {renderDocumentPicker()}

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Solicitar visto bueno</Text>
        <Text style={styles.helperText}>Disponible para usuarios que pueden visualizar el documento.</Text>
        <TextInput
          value={approvalReviewerId}
          onChangeText={setApprovalReviewerId}
          keyboardType="number-pad"
          placeholder="ID del revisor opcional"
          placeholderTextColor={theme.colors.muted}
          style={styles.input}
        />
        <TextInput
          value={approvalComment}
          onChangeText={setApprovalComment}
          placeholder="Comentario"
          placeholderTextColor={theme.colors.muted}
          style={styles.input}
        />
        <Pressable
          style={styles.primaryButton}
          onPress={() => runAction('createApproval', () => onCreateApproval(Number(selectedDocumentId), {
            reviewer_id: approvalReviewerId ? Number(approvalReviewerId) : null,
            comment: approvalComment || null,
          }))}
          disabled={!selectedDocumentId || loadingAction === 'createApproval'}
        >
          {loadingAction === 'createApproval' ? <ActivityIndicator color={theme.colors.surface} /> : <Text style={styles.primaryButtonText}>Solicitar aprobacion</Text>}
        </Pressable>
      </View>

      <View style={[styles.sectionCard, !canApprove && styles.disabledCard]}>
        <Text style={styles.sectionTitle}>Aprobar o rechazar</Text>
        <Text style={styles.helperText}>Solo jueces, notarios, revisores, aprobadores o administradores.</Text>
        <TextInput
          value={approvalRequestId}
          onChangeText={setApprovalRequestId}
          keyboardType="number-pad"
          placeholder="ID de solicitud de aprobacion"
          placeholderTextColor={theme.colors.muted}
          style={styles.input}
        />
        <View style={styles.segmentRow}>
          {['approved', 'rejected', 'changes_requested'].map((decision) => (
            <Pressable
              key={decision}
              style={[styles.segmentButton, approvalDecision === decision && styles.segmentButtonActive]}
              onPress={() => setApprovalDecision(decision)}
            >
              <Text style={[styles.segmentText, approvalDecision === decision && styles.segmentTextActive]}>{decision}</Text>
            </Pressable>
          ))}
        </View>
        <Pressable
          style={styles.primaryButton}
          onPress={() => runAction('decideApproval', () => onDecideApproval(Number(approvalRequestId), {
            decision: approvalDecision,
            comment: approvalComment || null,
          }))}
          disabled={!canApprove || !approvalRequestId || loadingAction === 'decideApproval'}
        >
          {loadingAction === 'decideApproval' ? <ActivityIndicator color={theme.colors.surface} /> : <Text style={styles.primaryButtonText}>Enviar decision</Text>}
        </Pressable>
      </View>

      <View style={[styles.sectionCard, !canRequestSignature && styles.disabledCard]}>
        <Text style={styles.sectionTitle}>Solicitar firma</Text>
        <Text style={styles.helperText}>El documento debe estar aprobado antes de crear firmas.</Text>
        <TextInput
          value={signatureSignerId}
          onChangeText={setSignatureSignerId}
          keyboardType="number-pad"
          placeholder="ID del firmante"
          placeholderTextColor={theme.colors.muted}
          style={styles.input}
        />
        <View style={styles.rowInputs}>
          <TextInput
            value={signatureOrder}
            onChangeText={setSignatureOrder}
            keyboardType="number-pad"
            placeholder="Orden"
            placeholderTextColor={theme.colors.muted}
            style={[styles.input, styles.inputHalf]}
          />
          <TextInput
            value={signatureMode}
            onChangeText={setSignatureMode}
            placeholder="sequential o parallel"
            placeholderTextColor={theme.colors.muted}
            style={[styles.input, styles.inputHalf]}
          />
        </View>
        <Pressable
          style={styles.primaryButton}
          onPress={() => runAction('createSignature', () => onCreateSignatureRequest(Number(selectedDocumentId), {
            signer_id: Number(signatureSignerId),
            signing_order: Number(signatureOrder || 1),
            mode: signatureMode || 'sequential',
          }))}
          disabled={!canRequestSignature || !selectedDocumentId || !signatureSignerId || loadingAction === 'createSignature'}
        >
          {loadingAction === 'createSignature' ? <ActivityIndicator color={theme.colors.surface} /> : <Text style={styles.primaryButtonText}>Crear solicitud de firma</Text>}
        </Pressable>
      </View>

      <View style={[styles.sectionCard, !canSign && styles.disabledCard]}>
        <Text style={styles.sectionTitle}>Registrar firma</Text>
        <Text style={styles.helperText}>Usa el ID de solicitud, version y hash generado por el firmante.</Text>
        <TextInput
          value={signatureRequestId}
          onChangeText={setSignatureRequestId}
          keyboardType="number-pad"
          placeholder="ID de solicitud de firma"
          placeholderTextColor={theme.colors.muted}
          style={styles.input}
        />
        <TextInput
          value={signatureVersionId}
          onChangeText={setSignatureVersionId}
          keyboardType="number-pad"
          placeholder="ID de version del documento"
          placeholderTextColor={theme.colors.muted}
          style={styles.input}
        />
        <TextInput
          value={signatureHash}
          onChangeText={setSignatureHash}
          placeholder="Hash de firma"
          placeholderTextColor={theme.colors.muted}
          style={styles.input}
        />
        <Pressable
          style={styles.primaryButton}
          onPress={() => runAction('sign', () => onSignRequest(Number(signatureRequestId), {
            document_version_id: Number(signatureVersionId),
            signature_hash: signatureHash,
            signed_payload: {
              channel: 'mobile',
              signer_role: role,
            },
          }))}
          disabled={!canSign || !signatureRequestId || !signatureVersionId || !signatureHash || loadingAction === 'sign'}
        >
          {loadingAction === 'sign' ? <ActivityIndicator color={theme.colors.surface} /> : <Text style={styles.primaryButtonText}>Firmar</Text>}
        </Pressable>
      </View>

      {error ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>Error</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {result ? (
        <View style={styles.resultCard}>
          <Text style={styles.sectionTitle}>Respuesta API</Text>
          <Text style={styles.resultText}>{JSON.stringify(result, null, 2)}</Text>
        </View>
      ) : null}
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
    fontWeight: '800',
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
    fontWeight: '700',
  },
  sectionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  disabledCard: {
    opacity: 0.65,
  },
  sectionTitle: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 8,
  },
  helperText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: theme.colors.textPrimary,
    backgroundColor: theme.colors.surfaceMuted,
    marginBottom: 10,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 10,
  },
  inputHalf: {
    flex: 1,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: theme.colors.surface,
    fontWeight: '800',
  },
  segmentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  segmentButton: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: theme.colors.surfaceMuted,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  segmentButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  segmentText: {
    color: theme.colors.textPrimary,
    fontWeight: '700',
    fontSize: 12,
  },
  segmentTextActive: {
    color: theme.colors.surface,
  },
  errorCard: {
    backgroundColor: '#fee2e2',
    borderColor: '#fecaca',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  errorTitle: {
    color: theme.colors.danger,
    fontWeight: '800',
    marginBottom: 4,
  },
  errorText: {
    color: theme.colors.danger,
    fontWeight: '700',
  },
  resultCard: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  resultText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
});
