'use client';

import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import { Upload, FileCode, AlertCircle, RefreshCw } from 'lucide-react';

interface FileParsedData {
  fileName: string;
  fileSize: string;
  totalRows: number;
  columns: string[];
  previewRows: Record<string, unknown>[];
  allRows: Record<string, unknown>[];
}

interface DropZoneProps {
  onFileParsed: (data: FileParsedData) => void;
}

export default function DropZone({ onFileParsed }: DropZoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateAndParseFile = (file: File) => {
    setError(null);
    setIsParsing(true);

    // Validate type (by extension or mime type)
    const isCsv = file.name.endsWith('.csv') || file.type === 'text/csv' || file.type === 'application/vnd.ms-excel';
    if (!isCsv) {
      setError('Invalid file type. Please upload a valid CSV file.');
      setIsParsing(false);
      return;
    }

    // Validate size (e.g. 50MB limit client-side)
    if (file.size === 0) {
      setError('The uploaded CSV file is empty.');
      setIsParsing(false);
      return;
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: 'greedy',
      complete: (results) => {
        setIsParsing(false);
        const data = results.data as Record<string, unknown>[];
        const fields = results.meta.fields || [];

        if (data.length === 0 || fields.length === 0) {
          setError('No records or headers found in this CSV.');
          return;
        }

        onFileParsed({
          fileName: file.name,
          fileSize: formatFileSize(file.size),
          totalRows: data.length,
          columns: fields,
          previewRows: data.slice(0, 10), // client preview first 10 rows
          allRows: data,
        });
      },
      error: (parseError) => {
        setIsParsing(false);
        setError(`Failed to parse CSV: ${parseError.message}`);
      },
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndParseFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndParseFile(e.target.files[0]);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={triggerFileSelect}
        className={`group relative flex flex-col items-center justify-center w-full min-h-[320px] p-8 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300 ${
          isDragActive
            ? 'border-primary bg-primary/5 scale-[1.01] shadow-lg shadow-primary/5'
            : 'border-border bg-card hover:border-primary/50 hover:bg-muted/30'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="hidden"
        />

        {isParsing ? (
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="relative flex items-center justify-center">
              <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
              <RefreshCw className="absolute h-6 w-6 text-primary animate-pulse" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-lg text-foreground">Reading CSV...</p>
              <p className="text-sm text-muted-foreground">Parsing records client-side using PapaParse</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform group-hover:scale-110 duration-300">
              <Upload className="h-8 w-8" />
            </div>
            
            <div className="space-y-2">
              <p className="font-semibold text-xl text-foreground">
                Drag & drop your CSV here, or <span className="text-primary hover:underline">browse</span>
              </p>
              <p className="text-sm text-muted-foreground max-w-sm">
                Supported formats: Standard CSV exported from Facebook Leads, CRM, Google Ads, or spreadsheets.
              </p>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary border border-border text-xs text-muted-foreground">
              <FileCode className="h-3.5 w-3.5" />
              <span>Comma Separated Values (.csv)</span>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive animate-in fade-in slide-in-from-top-2 duration-200">
          <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
          <div>
            <h4 className="font-semibold text-sm">Upload Error</h4>
            <p className="text-xs mt-0.5 opacity-90">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
