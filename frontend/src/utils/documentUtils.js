import * as pdfjsLib from 'pdfjs-dist';
// Vite: let the bundler resolve the worker URL
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export const MAX_DOC_BYTES = 10 * 1024 * 1024; // 10 MB
export const ACCEPTED_DOC_MIMES = ['application/pdf', 'text/plain'];
export const MAX_PDF_PAGES = 40;

export function validateDocFile(file) {
  if (!ACCEPTED_DOC_MIMES.includes(file.type) && !/\.(pdf|txt)$/i.test(file.name)) {
    return `"${file.name}": unsupported format. Use PDF or TXT.`;
  }
  if (file.size > MAX_DOC_BYTES) {
    const mb = (file.size / 1024 / 1024).toFixed(1);
    return `"${file.name}" is ${mb} MB — max is 10 MB.`;
  }
  return null;
}

export function isDocFile(file) {
  return (
    ACCEPTED_DOC_MIMES.includes(file.type) || /\.(pdf|txt)$/i.test(file.name)
  );
}

export async function extractTextFromFile(file) {
  const err = validateDocFile(file);
  if (err) throw new Error(err);

  if (file.type === 'application/pdf' || /\.pdf$/i.test(file.name)) {
    return await extractPdf(file);
  }
  return await file.text();
}

async function extractPdf(file) {
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  const total = Math.min(pdf.numPages, MAX_PDF_PAGES);
  const parts = [];
  for (let i = 1; i <= total; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((it) => ('str' in it ? it.str : ''))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    parts.push(`[Page ${i}]\n${text}`);
  }
  if (pdf.numPages > MAX_PDF_PAGES) {
    parts.push(
      `\n[Truncated: showing ${MAX_PDF_PAGES} of ${pdf.numPages} pages]`
    );
  }
  return parts.join('\n\n');
}