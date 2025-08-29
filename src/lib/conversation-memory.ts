import { BufferMemory } from "langchain/memory";

// Interface for conversation messages
export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

// Memory manager class to handle conversation context
export class ConversationMemoryManager {
  private memory: BufferMemory;
  private sessionId: string;
  private maxHistoryLength: number;
  private pendingUserMessage: string | null = null;

  constructor(sessionId: string, maxHistoryLength: number = 10) {
    this.sessionId = sessionId;
    this.maxHistoryLength = maxHistoryLength;
    this.memory = new BufferMemory({
      returnMessages: true,
    });
  }

  // Add a message to the conversation memory
  async addMessage(role: 'user' | 'assistant', content: string): Promise<void> {
    if (role === 'user') {
      // Store user message temporarily - we'll save it properly when we get the assistant response
      this.pendingUserMessage = content;
    } else {
      // For assistant messages, save the complete exchange
      if (this.pendingUserMessage) {
        await this.memory.saveContext(
          { input: this.pendingUserMessage },
          { output: content }
        );
        this.pendingUserMessage = null; // Clear the pending message
      }
    }
  }

  // Get conversation history in OpenRouter format
  async getConversationHistory(): Promise<ConversationMessage[]> {
    const messages = await this.memory.chatHistory.getMessages();
    
    return messages.map((message) => ({
      role: message._getType() === 'human' ? 'user' : 'assistant',
      content: message.content as string,
      timestamp: new Date()
    }));
  }

  // Get messages in OpenRouter API format
  async getOpenRouterMessages(systemPrompt: string, currentUserMessage: string): Promise<any[]> {
    const history = await this.getConversationHistory();
    
    // Start with system message
    const messages: any[] = [
      {
        role: "system",
        content: systemPrompt
      }
    ];

    // Add conversation history (limit to prevent oversized requests)
    const maxHistoryMessages = Math.min(history.length, this.maxHistoryLength * 2); // *2 because each exchange has 2 messages
    const recentHistory = history.slice(-maxHistoryMessages);
    
    messages.push(...recentHistory);

    // Add current user message
    messages.push({
      role: "user",
      content: currentUserMessage
    });

    return messages;
  }

  // Clear conversation history
  async clearHistory(): Promise<void> {
    this.memory = new BufferMemory({
      returnMessages: true,
    });
  }

  // Get conversation summary (useful for debugging)
  async getSummary(): Promise<{ messageCount: number; sessionId: string }> {
    const messages = await this.memory.chatHistory.getMessages();
    return {
      messageCount: messages.length,
      sessionId: this.sessionId
    };
  }

  // Get session ID (public accessor)
  getSessionId(): string {
    return this.sessionId;
  }

  // Check if conversation is getting too long
  async shouldTruncate(): Promise<boolean> {
    const messages = await this.memory.chatHistory.getMessages();
    return messages.length > this.maxHistoryLength * 2;
  }

  // Truncate conversation to keep only recent messages
  async truncateHistory(): Promise<void> {
    const messages = await this.memory.chatHistory.getMessages();
    if (messages.length > this.maxHistoryLength * 2) {
      // Keep only the most recent messages
      const recentMessages = messages.slice(-this.maxHistoryLength * 2);
      
      // Create new memory with recent messages

      this.memory = new BufferMemory({
        returnMessages: true,
      });

      // Re-add recent messages
      for (let i = 0; i < recentMessages.length; i += 2) {
        const userMessage = recentMessages[i];
        const assistantMessage = recentMessages[i + 1];
        
        if (userMessage && assistantMessage) {
          await this.memory.saveContext(
            { input: userMessage.content as string },
            { output: assistantMessage.content as string }
          );
        }
      }
    }
  }
}

// Session-specific memory managers
const memoryManagers = new Map<string, ConversationMemoryManager>();

// Factory function to get or create memory manager
export function getMemoryManager(sessionId: string = 'default'): ConversationMemoryManager {
  if (!memoryManagers.has(sessionId)) {
    memoryManagers.set(sessionId, new ConversationMemoryManager(sessionId));
  }
  return memoryManagers.get(sessionId)!;
}

// Function to clear a specific session's memory
export function clearSessionMemory(sessionId: string): void {
  memoryManagers.delete(sessionId);
}

// Utility function to generate session ID
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
