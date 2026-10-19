import { execSync } from 'child_process';
import fs from 'fs';

function getFiles() {
  const status = execSync('git status --porcelain', { encoding: 'utf-8' });
  const lines = status.split('\n').filter(Boolean);
  const files = [];

  for (const line of lines) {
    const rawPath = line.substring(3).trim().replace(/^"|"$/g, '');
    if (fs.existsSync(rawPath) && fs.statSync(rawPath).isDirectory()) {
      const dirFiles = fs.readdirSync(rawPath, { recursive: true });
      for (const df of dirFiles) {
        const full = `${rawPath}/${df}`.replace(/\\/g, '/');
        if (fs.existsSync(full) && fs.statSync(full).isFile()) {
          files.push(full);
        }
      }
    } else {
      files.push(rawPath);
    }
  }

  return Array.from(new Set(files));
}

async function main() {
  const files = getFiles();
  console.log(`Starting to commit and push ${files.length} files one by one to GitHub...`);

  let count = 0;
  for (const file of files) {
    count++;
    try {
      execSync(`git add "${file}"`, { stdio: 'pipe' });
      execSync(`git commit -m "Update ${file}"`, { stdio: 'pipe' });
      execSync(`git push origin main`, { stdio: 'pipe' });
      console.log(`[${count}/${files.length}] Pushed: ${file}`);
    } catch (err) {
      console.warn(`[${count}/${files.length}] Notice for ${file}:`, err.message?.slice(0, 100));
    }
  }

  console.log(`\nCompleted pushing ${files.length} files individually to GitHub!`);
}

main().catch(console.error);
