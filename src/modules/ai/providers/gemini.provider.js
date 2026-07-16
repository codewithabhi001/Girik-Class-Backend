import { GoogleGenerativeAI } from '@google/generative-ai';
import { allTools, getToolByName } from '../tools/index.js';

export const geminiProvider = async (messages) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY is not defined in environment variables.');

    const genAI = new GoogleGenerativeAI(apiKey);

    // Map tools to Gemini format (OpenAPI schema compatible)
    const geminiTools = [{
        functionDeclarations: allTools.map(tool => ({
            name: tool.name,
            description: tool.description,
            parameters: tool.parameters
        }))
    }];

    const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        tools: geminiTools,
        systemInstruction: `You are the GR Class Agentic AI Assistant. You have access to tools that can directly modify the GR Class Database (like creating clients, etc). 
When a user asks you to perform an action, use the relevant tool. If they ask a general question, answer politely.
IMPORTANT: Before calling a tool, you do NOT need to ask for permission if they provided all required fields (company_name, email, etc). If they are missing required fields, ask them for the missing details.`
    });

    // Gemini expects history in { role: 'user'/'model', parts: [{ text }] } format
    // But our API uses standard OpenAI format { role: 'user'/'assistant', content: '...' }
    // We need to map it carefully, especially handling tool calls
    
    let history = [];
    let lastUserMessage = '';
    
    for (const msg of messages) {
        if (msg.role === 'user') {
            lastUserMessage = msg.content;
            history.push({ role: 'user', parts: [{ text: msg.content }] });
        } else if (msg.role === 'assistant') {
            history.push({ role: 'model', parts: [{ text: msg.content || '' }] });
        }
    }
    
    // We pop the last message to send it as the main prompt
    history.pop(); 

    const chat = model.startChat({ history });

    let response = await chat.sendMessage(lastUserMessage);
    let responseText = response.response.text();

    const functionCalls = response.response.functionCalls();
    
    if (functionCalls && functionCalls.length > 0) {
        const toolResults = [];
        
        for (const call of functionCalls) {
            const tool = getToolByName(call.name);
            if (tool) {
                console.log(`[AI] Calling Tool: ${tool.name} with args:`, call.args);
                const result = await tool.execute(call.args);
                
                toolResults.push({
                    functionResponse: {
                        name: call.name,
                        response: result
                    }
                });
            }
        }
        
        if (toolResults.length > 0) {
            // Send the function response back to the model
            response = await chat.sendMessage(toolResults);
            responseText = response.response.text();
        }
    }

    return {
        message: responseText,
    };
};
