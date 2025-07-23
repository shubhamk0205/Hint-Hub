import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Filter, 
  Lightbulb, 
  BookOpen, 
  Tag, 
  Clock,
  Star,
  Copy,
  ExternalLink
} from "lucide-react";

const HintsLibrary = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");

  const hints = [
    {
      id: 1,
      title: "Optimizing Array Iterations",
      description: "Learn when to use map, filter, reduce, and forEach for better performance",
      language: "javascript",
      difficulty: "intermediate",
      tags: ["performance", "arrays", "optimization"],
      steps: 4,
      estimatedTime: "5 min",
      rating: 4.8,
      content: "Progressive hints for optimizing array operations and choosing the right method for your use case."
    },
    {
      id: 2,
      title: "Memory Management in Python",
      description: "Understanding garbage collection and preventing memory leaks",
      language: "python",
      difficulty: "advanced",
      tags: ["memory", "performance", "best-practices"],
      steps: 6,
      estimatedTime: "10 min",
      rating: 4.9,
      content: "Step-by-step guide to understanding Python's memory management and optimization techniques."
    },
    {
      id: 3,
      title: "React Component Patterns",
      description: "Common patterns for building reusable and maintainable React components",
      language: "react",
      difficulty: "beginner",
      tags: ["components", "patterns", "react"],
      steps: 5,
      estimatedTime: "8 min",
      rating: 4.7,
      content: "Learn the most effective patterns for creating clean, reusable React components."
    },
    {
      id: 4,
      title: "SQL Query Optimization",
      description: "Techniques for writing efficient database queries",
      language: "sql",
      difficulty: "intermediate",
      tags: ["database", "performance", "queries"],
      steps: 7,
      estimatedTime: "12 min",
      rating: 4.6,
      content: "Master the art of writing fast, efficient SQL queries with these proven techniques."
    },
    {
      id: 5,
      title: "Async/Await Best Practices",
      description: "Handling asynchronous operations effectively in modern JavaScript",
      language: "javascript",
      difficulty: "intermediate",
      tags: ["async", "promises", "javascript"],
      steps: 5,
      estimatedTime: "7 min",
      rating: 4.8,
      content: "Learn how to handle asynchronous operations cleanly and avoid common pitfalls."
    },
    {
      id: 6,
      title: "Error Handling Strategies",
      description: "Comprehensive approaches to error handling across different languages",
      language: "general",
      difficulty: "beginner",
      tags: ["error-handling", "debugging", "best-practices"],
      steps: 4,
      estimatedTime: "6 min",
      rating: 4.5,
      content: "Essential patterns for handling errors gracefully in your applications."
    }
  ];

  const languages = [
    { value: "all", label: "All Languages" },
    { value: "javascript", label: "JavaScript" },
    { value: "python", label: "Python" },
    { value: "react", label: "React" },
    { value: "sql", label: "SQL" },
    { value: "general", label: "General" },
  ];

  const difficulties = [
    { value: "all", label: "All Levels" },
    { value: "beginner", label: "Beginner" },
    { value: "intermediate", label: "Intermediate" },
    { value: "advanced", label: "Advanced" },
  ];

  const filteredHints = hints.filter(hint => {
    const matchesSearch = hint.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         hint.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         hint.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesLanguage = selectedLanguage === "all" || hint.language === selectedLanguage;
    const matchesDifficulty = selectedDifficulty === "all" || hint.difficulty === selectedDifficulty;
    
    return matchesSearch && matchesLanguage && matchesDifficulty;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner": return "bg-success/10 text-success border-success/20";
      case "intermediate": return "bg-warning/10 text-warning border-warning/20";
      case "advanced": return "bg-destructive/10 text-destructive border-destructive/20";
      default: return "bg-muted";
    }
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Hints Library</h1>
          <p className="text-muted-foreground">
            Browse curated programming hints and step-by-step guides to solve complex problems.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 space-y-4 sm:space-y-0 sm:flex sm:items-center sm:gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search hints, topics, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {languages.map((lang) => (
                <SelectItem key={lang.value} value={lang.value}>
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {difficulties.map((diff) => (
                <SelectItem key={diff.value} value={diff.value}>
                  {diff.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-sm text-muted-foreground">
            Showing {filteredHints.length} of {hints.length} hints
          </p>
        </div>

        {/* Hints Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHints.map((hint) => (
            <Card key={hint.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <Badge variant="outline" className={getDifficultyColor(hint.difficulty)}>
                    {hint.difficulty}
                  </Badge>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Star className="h-3 w-3 fill-current text-warning" />
                    {hint.rating}
                  </div>
                </div>
                <CardTitle className="text-lg leading-tight">{hint.title}</CardTitle>
                <CardDescription className="text-sm">
                  {hint.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-1">
                    {hint.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <BookOpen className="h-3 w-3" />
                      {hint.steps} steps
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {hint.estimatedTime}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1">
                      <Lightbulb className="h-3 w-3 mr-1" />
                      View Hints
                    </Button>
                    <Button variant="outline" size="sm">
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredHints.length === 0 && (
          <div className="text-center py-12">
            <Filter className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No hints found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search terms or filters to find what you're looking for.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HintsLibrary;