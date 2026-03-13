const { execSync } = require('child_process');
const fs = require('fs');

try {
  console.log('Running prisma generate...');
  const genOutput = execSync('npx prisma generate', { encoding: 'utf-8' });
  console.log(genOutput);

  console.log('Running prisma db push...');
  const pushOutput = execSync('npx prisma db push --accept-data-loss', { encoding: 'utf-8' });
  console.log(pushOutput);
  
} catch (error) {
  console.error("Error executing command:");
  if (error.stdout) console.error("STDOUT:", error.stdout.toString());
  if (error.stderr) console.error("STDERR:", error.stderr.toString());
}
