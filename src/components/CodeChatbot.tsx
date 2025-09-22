import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Bot, 
  User, 
  Send, 
  Lightbulb,
  Code,
  CheckCircle,
  ArrowRight,
  Trash2,
  Settings,
  MessageSquarePlus
} from "lucide-react";
import { getOpenRouterResponse } from "@/lib/openrouter";
import { generateSessionId, getMemoryManager, clearSessionMemory } from "@/lib/conversation-memory";

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  messageType?: 'hint' | 'suggestion' | 'walkthrough' | 'general';
  skillLevel?: 'beginner' | 'intermediate' | 'advanced';
  isBetterSolution?: boolean;
}

interface CodeChatbotProps {
  code: string;
  language: string;
  question: string;
  onNewConversation?: () => void;
}

const CodeChatbot = ({ code, language, question, onNewConversation }: CodeChatbotProps) => {
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
  const [skillLevel, setSkillLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [showBetterSolutionOffer, setShowBetterSolutionOffer] = useState(false);
  const [lastBotMessageId, setLastBotMessageId] = useState<string>('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Initialize session ID on component mount
  useEffect(() => {
    const newSessionId = generateSessionId();
    setSessionId(newSessionId);
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
      timestamp: new Date(),
      skillLevel
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);
    setShowBetterSolutionOffer(false);

    try {
      // OpenRouter API call with session ID for conversation memory
      const botContent = await getOpenRouterResponse({
        userMessage: input,
        code,
        language,
        question,
        sessionId,
        skillLevel
      });
      
      const botMessageId = (Date.now() + 1).toString();
      const botMessage: Message = {
        id: botMessageId,
        type: 'bot',
        content: botContent,
        timestamp: new Date(),
        messageType: 'general',
        skillLevel
      };

      setMessages(prev => [...prev, botMessage]);
      setLastBotMessageId(botMessageId);
      
      // Show better solution offer for beginners only if they've provided a solution
      if (skillLevel === 'beginner' && isSolutionProvided(input, botContent)) {
        setShowBetterSolutionOffer(true);
      }
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

  // Function to detect if user has provided a solution
  const isSolutionProvided = (userInput: string, botResponse: string): boolean => {
    const userInputLower = userInput.toLowerCase();
    const botResponseLower = botResponse.toLowerCase();
    
    // Check if user is asking for help or clarification (not providing solution)
    const helpKeywords = [
      'unable to understand',
      'unable to think',
      'not working',
      'help me',
      'explain',
      'what is',
      'how to',
      'tell me',
      'edge cases',
      'hint',
      'suggestion',
      'walkthrough',
      'stuck',
      'confused'
    ];
    
    // Check if user is providing a solution
    const solutionKeywords = [
      'here is my code',
      'my solution',
      'i wrote',
      'i implemented',
      'here\'s my approach',
      'my answer',
      'i solved it',
      'this is my code',
      'i think the solution is',
      'here\'s what i did',
      'my implementation',
      'i coded',
      'i made',
      'i created'
    ];
    
    // Check if bot response indicates user provided a solution
    const botSolutionIndicators = [
      'good solution',
      'nice approach',
      'your code',
      'your solution',
      'your implementation',
      'well done',
      'correct approach',
      'that works',
      'you\'re on the right track',
      'your logic is correct',
      'good job',
      'excellent',
      'perfect',
      'right solution'
    ];
    
    // If user input contains solution keywords, it's likely a solution
    const hasSolutionKeywords = solutionKeywords.some(keyword => 
      userInputLower.includes(keyword)
    );
    
    // If user input contains help keywords, it's likely not a solution
    const hasHelpKeywords = helpKeywords.some(keyword => 
      userInputLower.includes(keyword)
    );
    
    // If bot response indicates user provided a solution
    const botIndicatesSolution = botSolutionIndicators.some(keyword => 
      botResponseLower.includes(keyword)
    );
    
    // Show better solution offer if:
    // 1. User provided solution keywords AND bot indicates it's a solution, OR
    // 2. Bot response indicates user provided a solution (regardless of user input)
    // 3. But NOT if user is asking for help
    return (hasSolutionKeywords && botIndicatesSolution) || 
           (botIndicatesSolution && !hasHelpKeywords);
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
      
      setShowBetterSolutionOffer(false);
      setLastBotMessageId('');
      
      // Conversation history cleared
    }
  };

  const handleNewConversation = async () => {
    // Clear current session memory
    if (sessionId) {
      clearSessionMemory(sessionId);
    }
    
    // Generate new session ID
    const newSessionId = generateSessionId();
    setSessionId(newSessionId);
    
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
    
    setShowBetterSolutionOffer(false);
    setLastBotMessageId('');
    
    // Call the parent callback if provided
    if (onNewConversation) {
      onNewConversation();
    }
    
    // New conversation started
  };

  const handleBetterSolutionRequest = async () => {
    if (!lastBotMessageId) return;
    
    setIsTyping(true);
    setShowBetterSolutionOffer(false);
    
    try {
      const betterSolutionContent = await getOpenRouterResponse({
        userMessage: "Please provide a more advanced solution using better data structures and algorithms for this problem.",
        code,
        language,
        question,
        sessionId,
        skillLevel: 'advanced',
        isBetterSolution: true
      });
      
      const betterSolutionMessage: Message = {
        id: (Date.now() + 2).toString(),
        type: 'bot',
        content: betterSolutionContent,
        timestamp: new Date(),
        messageType: 'suggestion',
        skillLevel: 'advanced',
        isBetterSolution: true
      };

      setMessages(prev => [...prev, betterSolutionMessage]);
    } catch (error) {
      console.error("Error getting better solution:", error);
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        type: 'bot',
        content: `Error: ${error instanceof Error ? error.message : 'Failed to get better solution.'}`,
        timestamp: new Date(),
        messageType: 'general'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
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

  // Function to get message bubble width class based on content length
  const getMessageWidthClass = (content: string) => {
    const length = content.length;
    if (length <= 20) return 'w-fit max-w-[200px]';
    if (length <= 50) return 'w-fit max-w-[300px]';
    if (length <= 100) return 'w-fit max-w-[400px]';
    if (length <= 200) return 'w-fit max-w-[500px]';
    return 'w-fit max-w-[600px]';
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
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-muted-foreground" />
              <Select value={skillLevel} onValueChange={(value: 'beginner' | 'intermediate' | 'advanced') => setSkillLevel(value)}>
                <SelectTrigger className="w-32 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {memoryInfo && (
              <span className="text-xs text-muted-foreground">
                Memory: {memoryInfo.messageCount} messages
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleNewConversation}
              className="text-xs"
              title="Get help with another question"
            >
              <MessageSquarePlus className="h-4 w-4" />
            </Button>
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
                         ? `bg-primary text-primary-foreground ml-auto ${getMessageWidthClass(message.content)}`
                         : 'bg-muted'
                     }`}
                   >
                                           <div className="text-sm whitespace-pre-wrap text-left">{message.content}</div>
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
                      Thinking...
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Better Solution Offer for Beginners */}
            {showBetterSolutionOffer && skillLevel === 'beginner' && (
              <div className="flex gap-3">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback className="bg-muted">
                    <Lightbulb className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-muted p-3 rounded-lg">
                  <div className="text-sm mb-2">
                    💡 Would you like to see a more advanced solution using better data structures and algorithms?
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleBetterSolutionRequest}
                      className="text-xs"
                    >
                      Show Advanced Solution
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowBetterSolutionOffer(false)}
                      className="text-xs"
                    >
                      No, thanks
                    </Button>
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