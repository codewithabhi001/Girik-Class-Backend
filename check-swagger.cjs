const fs = require('fs');
const path = require('path');
const spec = require('./spec.json');

const modulesDir = path.join(__dirname, 'src', 'modules');
const files = [];

function getFiles(dir) {
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getFiles(fullPath);
    } else if (file.endsWith('.routes.js')) {
      files.push(fullPath);
    }
  }
}

getFiles(modulesDir);

let missing = [];

const appJsPath = path.join(__dirname, 'src', 'app.js');
let appJsContent = '';
if (fs.existsSync(appJsPath)) {
  appJsContent = fs.readFileSync(appJsPath, 'utf8');
}

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  // simplistic regex to find router.get('/path', ...)
  const regex = /router\.(get|post|put|patch|delete)\(\s*(['"`])([^'"`]+)\2/g;
  let match;

  // also find what prefix is used in app.js or the local routes structure
  const basename = path.basename(file, '.routes.js');
  const dirName = path.basename(path.dirname(file));

  while ((match = regex.exec(content)) !== null) {
    const method = match[1];
    let routePath = match[3];
    // routePath is something like "/", "/:id", "/jobs/:jobId/proof"
    // convert express params :id to swagger {id}
    const swaggerPathFragment = routePath.replace(/:([a-zA-Z0-9_]+)/g, '{$1}');

    // We don't know the exact base path but let's see if the fragment exists in the spec
    let found = false;
    for (const specPath in spec.paths) {
      if (specPath.endsWith(swaggerPathFragment) ||
        (routePath === '/' && specPath.includes(dirName.replace('_', '-')))) {
        if (spec.paths[specPath][method]) {
          found = true;
          break;
        }
      }
    }

    if (!found) {
      missing.push(`${method.toUpperCase()} in ${dirName}: ${routePath}`);
    }
  }
});

console.log(`Missing routes in swagger:\n` + missing.join('\n'));
