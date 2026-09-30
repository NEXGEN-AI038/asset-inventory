import { useState, useRef, useCallback } from 'react';
import { Upload, FileSpreadsheet, Download, Check, X, ArrowRight, AlertCircle } from 'lucide-react';
import type { AssetInput } from '@/types';
import { parseCsv, mapCsvRecordToAsset, generateSampleCsv, downloadFile, CSV_HEADERS } from '@/lib/csv';

interface CsvImporterProps {
  onClose: () => void;
  onImport: (records: AssetInput[]) => void;
}

type Step = 'upload' | 'mapping' | 'preview';

export default function CsvImporter({ onClose, onImport }: CsvImporterProps) {
  const [step, setStep] = useState<Step>('upload');
  const [fileName, setFileName] = useState('');
  const [records, setRecords] = useState<Record<string, string>[]>([]);
  const [parsedAssets, setParsedAssets] = useState<AssetInput[]>([]);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    setError('');
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      setError('Please upload a .csv file');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      try {
        const parsed = parseCsv(text);
        if (parsed.length === 0) {
          setError('The CSV file appears to be empty or has no data rows');
          return;
        }
        setRecords(parsed);
        setParsedAssets(parsed.map(mapCsvRecordToAsset));
        setFileName(file.name);
        setStep('mapping');
      } catch {
        setError('Failed to parse the CSV file. Please check the format.');
      }
    };
    reader.onerror = () => setError('Failed to read the file');
    reader.readAsText(file);
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleDownloadSample = () => {
    downloadFile('asset_template.csv', generateSampleCsv());
  };

  const handleConfirmImport = () => {
    const valid = parsedAssets.filter((a) => a.asset_tag.trim() && a.name.trim());
    if (valid.length === 0) {
      setError('No valid records found. Each row needs at least an asset_tag and name.');
      return;
    }
    onImport(valid);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-800">Import Assets from CSV</h2>
              <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                <StepIndicator active={step === 'upload'} done={step !== 'upload'} label="Upload" />
                <ArrowRight className="h-3 w-3" />
                <StepIndicator active={step === 'mapping'} done={step === 'preview'} label="Map" />
                <ArrowRight className="h-3 w-3" />
                <StepIndicator active={step === 'preview'} done={false} label="Preview" />
              </div>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto px-6 py-5">
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {step === 'upload' && (
            <div className="space-y-4">
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed py-12 transition-all ${
                  dragging ? 'border-indigo-400 bg-indigo-50' : 'border-slate-300 bg-slate-50 hover:border-indigo-300 hover:bg-indigo-50/50'
                }`}
              >
                <Upload className={`mb-3 h-10 w-10 ${dragging ? 'text-indigo-500' : 'text-slate-400'}`} />
                <p className="text-sm font-medium text-slate-600">
                  Drag & drop your CSV file here, or click to browse
                </p>
                <p className="mt-1 text-xs text-slate-400">Supports standard CSV format</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                />
              </div>

              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-600">Need a template?</p>
                  <p className="text-xs text-slate-400">Download a sample CSV with the correct headers</p>
                </div>
                <button
                  onClick={handleDownloadSample}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:border-indigo-300 hover:text-indigo-600"
                >
                  <Download className="h-4 w-4" /> Download Template
                </button>
              </div>

              <div className="rounded-xl border border-slate-200 p-4">
                <p className="mb-2 text-xs font-semibold text-slate-500">Required CSV columns:</p>
                <div className="flex flex-wrap gap-2">
                  {CSV_HEADERS.map((h) => (
                    <code key={h} className="rounded-lg bg-slate-100 px-2 py-1 text-xs text-slate-600">{h}</code>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 'mapping' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                <Check className="h-4 w-4" />
                Parsed <strong>{records.length}</strong> rows from <strong>{fileName}</strong>
              </div>

              <div className="rounded-xl border border-slate-200">
                <div className="border-b border-slate-100 px-4 py-3">
                  <h3 className="text-sm font-semibold text-slate-700">Field Mapping</h3>
                  <p className="text-xs text-slate-400">CSV columns are automatically mapped to asset fields</p>
                </div>
                <div className="divide-y divide-slate-100">
                  {CSV_HEADERS.map((header) => {
                    const hasColumn = records.some((r) => header in r);
                    const sample = records[0]?.[header] ?? '';
                    return (
                      <div key={header} className="flex items-center gap-3 px-4 py-2.5">
                        <div className={`flex h-6 w-6 items-center justify-center rounded-full ${hasColumn ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-300'}`}>
                          {hasColumn ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                        </div>
                        <code className="w-32 shrink-0 text-xs font-medium text-slate-600">{header}</code>
                        <ArrowRight className="h-3 w-3 text-slate-300" />
                        <span className="flex-1 truncate text-xs text-slate-500">
                          {hasColumn ? `"${sample}"` : <span className="italic text-slate-300">not in file — will be empty</span>}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setStep('upload')}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep('preview')}
                  className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
                >
                  Preview Records
                </button>
              </div>
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200">
                <div className="border-b border-slate-100 px-4 py-3">
                  <h3 className="text-sm font-semibold text-slate-700">Preview ({parsedAssets.length} records)</h3>
                  <p className="text-xs text-slate-400">Review the data before importing into the database</p>
                </div>
                <div className="max-h-72 overflow-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 bg-slate-50">
                      <tr className="border-b border-slate-200">
                        <th className="px-3 py-2 font-semibold text-slate-500">Tag</th>
                        <th className="px-3 py-2 font-semibold text-slate-500">Name</th>
                        <th className="px-3 py-2 font-semibold text-slate-500">Category</th>
                        <th className="px-3 py-2 font-semibold text-slate-500">Status</th>
                        <th className="px-3 py-2 font-semibold text-slate-500">Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedAssets.map((a, i) => (
                        <tr key={i} className="border-b border-slate-50">
                          <td className="px-3 py-2 font-mono text-slate-500">{a.asset_tag || '—'}</td>
                          <td className="px-3 py-2 font-medium text-slate-700">{a.name || '—'}</td>
                          <td className="px-3 py-2 text-slate-500">{a.category}</td>
                          <td className="px-3 py-2 text-slate-500">{a.status}</td>
                          <td className="px-3 py-2 text-slate-500">${a.purchase_price.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setStep('mapping')}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
                >
                  Back
                </button>
                <button
                  onClick={handleConfirmImport}
                  className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
                >
                  <Check className="h-4 w-4" /> Import {parsedAssets.length} Records
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StepIndicator({ active, done, label }: { active: boolean; done: boolean; label: string }) {
  return (
    <span className={`flex items-center gap-1 ${active ? 'font-semibold text-indigo-500' : done ? 'text-emerald-500' : 'text-slate-300'}`}>
      {done && <Check className="h-3 w-3" />}
      {label}
    </span>
  );
}
