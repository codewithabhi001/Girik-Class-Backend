import { GoogleGenerativeAI } from '@google/generative-ai';
import { allTools, getToolByName } from '../tools/index.js';

export const geminiProvider = async (messages, options = {}) => {
    const apiKey = options.api_key || process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY is not defined in environment variables or request body.');

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Fallback array of models to try if one is unavailable
    const fallbackModels = [
        'gemini-flash-latest',
        'gemini-3.5-flash',
        'gemini-2.5-flash',
        'gemini-1.5-flash',
        'gemini-2.0-flash',
        'gemini-pro'
    ];

    // Map tools to Gemini format (OpenAPI schema compatible)
    const geminiTools = [{
        functionDeclarations: allTools.map(tool => ({
            name: tool.name,
            description: tool.description,
            parameters: tool.parameters
        }))
    }];

    // Gemini expects history in { role: 'user'/'model', parts: [{ text }] } format
    // But our API uses standard OpenAI format { role: 'user'/'assistant', content: '...' }
    // We need to map it carefully, especially handling tool calls
    
    let history = [];
    let lastUserMessage = '';
    
    // Process all messages except the very last one (which is the current prompt)
    const previousMessages = messages.slice(0, -1);
    lastUserMessage = messages[messages.length - 1]?.content || '';

    let currentRole = null;
    let currentParts = [];

    for (const msg of previousMessages) {
        // Skip initial assistant greeting to ensure history starts with 'user'
        if (!currentRole && msg.role === 'assistant') continue;

        const roleMap = msg.role === 'user' ? 'user' : 'model';
        
        if (currentRole === roleMap) {
            currentParts.push({ text: msg.content || '' });
        } else {
            if (currentRole) {
                history.push({ role: currentRole, parts: currentParts });
            }
            currentRole = roleMap;
            currentParts = [{ text: msg.content || '' }];
        }
    }
    
    if (currentRole) {
        history.push({ role: currentRole, parts: currentParts });
    }

    // Ensure the last role in history is 'model' because the next message will be 'user'
    if (history.length > 0 && history[history.length - 1].role === 'user') {
        history.push({ role: 'model', parts: [{ text: 'Understood.' }] });
    }

    let lastError = null;

    // Try each model until one succeeds
    for (const currentModelName of fallbackModels) {
        try {
            const model = genAI.getGenerativeModel({
                model: currentModelName,
                tools: geminiTools,
                systemInstruction: `You are the GR Class Agentic AI Assistant, a highly conversational and proactive operations manager. You have access to tools that can directly modify the GR Class Database (creating clients, creating vessels, creating jobs, etc).
When a user asks you to perform an action, follow these workflows and be conversational:

1. **Create Client**: If they ask to create a client, politely ask for missing details step-by-step (company_name, company_code, email, address, country, phone, contact_person_name, contact_person_email). Once you have them, call createClient. Login credentials will automatically be sent to them.
   - PROACTIVE: After a client is created successfully, ALWAYS ask the user if they would like to register a Vessel for this new client.

2. **Create Vessel**: If they ask to create a vessel, politely ask for the client name (if not in context), vessel name, IMO number (7-digits), MMSI number (9-digits), ship type, flag state, and port of registry. Use searchClients to get the client UUID and searchFlags to get the flag UUID. Once you have all the details, call createVessel.

3. **Create Job**: If they ask to create a job, you MUST have the client UUID, and certificate type UUIDs. (Vessel UUID is optional). 
   - DO NOT guess UUIDs.
   - Use searchClients to find the client_id.
   - Use searchVessels to find the vessel_id ONLY if the user mentions a vessel.
   - Use searchCertificateTypes to find the certificate_type_id.
   - PROACTIVE: If the user hasn't specified a target port, target date, reason, or certificate type, DO NOT call createJob. Instead, politely ask them for the missing details.
   - PROACTIVE: If the user doesn't know which certificate to choose, use searchCertificateTypes with an empty string or a keyword to list some available options in a Markdown numbered list for them to pick from.
   - If multiple results match for clients or certificates, output a Markdown numbered list and ask the user to clarify. Once you have the exact UUIDs and all required fields, call createJob.

IMPORTANT: ALWAYS provide a clear, conversational, and professional text response confirming what you did after calling a tool. Never return an empty response. Structure your responses nicely with Markdown. Answer general questions politely. Be concise.`
            });

            const chat = model.startChat({ history });
            let response = await chat.sendMessage(lastUserMessage);
            let responseText = response.response.text();

            // Handle potential tool calls
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
                message: responseText || 'Action completed successfully.',
            };

        } catch (error) {
            console.warn(`[Gemini Fallback] Model ${currentModelName} failed:`, error.message);
            lastError = error;
            // For validation errors on user's prompt (e.g. 400), don't retry.
            // For 404 (Not Found), 503 (Unavailable), 429 (Quota), try next model.
            const isRetryable = error.status === 404 || error.status === 429 || error.status === 503 || 
                              error.message.includes('404') || error.message.includes('429') || error.message.includes('503');
            
            if (!isRetryable) {
                break;
            }
        }
    }

    console.error('[Gemini Provider Error]: All models failed or encountered fatal error.', lastError);
    
    // Handle specific errors gracefully
    if (lastError?.status === 429 || (lastError?.message && lastError.message.includes('429'))) {
        return {
            message: "I'm currently receiving too many requests. Google's Free AI tier has a strict rate limit. Please try again in about a minute!"
        };
    }

    if (lastError?.status === 503 || (lastError?.message && lastError.message.includes('503'))) {
        return {
            message: "Google's AI service is currently experiencing high demand (503 Service Unavailable) across all models. Please try again in a few minutes."
        };
    }
    
    return {
        message: "I encountered an internal error while processing your request. Please check the backend logs."
    };
};
