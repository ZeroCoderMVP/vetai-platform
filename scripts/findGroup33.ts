import * as XLSX from 'xlsx';
import * as path from 'path';

const file = path.join(__dirname, '../data/error/dtm/pen-history.xlsx');
try {
  const workbook = XLSX.readFile(file);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawData = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: 0 });

  console.log("Found rows for Group 33 (raw):");
  for (const row of rawData) {
    const groupCode = String(
      row["Код Технологической группы"] || row["Код"] || row["Group"] || ""
    ).trim();
    if (groupCode === '33') {
        console.log(row);
    }
  }
} catch (e) {
  console.error(e);
}
