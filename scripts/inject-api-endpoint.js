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

const distPath = path.join(__dirname, '../dist/scale');
if (fs.existsSync(distPath)) {
  console.log(`Processing directory: ${distPath}`);
  const count = processDirectory(distPath);
  console.log(`\n✓ Updated ${count} file(s)`);
} else {
  console.error(`✗ Directory not found: ${distPath}`);
  process.exit(1);
}

