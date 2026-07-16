import { GoogleGenerativeAI } from '@google/generative-ai';
import { allTools, getToolByName } from '../tools/index.js';

export const geminiProvider = async (messages, options = {}) => {
    const apiKey = options.api_key || process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY is not defined in environment variables or request body.');

    const genAI = new GoogleGenerativeAI(apiKey);
    const modelName = options.model_name || 'gemini-1.5-flash';

    // Map tools to Gemini format (OpenAPI schema compatible)
    const geminiTools = [{
        functionDeclarations: allTools.map(tool => ({
            name: tool.name,
            description: tool.description,
            parameters: tool.parameters
        }))
    }];
    const model = genAI.getGenerativeModel({
        model: modelName,
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

    const chat = model.startChat({ history });

    try {
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
            message: responseText || 'Action completed successfully.',
        };
    } catch (error) {
        console.error('[Gemini Provider Error]:', error);
        
        // Handle rate limiting gracefully
        if (error.status === 429 || (error.message && error.message.includes('429'))) {
            return {
                message: "I'm currently receiving too many requests. Google's Free AI tier has a strict rate limit. Please try again in about a minute!"
            };
        }
        
        return {
            message: "I encountered an internal error while processing your request. Please check the backend logs."
        };
    }
};
