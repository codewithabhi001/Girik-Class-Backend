import { config } from 'dotenv';
config();

import { generateAIResponse } from './src/modules/ai/providers/index.js';

// Temporarily set active provider to nvidia
process.env.ACTIVE_AI_PROVIDER = 'nvidia';

async function run() {
    try {
        console.log("Testing NVIDIA API Provider with system tools injected...");
        const result = await generateAIResponse([
            { role: 'user', content: 'Create a client named "NVIDIA Shipping Co" with email contact@nvshipping.com.' }
        ]);
        console.log("\n--- Success ---");
        console.log("Response Message:\n", result.message);
    } catch (e) {
        console.error("\n--- Error ---");
        console.error(e);
    }
}

run();
