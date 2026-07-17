import OpenAI from 'openai';
import { allTools, getToolByName } from '../tools/index.js';

export const groqProvider = async (messages) => {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error('GROQ_API_KEY is not defined in environment variables.');

    const openai = new OpenAI({
        apiKey: apiKey,
        baseURL: 'https://api.groq.com/openai/v1'
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
        content: `You are the GR Class Agentic AI Assistant, a highly conversational and proactive operations manager. You have access to tools that can directly modify the GR Class Database (creating clients, creating vessels, creating jobs, etc).
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
    };

    const apiMessages = [systemMessage, ...messages];

    let response = await openai.chat.completions.create({
        model: 'llama-3.3-70b-versatile', // using a recommended groq model
        messages: apiMessages,
        tools: openaiTools,
        tool_choice: 'auto',
    });

    const responseMessage = response.choices[0].message;

    // Check if the model wants to call a tool
    if (responseMessage.tool_calls) {
        apiMessages.push(responseMessage); // append assistant's tool call

        for (const toolCall of responseMessage.tool_calls) {
            const tool = getToolByName(toolCall.function.name);
            if (tool) {
                const args = JSON.parse(toolCall.function.arguments);
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
            model: 'llama-3.3-70b-versatile',
            messages: apiMessages,
            tools: openaiTools
        });
    }

    return {
        message: response.choices[0].message.content,
        raw_messages: response.choices[0].message // For frontend to keep history
    };
};
