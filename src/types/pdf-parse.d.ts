declare module 'pdf-parse/lib/pdf-parse.js' {
  export interface PdfParseOptions {
    pagerender?: (page: unknown) => Promise<string> | string;
    max?: number;
  }

  export interface PdfParseResult {
    text?: string;
    numpages?: number;
    numrender?: number;
    info?: unknown;
    metadata?: unknown;
    version?: string;
  }

  export type PdfParse = (data: Buffer, options?: PdfParseOptions) => Promise<PdfParseResult>;

  const pdfParse: PdfParse;
  export default pdfParse;
}
