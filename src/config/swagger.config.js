import path from 'path';
import { fileURLToPath } from 'url';
import YAML from 'yamljs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load base configuration from YAML
const swaggerDefinition = YAML.load(path.join(__dirname, '../docs/swagger.yaml'));

const options = {
    // Import the base definition (info, servers, components, tags)
    definition: swaggerDefinition,

    // Paths to files containing OpenAPI definitions (JSDoc comments)
    // Ensure this points to your route files in modules
    apis: [
        './src/modules/**/*.routes.js',      // Routes with @swagger docs
        './src/modules/**/*.swagger.yaml',   // Domain specific swagger files (YAML)
        './src/modules/**/*.controller.js',  // (Optional) Controllers if docs are there
        './src/docs/*.yaml'                  // Scan other yaml docs if split
    ],
};

export default options;
