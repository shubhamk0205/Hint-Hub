import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Search, 
  BookOpen, 
  Clock,
  CheckCircle,
  Circle,
  TrendingUp,
  Target,
  Filter
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { auth } from "@/lib/firebase";

const StudyPlans = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        navigate("/", { replace: true });
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const studyPlans = [
    {
      id: 1,
      title: "JavaScript Fundamentals",
      description: "Master the core concepts of JavaScript programming",
      category: "javascript",
      difficulty: "beginner",
      totalQuestions: 25,
      completedQuestions: 0,
      estimatedTime: "2 weeks",
      tags: ["variables", "functions", "objects", "arrays"],
      questions: [
        { id: 1, title: "Variable Declaration and Scope", completed: false },
        { id: 2, title: "Function Types and Usage", completed: false },
        { id: 3, title: "Object Methods and Properties", completed: false },
        { id: 4, title: "Array Manipulation Methods", completed: false },
        { id: 5, title: "Event Handling Basics", completed: false }
      ]
    },
    {
      id: 2,
      title: "React Development Path",
      description: "Complete guide to building modern React applications",
      category: "react",
      difficulty: "intermediate",
      totalQuestions: 30,
      completedQuestions: 0,
      estimatedTime: "3 weeks",
      tags: ["components", "hooks", "state", "props"],
      questions: [
        { id: 1, title: "Component Lifecycle Methods", completed: false },
        { id: 2, title: "useState and useEffect Hooks", completed: false },
        { id: 3, title: "Props and State Management", completed: false },
        { id: 4, title: "Context API Usage", completed: false },
        { id: 5, title: "Custom Hooks Creation", completed: false }
      ]
    },
    {
      id: 3,
      title: "Data Structures & Algorithms",
      description: "Essential DSA concepts for technical interviews",
      category: "algorithms",
      difficulty: "advanced",
      totalQuestions: 50,
      completedQuestions: 0,
      estimatedTime: "6 weeks",
      tags: ["arrays", "trees", "sorting", "searching"],
      questions: [
        { id: 1, title: "Array Traversal Techniques", completed: false },
        { id: 2, title: "Binary Tree Operations", completed: false },
        { id: 3, title: "Sorting Algorithms Comparison", completed: false },
        { id: 4, title: "Graph Traversal Methods", completed: false },
        { id: 5, title: "Dynamic Programming Basics", completed: false }
      ]
    },
    {
      id: 4,
      title: "Python for Data Science",
      description: "Learn Python specifically for data analysis and machine learning",
      category: "python",
      difficulty: "intermediate",
      totalQuestions: 35,
      completedQuestions: 0,
      estimatedTime: "4 weeks",
      tags: ["pandas", "numpy", "matplotlib", "sklearn"],
      questions: [
        { id: 1, title: "Pandas DataFrame Operations", completed: false },
        { id: 2, title: "NumPy Array Manipulation", completed: false },
        { id: 3, title: "Data Visualization with Matplotlib", completed: false },
        { id: 4, title: "Machine Learning Basics", completed: false },
        { id: 5, title: "Statistical Analysis Methods", completed: false }
      ]
    },
    {
      id: 5,
      title: "Database Design Principles",
      description: "Master relational database design and SQL optimization",
      category: "database",
      difficulty: "intermediate",
      totalQuestions: 20,
      completedQuestions: 0,
      estimatedTime: "3 weeks",
      tags: ["sql", "normalization", "indexing", "queries"],
      questions: [
        { id: 1, title: "Database Normalization Rules", completed: false },
        { id: 2, title: "Index Design Strategies", completed: false },
        { id: 3, title: "Complex Join Operations", completed: false },
        { id: 4, title: "Query Optimization Techniques", completed: false },
        { id: 5, title: "Transaction Management", completed: false }
      ]
    },
    {
      id: 6,
      title: "Web Security Fundamentals",
      description: "Essential security concepts for web developers",
      category: "security",
      difficulty: "beginner",
      totalQuestions: 15,
      completedQuestions: 0,
      estimatedTime: "2 weeks",
      tags: ["authentication", "encryption", "xss", "csrf"],
      questions: [
        { id: 1, title: "Authentication vs Authorization", completed: false },
        { id: 2, title: "Cross-Site Scripting Prevention", completed: false },
        { id: 3, title: "CSRF Attack Mitigation", completed: false },
        { id: 4, title: "HTTPS and SSL/TLS", completed: false },
        { id: 5, title: "Input Validation Best Practices", completed: false }
      ]
    }
  ];

  const categories = [
    { value: "all", label: "All Categories" },
    { value: "javascript", label: "JavaScript" },
    { value: "react", label: "React" },
    { value: "python", label: "Python" },
    { value: "algorithms", label: "Algorithms" },
    { value: "database", label: "Database" },
    { value: "security", label: "Security" },
  ];

  const difficulties = [
    { value: "all", label: "All Levels" },
    { value: "beginner", label: "Beginner" },
    { value: "intermediate", label: "Intermediate" },
    { value: "advanced", label: "Advanced" },
  ];

  const filteredPlans = studyPlans.filter(plan => {
    const matchesSearch = plan.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         plan.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         plan.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === "all" || plan.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === "all" || plan.difficulty === selectedDifficulty;
    
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner": return "bg-success/10 text-success border-success/20";
      case "intermediate": return "bg-warning/10 text-warning border-warning/20";
      case "advanced": return "bg-destructive/10 text-destructive border-destructive/20";
      default: return "bg-muted";
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      javascript: "bg-warning/10 text-warning border-warning/20",
      react: "bg-primary/10 text-primary border-primary/20",
      python: "bg-info/10 text-info border-info/20",
      algorithms: "bg-destructive/10 text-destructive border-destructive/20",
      database: "bg-success/10 text-success border-success/20",
      security: "bg-secondary/10 text-secondary border-secondary/20",
    };
    return colors[category as keyof typeof colors] || "bg-muted";
  };

  const handleStartPlan = (planId: number) => {
    navigate(`/study-plan/${planId}`);
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Study Plans</h1>
          <p className="text-muted-foreground">
            Choose a structured learning path and track your progress through curated questions.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 space-y-4 sm:space-y-0 sm:flex sm:items-center sm:gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search study plans..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
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
            Showing {filteredPlans.length} of {studyPlans.length} study plans
          </p>
        </div>

        {/* Study Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlans.map((plan) => {
            const progressPercentage = (plan.completedQuestions / plan.totalQuestions) * 100;
            
            return (
              <Card key={plan.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge className={getCategoryColor(plan.category)}>
                        {plan.category}
                      </Badge>
                      <Badge variant="outline" className={getDifficultyColor(plan.difficulty)}>
                        {plan.difficulty}
                      </Badge>
                    </div>
                  </div>
                  <CardTitle className="text-lg leading-tight">{plan.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {plan.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Progress */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">
                          {plan.completedQuestions}/{plan.totalQuestions} questions
                        </span>
                      </div>
                      <Progress value={progressPercentage} className="h-2" />
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1">
                      {plan.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {plan.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{plan.tags.length - 3} more
                        </Badge>
                      )}
                    </div>
                    
                    {/* Stats */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <BookOpen className="h-3 w-3" />
                        {plan.totalQuestions} questions
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {plan.estimatedTime}
                      </div>
                    </div>

                    {/* Action Button */}
                    <Button 
                      className="w-full" 
                      onClick={() => handleStartPlan(plan.id)}
                    >
                      <Target className="h-4 w-4 mr-2" />
                      {plan.completedQuestions > 0 ? "Continue Plan" : "Start Plan"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredPlans.length === 0 && (
          <div className="text-center py-12">
            <Filter className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No study plans found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search terms or filters to find what you're looking for.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudyPlans;