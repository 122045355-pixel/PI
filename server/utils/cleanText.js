function cleanText(raw) {
  if (!raw) return '';
  // Remove control characters except line breaks, normalize spaces
  let s = raw.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
  s = s.replace(/\u00A0/g, ' ');
  s = s.replace(/\s+\n\s+/g, '\n');
  s = s.replace(/[ \t]{2,}/g, ' ');
  return s.trim();
}

module.exports = { cleanText };
