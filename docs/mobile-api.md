# Integracion movil con API documental

## Variables locales

Crear `.env.local` a partir de `.env.example`:

```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:8080
EXPO_PUBLIC_API_KEY=change-me-only-for-local-development
```

En un dispositivo fisico, `localhost` apunta al telefono. Usar la IP LAN de la computadora, por ejemplo:

```env
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.50:8080
```

## Cliente API

`services/apiClient.js` centraliza:

- login contra `/login`
- almacenamiento del JWT con `expo-secure-store`
- envio automatico de `Authorization: Bearer <token>`
- envio opcional de `x-api-key` para desarrollo local
- bloqueo explicito de descarga movil

## Regla de descarga

La app movil no debe implementar botones ni flujos de descarga. Para consultar documentos debe usar endpoints de vista protegida:

```http
GET /api/documents/{document_id}/view
x-client-channel: mobile
Authorization: Bearer <token>
```

La API debe rechazar cualquier accion `download` cuando `x-client-channel` sea `mobile`.

## Siguiente integracion

Reemplazar los datos mock de `App.js` por llamadas a `getProfile()` y `getCaseDocuments(caseId)`.
Despues se puede agregar una pantalla de login que invoque `login(email, password)`.
