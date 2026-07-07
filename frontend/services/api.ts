const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface ImportStats {
  totalRecords: number;
  importedCount: number;
  skippedCount: number;
  processingTimeMs: number;
}

export interface SkippedRecord {
  rowNumber: number;
  reason: string;
  rawData: Record<string, unknown>;
}

export interface ImportResponse {
  success: boolean;
  imported: Record<string, unknown>[];
  skipped: SkippedRecord[];
  stats: ImportStats;
}

export async function uploadCsvFile(file: File): Promise<unknown> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.message || 'Failed to upload and parse CSV on server');
  }

  return response.json();
}

export async function importCsvData(rows: Record<string, unknown>[]): Promise<ImportResponse> {
  const response = await fetch(`${API_BASE_URL}/import`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ rows }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.message || 'Failed to import and map leads via Gemini AI');
  }

  return response.json();
}
