import { GoogleGenerativeAI, Schema } from '@google/generative-ai';
import { config } from '../config';
import { SYSTEM_INSTRUCTION } from '../prompts/mappingPrompt';
import { CrmMappingResult } from '../types';

export class GeminiService {
  private static genAI: GoogleGenerativeAI | null = null;

  private static getClient(): GoogleGenerativeAI {
    if (!this.genAI) {
      if (!config.geminiApiKey) {
        throw new Error('GEMINI_API_KEY is not defined in environment variables.');
      }
      this.genAI = new GoogleGenerativeAI(config.geminiApiKey);
    }
    return this.genAI;
  }

  // Strict output schema to pass to Gemini
  private static responseSchema: Schema = {
    type: 'array' as Schema['type'],
    description: 'List of parsed leads and validation results matching the GrowEasy formats.',
    items: {
      type: 'object' as Schema['type'],
      properties: {
        status: {
          type: 'string' as Schema['type'],
          description: 'Set to "success" if the lead contains contact details (email or phone). Set to "skipped" if it is invalid and needs to be discarded.',
        },
        reason: {
          type: 'string' as Schema['type'],
          description: 'Provide explanation if the lead is skipped. Leave blank if success.',
        },
        data: {
          type: 'object' as Schema['type'],
          description: 'The mapped CRM lead data.',
          properties: {
            created_at: { type: 'string' as Schema['type'] },
            name: { type: 'string' as Schema['type'] },
            email: { type: 'string' as Schema['type'] },
            country_code: { type: 'string' as Schema['type'] },
            mobile_without_country_code: { type: 'string' as Schema['type'] },
            company: { type: 'string' as Schema['type'] },
            city: { type: 'string' as Schema['type'] },
            state: { type: 'string' as Schema['type'] },
            country: { type: 'string' as Schema['type'] },
            lead_owner: { type: 'string' as Schema['type'] },
            crm_status: { type: 'string' as Schema['type'] },
            crm_note: { type: 'string' as Schema['type'] },
            data_source: { type: 'string' as Schema['type'] },
            possession_time: { type: 'string' as Schema['type'] },
            description: { type: 'string' as Schema['type'] },
          },
          required: [
            'created_at',
            'name',
            'email',
            'country_code',
            'mobile_without_country_code',
            'company',
            'city',
            'state',
            'country',
            'lead_owner',
            'crm_status',
            'crm_note',
            'data_source',
            'possession_time',
            'description',
          ],
        },
      },
      required: ['status'],
    },
  };

  /**
   * Sends a batch of up to 50 raw records to Gemini AI.
   * Employs structured JSON schema configs and retries up to 3 times on failures.
   */
  static async processBatch(
    batch: Record<string, unknown>[],
    attempt: number = 1
  ): Promise<CrmMappingResult[]> {
    const activeModel = 'gemini-2.5-flash';

    try {
      console.log(`Sending batch to Gemini using model: ${activeModel} (Attempt ${attempt}/3)...`);
      const client = this.getClient();
      const model = client.getGenerativeModel({
        model: activeModel,
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: this.responseSchema,
          temperature: 0.1, // Low temperature for high deterministic accuracy
        },
      });

      const promptText = `
        You are given a batch of raw records from a CSV file.
        Map them into the CRM schema matching the instructions provided.
        
        Raw Data Batch:
        ${JSON.stringify(batch, null, 2)}
      `;

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: promptText }] }],
        systemInstruction: SYSTEM_INSTRUCTION,
      });

      const response = result.response;
      const text = response.text();

      if (!text) {
        throw new Error('Gemini API returned an empty text response.');
      }

      // Try to parse the response
      const mappedResults = JSON.parse(text) as CrmMappingResult[];
      return mappedResults;
    } catch (error: any) {
      console.error(`Gemini processBatch failed on model '${activeModel}' (Attempt ${attempt}/3):`, error.message || error);

      if (attempt < 3) {
        console.log(`Retrying on model '${activeModel}' in 2 seconds...`);
        await new Promise((resolve) => setTimeout(resolve, 2000));
        return this.processBatch(batch, attempt + 1);
      }

      throw new Error(`Failed to map batch after 3 attempts. Error: ${error.message || error}`);
    }
  }
}
