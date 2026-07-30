import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Button, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { getDocuments, request } from '../api';
import theme from '../theme';

// NOTE: This is a demo signing screen. In production you must integrate with a secure PKI
// on the device (Keychain/KeyStore) or with an HSM and send a real PKCS#7/PKCS#11 signature.

export default function SignDocumentScreen({ route, navigation }) {
  const { documentId } = route.params || {};
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [certificatePem, setCertificatePem] = useState('');

  useEffect(() => {
    fetchDoc();
  }, []);

  async function fetchDoc() {
    setLoading(true);
    try {
      const d = await request(`/documents/${documentId}`);
      setDoc(d);
    } catch (err) {
      console.warn(err.message || err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSign() {
    // demo signature: base64 of 'signed-by-mobile-{timestamp}'
    const payload = `signed-by-mobile-${Date.now()}`;
    const signature = Buffer.from(payload).toString('base64');
    setLoading(true);
    try {
      const body = { signature, certificatePem, data: payload };
      const res = await fetch(`${API_URL}/documents/${documentId}/signflows/${doc.signFlows[0].id}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Sign failed');
      const json = await res.json();
      alert('Firmado: ' + JSON.stringify(json));
      fetchDoc();
    } catch (err) {
      alert(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <SafeAreaView style={styles.center}><ActivityIndicator /></SafeAreaView>;
  if (!doc) return <SafeAreaView style={styles.center}><Text>No document</Text></SafeAreaView>;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{doc.title}</Text>
        <Text style={styles.subtitle}>{doc.description}</Text>
        <View style={styles.section}>
          <Text style={styles.h}>Flujos</Text>
          {doc.signFlows?.map((f) => (
            <View key={f.id} style={styles.flowCard}>
              <Text style={styles.flowTitle}>{f.id} · {f.status}</Text>
              {f.signers.map((s) => (
                <View key={s.signerId} style={styles.signerRow}>
                  <Text style={styles.signer}>{s.signerId} ({s.role})</Text>
                  <Text>{s.signed ? 'Firmado' : 'Pendiente'}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.h}>Certificado PEM (opcional)</Text>
          <TextInput style={styles.input} multiline value={certificatePem} onChangeText={setCertificatePem} placeholder="-----BEGIN CERTIFICATE-----..." />
        </View>

        <Button title="Firmar (demo)" onPress={handleSign} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '700', color: theme.colors.textPrimary },
  subtitle: { color: theme.colors.textSecondary, marginBottom: 12 },
  section: { marginBottom: 12, backgroundColor: theme.colors.surface, padding: 12, borderRadius: 10 },
  h: { fontWeight: '700', marginBottom: 6, color: theme.colors.textPrimary },
  flowCard: { marginBottom: 8 },
  flowTitle: { fontWeight: '700' },
  signerRow: { flexDirection: 'row', justifyContent: 'space-between' },
  signer: { color: theme.colors.muted },
  input: { minHeight: 80, borderColor: theme.colors.border, borderWidth: 1, padding: 8, borderRadius: 6, backgroundColor: theme.colors.surface },
});
