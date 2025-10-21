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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Code, 
  Copy, 
  Trash2,
  Maximize,
  Minimize,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
  Eye,
  FileText,
  Loader2
} from "lucide-react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import DOMPurify from 'dompurify';
import { normalizeWhitespace } from '@/lib/utils';
// removed dialog for mode selection in favor of a header dropdown

 const CodeSpace = () => {
   const [code, setCode] = useState("");
   const [language, setLanguage] = useState("java");
   const [question, setQuestion] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<{
    isValid: boolean;
    syntaxCorrect: boolean;
    logicCorrect: boolean;
    explanation: string;
    issues: string[];
    testCases: string[];
  } | null>(null);
  const [showCheckResult, setShowCheckResult] = useState(false);
   const { toast } = useToast();
   const navigate = useNavigate();
  const [fullProblemHTML, setFullProblemHTML] = useState<string>('');
  const [problemMeta, setProblemMeta] = useState<{ title?: string; difficulty?: string; leetcodeUrl?: string } | null>(null);
  const [showProblem, setShowProblem] = useState(false);
  const [userMode, setUserMode] = useState<"beginner" | "intermediate" | "advanced" | null>(() => {
    try {
      const saved = localStorage.getItem('codeSpace.userMode');
      if (saved === 'beginner' || saved === 'intermediate' || saved === 'advanced') return saved;
    } catch {}
    return null; // Always start with no mode selected
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        navigate("/", { replace: true });
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  // Restore persisted Code Space state on mount
  useEffect(() => {
    try {
      const savedCode = localStorage.getItem('codeSpace.code');
      const savedLang = localStorage.getItem('codeSpace.language');
      const savedQuestion = sessionStorage.getItem('codeSpace.question');
      const savedMode = localStorage.getItem('codeSpace.userMode') as "beginner" | "intermediate" | "advanced" | null;

      if (savedCode !== null) setCode(savedCode);
      if (savedLang) setLanguage(savedLang);
      if (savedQuestion) setQuestion(savedQuestion);
      if (savedMode === 'beginner' || savedMode === 'intermediate' || savedMode === 'advanced') {
        setUserMode(savedMode);
      }
      // Also try reading user mode from Cache Storage
      (async () => {
        try {
          if ('caches' in window) {
            const cache = await caches.open('hint-hub');
            const resp = await cache.match('/codespace/user-mode');
            if (resp) {
              const data = await resp.json();
              const cm = data?.mode;
              if (cm === 'beginner' || cm === 'intermediate' || cm === 'advanced') {
                setUserMode(prev => prev ?? cm);
              }
            }
          }
        } catch {}
      })();

      // Cross-tab and cross-route sync for user mode
      const onStorage = (e: StorageEvent) => {
        if (e.key === 'codeSpace.userMode') {
          const val = e.newValue as any;
          if (val === 'beginner' || val === 'intermediate' || val === 'advanced') {
            setUserMode(val);
          }
        }
      };
      const onCustom = () => {
        try {
          const v = localStorage.getItem('codeSpace.userMode') as any;
          if (v === 'beginner' || v === 'intermediate' || v === 'advanced') setUserMode(v);
        } catch {}
      };
      window.addEventListener('storage', onStorage);
      window.addEventListener('codeSpace:userMode', onCustom as EventListener);
      return () => {
        window.removeEventListener('storage', onStorage);
        window.removeEventListener('codeSpace:userMode', onCustom as EventListener);
      };
    } catch {}
  }, []);

  // Persist Code Space state on change
  useEffect(() => {
    try {
      localStorage.setItem('codeSpace.code', code);
      localStorage.setItem('codeSpace.language', language);
      sessionStorage.setItem('codeSpace.question', question);
      if (userMode) {
        localStorage.setItem('codeSpace.userMode', userMode);
        // Also persist to Cache Storage for cache-based retention
        (async () => {
          try {
            if ('caches' in window) {
              const cache = await caches.open('hint-hub');
              await cache.put(
                new Request('/codespace/user-mode'),
                new Response(JSON.stringify({ mode: userMode }), { headers: { 'Content-Type': 'application/json' } })
              );
            }
          } catch {}
        })();
      }
    } catch {}
  }, [code, language, question, userMode]);

  // Clear only the question on full refresh (not SPA tab changes)
  useEffect(() => {
    const handler = () => {
      try { sessionStorage.removeItem('codeSpace.question'); } catch {}
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  // Check for pre-filled question from interview questions
  useEffect(() => {
    const html = localStorage.getItem('prefilledQuestionHTML') || '';
    const metaRaw = localStorage.getItem('prefilledQuestionMeta');
    setFullProblemHTML(html);
    setProblemMeta(metaRaw ? JSON.parse(metaRaw) : null);
    // Clear stored problem so refresh does not show it again
    localStorage.removeItem('prefilledQuestionHTML');
    localStorage.removeItem('prefilledQuestionMeta');
    localStorage.removeItem('prefilledQuestionText');
    const prefilledQuestion = localStorage.getItem('prefilledQuestion');
    const questionSource = localStorage.getItem('questionSource');
    
    if (prefilledQuestion) {
      const normalized = normalizeWhitespace(prefilledQuestion);
      setQuestion(normalized);
      // Clear the localStorage after using it
      localStorage.removeItem('prefilledQuestion');
      localStorage.removeItem('questionSource');
      // Persist question so navigating away/back keeps it
      try { sessionStorage.setItem('codeSpace.question', normalized); } catch {}
      
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

  const selectMode = (mode: "beginner" | "intermediate" | "advanced") => {
    setUserMode(mode);
    try { localStorage.setItem('codeSpace.userMode', mode); } catch {}
    try { window.dispatchEvent(new Event('codeSpace:userMode')); } catch {}
    // Write to Cache Storage
    (async () => {
      try {
        if ('caches' in window) {
          const cache = await caches.open('hint-hub');
          await cache.put(
            new Request('/codespace/user-mode'),
            new Response(JSON.stringify({ mode }), { headers: { 'Content-Type': 'application/json' } })
          );
        }
      } catch {}
    })();
    toast({ title: "Mode set", description: `You are in ${mode} mode.` });
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
    // Clear persisted state so a fresh conversation starts clean
    try {
      localStorage.removeItem('codeSpace.code');
      sessionStorage.removeItem('codeSpace.question');
    } catch {}
  };

  const handlePasteQuestion = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setQuestion(normalizeWhitespace(text));
    } catch (err) {
      toast({ title: "Failed to paste from clipboard", description: "Please allow clipboard access and try again." });
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Handle F11 key for fullscreen toggle
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'F11') {
        event.preventDefault();
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Check code functionality for LeetCode problems
  const checkCode = async () => {
    if (!code.trim() || !question.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide both code and the problem statement to check your solution.",
        variant: "destructive"
      });
      return;
    }

    setIsChecking(true);
    setCheckResult(null);
    
    try {
      const OPENROUTER_API_KEY = (import.meta as any).env?.VITE_OPENROUTER_API_KEY;
      const API_URL = 'https://openrouter.ai/api/v1/chat/completions';
      const model = (import.meta as any).env?.VITE_OPENROUTER_MODEL || 'openai/gpt-4o';

      if (!OPENROUTER_API_KEY) {
        setCheckResult({
          isValid: false,
          syntaxCorrect: false,
          logicCorrect: false,
          explanation: 'Missing OpenRouter API key. Please configure VITE_OPENROUTER_API_KEY in your environment.',
          issues: ['API key not configured'],
          suggestions: ['Set up your OpenRouter API key'],
          testCases: []
        });
        setShowCheckResult(true);
        return;
      }

      const systemPrompt = `You are an expert LeetCode code reviewer and validator. Your task is to thoroughly analyze code submissions for LeetCode problems and provide comprehensive feedback.

ANALYSIS FRAMEWORK:
1. SYNTAX VALIDATION: Check for syntax errors, compilation issues, and language-specific problems
2. LOGIC VALIDATION: Verify the algorithm correctness, edge case handling, and time/space complexity
3. PROBLEM ALIGNMENT: Ensure the solution matches the problem requirements and constraints
4. TEST CASE COVERAGE: Analyze how the code would perform on various test cases

EVALUATION CRITERIA:
- Syntax: No compilation errors, proper language constructs
- Logic: Correct algorithm implementation, handles edge cases
- Efficiency: Appropriate time/space complexity for the problem
- Completeness: Solves the problem as described
- Robustness: Handles boundary conditions and edge cases

RESPONSE FORMAT (JSON only):
{
  "isValid": boolean,
  "syntaxCorrect": boolean,
  "logicCorrect": boolean,
  "explanation": "string - comprehensive analysis of the code",
  "issues": ["string array - specific problems found"],
  "testCases": ["string array - example test cases to verify"]
}

GUIDELINES:
- Be thorough but constructive in your analysis
- Focus on LeetCode-specific patterns and best practices
- Consider time/space complexity requirements
- Provide actionable feedback for improvement
- If code is correct, explain why it works well
- If code has issues, provide specific fixes and explanations
- Always consider edge cases and boundary conditions
- Validate against the problem constraints and requirements`;

      const userPrompt = `PROBLEM STATEMENT:
${question}

LANGUAGE: ${language}

CODE TO ANALYZE:
\`\`\`${language}
${code}
\`\`\`

Please analyze this code submission for the given LeetCode problem. Check for:
1. Syntax correctness
2. Logic accuracy
3. Algorithm efficiency
4. Edge case handling
5. Problem requirement compliance

Provide a comprehensive analysis with specific feedback and suggestions for improvement.`;

      const response = await fetch(API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'HTTP-Referer': window.location.origin,
          'X-Title': 'Hint Hub - Code Checker'
          },
          body: JSON.stringify({
            model,
            messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
            ],
            temperature: 0.1,
            top_p: 0.2,
          max_tokens: 1500
          })
        });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      let content = data?.choices?.[0]?.message?.content || '';
      
      // Clean up the response
      content = content.replace(/```json|```/g, '').trim();
      
      try {
        const result = JSON.parse(content);
        setCheckResult(result);
        setShowCheckResult(true);
        
        toast({
          title: result.isValid ? "Code Analysis Complete" : "Issues Found",
          description: result.isValid 
            ? "Your code looks good! Check the detailed analysis below."
            : "Some issues were found. Please review the suggestions.",
          variant: result.isValid ? "default" : "destructive"
        });
      } catch (parseError) {
        // Fallback if JSON parsing fails
        setCheckResult({
          isValid: false,
          syntaxCorrect: false,
          logicCorrect: false,
          explanation: content || 'Unable to parse analysis results',
          issues: ['Failed to parse analysis results'],
          suggestions: ['Please try again or check your code manually'],
          testCases: []
        });
        setShowCheckResult(true);
      }

    } catch (error: any) {
      console.error('Code check error:', error);
      setCheckResult({
        isValid: false,
        syntaxCorrect: false,
        logicCorrect: false,
        explanation: `Error during code analysis: ${error.message}`,
        issues: ['Analysis failed'],
        suggestions: ['Please check your internet connection and try again'],
        testCases: []
      });
      setShowCheckResult(true);
      
      toast({
        title: "Analysis Failed",
        description: "Could not analyze your code. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsChecking(false);
    }
  };


  return (
    <div className={`min-h-screen ${isFullscreen ? 'p-0' : 'p-4 sm:p-6 lg:p-8'}`}>
      <div className={`${isFullscreen ? 'h-screen' : 'max-w-7xl mx-auto'}`}>
        {!isFullscreen && (
          <div className="mb-8">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h1 className="text-3xl font-bold mb-2">Code Space</h1>
                <p className="text-muted-foreground">
              Paste your DSA code, Express.js, or MySQL queries below and chat with our AI assistant for help and guidance.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-sm text-muted-foreground">Mode</div>
                <Select value={userMode || undefined} onValueChange={(v: any) => selectMode(v)}>
                  <SelectTrigger className="w-44 capitalize">
                    <SelectValue placeholder="Select mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {!isFullscreen && (fullProblemHTML || problemMeta) && (
          <div className="mb-4 border rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{problemMeta?.title || 'Problem'}</h3>
                {problemMeta?.difficulty && (
                  <span className="text-xs px-2 py-0.5 rounded bg-gray-200 text-gray-700">{problemMeta.difficulty}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {problemMeta?.leetcodeUrl && (
                  <a href={problemMeta.leetcodeUrl} target="_blank" rel="noreferrer" className="text-sm underline">
                    View on LeetCode
                  </a>
                )}
                <button className="text-sm underline" onClick={() => setShowProblem(s => !s)}>
                  {showProblem ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {showProblem && (
              fullProblemHTML
                ? <div className="prose prose-invert max-w-none max-h-80 overflow-auto" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(fullProblemHTML) }} />
                : <p className="text-sm text-muted-foreground">No full statement available. Try opening on LeetCode.</p>
            )}
          </div>
        )}

        <ResizablePanelGroup direction="horizontal" className={`w-full ${isFullscreen ? 'h-screen' : 'h-[70vh]'} gap-6`}>
          {/* Code Input Section */}
          <ResizablePanel defaultSize={isFullscreen ? 100 : 60} minSize={30}>
            <div className="h-full overflow-auto">
              <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Code className="h-5 w-5" />
                    Code Editor
                    {isFullscreen && (
                      <span className="text-sm text-muted-foreground ml-2">(Fullscreen - Press F11 to exit)</span>
                    )}
                  </CardTitle>
                  <div className="flex items-center gap-2">
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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={toggleFullscreen}
                      className="flex items-center gap-1"
                    >
                      {isFullscreen ? (
                        <>
                          <Minimize className="h-4 w-4" />
                          Exit Fullscreen
                        </>
                      ) : (
                        <>
                          <Maximize className="h-4 w-4" />
                          Fullscreen
                        </>
                      )}
                    </Button>
                  </div>
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
                    className="min-h-32 md:min-h-40 flex-1 border border-orange-500/60 focus-visible:ring-1 focus-visible:ring-orange-500/50"
                  />
                  <Button type="button" variant="outline" onClick={handlePasteQuestion}>
                    Paste
                  </Button>
                </div>
                <div className="min-h-96">
                  {showCheckResult && checkResult ? (
                    <div className="bg-gray-900 text-gray-100 p-6 rounded-lg min-h-[384px] flex flex-col gap-4">
                      {/* Header with status */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {checkResult.isValid ? (
                            <div className="flex items-center gap-2 text-green-400">
                              <CheckCircle className="h-6 w-6" />
                              <span className="font-semibold">Code Analysis Complete</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-red-400">
                              <XCircle className="h-6 w-6" />
                              <span className="font-semibold">Issues Found</span>
                            </div>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowCheckResult(false)}
                          className="text-gray-300 hover:text-white"
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Show Code
                        </Button>
                          </div>


                      {/* Explanation */}
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <Search className="h-4 w-4" />
                          Analysis
                        </h4>
                        <p className="text-sm text-gray-200 whitespace-pre-wrap leading-relaxed">
                          {checkResult.explanation}
                        </p>
                      </div>

                      {/* Issues */}
                      {checkResult.issues && checkResult.issues.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-2 flex items-center gap-2 text-red-400">
                            <AlertTriangle className="h-4 w-4" />
                            Issues Found
                          </h4>
                          <ul className="space-y-1">
                            {checkResult.issues.map((issue, index) => (
                              <li key={index} className="text-sm text-red-300 flex items-start gap-2">
                                <span className="text-red-400 mt-1">•</span>
                                <span>{issue}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}


                      {/* Test Cases */}
                      {checkResult.testCases && checkResult.testCases.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-2 flex items-center gap-2 text-yellow-400">
                            <Eye className="h-4 w-4" />
                            Test Cases to Verify
                          </h4>
                          <ul className="space-y-1">
                            {checkResult.testCases.map((testCase, index) => (
                              <li key={index} className="text-sm text-yellow-300 flex items-start gap-2">
                                <span className="text-yellow-400 mt-1">•</span>
                                <span className="font-mono bg-gray-800 px-2 py-1 rounded">{testCase}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                    </div>
                  ) : (
                    <CodeMirror
                      value={code}
                      height={isFullscreen ? "calc(100vh - 200px)" : "384px"}
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
                  )}
                </div>
                <div className="flex items-center flex-wrap gap-2 mt-4">
                  <Button 
                    onClick={checkCode}
                    disabled={!code.trim() || !question.trim() || isChecking}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isChecking ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Checking...
                      </>
                    ) : (
                      <>
                        <Search className="h-4 w-4 mr-2" />
                        Check Code
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowCheckResult((s) => !s)} 
                    disabled={!checkResult && !code}
                  >
                    {showCheckResult ? (
                      <>
                        <FileText className="h-4 w-4 mr-2" />
                        Show Code
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4 mr-2" />
                        Show Analysis
                      </>
                    )}
                  </Button>
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
          </ResizablePanel>

          {!isFullscreen && <ResizableHandle withHandle />}

          {/* AI Chatbot Section */}
          {!isFullscreen && (
            <ResizablePanel defaultSize={40} minSize={30}>
              <div className="h-full overflow-auto">
                <CodeChatbot 
                  code={code} 
                  language={language} 
                  question={question} 
                  onNewConversation={handleNewConversation}
                />
              </div>
            </ResizablePanel>
          )}
        </ResizablePanelGroup>

        {/* Mode Selection Popup */}
        <Dialog open={userMode === null} onOpenChange={() => {}}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader className="text-center">
              <DialogTitle className="text-xl font-bold">
                Choose Your Experience Level
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Select your programming experience to get personalized assistance.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-3 py-4">
              <div className="space-y-3">
                <div 
                  className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => selectMode('beginner')}
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-green-600">Beginner</h3>
                    <p className="text-xs text-muted-foreground">
                      Perfect for starters! New to programming or DSA.
                    </p>
                  </div>
                  <div className="text-2xl">🌱</div>
                </div>
                
                <div 
                  className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => selectMode('intermediate')}
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-blue-600">Intermediate</h3>
                    <p className="text-xs text-muted-foreground">
                      You know data structures like arrays, maps, sets, trees, and graphs.
                    </p>
                  </div>
                  <div className="text-2xl">🚀</div>
                </div>
                
                <div 
                  className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => selectMode('advanced')}
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-purple-600">Advanced</h3>
                    <p className="text-xs text-muted-foreground">
                      You're comfortable with Dynamic Programming (DP) and advanced algorithms.
                    </p>
                  </div>
                  <div className="text-2xl">⚡</div>
                </div>
              </div>
            </div>
            <div className="text-xs text-muted-foreground text-center">
              You can change this setting anytime from the dropdown in the header.
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default CodeSpace;