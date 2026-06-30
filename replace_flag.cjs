const fs = require('fs');
const path = require('path');

function walkDir(dir) {
    let files = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            files = files.concat(walkDir(fullPath));
        } else if (entry.isFile() && fullPath.endsWith('.html')) {
            files.push(fullPath);
        }
    }
    return files;
}

const targetDir = '/Users/abhinavvishwakarma/Desktop/Gr-class-Workshop/Gr-Class-Backend/ONLY CERTIFICATES';
const htmlFiles = walkDir(targetDir);

let modifiedCount = 0;
for (const file of htmlFiles) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace the specific div
    if (content.includes('<div class="hdr-flag">{flag_state}</div>')) {
        content = content.replace('<div class="hdr-flag">{flag_state}</div>', '<div class="hdr-flag">{term}</div>');
        fs.writeFileSync(file, content, 'utf8');
        modifiedCount++;
    }
}
console.log(`Modified ${modifiedCount} files.`);
