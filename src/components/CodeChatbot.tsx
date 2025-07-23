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
  ArrowRight
} from "lucide-react";

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
}

const CodeChatbot = ({ code, language }: CodeChatbotProps) => {
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
  const scrollAreaRef = useRef<HTMLDivElement>(null);

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

  const generateBotResponse = (userMessage: string): { content: string; messageType: 'hint' | 'suggestion' | 'walkthrough' | 'general' } => {
    const lowerMessage = userMessage.toLowerCase();
    
    // DSA related responses
    if (lowerMessage.includes('algorithm') || lowerMessage.includes('complexity') || lowerMessage.includes('big o')) {
      return {
        content: "For algorithm analysis, consider:\n\n🔍 **Time Complexity**: What's the Big O notation?\n📊 **Space Complexity**: How much extra space is used?\n⚡ **Optimization**: Can you use better data structures like HashMap, Set, or Stack?\n🧠 **Common patterns**: Two pointers, sliding window, divide & conquer, dynamic programming",
        messageType: 'suggestion'
      };
    }
    
    if (lowerMessage.includes('data structure') || lowerMessage.includes('array') || lowerMessage.includes('tree') || lowerMessage.includes('graph')) {
      return {
        content: "Data structure hints:\n\n📝 **Arrays**: Consider two pointers, binary search, or prefix sums\n🌳 **Trees**: Think about DFS, BFS, or tree traversal patterns\n🔗 **Graphs**: BFS for shortest path, DFS for connectivity\n📚 **Hash Maps**: For O(1) lookups and frequency counting\n⚡ **Stacks/Queues**: For parsing, backtracking, or level-order processing",
        messageType: 'hint'
      };
    }
    
    // Express.js related responses
    if (lowerMessage.includes('express') || lowerMessage.includes('route') || lowerMessage.includes('middleware')) {
      return {
        content: "Express.js best practices:\n\n🛣️ **Routing**: Use router.get/post/put/delete for clean organization\n🔧 **Middleware**: Add error handling, validation, and authentication middleware\n📦 **Body parsing**: Use express.json() and express.urlencoded()\n🔒 **Security**: Implement CORS, helmet, and input validation\n📊 **Error handling**: Use try-catch blocks and error middleware",
        messageType: 'suggestion'
      };
    }
    
    // MySQL related responses
    if (lowerMessage.includes('mysql') || lowerMessage.includes('sql') || lowerMessage.includes('query') || lowerMessage.includes('database')) {
      return {
        content: "SQL/MySQL optimization tips:\n\n🗂️ **Indexing**: Add indexes on frequently queried columns\n🔍 **Joins**: Use INNER JOIN for better performance when possible\n📊 **Aggregation**: Use GROUP BY with aggregate functions efficiently\n⚡ **Query optimization**: Avoid SELECT *, use LIMIT for large datasets\n🔒 **Security**: Use parameterized queries to prevent SQL injection",
        messageType: 'suggestion'
      };
    }
    
    if (lowerMessage.includes('hint') || lowerMessage.includes('help')) {
      if (language === 'sql') {
        return {
          content: "SQL hint: Consider the query execution order: FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT. Are you filtering data efficiently? Could you use joins instead of subqueries?",
          messageType: 'hint'
        };
      }
      return {
        content: "Algorithm hint: Break down the problem step by step. What's the brute force approach first? Then think about optimization - can you use hash maps for O(1) lookups? Are there any patterns like two pointers or sliding window?",
        messageType: 'hint'
      };
    }
    
    if (lowerMessage.includes('walkthrough') || lowerMessage.includes('step by step')) {
      return {
        content: "Problem-solving walkthrough:\n\n1. **Understand**: Read the problem carefully, identify inputs/outputs\n2. **Examples**: Work through examples manually\n3. **Brute Force**: Start with the simplest solution\n4. **Optimize**: Look for patterns, better data structures\n5. **Edge Cases**: Handle empty inputs, single elements, duplicates\n6. **Test**: Verify with different test cases",
        messageType: 'walkthrough'
      };
    }
    
    return {
      content: "I can help with:\n\n🧮 **DSA**: Algorithms, data structures, Big O analysis\n🌐 **Express.js**: Routes, middleware, error handling\n🗄️ **MySQL**: Query optimization, joins, indexing\n\nWhat would you like to work on?",
      messageType: 'general'
    };
  };

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

    // Simulate bot thinking time
    setTimeout(() => {
      const { content, messageType } = generateBotResponse(input);
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content,
        timestamp: new Date(),
        messageType
      };

      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
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
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bot className="h-5 w-5 text-primary" />
          Code Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea ref={scrollAreaRef} className="flex-1 px-4">
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
            {isTyping && (
              <div className="flex gap-3">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback className="bg-muted">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-muted p-3 rounded-lg">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        <div className="p-4 border-t">
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