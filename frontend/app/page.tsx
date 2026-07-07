'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import DropZone from '@/components/DropZone';
import PreviewTable from '@/components/PreviewTable';
import { importCsvData, ImportResponse } from '@/services/api';
import {
  CheckCircle2,
  XCircle,
  BarChart3,
  ArrowLeft,
  RefreshCw,
  FileCheck,
  AlertTriangle,
  FileJson,
  FileSpreadsheet
} from 'lucide-react';

interface FileParsedData {
  fileName: string;
  fileSize: string;
  totalRows: number;
  columns: string[];
  previewRows: Record<string, unknown>[];
  allRows: Record<string, unknown>[];
}

export default function Home() {
  const [parsedData, setParsedData] = useState<FileParsedData | null>(null);
  const [importStatus, setImportStatus] = useState<'idle' | 'importing' | 'completed' | 'failed'>('idle');
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('Initializing import...');
  const [importResponse, setImportResponse] = useState<ImportResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Rotating loading texts to give a professional feedback experience
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (importStatus === 'importing') {
      const texts = [
        'Analyzing CSV schema and columns...',
        'Dividing records into batches of 50...',
        'Sending batch 1 to Gemini AI for intelligent mapping...',
        'Normalizing phone numbers and emails...',
        'Checking data source constraints...',
        'Validating records against CRM formats...',
        'Almost finished, compiling results...',
      ];
      let index = 0;
      interval = setInterval(() => {
        setLoadingText(texts[index % texts.length]);
        index++;
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [importStatus]);

  // Simulated progress bar animation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (importStatus === 'importing') {
      setProgress(5);
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 92) {
            clearInterval(interval);
            return 92; // hold near 92% until api returns
          }
          const increment = prev < 50 ? 8 : prev < 75 ? 4 : 1.5;
          return parseFloat((prev + increment).toFixed(1));
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [importStatus]);

  const handleFileParsed = (data: FileParsedData) => {
    setParsedData(data);
    setError(null);
  };

  const handleConfirmImport = async () => {
    if (!parsedData) return;
    setImportStatus('importing');
    setError(null);

    try {
      // POST parsed rows to backend API
      const result = await importCsvData(parsedData.allRows);

      setProgress(100);
      setImportResponse(result);
      setImportStatus('completed');
    } catch (err: unknown) {
      console.error(err);
      const errMsg = err instanceof Error ? err.message : 'An unexpected error occurred during AI processing. Please check if the backend is running and the Gemini API key is valid.';
      setError(errMsg);
      setImportStatus('failed');
    }
  };

  const handleReset = () => {
    setParsedData(null);
    setImportStatus('idle');
    setProgress(0);
    setImportResponse(null);
    setError(null);
  };

  // Convert JSON leads to CSV for download
  const handleDownloadCsv = () => {
    if (!importResponse || importResponse.imported.length === 0) return;
    const leads = importResponse.imported;
    const headers = Object.keys(leads[0]);

    const csvContent = [
      headers.join(','),
      ...leads.map(lead =>
        headers.map(header => {
          const val = lead[header];
          if (val === null || val === undefined) return '""';
          const stringVal = String(val).replace(/"/g, '""');
          return `"${stringVal}"`;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `groweasy_imported_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download JSON
  const handleDownloadJson = () => {
    if (!importResponse || importResponse.imported.length === 0) return;
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(importResponse.imported, null, 2)
    )}`;
    const link = document.createElement('a');
    link.setAttribute('href', jsonString);
    link.setAttribute('download', `groweasy_imported_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const successRate = importResponse
    ? ((importResponse.stats.importedCount / importResponse.stats.totalRecords) * 100).toFixed(1)
    : '0';

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans transition-colors duration-200">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col justify-start">
        {importStatus === 'idle' && !parsedData && (
          <div className="flex-1 flex flex-col items-center justify-center py-12">
            <div className="text-center space-y-4 max-w-2xl mb-10">
              <h1 className="text-4xl sm:text-5xl font-black tracking-tight bg-gradient-to-r from-primary via-indigo-500 to-indigo-600 bg-clip-text text-transparent">
                AI-Powered Lead & CSV Importer
              </h1>
              <p className="text-muted-foreground text-lg sm:text-xl">
                Upload chaotic spreadsheets or leads exports from any platform. Our backend uses Google Gemini AI to map, validate, and structure your records into the standard formats.
              </p>
            </div>
            <DropZone onFileParsed={handleFileParsed} />
          </div>
        )}

        {importStatus === 'idle' && parsedData && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* File info bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-card border border-border shadow-sm">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <FileCheck className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-foreground">{parsedData.fileName}</h3>
                  <p className="text-sm text-muted-foreground">
                    Size: {parsedData.fileSize} | Columns: {parsedData.columns.length} | Rows: {parsedData.totalRows}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleReset}
                  className="px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm font-semibold hover:bg-muted transition-colors flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Upload Different File
                </button>
                <button
                  onClick={handleConfirmImport}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary to-indigo-600 text-primary-foreground text-sm font-semibold hover:opacity-95 hover:scale-[1.02] shadow-md shadow-primary/20 transition-all flex items-center gap-2"
                >
                  Confirm & Import with AI
                </button>
              </div>
            </div>

            {/* Preview table wrapper */}
            <div className="space-y-2">
              <h2 className="text-xl font-bold tracking-tight text-foreground">File Preview (First 10 Rows)</h2>
              <PreviewTable headers={parsedData.columns} data={parsedData.previewRows} />
            </div>
          </div>
        )}

        {importStatus === 'importing' && (
          <div className="flex-1 flex flex-col items-center justify-center py-20 max-w-xl mx-auto w-full">
            <div className="w-full bg-card rounded-2xl border border-border p-8 text-center space-y-6 shadow-lg shadow-black/5">
              <div className="relative flex justify-center">
                <div className="h-20 w-20 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
                <RefreshCw className="absolute h-8 w-8 text-primary top-6 animate-pulse" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold text-foreground">Processing CSV Data</h3>
                <p className="text-sm text-muted-foreground animate-pulse duration-1000">{loadingText}</p>
              </div>

              {/* Progress bar container */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-muted-foreground">
                  <span>Import progress</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-indigo-500 transition-all duration-300 ease-out rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {importStatus === 'failed' && (
          <div className="flex-1 flex flex-col items-center justify-center py-16 max-w-lg mx-auto w-full">
            <div className="bg-card rounded-2xl border border-border p-8 text-center space-y-6 shadow-md">
              <div className="flex justify-center">
                <div className="h-16 w-16 items-center justify-center flex rounded-2xl bg-destructive/10 text-destructive">
                  <XCircle className="h-10 w-10" />
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold text-foreground">Import Process Failed</h3>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>

              <div className="flex justify-center gap-3">
                <button
                  onClick={handleReset}
                  className="px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm font-semibold hover:bg-muted transition-all flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Go Back
                </button>
                <button
                  onClick={handleConfirmImport}
                  className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/95 transition-all flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Retry Process
                </button>
              </div>
            </div>
          </div>
        )}

        {importStatus === 'completed' && importResponse && (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* Success Heading */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-2">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                  Import Complete
                </h1>
                <p className="text-muted-foreground mt-1">
                  Gemini AI successfully mapped and cleaned your CSV columns.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleReset}
                  className="px-4 py-2.5 rounded-xl border border-border bg-card text-foreground text-sm font-semibold hover:bg-muted transition-colors flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Import Another File
                </button>
              </div>
            </div>

            {/* Statistics Cards grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-card border border-border shadow-sm flex flex-col justify-between">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Evaluated</span>
                <span className="text-3xl font-black text-foreground mt-2">{importResponse.stats.totalRecords}</span>
                <span className="text-xs text-muted-foreground mt-1">Raw rows processed</span>
              </div>

              <div className="p-5 rounded-2xl bg-card border border-border shadow-sm flex flex-col justify-between">
                <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider">Total Imported</span>
                <span className="text-3xl font-black text-emerald-600 dark:text-emerald-500 mt-2">
                  {importResponse.stats.importedCount}
                </span>
                <span className="text-xs text-muted-foreground mt-1">Valid CRM records</span>
              </div>

              <div className="p-5 rounded-2xl bg-card border border-border shadow-sm flex flex-col justify-between">
                <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">Total Skipped</span>
                <span className="text-3xl font-black text-amber-600 dark:text-amber-500 mt-2">
                  {importResponse.stats.skippedCount}
                </span>
                <span className="text-xs text-muted-foreground mt-1">No contact details/failures</span>
              </div>

              <div className="p-5 rounded-2xl bg-card border border-border shadow-sm flex flex-col justify-between">
                <span className="text-xs font-bold text-primary uppercase tracking-wider">Processing Time</span>
                <span className="text-3xl font-black text-primary mt-2">
                  {(importResponse.stats.processingTimeMs / 1000).toFixed(2)}s
                </span>
                <span className="text-xs text-muted-foreground mt-1">AI Batch processing duration</span>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="p-5 rounded-2xl bg-card border border-border shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 bg-gradient-to-r from-primary/5 via-indigo-500/5 to-transparent">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-foreground">Transform Results Available</h4>
                  <p className="text-xs text-muted-foreground">
                    Import success rate of <span className="font-semibold text-foreground">{successRate}%</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleDownloadJson}
                  disabled={importResponse.imported.length === 0}
                  className="px-4 py-2.5 rounded-xl border border-border bg-card text-foreground text-sm font-semibold hover:bg-muted disabled:opacity-40 transition-all flex items-center gap-2"
                >
                  <FileJson className="h-4 w-4 text-orange-500" />
                  Export JSON
                </button>
                <button
                  onClick={handleDownloadCsv}
                  disabled={importResponse.imported.length === 0}
                  className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-95 shadow-md shadow-primary/10 disabled:opacity-40 transition-all flex items-center gap-2"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  Export CSV
                </button>
              </div>
            </div>

            {/* Tables for Imported/Skipped lists */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold tracking-tight text-foreground">Import Breakdown</h3>

              <div className="border border-border rounded-2xl overflow-hidden bg-card">
                <div className="border-b border-border bg-muted/20 px-6 py-4 flex items-center justify-between">
                  <span className="font-bold text-foreground text-sm">Skipped Records Details</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs bg-amber-500/10 border border-amber-500/20 text-amber-600 font-semibold flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {importResponse.skipped.length} Rows skipped
                  </span>
                </div>

                <div className="overflow-x-auto max-h-[300px]">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-muted/30 sticky top-0 shadow-[0_1px_0_0_rgba(0,0,0,0.05)] text-muted-foreground text-xs uppercase font-semibold">
                      <tr>
                        <th className="px-6 py-3">Row #</th>
                        <th className="px-6 py-3">Reason</th>
                        <th className="px-6 py-3">Raw Data Snippet</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {importResponse.skipped.length > 0 ? (
                        importResponse.skipped.map((skip, idx) => (
                          <tr key={idx} className="hover:bg-muted/5 transition-colors">
                            <td className="px-6 py-3 font-semibold text-foreground">{skip.rowNumber}</td>
                            <td className="px-6 py-3 text-amber-600 dark:text-amber-500 font-medium">
                              {skip.reason}
                            </td>
                            <td className="px-6 py-3 font-mono text-xs text-muted-foreground truncate max-w-sm">
                              {JSON.stringify(skip.rawData)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={3} className="px-6 py-8 text-center text-muted-foreground text-sm">
                            Perfect mapping! No records were skipped.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
