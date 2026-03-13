import fs from 'fs';
fetch('http://127.0.0.1:3000/api/reporting/seed', { method: 'POST' })
  .then(res => res.text())
  .then(txt => console.log('Seed response:', txt))
  .catch(err => console.error('Seed error:', err));
