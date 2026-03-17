import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';

const dirs = [
  path.join(__dirname, '../data/inbox/dtm'),
  path.join(__dirname, '../data/processed/dtm'),
  path.join(__dirname, '../data/error/dtm')
];

for (const dir of dirs) {
  if (!fs.existsSync(dir)) continue;

  const files = fs.readdirSync(dir).filter(f => f.endsWith('.xlsx'));
  for (const file of files) {
    const filePath = path.join(dir, file);
    try {
      const workbook = XLSX.readFile(filePath);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rawData = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: 0 });
      for (let i = 0; i < rawData.length; i++) {
        const row = rawData[i];
        for (const [key, value] of Object.entries(row)) {
          const lowerKey = key.toLowerCase();
          if (lowerKey.includes('коров') || lowerKey.includes('head') || lowerKey.includes('голов') || lowerKey.includes('count')) {
            if (String(value).includes('191')) {
              console.log(`Found 191 in ${file}, row ${i+2}, column "${key}":`, row);
            }
          }
        }
      }
    } catch (e) {
      // ignore
    }
  }
}
