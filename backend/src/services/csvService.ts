import fs from 'fs';
import csvParser from 'csv-parser';

export class CsvService {
  /**
   * Parses the first N rows of a CSV file for preview by streaming.
   * Immediately terminates the file read stream once the preview limit is reached.
   */
  static parseCsvPreview(filePath: string, limit: number = 10): Promise<Record<string, string>[]> {
    return new Promise((resolve, reject) => {
      const results: Record<string, string>[] = [];
      const readStream = fs.createReadStream(filePath);
      
      const parser = readStream.pipe(csvParser());

      parser.on('data', (data) => {
        // Trim headers and values
        const cleanData: Record<string, string> = {};
        let hasContent = false;
        
        for (const [key, val] of Object.entries(data)) {
          const cleanKey = key.trim();
          const cleanVal = typeof val === 'string' ? val.trim() : String(val);
          cleanData[cleanKey] = cleanVal;
          if (cleanVal !== '') {
            hasContent = true;
          }
        }
        
        // Only push if row has at least one cell with content
        if (hasContent) {
          results.push(cleanData);
        }
        
        if (results.length >= limit) {
          // Destroy the stream to avoid reading more of the file
          readStream.destroy();
          resolve(results);
        }
      });

      parser.on('end', () => {
        resolve(results);
      });

      parser.on('error', (err) => {
        reject(err);
      });
    });
  }

  /**
   * Parses an entire CSV file as a stream.
   */
  static parseFullCsv(filePath: string): Promise<Record<string, string>[]> {
    return new Promise((resolve, reject) => {
      const results: Record<string, string>[] = [];
      const readStream = fs.createReadStream(filePath);
      
      const parser = readStream.pipe(csvParser());

      parser.on('data', (data) => {
        const cleanData: Record<string, string> = {};
        let hasContent = false;
        
        for (const [key, val] of Object.entries(data)) {
          const cleanKey = key.trim();
          const cleanVal = typeof val === 'string' ? val.trim() : String(val);
          cleanData[cleanKey] = cleanVal;
          if (cleanVal !== '') {
            hasContent = true;
          }
        }
        
        if (hasContent) {
          results.push(cleanData);
        }
      });

      parser.on('end', () => {
        resolve(results);
      });

      parser.on('error', (err) => {
        reject(err);
      });
    });
  }
}
