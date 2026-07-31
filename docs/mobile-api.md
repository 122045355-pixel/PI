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

## Ventanas moviles

La app ya cuenta con:

- `LoginScreen`: autentica contra `/login` y guarda JWT en `expo-secure-store`.
- `DashboardScreen`: muestra usuario, rol y permisos efectivos.
- `DocumentsScreen`: lista solo documentos devueltos por la API para el rol autenticado.
- `DocumentDetailScreen`: consulta `/api/documents/{id}/view` y confirma bloqueo de descarga movil.
- `RoleActionsScreen`: ejecuta acciones de aprobacion y firma segun rol.

## Cliente API

`services/apiClient.js` centraliza:

- login contra `/login`
- almacenamiento del JWT con `expo-secure-store`
- envio automatico de `Authorization: Bearer <token>`
- envio opcional de `x-api-key` para desarrollo local
- consulta de casos y documentos permitidos
- acciones de visto bueno y firma
- bloqueo explicito de descarga movil

## Endpoints usados

```http
POST /login
GET /api/perfil
GET /api/cases
GET /api/cases/{case_id}/documents
GET /api/documents/{document_id}/view
POST /api/documents/{document_id}/approval-requests
POST /api/approval-requests/{request_id}/approve
POST /api/documents/{document_id}/signature-requests
POST /api/signature-requests/{request_id}/sign
```

## Regla de descarga

La app movil no implementa botones ni flujos de descarga. Para consultar documentos usa endpoints de vista protegida:

```http
GET /api/documents/{document_id}/view
x-client-channel: mobile
Authorization: Bearer <token>
```

La API debe rechazar cualquier accion `download` cuando `x-client-channel` sea `mobile`.

## Limitacion actual

La API todavia no expone listados de solicitudes pendientes de aprobacion o firma. Por eso `RoleActionsScreen` permite capturar manualmente `approval_request_id`, `signature_request_id` y `document_version_id`. El siguiente paso recomendado es agregar endpoints tipo:

```http
GET /api/approval-requests/pending
GET /api/signature-requests/pending
```

para que la app muestre bandejas automaticas por rol.
