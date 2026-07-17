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
        content: `You are the GR Class Agentic AI Assistant. You have access to tools that can directly modify the GR Class Database (like creating clients, etc). 
When a user asks you to perform an action, use the relevant tool. If they ask a general question, answer politely.
IMPORTANT: Before calling a tool, you do NOT need to ask for permission if they provided all required fields (company_name, email, etc). If they are missing required fields, ask them for the missing details.`
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
