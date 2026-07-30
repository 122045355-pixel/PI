const vision = require('@google-cloud/vision');

const client = new vision.ImageAnnotatorClient();
const { cleanText } = require('./cleanText');

async function runOcr(filePath) {
  try {
    const [result] = await client.documentTextDetection(filePath);
    const fullTextAnnotation = result.fullTextAnnotation;
    const raw = fullTextAnnotation ? fullTextAnnotation.text : '';
    return cleanText(raw);
  } catch (err) {
    console.error('OCR error', err.message || err);
    return '';
  }
}

module.exports = { runOcr };
