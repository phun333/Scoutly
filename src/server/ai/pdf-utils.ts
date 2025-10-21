import { Buffer } from 'node:buffer';

async function parsePdf(buffer: Buffer): Promise<string> {
  const pdfParseModule = await import('pdf-parse/lib/pdf-parse.js');
  const pdfParse = pdfParseModule.default ?? pdfParseModule;
  const result = await pdfParse(buffer);
  const text = result.text ?? '';
  console.info('pdf-utils.parsePdf', {
    bytes: buffer.byteLength,
    textLength: text.length,
  });
  return text;
}

export async function extractPdfTextFromUrl(url: string): Promise<{ text: string; success: boolean }> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.warn('extractPdfTextFromUrl: non-200 response', {
        status: response.status,
        statusText: response.statusText,
        url,
      });
      return { text: '', success: false };
    }

    const arrayBuffer = await response.arrayBuffer();
    const text = await parsePdf(Buffer.from(arrayBuffer));
    const success = text.trim().length > 0;
    console.info('extractPdfTextFromUrl: parsed', {
      url,
      success,
      textLength: text.length,
    });
    return { text, success };
  } catch (error) {
    console.error('Extracting PDF text from URL failed', error);
    return { text: '', success: false };
  }
}

export async function extractPdfTextFromBase64(base64: string): Promise<{ text: string; success: boolean }> {
  try {
    const buffer = Buffer.from(base64, 'base64');
    const text = await parsePdf(buffer);
    const success = text.trim().length > 0;
    console.info('extractPdfTextFromBase64: parsed', {
      success,
      textLength: text.length,
    });
    return { text, success };
  } catch (error) {
    console.error('Extracting PDF text from base64 failed', error);
    return { text: '', success: false };
  }
}
