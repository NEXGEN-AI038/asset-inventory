import type { AssetInput, AssetStatus } from '@/types';

export const CSV_HEADERS = [
  'asset_tag',
  'name',
  'category',
  'assigned_to',
  'project_name',
  'assigned_by',
  'location',
  'purchase_date',
  'purchase_price',
  'status',
  'notes',
];

export function generateSampleCsv(): string {
  const rows = [
    CSV_HEADERS.join(','),
    ['PNL-001', 'Waaree 540W Mono PERC Panel', 'Solar Panels', '', '', '', 'Main Warehouse', '2026-09-10', '14500.00', 'Active', 'Serial WR540-0001'].join(','),
    ['PNL-002', 'Waaree 540W Mono PERC Panel', 'Solar Panels', 'Ravi Kumar', 'Sharma Residence 5kW', 'Anita Das', 'Site - Salt Lake', '2026-09-10', '14500.00', 'In Use', 'Serial WR540-0002'].join(','),
    ['INV-001', 'Growatt 5kW On-Grid Inverter', 'Inverters', '', '', '', 'Main Warehouse', '2026-09-12', '48000.00', 'Active', ''].join(','),
    ['BAT-001', 'Luminous 150Ah Battery', 'Batteries', '', '', '', 'Main Warehouse', '2026-09-15', '16500.00', 'Active', ''].join(','),
    ['STR-001', 'GI Mounting Structure 5kW', 'Mounting Structures', 'Imran Sheikh', 'Das Apartments 10kW', 'Anita Das', 'Site - Howrah', '2026-09-18', '22000.00', 'In Use', ''].join(','),
  ];
  return rows.join('\n');
}

export function downloadFile(filename: string, content: string, mimeType = 'text/csv') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function parseCsv(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];

  const headers = splitCsvLine(lines[0]).map((h) => h.trim());

  const records: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = splitCsvLine(lines[i]);
    const record: Record<string, string> = {};
    headers.forEach((header, idx) => {
      record[header] = (values[idx] ?? '').trim();
    });
    records.push(record);
  }
  return records;
}

function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

export function mapCsvRecordToAsset(record: Record<string, string>): AssetInput {
  const get = (key: string) => record[key] ?? '';
  return {
    asset_tag: get('asset_tag'),
    name: get('name'),
    category: get('category') || 'Other',
    assigned_to: get('assigned_to') || null,
    project_name: get('project_name') || null,
    assigned_by: get('assigned_by') || null,
    location: get('location') || null,
    purchase_date: get('purchase_date') || null,
    purchase_price: parseFloat(get('purchase_price')) || 0,
    status: (get('status') as AssetStatus) || 'Active',
    notes: get('notes') || null,
  };
}

export function assetsToCsv(assets: AssetInput[]): string {
  const rows = [CSV_HEADERS.join(',')];
  for (const a of assets) {
    const values = CSV_HEADERS.map((h) => {
      const val = a[h as keyof AssetInput];
      if (val === null || val === undefined) return '';
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    });
    rows.push(values.join(','));
  }
  return rows.join('\n');
}
