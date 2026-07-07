export type CrmStatus = 'GOOD_LEAD_FOLLOW_UP' | 'DID_NOT_CONNECT' | 'BAD_LEAD' | 'SALE_DONE' | '';

export type DataSource = 'leads_on_demand' | 'meridian_tower' | 'eden_park' | 'varah_swamy' | 'sarjapur_plots' | '';

export interface CrmLead {
  created_at: string;
  name: string;
  email: string;
  country_code: string;
  mobile_without_country_code: string;
  company: string;
  city: string;
  state: string;
  country: string;
  lead_owner: string;
  crm_status: CrmStatus;
  crm_note: string;
  data_source: DataSource;
  possession_time: string;
  description: string;
}

export interface SkippedRecord {
  rowNumber: number;
  reason: string;
  rawData: Record<string, unknown>;
}

export interface ImportStats {
  totalRecords: number;
  importedCount: number;
  skippedCount: number;
  processingTimeMs: number;
}

export interface ImportResponse {
  success: boolean;
  imported: CrmLead[];
  skipped: SkippedRecord[];
  stats: ImportStats;
}

export interface CrmMappingResult {
  status: 'success' | 'skipped';
  reason?: string;
  data?: Partial<CrmLead>;
  rawData?: Record<string, unknown>;
}
