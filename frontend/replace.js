import fs from 'fs';
import path from 'path';

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    for (const file of list) {
        const filePath = path.resolve(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(filePath));
        } else if (filePath.endsWith('.tsx')) {
            results.push(filePath);
        }
    }
    return results;
}

const files = walk('src');
for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let newContent = content.replace(/text-white(?![a-zA-Z0-9_-])/g, 'text-theme-text-primary');
  newContent = newContent.replace(/text-gray-(300|400|500)(?![a-zA-Z0-9_-])/g, 'text-theme-text-muted');
  
  if (content !== newContent) {
    fs.writeFileSync(file, newContent);
    console.log(`Updated ${file}`);
  }
}
console.log('Done replacing colors');
