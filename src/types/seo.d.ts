

// 1. Interface untuk Meta Data (Title, Description, dll)
export interface MetaData {
  title: string | null;
  description: string | null;
  titleLength: number;
  descriptionLength: number;
  isTitleOptimal: boolean;       // Target: 50-60 karakter
  isDescriptionOptimal: boolean; // Target: 150-160 karakter
  robots: string | null;
  canonical: string | null;
}

// 2. Interface untuk Internal & Outbound Links
export interface LinkData {
  url: string;
  anchorText: string;
  isInternal: boolean;
  status: number | null; // Kode HTTP (200, 404, dll). Null jika belum dicek.
}

// 3. Interface untuk JSON-LD Schema
export interface SchemaData {
  type: string;       // Misalnya: 'MedicalClinic', 'Article', 'LocalBusiness'
  isValid: boolean;
  rawJson: any;       // Menyimpan objek JSON aslinya
  missingFields?: string[]; // Menyimpan parameter wajib yang mungkin terlewat
}

// 4. Interface Utama yang menggabungkan seluruh hasil audit
export interface SeoAuditResult {
  targetUrl: string;
  scrapedAt: string; // Timestamp kapan URL diaudit
  meta: MetaData;
  links: LinkData[];
  schemas: SchemaData[];
}