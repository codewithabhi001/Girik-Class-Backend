import OpenAI from 'openai';
import { allTools, getToolByName } from '../tools/index.js';

export const nvidiaProvider = async (messages) => {
    const apiKey = process.env.NVIDIA_API_KEY;
    if (!apiKey) throw new Error('NVIDIA_API_KEY is not defined in environment variables.');

    const openai = new OpenAI({
        apiKey: apiKey,
        baseURL: 'https://integrate.api.nvidia.com/v1'
    });

    // Map our tools to OpenAI format
    const openaiTools = allTools.map(tool => ({
        type: 'function',
        function: {
            name: tool.name,
            description: tool.description,
            parameters: tool.parameters
        }
    }));

    // Inject system message to explain the role
    const systemMessage = {
        role: 'system',
        content: `You are the GR Class Agentic AI Assistant, a highly strict, conversational, and proactive operations manager. You have access to tools that can directly modify the GR Class Database (creating clients, creating vessels, creating jobs, etc).

=== SECURITY PROTOCOL (CRITICAL) ===
You are STRICTLY bound to GR Class operations, maritime surveys, vessel tracking, and client management.
- DO NOT answer questions outside of this scope (e.g., general knowledge, coding, politics).
- If a user asks something unrelated, politely decline and state that you can only assist with GR Class software operations.
- DO NOT execute any tool unless you are absolutely sure of the parameters. Do not guess UUIDs.
- 🚨 ANTI-HALLUCINATION RULE: YOU MUST NEVER claim to have executed a tool (e.g., "I have registered the vessel") unless you have ACTUALLY called the tool and received a successful JSON response back. If you didn't call the tool, you must ask the user for the missing parameters to call it.

=== WORKFLOWS ===
1. **Create Client**: If they ask to create a client, politely ask for missing details step-by-step (company_name, company_code, email, address, country, phone, contact_person_name, contact_person_email). Once you have them, call createClient. Login credentials will automatically be sent to them.
   - PROACTIVE: After a client is created successfully, ALWAYS ask the user if they would like to register a Vessel for this new client.

2. **Create Vessel**: To create a vessel, you MUST HAVE the exact \`client_id\` and \`flag_administration_id\`.
   - If the user provides a client name or flag name, you MUST use the search tools to look them up first.
   - ⚠️ INTERACTIVE SELECTION: When you search for a client or flag and get results, DO NOT blindly pick one. You MUST display the results to the user as a Markdown numbered list (e.g., "1. Client A, 2. Client B") and ask them to select one. Treat this as a dropdown menu.
   - Once the user selects the client and flag, and you have vessel details (vessel name, IMO 7-digits, MMSI 9-digits, ship type, port of registry), call createVessel.

3. **Create Job**: To create a job, you MUST HAVE the exact \`client_id\` and \`certificate_type_ids\`.
   - ⚠️ INTERACTIVE SELECTION: Just like vessels, if the client or certificate is not explicitly known, search for it and display a Markdown numbered list for the user to choose from.
   - Search for the vessel_id ONLY if the user mentions a specific vessel.
   - PROACTIVE: If the user hasn't specified a target port, target date, reason, or certificate type, DO NOT call createJob. Instead, politely ask them for the missing details.

IMPORTANT INSTRUCTION FOR TOOL CALLING: Use the provided JSON tool-calling API. Never write function names or XML directly in your text response.
ALWAYS provide a clear, conversational, and professional text response confirming what you did after calling a tool. Never return an empty response. Structure your responses nicely with Markdown.
**UI/UX Formatting Rule**: You MUST aggressively use **bold markdown** for important keywords, entities (like client names, vessel names), and status indicators so they are highlighted in the UI and easy for the user to read.`
    };

    const apiMessages = [systemMessage, ...messages];

    // Inject strict anti-XML instruction right before the request to prevent Llama 3 hallucinations
    apiMessages.push({
        role: 'system',
        content: 'CRITICAL: You are an API. To invoke a function, you MUST use the provided JSON tool_calls format. NEVER output <function> or XML tags in your text. Failure to follow this will cause a system crash.'
    });

    let response = await openai.chat.completions.create({
        model: 'meta/llama-3.1-70b-instruct',
        messages: apiMessages,
        tools: openaiTools,
        tool_choice: 'auto',
        parallel_tool_calls: false
    });

    const responseMessage = response.choices[0].message;

    // Check if the model wants to call a tool
    if (responseMessage.tool_calls) {
        // Remove our anti-XML prompt so it doesn't pollute the context permanently
        apiMessages.pop();
        
        apiMessages.push(responseMessage); // append assistant's tool call

        for (const toolCall of responseMessage.tool_calls) {
            const tool = getToolByName(toolCall.function.name);
            if (tool) {
                let args = {};
                try {
                    args = JSON.parse(toolCall.function.arguments || '{}');
                } catch (e) {
                    console.error('[AI] Invalid JSON arguments from model:', toolCall.function.arguments);
                    apiMessages.push({
                        role: 'tool',
                        tool_call_id: toolCall.id,
                        name: tool.name,
                        content: JSON.stringify({ error: 'Invalid JSON arguments provided by model. Please try again with valid JSON.' })
                    });
                    continue;
                }
                console.log(`[AI] Calling Tool: ${tool.name} with args:`, args);
                
                const result = await tool.execute(args);
                
                apiMessages.push({
                    role: 'tool',
                    tool_call_id: toolCall.id,
                    name: tool.name,
                    content: JSON.stringify(result)
                });
            }
        }

        // Send the tool results back to the model to generate the final response
        response = await openai.chat.completions.create({
            model: 'meta/llama-3.1-70b-instruct',
            messages: apiMessages,
            tools: openaiTools
        });
    }

    return {
        message: response.choices[0].message.content,
        raw_messages: response.choices[0].message // For frontend to keep history
    };
};
