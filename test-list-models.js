import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

async function run() {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();
        console.log(JSON.stringify(data.models.map(m => m.name), null, 2));
    } catch(e) {
        console.log(e);
    }
}

run();
