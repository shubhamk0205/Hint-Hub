import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft,
  CheckCircle,
  Circle,
  BookOpen,
  Clock,
  Target,
  TrendingUp
} from "lucide-react";
import { auth } from "@/lib/firebase";
import { loadStudyPlanProgress, saveStudyPlanProgress } from "@/lib/playlistProgress";

const StudyPlanDetail = () => {
  const { planId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [studyPlan, setStudyPlan] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        navigate("/", { replace: true });
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  // Mock data - in a real app, this would come from an API or state management
  const studyPlans = [
    {
      id: 1,
      title: "JavaScript Fundamentals",
      description: "Master the core concepts of JavaScript programming",
      category: "javascript",
      difficulty: "beginner",
      totalQuestions: 25,
      estimatedTime: "2 weeks",
      tags: ["variables", "functions", "objects", "arrays"],
      questions: [
        { id: 1, title: "Variable Declaration and Scope", completed: false, description: "Learn about var, let, and const declarations and their scope rules." },
        { id: 2, title: "Function Types and Usage", completed: false, description: "Understand function declarations, expressions, and arrow functions." },
        { id: 3, title: "Object Methods and Properties", completed: false, description: "Work with object properties, methods, and this keyword." },
        { id: 4, title: "Array Manipulation Methods", completed: false, description: "Master map, filter, reduce, and other array methods." },
        { id: 5, title: "Event Handling Basics", completed: false, description: "Learn DOM events and event listeners." },
        { id: 6, title: "Asynchronous JavaScript", completed: false, description: "Understand callbacks, promises, and async/await." },
        { id: 7, title: "Error Handling", completed: false, description: "Learn try-catch blocks and error management." },
        { id: 8, title: "JSON and API Calls", completed: false, description: "Work with JSON data and fetch API." },
        { id: 9, title: "Regular Expressions", completed: false, description: "Learn pattern matching with regex." },
        { id: 10, title: "ES6+ Features", completed: false, description: "Explore modern JavaScript features." }
      ]
    },
    {
      id: 2,
      title: "React Development Path",
      description: "Complete guide to building modern React applications",
      category: "react",
      difficulty: "intermediate",
      totalQuestions: 30,
      estimatedTime: "3 weeks",
      tags: ["components", "hooks", "state", "props"],
      questions: [
        { id: 1, title: "Component Lifecycle Methods", completed: false, description: "Understand mounting, updating, and unmounting phases." },
        { id: 2, title: "useState and useEffect Hooks", completed: false, description: "Master the most common React hooks." },
        { id: 3, title: "Props and State Management", completed: false, description: "Learn data flow in React applications." },
        { id: 4, title: "Context API Usage", completed: false, description: "Share state across component tree." },
        { id: 5, title: "Custom Hooks Creation", completed: false, description: "Build reusable stateful logic." },
        { id: 6, title: "Event Handling in React", completed: false, description: "Handle user interactions effectively." },
        { id: 7, title: "Form Handling and Validation", completed: false, description: "Build interactive forms with validation." },
        { id: 8, title: "Conditional Rendering", completed: false, description: "Render components based on conditions." },
        { id: 9, title: "Lists and Keys", completed: false, description: "Render dynamic lists efficiently." },
        { id: 10, title: "Performance Optimization", completed: false, description: "Use memo, useMemo, and useCallback." }
      ]
    }
  ];

  useEffect(() => {
    const loadPlanWithProgress = async () => {
      const plan = studyPlans.find(p => p.id === parseInt(planId || "0"));
      if (plan) {
        try {
          // Load saved progress from Supabase
          const progress = await loadStudyPlanProgress(planId || "");
          if (Object.keys(progress).length > 0) {
            plan.questions = plan.questions.map(q => ({
              ...q,
              completed: progress[q.id] || false
            }));
          }
          setStudyPlan(plan);
        } catch (error) {
          console.error('Error loading study plan progress:', error);
          setStudyPlan(plan); // Fallback to plan without progress
        }
      }
    };
    
    loadPlanWithProgress();
  }, [planId]);

  const handleQuestionToggle = async (questionId: number, completed: boolean) => {
    if (!studyPlan) return;

    const updatedQuestions = studyPlan.questions.map((q: any) =>
      q.id === questionId ? { ...q, completed } : q
    );

    const updatedPlan = { ...studyPlan, questions: updatedQuestions };
    setStudyPlan(updatedPlan);

    // Save progress to Supabase
    const saveSuccess = await saveStudyPlanProgress(planId || "", questionId.toString(), completed);
    
    if (!saveSuccess) {
      toast({
        title: "Save Failed",
        description: "Failed to save progress. Please try again.",
        variant: "destructive"
      });
      return;
    }

    // Show toast for feedback
    toast({
      title: completed ? "Question completed!" : "Question unmarked",
      description: completed ? "Great progress! Keep going." : "Question marked as incomplete.",
    });
  };

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

  if (!studyPlan) {
    return (
      <div className="min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <h3 className="text-lg font-medium mb-2">Study plan not found</h3>
            <p className="text-muted-foreground mb-4">
              The study plan you're looking for doesn't exist.
            </p>
            <Button onClick={() => navigate("/study-plans")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Study Plans
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const completedQuestions = studyPlan.questions.filter((q: any) => q.completed).length;
  const progressPercentage = (completedQuestions / studyPlan.questions.length) * 100;

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/study-plans")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Study Plans
          </Button>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge className={getCategoryColor(studyPlan.category)}>
                {studyPlan.category}
              </Badge>
              <Badge variant="outline" className={getDifficultyColor(studyPlan.difficulty)}>
                {studyPlan.difficulty}
              </Badge>
            </div>

            <h1 className="text-3xl font-bold">{studyPlan.title}</h1>
            <p className="text-muted-foreground text-lg">{studyPlan.description}</p>

            {/* Progress Card */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      <span className="font-medium">Your Progress</span>
                    </div>
                    <span className="text-2xl font-bold">
                      {Math.round(progressPercentage)}%
                    </span>
                  </div>
                  
                  <Progress value={progressPercentage} className="h-3" />
                  
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{completedQuestions} of {studyPlan.questions.length} questions completed</span>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {studyPlan.estimatedTime}
                      </div>
                      <div className="flex items-center gap-1">
                        <BookOpen className="h-3 w-3" />
                        {studyPlan.questions.length} questions
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Questions List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">Questions</h2>
          
          {studyPlan.questions.map((question: any, index: number) => (
            <Card key={question.id} className={`transition-all ${question.completed ? 'bg-success/5 border-success/20' : ''}`}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <Checkbox
                    id={`question-${question.id}`}
                    checked={question.completed}
                    onCheckedChange={(checked) => 
                      handleQuestionToggle(question.id, checked as boolean)
                    }
                    className="mt-1"
                  />
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        Question {index + 1}
                      </span>
                      {question.completed && (
                        <CheckCircle className="h-4 w-4 text-success" />
                      )}
                    </div>
                    
                    <label 
                      htmlFor={`question-${question.id}`}
                      className={`block font-medium cursor-pointer ${
                        question.completed ? 'line-through text-muted-foreground' : ''
                      }`}
                    >
                      {question.title}
                    </label>
                    
                    <p className="text-sm text-muted-foreground">
                      {question.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Completion Message */}
        {progressPercentage === 100 && (
          <Card className="mt-8 bg-success/5 border-success/20">
            <CardContent className="pt-6 text-center">
              <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Congratulations!</h3>
              <p className="text-muted-foreground">
                You've completed all questions in this study plan. Great work!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default StudyPlanDetail;