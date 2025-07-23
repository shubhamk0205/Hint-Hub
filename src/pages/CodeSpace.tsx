import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import CodeChatbot from "@/components/CodeChatbot";
import { useNavigate } from "react-router-dom";
import { auth } from "@/lib/firebase";
import { 
  Code, 
  Copy, 
  Trash2
} from "lucide-react";

const CodeSpace = () => {
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [question, setQuestion] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        navigate("/", { replace: true });
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const languages = [
    { value: "javascript", label: "JavaScript" },
    { value: "python", label: "Python" },
    { value: "java", label: "Java" },
    { value: "cpp", label: "C++" },
    { value: "typescript", label: "TypeScript" },
    { value: "sql", label: "SQL" },
  ];

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Copied to clipboard",
      description: "Code has been copied to your clipboard.",
    });
  };

  const clearCode = () => {
    setCode("");
  };

  const handlePasteQuestion = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setQuestion(text);
    } catch (err) {
      toast({ title: "Failed to paste from clipboard", description: "Please allow clipboard access and try again." });
    }
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Code Space</h1>
          <p className="text-muted-foreground">
            Paste your DSA code, Express.js, or MySQL queries below and chat with our AI assistant for help and guidance.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Code Input Section */}
          <div>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Code className="h-5 w-5" />
                    Code Editor
                  </CardTitle>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger className="w-32">
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
                </div>
                <CardDescription>
                  Paste your DSA problems, Express.js code, or MySQL queries here
                </CardDescription>
              </CardHeader>
              <CardContent>
                <label className="block mb-2 font-medium text-sm">Paste your question here</label>
                <div className="flex gap-2 mb-4">
                  <Textarea
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Paste your question here..."
                    className="min-h-20 flex-1"
                  />
                  <Button type="button" variant="outline" onClick={handlePasteQuestion}>
                    Paste
                  </Button>
                </div>
                <Textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder={language === 'sql' 
                    ? "-- Paste your SQL query here...\nSELECT * FROM users\nWHERE age > 18\nORDER BY name;"
                    : "// Paste your code here...\n// DSA problems, algorithms, Express.js routes, etc.\nfunction twoSum(nums, target) {\n  // Your solution here\n}"
                  }
                  className="min-h-96 font-mono text-sm bg-code-bg border-border"
                />
                <div className="flex items-center gap-2 mt-4">
                  <Button variant="outline" onClick={copyToClipboard} disabled={!code}>
                    <Copy className="h-4 w-4" />
                    Copy
                  </Button>
                  <Button variant="outline" onClick={clearCode} disabled={!code}>
                    <Trash2 className="h-4 w-4" />
                    Clear
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AI Chatbot Section */}
          <div>
            <CodeChatbot code={code} language={language} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeSpace;