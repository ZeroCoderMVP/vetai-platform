// Inspect DTM Excel files - dumps column names and sample data
const path = require("path");
const fs = require("fs");
const XLSX = require("xlsx");

const DTM_DIR = path.resolve(__dirname, "..", "DTM");
const out = [];

if (!fs.existsSync(DTM_DIR)) {
  out.push("DTM dir not found: " + DTM_DIR);
} else {
  const files = fs.readdirSync(DTM_DIR).filter(f => f.endsWith(".xlsx"));
  out.push(`Found ${files.length} files in ${DTM_DIR}\n`);

  for (const file of files) {
    out.push(`\n${"=".repeat(60)}`);
    out.push(`FILE: ${file}`);
    out.push(`${"=".repeat(60)}`);
    
    const workbook = XLSX.readFile(path.join(DTM_DIR, file));
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet, { defval: "" });
    
    out.push(`Sheet: ${workbook.SheetNames[0]}`);
    out.push(`Rows: ${data.length}`);
    
    if (data.length > 0) {
      const cols = Object.keys(data[0]);
      out.push(`\nCOLUMNS (${cols.length}):`);
      cols.forEach((c, i) => out.push(`  [${i}] "${c}"`));
      
      out.push(`\nFIRST 3 ROWS:`);
      for (let i = 0; i < Math.min(3, data.length); i++) {
        out.push(`\n  Row ${i}:`);
        for (const [key, val] of Object.entries(data[i])) {
          out.push(`    "${key}" = ${JSON.stringify(val)}`);
        }
      }
    }
  }
}

fs.writeFileSync(path.resolve(__dirname, "dtm_inspect_result.txt"), out.join("\n"), "utf8");
console.log("Done! Check dtm_inspect_result.txt");
