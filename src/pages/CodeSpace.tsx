import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { java } from "@codemirror/lang-java";
import { python } from "@codemirror/lang-python";
import { sql } from "@codemirror/lang-sql";
import { cpp } from "@codemirror/lang-cpp";
import { vscodeDark } from "@uiw/codemirror-theme-vscode";
import { autocompletion, completeFromList, CompletionSource } from "@codemirror/autocomplete";
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
  const [language, setLanguage] = useState("java");
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

  // Check for pre-filled question from interview questions
  useEffect(() => {
    const prefilledQuestion = localStorage.getItem('prefilledQuestion');
    const questionSource = localStorage.getItem('questionSource');
    
    if (prefilledQuestion) {
      setQuestion(prefilledQuestion);
      // Clear the localStorage after using it
      localStorage.removeItem('prefilledQuestion');
      localStorage.removeItem('questionSource');
      
      // Show a toast notification
      if (questionSource) {
        toast({
          title: "Question Loaded",
          description: `Loaded ${questionSource} from Interview Questions section.`,
        });
      }
    }
  }, [toast]);

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

  const getCodeMirrorExtensions = () => {
    const commonCompletions = [
      { label: "function", type: "keyword" },
      { label: "const", type: "keyword" },
      { label: "let", type: "keyword" },
      { label: "return", type: "keyword" },
      { label: "class", type: "keyword" },
      { label: "import", type: "keyword" },
      { label: "export", type: "keyword" },
    ];

    const jsTsCompletions = [
      ...commonCompletions,
      { label: "console", type: "variable" },
      { label: "console.log", type: "function" },
      { label: "map", type: "function" },
      { label: "filter", type: "function" },
      { label: "reduce", type: "function" },
      { label: "Promise", type: "class" },
      { label: "async", type: "keyword" },
      { label: "await", type: "keyword" },
    ];

    const pythonCompletions = [
      { label: "def", type: "keyword" },
      { label: "class", type: "keyword" },
      { label: "return", type: "keyword" },
      { label: "print", type: "function" },
      { label: "len", type: "function" },
      { label: "range", type: "function" },
      { label: "list", type: "type" },
      { label: "dict", type: "type" },
    ];

    const javaCompletions = [
      { label: "public", type: "keyword" },
      { label: "private", type: "keyword" },
      { label: "class", type: "keyword" },
      { label: "static", type: "keyword" },
      { label: "void", type: "keyword" },
      { label: "System.out.println", type: "function" },
      { label: "String", type: "type" },
      { label: "int", type: "type" },
    ];

    const cppCompletions = [
      { label: "#include", type: "keyword" },
      { label: "std", type: "namespace" },
      { label: "cout", type: "variable" },
      { label: "cin", type: "variable" },
      { label: "vector", type: "type" },
      { label: "string", type: "type" },
      { label: "int", type: "type" },
    ];

    const sqlCompletions = [
      { label: "SELECT", type: "keyword" },
      { label: "FROM", type: "keyword" },
      { label: "WHERE", type: "keyword" },
      { label: "GROUP BY", type: "keyword" },
      { label: "ORDER BY", type: "keyword" },
      { label: "INSERT INTO", type: "keyword" },
      { label: "UPDATE", type: "keyword" },
      { label: "DELETE", type: "keyword" },
      { label: "JOIN", type: "keyword" },
    ];

    const completionSource: CompletionSource = (ctx) => {
      // Find the word before the cursor to properly replace it when applying a completion
      const word = ctx.matchBefore(/[A-Za-z_\.]+/);
      if (word && word.from === word.to && !ctx.explicit) return null;

      let options;
      switch (language) {
        case "javascript":
        case "typescript":
          options = jsTsCompletions; break;
        case "python":
          options = pythonCompletions; break;
        case "java":
          options = javaCompletions; break;
        case "cpp":
          options = cppCompletions; break;
        case "sql":
          options = sqlCompletions; break;
        default:
          options = commonCompletions; break;
      }

      return { from: word ? word.from : ctx.pos, options };
    };

    switch (language) {
      case "javascript":
        return [javascript({ jsx: true }), autocompletion({ override: [completionSource] })];
      case "typescript":
        return [javascript({ typescript: true }), autocompletion({ override: [completionSource] })];
      case "python":
        return [python(), autocompletion({ override: [completionSource] })];
      case "java":
        return [java(), autocompletion({ override: [completionSource] })];
      case "cpp":
        return [cpp(), autocompletion({ override: [completionSource] })];
      case "sql":
        return [sql(), autocompletion({ override: [completionSource] })];
      default:
        return [javascript(), autocompletion({ override: [completionSource] })];
    }
  };

  const clearCode = () => {
    setCode("");
  };

  const handleNewConversation = () => {
    // Clear code and question when starting new conversation
    setCode("");
    setQuestion("");
    
    // Show toast notification
    toast({
      title: "New Conversation Started",
      description: "Ready to help with a new question!",
    });
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
                    rows={5}
                    className="min-h-32 md:min-h-40 flex-1"
                  />
                  <Button type="button" variant="outline" onClick={handlePasteQuestion}>
                    Paste
                  </Button>
                </div>
                <div className="min-h-96">
                  <CodeMirror
                    value={code}
                    height="384px"
                    theme={vscodeDark}
                    extensions={getCodeMirrorExtensions()}
                    basicSetup={{
                      lineNumbers: true,
                      highlightActiveLine: true,
                      foldGutter: true,
                      autocompletion: true,
                    }}
                    onChange={(value) => setCode(value)}
                  />
                </div>
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
            <CodeChatbot 
              code={code} 
              language={language} 
              question={question} 
              onNewConversation={handleNewConversation}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeSpace;