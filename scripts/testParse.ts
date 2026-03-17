import { parseSmartDTM } from '../src/services/parsers/dtm';
import * as path from 'path';

const file = path.join(__dirname, '../data/error/dtm/pen-history.xlsx');
try {
  const result = parseSmartDTM(file);
  console.log(`Report type: ${result.type}`);
  if (result.penHistory) {
      console.log('Group 33 rows:', result.penHistory.filter((r) => r.groupCode === '33'));
  }
} catch (e) {
  console.error("Parse failed", e);
}
