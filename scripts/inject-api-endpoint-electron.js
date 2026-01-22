const fs = require('fs');
const path = require('path');

const OLD_API = 'http://103.82.27.132:9090';
const NEW_API = 'http://localhost:8080';

function replaceInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.includes(OLD_API)) {
      content = content.replace(new RegExp(OLD_API.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), NEW_API);
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✓ Updated: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`✗ Error processing ${filePath}:`, error.message);
    return false;
  }
}

function processDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    return 0;
  }

  const files = fs.readdirSync(dirPath);
  let updatedCount = 0;

  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      updatedCount += processDirectory(filePath);
    } else if (file.endsWith('.js') || file.endsWith('.html')) {
      if (replaceInFile(filePath)) {
        updatedCount++;
      }
    }
  });

  return updatedCount;
}

// Process both dist/scale and dist-electron/win-unpacked/app
const paths = [
  path.join(__dirname, '../dist/scale'),
  path.join(__dirname, '../dist-electron/win-unpacked/app')
];

let totalUpdated = 0;
paths.forEach(distPath => {
  if (fs.existsSync(distPath)) {
    console.log(`\nProcessing directory: ${distPath}`);
    const count = processDirectory(distPath);
    totalUpdated += count;
    console.log(`✓ Updated ${count} file(s) in ${distPath}`);
  } else {
    console.log(`⚠ Directory not found: ${distPath}`);
  }
});

if (totalUpdated > 0) {
  console.log(`\n✓ Total: Updated ${totalUpdated} file(s)`);
} else {
  console.log(`\n⚠ No files were updated. Make sure the directories exist and contain the old API endpoint.`);
}

