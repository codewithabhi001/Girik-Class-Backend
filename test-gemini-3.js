import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

async function run() {
    const apiKey = process.env.GEMINI_API_KEY;
    const genAI = new GoogleGenerativeAI(apiKey);
    
    const modelsToTest = ['gemini-3.5-flash', 'gemini-flash-latest'];
    
    for (const modelName of modelsToTest) {
        console.log(`\nTesting model: ${modelName}`);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent('Hi');
            console.log(`✅ Success for ${modelName}:`, result.response.text());
        } catch (error) {
            console.error(`❌ Error for ${modelName}:`, error.message);
        }
    }
}

run();
