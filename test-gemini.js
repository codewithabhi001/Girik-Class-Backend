import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

async function run() {
    const apiKey = process.env.GEMINI_API_KEY;
    console.log('Using API Key:', apiKey ? 'Loaded' : 'Missing');
    
    const genAI = new GoogleGenerativeAI(apiKey);
    
    const modelsToTest = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash', 'gemini-pro'];
    
    for (const modelName of modelsToTest) {
        console.log(`\nTesting model: ${modelName}`);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent('Hi');
            console.log(`✅ Success for ${modelName}`);
        } catch (error) {
            console.error(`❌ Error for ${modelName}:`, error.message);
        }
    }
}

run();
