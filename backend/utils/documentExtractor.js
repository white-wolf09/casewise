import mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';

export async function extractDocumentText(doc) {
  if (!doc.base64) {
    return doc.content || '';
  }

  const name = doc.name || '';
  const ext = (doc.ext || (name.includes('.') ? name.split('.').pop() : '')).toLowerCase();

  try {
    const buffer = Buffer.from(doc.base64, 'base64');

    if (ext === 'pdf') {
      try {
        const parser = new PDFParse({ data: buffer });
        const res = await parser.getText();
        await parser.destroy().catch(() => {});
        const text = (res.text || '').trim();
        if (text) return text;
      } catch (pdfErr) {
        // Fallback: extract readable strings from buffer
        const raw = buffer.toString('utf-8').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ').trim();
        if (raw.length > 20) return raw;
      }
    }

    if (ext === 'docx') {
      try {
        const res = await mammoth.extractRawText({ buffer });
        const text = (res.value || '').trim();
        if (text) return text;
      } catch (docxErr) {
        // Fallback: extract readable strings from buffer
        const raw = buffer.toString('utf-8').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ').trim();
        if (raw.length > 20) return raw;
      }
    }

    if (['txt', 'csv', 'json', 'md', 'html'].includes(ext)) {
      return buffer.toString('utf-8').trim();
    }

    // Generic fallback for any other file type
    const fallbackStr = buffer.toString('utf-8').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ').trim();
    if (fallbackStr.length > 20) return fallbackStr;
  } catch (err) {
    console.warn(`[Document Text Extraction Warning] Could not parse ${name}:`, err.message);
  }

  return doc.content || '';
}

export default extractDocumentText;
