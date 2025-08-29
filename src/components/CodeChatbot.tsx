import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Bot, 
  User, 
  Send, 
  Lightbulb,
  Code,
  CheckCircle,
  ArrowRight,
  Trash2
} from "lucide-react";
import { getOpenRouterResponse } from "@/lib/openrouter";
import { generateSessionId, getMemoryManager, clearSessionMemory } from "@/lib/conversation-memory";

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  messageType?: 'hint' | 'suggestion' | 'walkthrough' | 'general';
}

interface CodeChatbotProps {
  code: string;
  language: string;
  question: string;
}

const CodeChatbot = ({ code, language, question }: CodeChatbotProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      content: "Hi! I'm your DSA and backend coding assistant. I specialize in Data Structures & Algorithms, Express.js, and MySQL. Feel free to ask me about algorithms, optimization, database queries, or Express routes!",
      timestamp: new Date(),
      messageType: 'general'
    }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [memoryInfo, setMemoryInfo] = useState<{ messageCount: number; sessionId: string } | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Initialize session ID on component mount
  useEffect(() => {
    const newSessionId = generateSessionId();
    setSessionId(newSessionId);
    console.log("🆔 New conversation session started:", newSessionId);
  }, []);

  // Function to update memory info
  const updateMemoryInfo = async () => {
    if (sessionId) {
      const memoryManager = getMemoryManager(sessionId);
      const summary = await memoryManager.getSummary();
      setMemoryInfo(summary);
    }
  };

  // Update memory info when messages change
  useEffect(() => {
    updateMemoryInfo();
  }, [messages, sessionId]);

  const initialQuestions = [
    "Unable to understand the problem",
    "Unable to think of a solution",
    "My code isn't working",
    "Tell me edge cases for this problem"
  ];

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Add a more reliable scroll effect
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToBottom();
    }, 100);
    return () => clearTimeout(timer);
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    try {
      // OpenRouter API call with session ID for conversation memory
      const botContent = await getOpenRouterResponse({
        userMessage: input,
        code,
        language,
        question,
        sessionId
      });
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: botContent,
        timestamp: new Date(),
        messageType: 'general' // Could parse for hint/suggestion if needed
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error("Error getting OpenRouter response:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: `Error: ${error instanceof Error ? error.message : 'Failed to get response from AI assistant. Please check your API key configuration.'}`,
        timestamp: new Date(),
        messageType: 'general'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickQuestion = (questionText: string) => {
    setInput(questionText);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearConversation = async () => {
    if (sessionId) {
      // Clear the session memory completely
      clearSessionMemory(sessionId);
      
      // Reset messages to initial state
      setMessages([
        {
          id: Date.now().toString(),
          type: 'bot',
          content: "Hi! I'm your DSA and backend coding assistant. I specialize in Data Structures & Algorithms, Express.js, and MySQL. Feel free to ask me about algorithms, optimization, database queries, or Express routes!",
          timestamp: new Date(),
          messageType: 'general'
        }
      ]);
      
      console.log("🗑️ Conversation history cleared for session:", sessionId);
    }
  };

  const getMessageIcon = (messageType?: string) => {
    switch (messageType) {
      case 'hint': return <Lightbulb className="h-4 w-4 text-accent" />;
      case 'suggestion': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'walkthrough': return <ArrowRight className="h-4 w-4 text-info" />;
      default: return <Bot className="h-4 w-4" />;
    }
  };

  const getMessageBadge = (messageType?: string) => {
    switch (messageType) {
      case 'hint': return <Badge variant="outline" className="text-xs bg-accent/10 text-accent border-accent/20">Hint</Badge>;
      case 'suggestion': return <Badge variant="outline" className="text-xs bg-success/10 text-success border-success/20">Suggestion</Badge>;
      case 'walkthrough': return <Badge variant="outline" className="text-xs bg-info/10 text-info border-info/20">Walkthrough</Badge>;
      default: return null;
    }
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="pb-3 flex-shrink-0">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            Code Assistant
          </div>
          <div className="flex items-center gap-2">
            {memoryInfo && (
              <span className="text-xs text-muted-foreground">
                Memory: {memoryInfo.messageCount} messages
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearConversation}
              className="text-xs"
              title="Clear conversation history"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0 min-h-0">
        <ScrollArea ref={scrollAreaRef} className="flex-1 px-4 min-h-0">
          <div className="space-y-4 pb-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback className={message.type === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}>
                    {message.type === 'user' ? <User className="h-4 w-4" /> : getMessageIcon(message.messageType)}
                  </AvatarFallback>
                </Avatar>
                <div className={`flex-1 max-w-[80%] ${message.type === 'user' ? 'text-right' : 'text-left'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    {message.type === 'bot' && getMessageBadge(message.messageType)}
                    <span className="text-xs text-muted-foreground">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div
                    className={`p-3 rounded-lg ${
                      message.type === 'user'
                        ? 'bg-primary text-primary-foreground ml-auto'
                        : 'bg-muted'
                    }`}
                  >
                    <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Initial Questions Section */}
            {messages.length === 1 && (
              <div className="flex gap-3">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback className="bg-muted">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 max-w-[80%]">
                  <div className="bg-muted p-3 rounded-lg">
                    <div className="text-sm mb-3">Try asking me:</div>
                    <div className="grid grid-cols-1 gap-2">
                      {initialQuestions.map((question, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          className="justify-start text-left h-auto py-2 px-3 text-xs"
                          onClick={() => handleQuickQuestion(question)}
                        >
                          {question}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {isTyping && (
              <div className="flex gap-3">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback className="bg-muted">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-muted p-3 rounded-lg">
                  <div className="flex flex-col gap-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Thinking... (This may take a moment due to rate limiting)
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        <div className="p-4 border-t flex-shrink-0">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask for hints, suggestions, or walkthroughs..."
              className="flex-1"
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={!input.trim() || isTyping}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CodeChatbot;