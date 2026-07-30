import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'legal_docs_access_token';
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8080';
const API_KEY = process.env.EXPO_PUBLIC_API_KEY;

export async function saveAccessToken(token) {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function getAccessToken() {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function clearAccessToken() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

async function buildHeaders(options = {}) {
  const token = await getAccessToken();
  const headers = {
    Accept: 'application/json',
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...options.headers,
  };

  if (API_KEY) {
    headers['x-api-key'] = API_KEY;
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

export async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: await buildHeaders(options),
  });

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message = typeof payload === 'string'
      ? payload
      : payload?.detail?.mensaje || payload?.detail?.error || payload?.error || 'Error de API';

    throw new Error(message);
  }

  return payload;
}

export async function login(email, password) {
  const payload = await apiRequest('/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  await saveAccessToken(payload.access_token);
  return payload.usuario;
}

export async function logout() {
  await clearAccessToken();
}

export function getProfile() {
  return apiRequest('/api/perfil');
}

export function getCases() {
  return apiRequest('/api/cases');
}

export function getCaseDocuments(caseId) {
  return apiRequest(`/api/cases/${caseId}/documents`);
}

export function getDocumentView(documentId) {
  return apiRequest(`/api/documents/${documentId}/view`, {
    headers: {
      'x-client-channel': 'mobile',
    },
  });
}

export function rejectMobileDownload() {
  throw new Error('La descarga de documentos no esta permitida en la aplicacion movil.');
}
