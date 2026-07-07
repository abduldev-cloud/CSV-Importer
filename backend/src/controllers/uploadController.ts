import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import { CsvService } from '../services/csvService';

export const handleUpload = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        message: 'No file uploaded.',
      });
      return;
    }

    const filePath = req.file.path;

    // Validate if the file is empty
    const stats = fs.statSync(filePath);
    if (stats.size === 0) {
      fs.unlinkSync(filePath); // Delete temporary file
      res.status(400).json({
        success: false,
        message: 'The uploaded CSV file is empty.',
      });
      return;
    }

    // Get the first 10 rows for table headers and rows preview
    const previewRows = await CsvService.parseCsvPreview(filePath, 10);

    // Clean up temporary upload file immediately
    fs.unlinkSync(filePath);

    if (previewRows.length === 0) {
      res.status(400).json({
        success: false,
        message: 'The CSV file does not contain any record rows.',
      });
      return;
    }

    const headers = Object.keys(previewRows[0]);

    res.status(200).json({
      success: true,
      fileName: req.file.originalname,
      fileSize: `${(stats.size / 1024).toFixed(2)} KB`,
      headers,
      previewRows,
    });
  } catch (error) {
    // Ensure file is deleted on error
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {
        console.error('Failed to delete temp file on error:', err);
      }
    }
    next(error);
  }
};
