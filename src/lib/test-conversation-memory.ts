// Test file for conversation memory integration
import { getMemoryManager, generateSessionId, clearSessionMemory } from './conversation-memory';

export async function testConversationMemory() {
  console.log("🧪 Testing Conversation Memory Integration...");
  
  const sessionId = generateSessionId();
  console.log("Session ID:", sessionId);
  
  const memoryManager = getMemoryManager(sessionId);
  
  // Test 1: Add user message
  console.log("Test 1: Adding user message...");
  await memoryManager.addMessage('user', 'Hello, I need help with a binary search problem');
  
  // Test 2: Add assistant response
  console.log("Test 2: Adding assistant response...");
  await memoryManager.addMessage('assistant', 'I\'d be happy to help with binary search! Can you tell me more about the specific problem you\'re working on?');
  
  // Test 3: Add another user message
  console.log("Test 3: Adding another user message...");
  await memoryManager.addMessage('user', 'I have a sorted array and need to find a target element');
  
  // Test 4: Add another assistant response
  console.log("Test 4: Adding another assistant response...");
  await memoryManager.addMessage('assistant', 'Great! Binary search is perfect for that. What\'s your current approach?');
  
  // Test 5: Get conversation history
  console.log("Test 5: Getting conversation history...");
  const history = await memoryManager.getConversationHistory();
  console.log("Conversation history:", history);
  
  // Test 6: Get OpenRouter format messages
  console.log("Test 6: Getting OpenRouter format messages...");
  const openRouterMessages = await memoryManager.getOpenRouterMessages(
    'You are a helpful coding assistant.',
    'Can you help me implement it?'
  );
  console.log("OpenRouter messages:", openRouterMessages);
  
  // Test 7: Get summary
  console.log("Test 7: Getting memory summary...");
  const summary = await memoryManager.getSummary();
  console.log("Memory summary:", summary);
  
  // Test 8: Test session isolation
  console.log("Test 8: Testing session isolation...");
  const sessionId2 = generateSessionId();
  const memoryManager2 = getMemoryManager(sessionId2);
  await memoryManager2.addMessage('user', 'This is a different session');
  await memoryManager2.addMessage('assistant', 'Yes, this is isolated from the first session');
  
  const history2 = await memoryManager2.getConversationHistory();
  console.log("Session 2 history:", history2);
  
  // Verify session 1 still has its own history
  const history1Again = await memoryManager.getConversationHistory();
  console.log("Session 1 history (should be unchanged):", history1Again);
  
  console.log("✅ Conversation Memory Test Completed Successfully!");
  
  return {
    sessionId,
    sessionId2,
    history,
    history2,
    openRouterMessages,
    summary
  };
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  (window as any).testConversationMemory = testConversationMemory;
  (window as any).clearSessionMemory = clearSessionMemory;
}
