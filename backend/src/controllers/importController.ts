import { Request, Response, NextFunction } from 'express';
import pLimit from 'p-limit';
import { GeminiService } from '../services/geminiService';
import { CrmLead, SkippedRecord, ImportResponse } from '../types';

export const handleImport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const startTime = Date.now();

  try {
    const { rows } = req.body;

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Invalid input. Please provide a non-empty array of rows in the request body.',
      });
      return;
    }

    const totalRecords = rows.length;
    const batchSize = 50;
    const batches: Record<string, unknown>[][] = [];

    for (let i = 0; i < rows.length; i += batchSize) {
      batches.push(rows.slice(i, i + batchSize));
    }

    // Limit concurrency to 3 simultaneous calls to avoid Gemini rate limiting (429)
    const limit = pLimit(3);
    const batchPromises = batches.map((batch, index) =>
      limit(async () => {
        console.log(`Processing batch ${index + 1} of ${batches.length}...`);
        return GeminiService.processBatch(batch);
      })
    );

    const batchResults = await Promise.all(batchPromises);

    const importedLeads: CrmLead[] = [];
    const skippedRecords: SkippedRecord[] = [];

    // Track duplicates globally across this import session
    const seenEmails = new Set<string>();
    const seenPhones = new Set<string>();

    let processedRowIndex = 1;

    for (const batchRes of batchResults) {
      for (const item of batchRes) {
        const rawRow = item.rawData || {};

        if (item.status === 'skipped' || !item.data) {
          skippedRecords.push({
            rowNumber: processedRowIndex,
            reason: item.reason || 'Failed validation or flagged as skipped by AI.',
            rawData: rawRow,
          });
        } else {
          const lead = item.data as CrmLead;

          // Double check contact presence at controller level
          const email = (lead.email || '').trim().toLowerCase();
          const phone = (lead.mobile_without_country_code || '').trim();

          if (!email && !phone) {
            skippedRecords.push({
              rowNumber: processedRowIndex,
              reason: 'Skipped: Record does not contain any valid email or phone number.',
              rawData: rawRow,
            });
            processedRowIndex++;
            continue;
          }

          // Duplicate detection
          let isDuplicate = false;
          let dupReason = '';

          if (email && seenEmails.has(email)) {
            isDuplicate = true;
            dupReason = `Duplicate email found: ${email}`;
          } else if (phone && seenPhones.has(phone)) {
            isDuplicate = true;
            dupReason = `Duplicate phone number found: ${phone}`;
          }

          if (isDuplicate) {
            skippedRecords.push({
              rowNumber: processedRowIndex,
              reason: `Skipped: ${dupReason}`,
              rawData: rawRow,
            });
          } else {
            // Keep track of contact details
            if (email) seenEmails.add(email);
            if (phone) seenPhones.add(phone);

            // Clean up and push
            importedLeads.push({
              created_at: lead.created_at || new Date().toISOString(),
              name: (lead.name || 'Unknown Lead').trim(),
              email,
              country_code: (lead.country_code || '').trim().replace('+', ''), // remove plus prefix
              mobile_without_country_code: phone,
              company: (lead.company || '').trim(),
              city: (lead.city || '').trim(),
              state: (lead.state || '').trim(),
              country: (lead.country || '').trim(),
              lead_owner: (lead.lead_owner || '').trim(),
              crm_status: lead.crm_status || '',
              crm_note: (lead.crm_note || '').trim(),
              data_source: lead.data_source || '',
              possession_time: (lead.possession_time || '').trim(),
              description: (lead.description || '').trim(),
            });
          }
        }

        processedRowIndex++;
      }
    }

    const endTime = Date.now();
    const processingTimeMs = endTime - startTime;

    const responseData: ImportResponse = {
      success: true,
      imported: importedLeads,
      skipped: skippedRecords,
      stats: {
        totalRecords,
        importedCount: importedLeads.length,
        skippedCount: skippedRecords.length,
        processingTimeMs,
      },
    };

    res.status(200).json(responseData);
  } catch (error: any) {
    console.error('Import Controller process failed:', error);
    next(error);
  }
};
