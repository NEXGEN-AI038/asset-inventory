import type { AssetInput, AssetStatus } from '@/types';

export const CSV_HEADERS = [
  'asset_tag',
  'name',
  'category',
  'assigned_to',
  'location',
  'purchase_date',
  'purchase_price',
  'status',
  'notes',
];

export function generateSampleCsv(): string {
  const rows = [
    CSV_HEADERS.join(','),
    ['AST-001', 'Dell Latitude 5520', 'Laptops', 'John Smith', 'HQ - Floor 2', '2023-03-15', '1200.00', 'In Use', 'Primary dev laptop'].join(','),
    ['AST-002', 'iPhone 14 Pro', 'Mobile', 'Sarah Johnson', 'HQ - Floor 1', '2023-06-01', '999.00', 'In Use', 'Company phone'].join(','),
    ['AST-003', 'Standing Desk', 'Furniture', 'Marketing Dept', 'HQ - Floor 3', '2022-11-20', '650.00', 'Active', 'Adjustable height'].join(','),
    ['AST-004', 'Adobe Creative Cloud', 'Software', 'Design Team', 'Remote', '2024-01-10', '599.88', 'In Use', '5 seats'].join(','),
    ['AST-005', 'Canon Printer MF445dw', 'Office Equipment', 'Operations', 'HQ - Floor 1', '2023-08-05', '380.00', 'Under Maintenance', 'Paper jam issue'].join(','),
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
