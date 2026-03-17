import * as fs from 'fs';
import * as path from 'path';

const afiDir = path.join(__dirname, '../data/inbox/afimilk');
const processDir = path.join(__dirname, '../data/processed/afimilk');

function checkAfimilk(dir: string) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
    for (const f of files) {
        try {
            const data = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf-8'));
            if (Array.isArray(data)) {
                let group33Count = 0;
                for (const row of data) {
                    if (String(row.GroupNumber) === '33' || String(row.group) === '33') {
                        group33Count++;
                    }
                }
                if (group33Count > 0) {
                    console.log(`Afimilk File ${f} has ${group33Count} cows in group 33. Total rows: ${data.length}`);
                }
            }
        } catch (e) {
            // ignore
        }
    }
}

checkAfimilk(afiDir);
checkAfimilk(processDir);
