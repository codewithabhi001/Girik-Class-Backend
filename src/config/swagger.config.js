import path from 'path';
import { fileURLToPath } from 'url';
import YAML from 'yamljs';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load base configuration from YAML
const swaggerDefinition = YAML.load(path.join(__dirname, '../docs/swagger.yaml'));

// Determine Server URL
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';
const SERVER_IP = '13.239.63.143'; // User provided server IP

// Set servers based on environment
// "if it is local then localhost if it on server then server address"
if (isProduction || process.env.USE_SERVER_IP === 'true') {
    swaggerDefinition.servers = [
        {
            url: `http://${SERVER_IP}:${PORT}/api/v1`,
            description: 'Production Server'
        },
        {
            url: '/api/v1',
            description: 'Current Host (Relative)'
        }
    ];
} else {
    swaggerDefinition.servers = [
        {
            url: `http://localhost:${PORT}/api/v1`,
            description: 'Local Development Server'
        },
        {
            url: '/api/v1',
            description: 'Current Host (Relative)'
        }
    ];
}


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
