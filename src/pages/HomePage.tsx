import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Code, 
  Lightbulb, 
  FileCode, 
  Users, 
  ArrowRight,
  Zap,
  Shield,
  Target
} from "lucide-react";

const HomePage = () => {
  const features = [
    {
      icon: Code,
      title: "Code Space Suggestions",
      description: "Paste your code and receive intelligent suggestions, bug detection, and optimization tips.",
      link: "/code-space"
    },
    {
      icon: Lightbulb,
      title: "Progressive Hints",
      description: "Get step-by-step guidance without spoilers. Unlock hints as you need them.",
      link: "/hints"
    },
    {
      icon: FileCode,
      title: "Code Snippets",
      description: "Access a repository of verified, ready-to-use code snippets for common problems.",
      link: "/snippets"
    },
    {
      icon: Users,
      title: "Private Collaboration",
      description: "Share hints and review code securely with your team members.",
      link: "/collaborate"
    }
  ];

  const benefits = [
    {
      icon: Zap,
      title: "Boost Productivity",
      description: "Reduce time spent stuck on bugs with actionable, context-aware advice."
    },
    {
      icon: Target,
      title: "Improve Code Quality",
      description: "Catch issues early and learn best practices with automated suggestions."
    },
    {
      icon: Shield,
      title: "Safe & Private",
      description: "All data and interactions remain secure within your authorized team."
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-6xl font-bold mb-6">
            Accelerate Your{" "}
            <span className="text-primary">Development</span>{" "}
            Workflow
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Hint Hub provides step-by-step hints, curated code snippets, and smart guidance 
            to help you solve complex problems faster and learn better.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/code-space">
              <Button size="lg" className="flex items-center gap-2">
                Start Coding
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/hints">
              <Button variant="outline" size="lg">
                Browse Hints
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-surface-subtle">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Key Features</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Everything you need to accelerate your programming workflow and foster learning.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map(({ icon: Icon, title, description, link }) => (
              <Link key={title} to={link}>
                <Card className="h-full hover:shadow-lg transition-shadow bg-card">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                    <CardTitle className="text-lg">{title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm">
                      {description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Hint Hub?</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {benefits.map(({ icon: Icon, title, description }) => (
              <div key={title} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                  <Icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{title}</h3>
                <p className="text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;