# Gestion Documental - servidor ligero

Instrucciones rápidas para levantar el servidor en la Raspberry Pi o en un servidor local.

1. Instalar dependencias

```bash
cd server
npm install
```

2. Variables de entorno recomendadas

- `JWT_SECRET` (opcional) — secreto para tokens JWT
- `GOOGLE_APPLICATION_CREDENTIALS` — ruta al JSON de la cuenta de servicio para Google Vision

3. Ejecutar

```bash
NODE_ENV=production npm start
```

Notas:
- El directorio `server/storage` contiene los archivos subidos y `server/data/db.json` la base simple en JSON.
- El endpoint de descarga exige la cabecera `X-CLIENT-TYPE: web` y que el usuario tenga rol `judge` o `notary` o `admin`.
- OCR usa Google Cloud Vision; configure `GOOGLE_APPLICATION_CREDENTIALS` en la Pi.
- Para mover un caso a archivo profundo (copia local comprimida) use el endpoint `POST /documents/:id/archive`.
- Para el flujo de firmas se han añadido endpoints:
	- `POST /documents/:id/signflows` — crear flujo (body `{ signers: [{ signerId, role }], sequential: true }`).
	- `GET /documents/:id/signflows` — listar flujos.
	- `POST /documents/:id/signflows/:flowId/sign` — firmar dentro del flujo (body `{ signature, certificatePem, data }`).

