import JSZip from 'jszip';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export interface TaxPackOptions {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  expenses: Array<{ id: string; date: string; category: string; description: string; amount: number; receipt_url: string | null }>;
  trips: Array<{ id: string; start_time: string; distance_miles: number; purpose: string; start_location?: any; end_location?: any }>;
  companyName?: string;
}

export async function buildTaxPackZip(opts: TaxPackOptions): Promise<string> {
  const zip = new JSZip();

  // CSV: expenses.csv
  let expensesCsv = 'Date,Category,Description,Amount,Receipt\n';
  for (const e of opts.expenses) {
    const desc = (e.description || '').replace(/"/g, '""');
    const receipt = e.receipt_url ? e.receipt_url : '';
    expensesCsv += `${e.date},${e.category},"${desc}",${e.amount.toFixed(2)},${receipt}\n`;
  }
  zip.file('expenses.csv', expensesCsv);

  // CSV: mileage.csv
  let mileageCsv = 'Date,Miles,Purpose,From,To\n';
  for (const t of opts.trips) {
    const date = t.start_time.split('T')[0];
    const from = t.start_location?.address || '';
    const to = t.end_location?.address || '';
    mileageCsv += `${date},${t.distance_miles.toFixed(1)},${t.purpose},"${from}","${to}"\n`;
  }
  zip.file('mileage.csv', mileageCsv);

  // Manifest
  const manifest = {
    companyName: opts.companyName || null,
    period: { start: opts.startDate, end: opts.endDate },
    counts: { expenses: opts.expenses.length, trips: opts.trips.length },
    generatedAt: new Date().toISOString(),
    note: 'Receipts are referenced by URL if cloud-hosted.'
  };
  zip.file('manifest.json', JSON.stringify(manifest, null, 2));

  // Receipts folder: attempt to fetch and include small thumbnails when possible
  const receiptsFolder = zip.folder('receipts');
  if (receiptsFolder) {
    for (const e of opts.expenses) {
      if (!e.receipt_url) continue;
      const filenameBase = `${e.date}_${sanitize(e.category)}_${sanitize(e.description)}_${e.id}`.slice(0, 80);
      const fileName = `${filenameBase}.jpg`;
      try {
        // Best-effort download; if fails, skip silently
        const res = await FileSystem.downloadAsync(e.receipt_url, FileSystem.cacheDirectory + fileName);
        const b64 = await FileSystem.readAsStringAsync(res.uri, { encoding: (FileSystem as any).EncodingType?.Base64 || 'base64' });
        receiptsFolder.file(fileName, b64, { base64: true });
      } catch {
        // Skip if cannot download public URL
      }
    }
  }

  const content = await zip.generateAsync({ type: 'base64' });
  const outPath = (FileSystem as any).documentDirectory + `tax_pack_${opts.startDate}_to_${opts.endDate}.zip`;
  await FileSystem.writeAsStringAsync(outPath, content, { encoding: (FileSystem as any).EncodingType?.Base64 || 'base64' });
  return outPath;
}

export async function shareFile(fileUri: string, title: string) {
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(fileUri, { mimeType: 'application/zip', dialogTitle: title });
  }
}

function sanitize(s: string) {
  return (s || '').toString().replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '').toLowerCase();
}

