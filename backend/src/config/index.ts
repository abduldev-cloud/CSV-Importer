import dotenv from 'dotenv';
import path from 'path';

// Load .env from root of backend
dotenv.config();

// Auto-clean API key by trimming whitespaces and stripping leading/trailing quotes
const rawApiKey = process.env.GEMINI_API_KEY || '';
const cleanApiKey = rawApiKey.trim().replace(/^["']|["']$/g, '');

export const config = {
  port: process.env.PORT || 5000,
  geminiApiKey: cleanApiKey,
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  uploadDir: path.join(__dirname, '../../uploads'),
};

// Validate critical configurations
if (!config.geminiApiKey) {
  console.warn('WARNING: GEMINI_API_KEY is not defined in environment variables. AI operations will fail.');
}
