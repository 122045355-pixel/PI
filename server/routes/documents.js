const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { db, init } = require('../db');
const { authRequired, requireRole } = require('../middleware/auth');
const { runOcr } = require('../utils/ocr');
const { verifySignature } = require('../utils/pki');

init();

const storageDir = path.join(__dirname, '..', 'storage');
fs.mkdirSync(storageDir, { recursive: true });

const upload = multer({ dest: storageDir });

// List documents (enforce RBAC)
router.get('/', authRequired, async (req, res) => {
  await db.read();
  const { role, id } = req.user;
  let docs = db.data.documents || [];
  if (role === 'admin' || role === 'notary' || role === 'judge') {
    // judge only active cases in real system; keep simple here
    return res.json(docs);
  }
  if (role === 'lawyer') {
    // return documents where lawyerId === id
    docs = docs.filter((d) => d.lawyerId === id);
    return res.json(docs);
  }
  // parties/testigos: only their own personal documents or authored libelos
  docs = docs.filter((d) => d.ownerId === id || d.authorId === id);
  res.json(docs);
});

// Create document metadata
router.post('/', authRequired, async (req, res) => {
  const payload = req.body;
  await db.read();
  const id = db.data.nextId++;
  const doc = {
    id,
    title: payload.title || 'Sin título',
    description: payload.description || '',
    status: 'draft',
    ownerId: payload.ownerId || req.user.id,
    authorId: req.user.id,
    versions: [],
    workflow: payload.workflow || [],
    signatures: [],
    metadata: payload.metadata || {},
    createdAt: new Date().toISOString(),
    audit: [],
  };
  // record creation audit
  doc.audit.push({ at: new Date().toISOString(), by: req.user.id, role: req.user.role, action: 'create', detail: { title: doc.title } });
  db.data.documents.push(doc);
  await db.write();
  res.status(201).json(doc);
});

// Upload a new version
router.post('/:id/versions', authRequired, upload.single('file'), async (req, res) => {
  const docId = parseInt(req.params.id, 10);
  await db.read();
  const doc = db.data.documents.find((d) => d.id === docId);
  if (!doc) return res.status(404).json({ detail: 'Document not found' });
  const file = req.file;
  if (!file) return res.status(400).json({ detail: 'Missing file' });
  const ext = path.extname(file.originalname) || '';
  const versionNumber = (doc.versions.length || 0) + 1;
  const filename = `d${docId}.v${versionNumber}${ext}`;
  const dest = path.join(storageDir, filename);
  fs.renameSync(file.path, dest);
  doc.versions.unshift(filename);
  doc.currentVersion = versionNumber;
  doc.status = 'draft';
  // If file likely a libelo, trigger OCR and save per-version
  const isLibelo = (req.body.type || '').toLowerCase() === 'libelo' || file.mimetype.startsWith('image/');
  if (isLibelo) {
    try {
      const ocrText = await runOcr(dest);
      doc.metadata.ocr = doc.metadata.ocr || {};
      doc.metadata.ocr[filename] = ocrText || '';
    } catch (err) {
      console.error('OCR failed', err.message || err);
    }
  }
  await db.write();
  // audit
  doc.audit.push({ at: new Date().toISOString(), by: req.user.id, role: req.user.role, action: 'upload_version', detail: { filename, version: versionNumber } });
  res.status(201).json({ filename, version: versionNumber });
});

// Trigger OCR for a document (all versions or a single version)
router.post('/:id/ocr', authRequired, async (req, res) => {
  const docId = parseInt(req.params.id, 10);
  const { version } = req.body; // optional filename
  await db.read();
  const doc = db.data.documents.find((d) => d.id === docId);
  if (!doc) return res.status(404).json({ detail: 'Document not found' });
  // permission: allow owner, author, lawyer for their docs, or admin/notary/judge
  const allowedRoles = ['admin', 'notary', 'judge'];
  if (doc.ownerId !== req.user.id && doc.authorId !== req.user.id && !allowedRoles.includes(req.user.role) && !(req.user.role === 'lawyer' && doc.lawyerId === req.user.id)) {
    return res.status(403).json({ detail: 'Forbidden' });
  }

  doc.metadata.ocr = doc.metadata.ocr || {};
  const targets = version ? [version] : doc.versions.slice();
  const results = {};
  for (const fname of targets) {
    const filePath = path.join(storageDir, fname);
    if (!fs.existsSync(filePath)) {
      results[fname] = { ok: false, error: 'missing file' };
      continue;
    }
    try {
      const text = await runOcr(filePath);
      doc.metadata.ocr[fname] = text || '';
      results[fname] = { ok: true };
    } catch (err) {
      results[fname] = { ok: false, error: err.message || String(err) };
    }
  }
  await db.write();
  res.json({ ok: true, results });
});

// Get OCR results for a document
router.get('/:id/ocr', authRequired, async (req, res) => {
  const docId = parseInt(req.params.id, 10);
  await db.read();
  const doc = db.data.documents.find((d) => d.id === docId);
  if (!doc) return res.status(404).json({ detail: 'Document not found' });
  // reuse same permission model as above
  const allowedRoles = ['admin', 'notary', 'judge'];
  if (doc.ownerId !== req.user.id && doc.authorId !== req.user.id && !allowedRoles.includes(req.user.role) && !(req.user.role === 'lawyer' && doc.lawyerId === req.user.id)) {
    return res.status(403).json({ detail: 'Forbidden' });
  }
  res.json({ ocr: doc.metadata.ocr || {} });
});

// Submit document for review
router.post('/:id/submit', authRequired, async (req, res) => {
  const docId = parseInt(req.params.id, 10);
  await db.read();
  const doc = db.data.documents.find((d) => d.id === docId);
  if (!doc) return res.status(404).json({ detail: 'Document not found' });
  doc.status = 'pending_review';
  await db.write();
  doc.audit.push({ at: new Date().toISOString(), by: req.user.id, role: req.user.role, action: 'submit_for_review' });
  res.json(doc);
});

// Review document (approve/reject) - only judges and notaries and admins
router.post('/:id/review', authRequired, requireRole('judge', 'notary', 'admin'), async (req, res) => {
  const docId = parseInt(req.params.id, 10);
  const { decision, comment } = req.body;
  await db.read();
  const doc = db.data.documents.find((d) => d.id === docId);
  if (!doc) return res.status(404).json({ detail: 'Document not found' });
  doc.status = decision === 'approve' ? 'approved' : 'draft';
  doc.review = { by: req.user.id, role: req.user.role, comment, at: new Date().toISOString() };
  await db.write();
  doc.audit.push({ at: new Date().toISOString(), by: req.user.id, role: req.user.role, action: 'review', detail: { decision, comment } });
  res.json(doc);
});

// Register a signature (mobile clients send signed blob / pkcs7 etc.)
router.post('/:id/signatures', authRequired, async (req, res) => {
  const docId = parseInt(req.params.id, 10);
  await db.read();
  const doc = db.data.documents.find((d) => d.id === docId);
  if (!doc) return res.status(404).json({ detail: 'Document not found' });
  const { signature, method, metadata } = req.body;
  if (!signature) return res.status(400).json({ detail: 'Missing signature payload' });
  const sigRecord = { id: Date.now(), signerId: req.user.id, role: req.user.role, signature, method: method || 'pki', metadata: metadata || {}, at: new Date().toISOString() };
  doc.signatures.push(sigRecord);
  // If signatures must be sequential, you can validate order here
  await db.write();
  doc.audit.push({ at: new Date().toISOString(), by: req.user.id, role: req.user.role, action: 'signature', detail: { sigId: sigRecord.id, method: sigRecord.method } });
  res.status(201).json(sigRecord);
});

// Create a signing flow for a document
router.post('/:id/signflows', authRequired, requireRole('notary', 'admin', 'judge'), async (req, res) => {
  const docId = parseInt(req.params.id, 10);
  const { signers, sequential } = req.body; // signers: [{ signerId, role }]
  await db.read();
  const doc = db.data.documents.find((d) => d.id === docId);
  if (!doc) return res.status(404).json({ detail: 'Document not found' });
  doc.signFlows = doc.signFlows || [];
  const flowId = `f${Date.now()}`;
  const flow = { id: flowId, signers: (signers || []).map(s => ({ signerId: s.signerId, role: s.role, signed: null })), sequential: !!sequential, status: 'pending', createdAt: new Date().toISOString() };
  doc.signFlows.push(flow);
  await db.write();
  doc.audit.push({ at: new Date().toISOString(), by: req.user.id, role: req.user.role, action: 'create_signflow', detail: { flowId, signers: flow.signers, sequential: flow.sequential } });
  res.status(201).json(flow);
});

// Get sign flows for a document
router.get('/:id/signflows', authRequired, async (req, res) => {
  const docId = parseInt(req.params.id, 10);
  await db.read();
  const doc = db.data.documents.find((d) => d.id === docId);
  if (!doc) return res.status(404).json({ detail: 'Document not found' });
  res.json({ signFlows: doc.signFlows || [] });
});

// Sign within a flow
router.post('/:id/signflows/:flowId/sign', authRequired, async (req, res) => {
  const docId = parseInt(req.params.id, 10);
  const { flowId } = req.params;
  const { signature, certificatePem, data } = req.body; // data is the signed payload
  await db.read();
  const doc = db.data.documents.find((d) => d.id === docId);
  if (!doc) return res.status(404).json({ detail: 'Document not found' });
  const flow = (doc.signFlows || []).find(f => f.id === flowId);
  if (!flow) return res.status(404).json({ detail: 'Flow not found' });
  const signerEntry = flow.signers.find(s => s.signerId === req.user.id || s.role === req.user.role);
  if (!signerEntry) return res.status(403).json({ detail: 'Not authorized to sign this flow' });
  // If sequential, ensure previous signers have signed
  if (flow.sequential) {
    const idx = flow.signers.indexOf(signerEntry);
    for (let i = 0; i < idx; i++) {
      if (!flow.signers[i].signed) return res.status(400).json({ detail: 'Previous signer pending' });
    }
  }
  // Attempt to verify signature if certificate provided
  let verified = null;
  if (certificatePem && signature && typeof data === 'string') {
    verified = verifySignature({ data, signatureBase64: signature, certificatePem });
  }
  const sigRecord = { id: Date.now(), signerId: req.user.id, role: req.user.role, signature, certificatePem: certificatePem || null, verified, at: new Date().toISOString() };
  signerEntry.signed = sigRecord;
  // If all signed, mark flow complete
  const allSigned = flow.signers.every(s => s.signed);
  flow.status = allSigned ? 'complete' : 'pending';
  await db.write();
  doc.audit.push({ at: new Date().toISOString(), by: req.user.id, role: req.user.role, action: 'flow_sign', detail: { flowId, sigId: sigRecord.id, verified } });
  res.status(201).json({ ok: true, sig: sigRecord, flowStatus: flow.status });
});

// File access: restrict downloads to web clients and judge/notary roles
router.get('/:id/files/:filename', authRequired, async (req, res) => {
  const { role } = req.user;
  const clientType = req.headers['x-client-type'] || 'mobile';
  if (clientType !== 'web' || !['judge', 'notary', 'admin'].includes(role)) {
    return res.status(403).json({ detail: 'Download restricted' });
  }
  const filename = req.params.filename;
  const filePath = path.join(storageDir, filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ detail: 'Not found' });
  res.sendFile(filePath);
});

// Archive document (move files to deep archive, gzip each file) - only admin/tech
router.post('/:id/archive', authRequired, requireRole('admin', 'notary'), async (req, res) => {
  const docId = parseInt(req.params.id, 10);
  await db.read();
  const doc = db.data.documents.find((d) => d.id === docId);
  if (!doc) return res.status(404).json({ detail: 'Document not found' });
  const archiveDir = path.join(storageDir, 'archive', `d${docId}`);
  fs.mkdirSync(archiveDir, { recursive: true });

  const zlib = require('zlib');

  const moved = [];
  for (const fname of doc.versions) {
    const src = path.join(storageDir, fname);
    if (!fs.existsSync(src)) continue;
    const gzName = `${fname}.gz`;
    const dest = path.join(archiveDir, gzName);
    // gzip stream
    await new Promise((resolve, reject) => {
      const input = fs.createReadStream(src);
      const output = fs.createWriteStream(dest);
      const gzip = zlib.createGzip();
      input.pipe(gzip).pipe(output).on('finish', resolve).on('error', reject);
    });
    // keep original but optionally remove original to save space — we'll keep originals per retention
    moved.push(gzName);
  }

  doc.archived = true;
  doc.archive = { path: path.relative(path.join(__dirname, '..'), archiveDir), files: moved, at: new Date().toISOString() };
  await db.write();
  doc.audit.push({ at: new Date().toISOString(), by: req.user.id, role: req.user.role, action: 'archive', detail: { files: moved } });
  res.json({ archived: true, archive: doc.archive });
});

// Get audit/history for a document
router.get('/:id/history', authRequired, async (req, res) => {
  const docId = parseInt(req.params.id, 10);
  await db.read();
  const doc = db.data.documents.find((d) => d.id === docId);
  if (!doc) return res.status(404).json({ detail: 'Document not found' });
  // permission: owner/author/lawyer or admin/notary/judge
  const allowedRoles = ['admin', 'notary', 'judge'];
  if (doc.ownerId !== req.user.id && doc.authorId !== req.user.id && !allowedRoles.includes(req.user.role) && !(req.user.role === 'lawyer' && doc.lawyerId === req.user.id)) {
    return res.status(403).json({ detail: 'Forbidden' });
  }
  res.json({ audit: doc.audit || [], versions: doc.versions || [], currentVersion: doc.currentVersion });
});

module.exports = router;
