import { config } from 'dotenv';
config();

import { groqProvider } from './src/modules/ai/providers/groq.provider.js';

async function run() {
    try {
        console.log("Testing Groq Provider with simple message...");
        const result = await groqProvider([{ role: 'user', content: 'Say hello in 3 words' }]);
        console.log("\n--- Success ---");
        console.log("Response Message:", result.message);
    } catch (e) {
        console.error("\n--- Error ---");
        console.error(e);
    }
}

run();
