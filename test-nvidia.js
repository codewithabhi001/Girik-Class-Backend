import OpenAI from 'openai';

const apiKey = "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";

const openai = new OpenAI({
  apiKey: apiKey,
  baseURL: 'https://integrate.api.nvidia.com/v1',
});

async function main() {
  try {
    const completion = await openai.chat.completions.create({
      model: "meta/llama-3.1-70b-instruct",
      messages: [{"role":"user","content":"Write a short welcoming message for a maritime shipping software."}],
      temperature: 0.2,
      top_p: 0.7,
      max_tokens: 1024,
    });

    console.log("Response from NVIDIA API:");
    console.log(completion.choices[0].message.content);
  } catch (error) {
    console.error("Error calling NVIDIA API:", error);
  }
}

main();
