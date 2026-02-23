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

let expressRoutes = [];

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  // Simple regex to catch generic routes. We'll strip regex specifics later manually if needed.
  const regex = /router\.(get|post|put|patch|delete)\(\s*(['"`])([^'"`]+)\2/g;
  let match;
  
  const dirName = path.basename(path.dirname(file)).replace('_', '-');
  
  while ((match = regex.exec(content)) !== null) {
    const method = match[1];
    let routePath = match[3];
    // Handle express to swagger path params: :jobId -> {jobId}
    const swaggerPathFragment = routePath.replace(/:([a-zA-Z0-9_]+)/g, '{$1}');
    
    expressRoutes.push({
      file: file.replace(__dirname, ''),
      module: dirName,
      method: method.toLowerCase(),
      expressPath: routePath,
      swaggerPathFragment: swaggerPathFragment
    });
  }
});

let missing = [];

const specPaths = Object.keys(spec.paths);

expressRoutes.forEach(route => {
  // Check if this route is covered in Swagger
  // The prefix is usually /api/v1/{module} but not always.
  // E.g. /api/v1/jobs/:jobId/checklist could be mapped in checklists module.
  
  let found = false;
  let matchingSpecPath = null;
  
  for (let sp of specPaths) {
     if (sp.endsWith(route.swaggerPathFragment) || 
         (route.swaggerPathFragment === '/' && sp.endsWith('/' + route.module))) {
         if (spec.paths[sp][route.method]) {
             found = true;
             matchingSpecPath = sp;
             break;
         }
     }
  }
  
  if (!found) {
    // try looser matching
    for (let sp of specPaths) {
      if (sp.includes(route.swaggerPathFragment.replace(/\/$/, ''))) {
          if (spec.paths[sp] && spec.paths[sp][route.method]) {
            found = true;
            if(route.swaggerPathFragment !== '/') break;
          }
      }
    }
  }
  
  if (!found) {
    missing.push(`Missing: ${route.method.toUpperCase()} ${route.expressPath} (Module: ${route.module}) from ${route.file}`);
  }
});

fs.writeFileSync('missing-swagger.txt', missing.join('\n'));
console.log(`Found ${missing.length} missing endpoints.`);
