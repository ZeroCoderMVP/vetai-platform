const { execSync } = require('child_process');

try {
  console.log("Finding process on port 3000...");
  const output = execSync('netstat -ano | findstr :3000', { encoding: 'utf-8' });
  const lines = output.split('\n').filter(Boolean);
  const listening = lines.find(l => l.includes('LISTENING'));
  if (listening) {
    const parts = listening.trim().split(/\s+/);
    const pid = parts[parts.length - 1];
    console.log(`Killing PID ${pid}...`);
    execSync(`taskkill /F /PID ${pid}`);
    console.log("Killed successfully.");
  } else {
    console.log("No process on port 3000.");
  }
} catch (err) {
  console.log("Error or no process:", err.message);
}
