import { GoogleGenerativeAI } from '@google/generative-ai';
import { allTools, getToolByName } from '../tools/index.js';

// Helper function for delays
const delay = ms => new Promise(res => setTimeout(res, ms));

export const geminiProvider = async (messages, options = {}) => {
    const apiKey = options.api_key || process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY is not defined in environment variables or request body.');

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Fallback array of models to try if one is unavailable
    const fallbackModels = [
        'gemini-flash-latest',
        'gemini-3.5-flash',
        'gemini-2.5-flash'
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
    let history = [];
    let lastUserMessage = '';
    
    const previousMessages = messages.slice(0, -1);
    lastUserMessage = messages[messages.length - 1]?.content || '';

    let currentRole = null;
    let currentParts = [];

    for (const msg of previousMessages) {
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

    if (history.length > 0 && history[history.length - 1].role === 'user') {
        history.push({ role: 'model', parts: [{ text: 'Understood.' }] });
    }

    let lastError = null;

    // Try each model
    for (let modelIndex = 0; modelIndex < fallbackModels.length; modelIndex++) {
        const currentModelName = fallbackModels[modelIndex];
        let attempt = 0;
        const maxRetries = 3;

        while (attempt < maxRetries) {
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
                        response = await chat.sendMessage(toolResults);
                        responseText = response.response.text();
                    }
                }

                // Success!
                return {
                    message: responseText || 'Action completed successfully.',
                };

            } catch (error) {
                console.warn(`[Gemini Fallback] Model ${currentModelName} failed on attempt ${attempt + 1}:`, error.message);
                lastError = error;

                const is429 = error.status === 429 || error.message.includes('429') || error.message.includes('Quota');
                const is404 = error.status === 404 || error.message.includes('404');
                const is503 = error.status === 503 || error.message.includes('503');

                if (is429) {
                    // Quota exceeded: immediately break out of the entire function, no need to check other models.
                    return {
                        message: "Daily AI quota exceeded (429). Please try again tomorrow or contact the system administrator."
                    };
                }

                if (is404) {
                    // Model deprecated or not found: skip this model entirely
                    break;
                }

                if (is503) {
                    // Overloaded: backoff and retry
                    attempt++;
                    if (attempt < maxRetries) {
                        const backoffTime = Math.pow(2, attempt) * 1000; // 2s -> 4s
                        await delay(backoffTime);
                        continue;
                    } else {
                        // Max retries reached for 503 on this model, try next model
                        break;
                    }
                }

                // If it's a 400 (Bad Request) or something else (validation error), we don't retry.
                // Just break and it will return a general error.
                break;
            }
        }
    }

    console.error('[Gemini Provider Error]: All models failed or encountered fatal error.', lastError);
    
    return {
        message: "I encountered an internal error while processing your request. Please check the backend logs."
    };
};
