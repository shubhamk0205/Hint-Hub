import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  Share2, 
  MessageCircle, 
  Send, 
  Code, 
  Plus,
  Clock,
  Eye,
  Heart,
  Reply
} from "lucide-react";

const Collaboration = () => {
  const [newComment, setNewComment] = useState("");
  const [newShareTitle, setNewShareTitle] = useState("");
  const [newShareContent, setNewShareContent] = useState("");
  const { toast } = useToast();

  const teamMembers = [
    {
      id: 1,
      name: "Alex Johnson",
      email: "alex@company.com",
      avatar: "/api/placeholder/40/40",
      role: "Senior Developer",
      online: true,
      initials: "AJ"
    },
    {
      id: 2,
      name: "Sarah Chen",
      email: "sarah@company.com",
      avatar: "/api/placeholder/40/40",
      role: "Tech Lead",
      online: true,
      initials: "SC"
    },
    {
      id: 3,
      name: "Michael Brown",
      email: "michael@company.com",
      avatar: "/api/placeholder/40/40",
      role: "Developer",
      online: false,
      initials: "MB"
    },
    {
      id: 4,
      name: "Emily Davis",
      email: "emily@company.com",
      avatar: "/api/placeholder/40/40",
      role: "Junior Developer",
      online: true,
      initials: "ED"
    }
  ];

  const sharedItems = [
    {
      id: 1,
      type: "hint",
      title: "React Performance Optimization",
      content: "Here's a step-by-step approach to optimizing React components using useMemo and useCallback...",
      author: "Sarah Chen",
      authorInitials: "SC",
      timestamp: "2 hours ago",
      likes: 5,
      comments: 3,
      tags: ["react", "performance", "optimization"]
    },
    {
      id: 2,
      type: "code",
      title: "Custom Debounce Hook",
      content: `// Custom hook for debouncing values
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => clearTimeout(handler);
  }, [value, delay]);
  
  return debouncedValue;
}`,
      author: "Alex Johnson",
      authorInitials: "AJ",
      timestamp: "4 hours ago",
      likes: 8,
      comments: 2,
      tags: ["react", "hooks", "debounce"]
    },
    {
      id: 3,
      type: "question",
      title: "Best approach for error boundaries?",
      content: "What's the recommended pattern for implementing error boundaries in a large React application? Should we have one global boundary or multiple smaller ones?",
      author: "Emily Davis",
      authorInitials: "ED",
      timestamp: "1 day ago",
      likes: 3,
      comments: 7,
      tags: ["react", "error-handling", "architecture"]
    }
  ];

  const comments = [
    {
      id: 1,
      itemId: 1,
      author: "Alex Johnson",
      authorInitials: "AJ",
      content: "Great tips! I'd also recommend using React DevTools Profiler to identify performance bottlenecks.",
      timestamp: "1 hour ago",
      likes: 2
    },
    {
      id: 2,
      itemId: 1,
      author: "Michael Brown",
      authorInitials: "MB",
      content: "This helped me optimize our dashboard component. Reduced render time by 40%!",
      timestamp: "30 minutes ago",
      likes: 1
    }
  ];

  const handleShare = () => {
    if (!newShareTitle.trim() || !newShareContent.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide both a title and content for your share.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Shared successfully",
      description: "Your content has been shared with the team.",
    });

    setNewShareTitle("");
    setNewShareContent("");
  };

  const handleComment = (itemId: number) => {
    if (!newComment.trim()) return;

    toast({
      title: "Comment added",
      description: "Your comment has been added to the discussion.",
    });

    setNewComment("");
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "hint": return <MessageCircle className="h-4 w-4" />;
      case "code": return <Code className="h-4 w-4" />;
      case "question": return <MessageCircle className="h-4 w-4" />;
      default: return <Share2 className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "hint": return "bg-info/10 text-info border-info/20";
      case "code": return "bg-success/10 text-success border-success/20";
      case "question": return "bg-warning/10 text-warning border-warning/20";
      default: return "bg-muted";
    }
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Team Collaboration</h1>
          <p className="text-muted-foreground">
            Share hints, code snippets, and collaborate with your team members.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Share New Content */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Share with Team
                </CardTitle>
                <CardDescription>
                  Share a hint, code snippet, or ask a question
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Title for your share..."
                  value={newShareTitle}
                  onChange={(e) => setNewShareTitle(e.target.value)}
                />
                <Textarea
                  placeholder="Share your hint, code, or question here..."
                  value={newShareContent}
                  onChange={(e) => setNewShareContent(e.target.value)}
                  className="min-h-32 font-mono text-sm"
                />
                <div className="flex justify-end">
                  <Button onClick={handleShare} className="flex items-center gap-2">
                    <Share2 className="h-4 w-4" />
                    Share
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Shared Items Feed */}
            <div className="space-y-4">
              {sharedItems.map((item) => (
                <Card key={item.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>{item.authorInitials}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge className={getTypeColor(item.type)}>
                              {getTypeIcon(item.type)}
                              {item.type}
                            </Badge>
                            <h3 className="font-semibold">{item.title}</h3>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            by {item.author} • {item.timestamp}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-surface-elevated p-4 rounded-lg">
                      <pre className="whitespace-pre-wrap text-sm font-mono">
                        {item.content}
                      </pre>
                    </div>
                    
                    <div className="flex flex-wrap gap-1">
                      {item.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <button className="flex items-center gap-1 hover:text-foreground">
                          <Heart className="h-3 w-3" />
                          {item.likes}
                        </button>
                        <button className="flex items-center gap-1 hover:text-foreground">
                          <MessageCircle className="h-3 w-3" />
                          {item.comments}
                        </button>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Reply className="h-3 w-3 mr-1" />
                        Reply
                      </Button>
                    </div>

                    {/* Comments Section */}
                    <div className="border-t pt-4 space-y-3">
                      {comments
                        .filter(comment => comment.itemId === item.id)
                        .map((comment) => (
                          <div key={comment.id} className="flex gap-3">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs">
                                {comment.authorInitials}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="bg-surface-elevated p-3 rounded-lg">
                                <p className="text-sm">{comment.content}</p>
                              </div>
                              <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                                <span>{comment.author}</span>
                                <span>{comment.timestamp}</span>
                                <button className="flex items-center gap-1 hover:text-foreground">
                                  <Heart className="h-2 w-2" />
                                  {comment.likes}
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      
                      {/* Add Comment */}
                      <div className="flex gap-3">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">You</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 flex gap-2">
                          <Input
                            placeholder="Add a comment..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            className="h-8 text-sm"
                          />
                          <Button 
                            size="sm" 
                            onClick={() => handleComment(item.id)}
                            disabled={!newComment.trim()}
                          >
                            <Send className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Team Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Team Members
                </CardTitle>
                <CardDescription>
                  {teamMembers.filter(m => m.online).length} of {teamMembers.length} online
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {teamMembers.map((member) => (
                    <div key={member.id} className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>{member.initials}</AvatarFallback>
                        </Avatar>
                        <div className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background ${
                          member.online ? 'bg-success' : 'bg-muted-foreground'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{member.name}</p>
                        <p className="text-xs text-muted-foreground">{member.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Collaboration;