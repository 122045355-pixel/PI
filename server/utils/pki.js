const crypto = require('crypto');

function verifySignature({ data, signatureBase64, certificatePem }) {
  try {
    const verifier = crypto.createVerify('SHA256');
    verifier.update(data);
    verifier.end();
    const signature = Buffer.from(signatureBase64, 'base64');
    // Extract public key from certificate PEM
    const pubKey = certificatePem; // Node accepts certificate PEMs as key
    return verifier.verify(pubKey, signature);
  } catch (err) {
    console.error('verifySignature error', err.message || err);
    return false;
  }
}

module.exports = { verifySignature };
