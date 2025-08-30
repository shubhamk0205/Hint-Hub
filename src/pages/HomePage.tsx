import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Code, 
  BookOpen,
  ArrowRight,
  Zap,
  Shield,
  Target
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { auth } from "@/lib/firebase";
import { useEffect, useState } from "react";
import { signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import Footer from "@/components/Footer";

const HomePage = () => {
  const features = [
    {
      icon: Code,
      title: "AI-Powered Learning Assistant",
      description: "Get targeted hints, probing questions, and instant feedback to guide your problem-solving journey.",
      link: "/code-space"
    },
    {
      icon: BookOpen,
      title: "Comprehensive Study Plans",
      description: "Master DSA with 176+ curated questions across 10 topics, from beginner to advanced.",
      link: "/study-plans"
    }
  ];

  const benefits = [
    {
      icon: Zap,
      title: "Build Lasting Expertise",
      description: "Develop genuine understanding through guided discovery, not just memorization."
    },
    {
      icon: Target,
      title: "Interview-Ready Skills",
      description: "Practice with real questions from top tech companies and track your progress."
    },
    {
      icon: Shield,
      title: "Adaptive Learning",
      description: "AI adapts to your learning style and pace, providing personalized guidance."
    }
  ];

  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      setUser(firebaseUser);
    });
    return () => unsubscribe();
  }, []);

  const handleProtectedNavigation = async (path: string) => {
    if (!auth.currentUser) {
      try {
        const provider = new GoogleAuthProvider();
        console.log("Attempting Google sign-in...");
        console.log("Firebase config:", {
          apiKey: import.meta.env.VITE_FIREBASE_API_KEY ? "Set" : "Not set",
          authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ? "Set" : "Not set",
          projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ? "Set" : "Not set"
        });
        await signInWithPopup(auth, provider);
        console.log("Sign-in successful!");
        navigate(path);
      } catch (error) {
        console.error("Sign-in error:", error);
        console.error("Error code:", error.code);
        console.error("Error message:", error.message);
        
        let errorMessage = "Sign-in failed. Please try again.";
        
        if (error.code === 'auth/unauthorized-domain') {
          errorMessage = "This domain is not authorized for sign-in. Please contact support.";
        } else if (error.code === 'auth/popup-closed-by-user') {
          errorMessage = "Sign-in was cancelled. Please try again.";
        } else if (error.code === 'auth/popup-blocked') {
          errorMessage = "Sign-in popup was blocked. Please allow popups and try again.";
        }
        
        alert(errorMessage);
      }
    } else {
      navigate(path);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-6xl font-bold mb-6">
            Master{" "}
            <span className="text-primary">DSA</span>{" "}
            Through Intelligent Guidance
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            AI-powered platform that delivers hints, guiding questions, and instant feedback 
            to foster problem-solving and deeper understanding of Data Structures & Algorithms.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="flex items-center gap-2" onClick={() => handleProtectedNavigation("/code-space")}> 
              Start Learning
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="lg" onClick={() => handleProtectedNavigation("/study-plans")}> 
              Explore Study Plans
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-surface-subtle">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Key Features</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Everything you need to master Data Structures & Algorithms through intelligent guidance.
            </p>
          </div>
          {user && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {features.map(({ icon: Icon, title, description, link }) => (
                <div key={title} className="h-full hover:shadow-lg transition-shadow bg-card cursor-pointer text-left rounded-lg border" onClick={() => handleProtectedNavigation(link)}>
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
                </div>
              ))}
            </div>
          )}
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
      
      {/* Footer */}
      <Footer />
    </div>
  );
};

export default HomePage;