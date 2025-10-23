// OpenRouter API utility for Hint Hub

import { getMemoryManager, ConversationMemoryManager } from './conversation-memory';

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || "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";
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_MODEL = import.meta.env.VITE_OPENROUTER_MODEL || "openai/gpt-3.5-turbo";

// Rate limiting configuration
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000; // 1 second between requests

// Problem-solving guide assistant system prompt for Hint Hub
export const getSystemPrompt = (skillLevel: 'beginner' | 'intermediate' | 'advanced', isBetterSolution: boolean = false) => {
  const basePrompt = `When guiding users, the problem-solving process in three stages: first, ensure the user fully understands what the question is asking; second, help them determine the algorithm needed to solve it; third, support them in identifying the best way to implement the algorithm in code.
You are a problem-solving guide assistant helping users through algorithmic and programming challenges. Your role is to support the user by asking thoughtful, probing questions that stimulate their critical thinking about the problem. You provide concise and relevant hints or analogies, no longer than three lines, to gently steer them towards solutions without revealing the full answer outright. Encourage users to devise their own algorithms by comparing their approach against the problem requirements. If the user is stuck, gradually offer clearer hints in a stepwise manner, maintaining an interactive and supportive tone throughout and after giving the code in a particular language if the user ask the code in any other language provide it straight away.
- most of the questions are leetcode questions 
IMPORTANT GUIDELINES:
1. **Start with plain English explanations**: Always begin by explaining concepts, logic, and approaches in clear, and after that provide the code.

2. **Provide code when requested**: Wait for the user to ask for code, say "show me the code", "give me the implementation", or similar requests before providing any code snippets.

3. **When code is requested, provide specific parts**: If the user asks for code after your explanation, provide only the specific code parts that need to be corrected or implemented, not the entire solution.

4. **Focus on understanding first**: Help users understand the problem and algorithm before jumping to code implementation.

5. **Encourage self-discovery**: Guide users to think through the solution themselves rather than immediately providing code answers.

Proceed sequentially through stages and confirm correctness before moving to the next. For complex problems, break each stage into sub-steps if needed.`;

  if (isBetterSolution) {
    return basePrompt + `

ADVANCED SOLUTION MODE:
You are now providing an advanced solution. Use the most optimal data structures and algorithms available:
- Use HashMaps/Maps for O(1) lookups
- Use Sets for unique element tracking
- Use Trees (BST, Trie, etc.) for hierarchical data
- Use Heaps for priority-based operations
- Use Dynamic Programming for optimization problems
- Use advanced algorithms like Two Pointers, Sliding Window, etc.
- Explain the time and space complexity
- Compare with the basic solution and explain why this is better`;
  }

  switch (skillLevel) {
    case 'beginner':
      return basePrompt + `

BEGINNER MODE - RESTRICTIONS:
- Use only basic data structures: arrays, simple loops, basic conditionals
- Avoid: HashMaps/Maps, Sets, Trees, LinkedLists, Stacks, Queues, Heaps
- Avoid: Dynamic Programming, advanced algorithms
- Focus on: Simple nested loops, basic array operations, straightforward logic
- Explain concepts in very simple terms
- Provide step-by-step breakdowns
- Use simple variable names and clear comments

IMPORTANT: When the user provides a working solution (even if basic), acknowledge it positively with phrases like "Good solution!", "Nice approach!", "Your code works well!", or "Well done!" to indicate they have successfully solved the problem.`;

    case 'intermediate':
      return basePrompt + `

INTERMEDIATE MODE - ALLOWED:
- Use: Arrays, HashMaps/Maps, Sets, basic Trees, Stacks, Queues
- Use: Basic algorithms like Two Pointers, Sliding Window
- Avoid: Dynamic Programming, advanced tree algorithms, complex graph algorithms
- Focus on: Efficient solutions with common data structures
- Explain time and space complexity in simple terms
- Provide optimized but understandable solutions`;

    case 'advanced':
      return basePrompt + `

ADVANCED MODE - FULL CAPABILITIES:
- Use all data structures: HashMaps, Sets, Trees, LinkedLists, Stacks, Queues, Heaps, Tries
- Use: Dynamic Programming, advanced algorithms, graph algorithms
- Focus on: Most optimal solutions with best time/space complexity
- Explain advanced concepts and optimizations
- Provide multiple solution approaches when applicable
- Discuss trade-offs between different approaches`;

    default:
      return basePrompt;
  }
};


// Helper function to delay requests
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to implement rate limiting
const rateLimit = async () => {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
    await delay(waitTime);
  }
  
  lastRequestTime = Date.now();
};

export async function getOpenRouterResponse({ 
  userMessage, 
  code, 
  language, 
  question, 
  sessionId = 'default',
  skillLevel = 'beginner',
  isBetterSolution = false
}: { 
  userMessage: string; 
  code: string; 
  language: string; 
  question: string; 
  sessionId?: string;
  skillLevel?: 'beginner' | 'intermediate' | 'advanced';
  isBetterSolution?: boolean;
}): Promise<string> {
  // Check if API key is available
  if (!OPENROUTER_API_KEY) {
    console.error("OpenRouter API key not found.");
    return "Error: OpenRouter API key not configured.";
  }

  // Starting API request (minimal logging)

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
      // Making API request (attempt ${attempt}/${maxRetries})
      
      // Get conversation history and construct messages
      const systemPrompt = getSystemPrompt(skillLevel, isBetterSolution);
      const messages = await memoryManager.getOpenRouterMessages(systemPrompt, userContent);
      
      const requestBody = {
        model: OPENROUTER_MODEL,
        messages: messages,
        max_tokens: 2048,
        temperature: 0.7,
        top_p: 0.95
      };

      const requestSize = JSON.stringify(requestBody).length;
      
      // Check if request is too large
      if (requestSize > 30000) {
        console.warn("Request is quite large. Consider shortening your code or message.");
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
      }

      const response = await fetch(OPENROUTER_API_URL, fetchOptions);

      // Log response body for debugging 402 errors
      if (response.status === 402) {
        const errorBody = await response.text();
        console.error("402 Error Response Body:", errorBody);
      }

      if (response.status === 429) {
        // Rate limited - wait longer and retry
        const retryAfter = response.headers.get('Retry-After');
        const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : Math.pow(2, attempt) * 1000;
        
        console.warn(`Rate limited. Waiting ${waitTime}ms before retry...`);
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
      
      // Check for API errors in the response
      if (data.error) {
        console.error("OpenRouter API Error:", data.error);
        
        if (data.error.code === 429) {
          // Rate limited in response body
          const waitTime = Math.pow(2, attempt) * 1000;
          console.warn(`Rate limited in response. Waiting ${waitTime}ms before retry...`);
          await delay(waitTime);
          continue;
        }
        
        throw new Error(`API Error: ${data.error.message || 'Unknown error'}`);
      }

      // Extract the response text
      const responseText = data?.choices?.[0]?.message?.content;
      
      if (!responseText) {
        console.error("Invalid response format from OpenRouter API");
        throw new Error("Invalid response format from OpenRouter API");
      }
      
      // Save assistant response to memory
      await memoryManager.addMessage('assistant', responseText);
      
      // Check if we need to truncate history to prevent oversized requests
      if (await memoryManager.shouldTruncate()) {
        await memoryManager.truncateHistory();
      }
      
      return responseText;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.error(`API Error (attempt ${attempt}/${maxRetries}):`, lastError.message);
      
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
      await delay(waitTime);
    }
  }

  // If we get here, all retries failed
  const errorMessage = lastError?.message || "Unknown error occurred";
  console.error("All retries failed:", errorMessage);
  return `Sorry, there was an error connecting to the AI assistant after multiple attempts: ${errorMessage}. Please check your API key and try again.`;
}
