declare module 'pdf-parse' {
  import type { Buffer } from 'node:buffer';

  export interface PDFMetaData {
    text: string;
    info: Record<string, unknown>;
    metadata: unknown;
    version: string;
  }

  export default function pdfParse(data: Buffer | Uint8Array | ArrayBuffer): Promise<PDFMetaData>;
}
