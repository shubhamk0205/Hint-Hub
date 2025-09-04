// OpenRouter API utility for Hint Hub

import { getMemoryManager, ConversationMemoryManager } from './conversation-memory';

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || "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";
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_MODEL = import.meta.env.VITE_OPENROUTER_MODEL || "openai/gpt-3.5-turbo";

// Rate limiting configuration
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000; // 1 second between requests

// Problem-solving guide assistant system prompt for Hint Hub
const SYSTEM_PROMPT = `When guiding users,  the problem-solving process in three stages: first, ensure the user fully understands what the question is asking; second, help them determine the algorithm needed to solve it; third, support them in identifying the best way to implement the algorithm in code.
You are a problem-solving guide assistant helping users through algorithmic and programming challenges. Your role is to support the user by asking thoughtful, probing questions that stimulate their critical thinking about the problem. You provide concise and relevant hints or analogies, no longer than three lines, to gently steer them towards solutions without revealing the full answer outright. Encourage users to devise their own algorithms by comparing their approach against the problem requirements. If the user is stuck, gradually offer clearer hints in a stepwise manner, maintaining an interactive and supportive tone throughout and after giving the code in a particular laguage if the user ask the code in any other language provide it straight away .

IMPORTANT GUIDELINES:
1. **Start with plain English explanations*
*: Always begin by explaining concepts, logic, and approaches in clear, and after that provide the code .

2. **provide code when requested**: Wait for the user to ask for code, say "show me the code", "give me the implementation", or similar requests before providing any code snippets.


3. **When code is requested, provide specific parts**: If the user asks for code after your explanation, provide only the specific code parts that need to be corrected or implemented, not the entire solution.

4. **Focus on understanding first**: Help users understand the problem and algorithm before jumping to code implementation.

5. **Encourage self-discovery**: Guide users to think through the solution themselves rather than immediately providing code answers.

Proceed sequentially through stages and confirm correctness before moving to the next. For complex problems, break each stage into sub-steps if needed.`


// Helper function to delay requests
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to implement rate limiting
const rateLimit = async () => {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
    console.log(`Rate limiting: waiting ${waitTime}ms before next request`);
    await delay(waitTime);
  }
  
  lastRequestTime = Date.now();
};

export async function getOpenRouterResponse({ 
  userMessage, 
  code, 
  language, 
  question, 
  sessionId = 'default' 
}: { 
  userMessage: string; 
  code: string; 
  language: string; 
  question: string; 
  sessionId?: string;
}): Promise<string> {
  // Check if API key is available
  if (!OPENROUTER_API_KEY) {
    console.error("OpenRouter API key not found.");
    return "Error: OpenRouter API key not configured.";
  }

  console.log("🔍 Starting OpenRouter API request...");
  console.log("API Key present:", !!OPENROUTER_API_KEY);
  console.log("API Key length:", OPENROUTER_API_KEY?.length || 0);
  console.log("Running in browser:", typeof window !== 'undefined');

  // Get memory manager for this session
  const memoryManager = getMemoryManager(sessionId);
  
  // Check if user provided code and question
  const hasCode = code && code.trim().length > 0;
  const hasQuestion = question && question.trim().length > 0;
  
  // Construct the current user message with context
  let userContent = `PROBLEM CONTEXT:
Language: ${language}

`;

  if (hasQuestion) {
    userContent += `ORIGINAL QUESTION/PROBLEM:
${question}

`;
  }

  if (hasCode) {
    userContent += `USER'S CODE:
${code}

`;
  } else {
    userContent += `USER HAS NOT PROVIDED ANY CODE YET.

`;
  }

  userContent += `USER'S CURRENT MESSAGE:
${userMessage}

`;

  if (hasCode) {
    userContent += 'Please analyze the original question, code, and current message above. Start with plain English explanations of what needs to be done or corrected. Only provide code snippets if the user explicitly asks for code or implementation. Focus on helping them understand the concepts and logic first.';
  } else {
    userContent += 'Please start by checking if they understand the question and offer initial guidance if needed. Explain concepts in plain English first, and only provide code when explicitly requested.';
  }

  // Add current user message to memory
  await memoryManager.addMessage('user', userContent);

  // Implement rate limiting
  await rateLimit();

  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📡 Attempt ${attempt}/${maxRetries} - Making API request...`);
      
      // Get conversation history and construct messages
      const messages = await memoryManager.getOpenRouterMessages(SYSTEM_PROMPT, userContent);
      
      const requestBody = {
        model: OPENROUTER_MODEL,
        messages: messages,
        max_tokens: 2048,
        temperature: 0.7,
        top_p: 0.95
      };

      const requestSize = JSON.stringify(requestBody).length;
      console.log("Request URL:", OPENROUTER_API_URL);
      console.log("Request body size:", requestSize, "characters");
      console.log("Model:", OPENROUTER_MODEL);
      
      // Check if request is too large
      if (requestSize > 30000) {
        console.warn("⚠️ Request is quite large. Consider shortening your code or message.");
      }

      // Check if we're in a browser environment and add CORS headers if needed
      const fetchOptions: RequestInit = {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "HTTP-Referer": window.location.origin,
          "X-Title": "Hint Hub"
        },
        body: JSON.stringify(requestBody)
      };

      // Add mode: 'cors' for browser environments
      if (typeof window !== 'undefined') {
        fetchOptions.mode = 'cors';
        console.log("Using CORS mode for browser request");
      }

      const response = await fetch(OPENROUTER_API_URL, fetchOptions);

      console.log(`Response status: ${response.status} ${response.statusText}`);
      console.log("Response headers:", Object.fromEntries(response.headers.entries()));
      
      // Log response body for debugging 402 errors
      if (response.status === 402) {
        const errorBody = await response.text();
        console.error("402 Error Response Body:", errorBody);
      }

      if (response.status === 429) {
        // Rate limited - wait longer and retry
        const retryAfter = response.headers.get('Retry-After');
        const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : Math.pow(2, attempt) * 1000;
        
        console.warn(`Rate limited (attempt ${attempt}/${maxRetries}). Waiting ${waitTime}ms before retry...`);
        await delay(waitTime);
        continue;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("OpenRouter API Error:", response.status, response.statusText, errorData);
        
        if (response.status === 400) {
          throw new Error("Invalid request format. Please check your input.");
        } else if (response.status === 401) {
          throw new Error("Invalid API key. Please check your configuration.");
        } else if (response.status === 402) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.error?.message || "Payment required";
          throw new Error(`Payment required (402): ${errorMessage}. This usually means insufficient credits or usage limits. Check your OpenRouter account at https://openrouter.ai/account`);
        } else if (response.status === 403) {
          throw new Error("API key doesn't have permission to access this model.");
        } else if (response.status >= 500) {
          throw new Error("OpenRouter API is experiencing issues. Please try again later.");
        } else {
          throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }
      }

      const data = await response.json();
      console.log("Response data keys:", Object.keys(data));
      
      // Check for API errors in the response
      if (data.error) {
        console.error("OpenRouter API Error:", data.error);
        
        if (data.error.code === 429) {
          // Rate limited in response body
          const waitTime = Math.pow(2, attempt) * 1000;
          console.warn(`Rate limited in response (attempt ${attempt}/${maxRetries}). Waiting ${waitTime}ms before retry...`);
          await delay(waitTime);
          continue;
        }
        
        throw new Error(`API Error: ${data.error.message || 'Unknown error'}`);
      }

      // Extract the response text
      const responseText = data?.choices?.[0]?.message?.content;
      
      if (!responseText) {
        console.error("Unexpected response format:", data);
        console.error("Choices:", data?.choices);
        console.error("First choice:", data?.choices?.[0]);
        console.error("Message:", data?.choices?.[0]?.message);
        throw new Error("Invalid response format from OpenRouter API");
      }

      console.log("✅ Successfully received response from OpenRouter API");
      
      // Save assistant response to memory
      await memoryManager.addMessage('assistant', responseText);
      
      // Check if we need to truncate history to prevent oversized requests
      if (await memoryManager.shouldTruncate()) {
        console.log("📝 Truncating conversation history to prevent oversized requests");
        await memoryManager.truncateHistory();
      }
      
      return responseText;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.error(`OpenRouter API Error (attempt ${attempt}/${maxRetries}):`, lastError);
      console.error("Error details:", {
        name: lastError.name,
        message: lastError.message,
        stack: lastError.stack
      });
      
      // Check for CORS errors
      if (lastError.message.includes('CORS') || lastError.message.includes('cors')) {
        console.error("CORS error detected. This might be a browser security issue.");
      }
      
      // Check for network errors
      if (lastError.message.includes('fetch') || lastError.message.includes('network')) {
        console.error("Network error detected. Check your internet connection.");
      }
      
      // If this is the last attempt, throw the error
      if (attempt === maxRetries) {
        break;
      }
      
      // Wait before retrying (exponential backoff)
      const waitTime = Math.pow(2, attempt) * 1000;
      console.log(`Retrying in ${waitTime}ms...`);
      await delay(waitTime);
    }
  }

  // If we get here, all retries failed
  const errorMessage = lastError?.message || "Unknown error occurred";
  console.error("All retries failed. Final error:", errorMessage);
  return `Sorry, there was an error connecting to the AI assistant after multiple attempts: ${errorMessage}. Please check your API key and try again.`;
}
