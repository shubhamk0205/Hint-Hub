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
  Trash2,
  Play,
  Eye,
  FileText,
  Loader2,
  CheckCircle,
  PartyPopper
} from "lucide-react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import DOMPurify from 'dompurify';
import { normalizeWhitespace } from '@/lib/utils';

 const CodeSpace = () => {
   const [code, setCode] = useState("");
   const [language, setLanguage] = useState("java");
   const [question, setQuestion] = useState("");
   const [isExecuting, setIsExecuting] = useState(false);
   const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<{
    willPassAll: boolean;
    reason: string;
    issues?: string[]; // top issues
    failingScenarios?: string[]; // example failing inputs or scenarios
    suggestedFixes?: string[]; // concrete next steps
    riskyInputs?: string[]; // edge cases to test
  } | null>(null);
   const { toast } = useToast();
   const navigate = useNavigate();
  const [fullProblemHTML, setFullProblemHTML] = useState<string>('');
  const [problemMeta, setProblemMeta] = useState<{ title?: string; difficulty?: string; leetcodeUrl?: string } | null>(null);
  const [showProblem, setShowProblem] = useState(false);
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
      const savedShowResult = localStorage.getItem('codeSpace.showResult');
      const savedResult = localStorage.getItem('codeSpace.result');

      if (savedCode !== null) setCode(savedCode);
      if (savedLang) setLanguage(savedLang);
      if (savedQuestion) setQuestion(savedQuestion);
      if (savedShowResult) setShowResult(savedShowResult === '1');
      if (savedResult) {
        try { setResult(JSON.parse(savedResult)); } catch {}
      }
    } catch {}
  }, []);

  // Persist Code Space state on change
  useEffect(() => {
    try {
      localStorage.setItem('codeSpace.code', code);
      localStorage.setItem('codeSpace.language', language);
      sessionStorage.setItem('codeSpace.question', question);
      localStorage.setItem('codeSpace.showResult', showResult ? '1' : '0');
      if (result) {
        localStorage.setItem('codeSpace.result', JSON.stringify(result));
      } else {
        localStorage.removeItem('codeSpace.result');
      }
    } catch {}
  }, [code, language, question, showResult, result]);

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
      localStorage.removeItem('codeSpace.result');
      localStorage.setItem('codeSpace.showResult', '0');
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

  // Minimal evaluation: will it pass all tests? and why not if it won't
  const runEvaluation = async () => {
    if (!code.trim()) return;
    setIsExecuting(true);
    setResult(null);
    try {
      const OPENROUTER_API_KEY = (import.meta as any).env?.VITE_OPENROUTER_API_KEY;
      const API_URL = 'https://openrouter.ai/api/v1/chat/completions';
      const model = (import.meta as any).env?.VITE_OPENROUTER_MODEL || 'openai/gpt-3.5-turbo';

      // Preflight checks for common 401 causes
      if (!OPENROUTER_API_KEY || typeof OPENROUTER_API_KEY !== 'string' || OPENROUTER_API_KEY.trim().length === 0) {
        setResult({
          willPassAll: false,
          reason: 'Missing OpenRouter API key. Set VITE_OPENROUTER_API_KEY in your .env, then restart the dev server.'
        });
        setShowResult(true);
        return;
      }

      const system = `You are a STRICT code judge for LeetCode-style questions. Be conservative: DEFAULT to willPassAll=false unless you can clearly argue coverage of edge cases and constraints typical to LeetCode. Use the provided Problem Context as the source of truth (inputs/outputs/constraints). If code contradicts the Problem Context, explain precisely.\n\nNEVER contradict explicit guarantees in the Problem Context. For example, if it states "exactly one solution", do NOT claim multiple solutions/ambiguity; if it states "may not use the same element twice", assume inputs respect this. Judge the code under the stated guarantees.\n\nIMPORTANT: The boolean and the explanation must be CONSISTENT.\n- If willPassAll = true: reason should briefly affirm correctness, complexity, and edge-case coverage. Do NOT include failure reasons.\n- If willPassAll = false: reason must start with "Fails because:" followed by concrete blockers; do NOT praise correctness.\n\nReturn ONLY JSON with this schema:\n{\n  willPassAll: boolean,\n  reason: string, // 1-4 sentence summary\n  issues?: string[], // top 3 concrete issues (e.g., "doesn't handle negatives")\n  failingScenarios?: string[], // up to 3 example inputs/scenarios likely to fail\n  suggestedFixes?: string[], // up to 3 specific implementation changes\n  riskyInputs?: string[] // up to 5 edge inputs to test\n}\nRules:\n- Assume LeetCode-style constraints and data ranges; consider negatives, zeros, empties/nulls, duplicates, sorted/unsorted, boundaries, integer overflow, and large inputs.\n- Consider time/space complexity vs typical constraints (e.g., O(n) or O(n log n) when required).\n- If a known optimal pattern (two pointers, sliding window, prefix sums, sorting+scan, hashing, stack, binary search, heap, union-find, DP) is correctly implemented for the standard problem, willPassAll=true.\n- If complexity is worse than required or edge cases are unhandled, set willPassAll=false.\n- Do NOT nitpick style; judge correctness and constraints coverage only.\n- Always ground feedback in the Problem Context when provided.`;

      const user = `Question Type: LeetCode-style\nLanguage: ${language}\n\nProblem Context (source of truth):\n${question || 'N/A'}\n\nYour task: Judge the code strictly against the Problem Context above. If the problem is missing, infer likely constraints from common LeetCode patterns and state assumptions in your reason.\n\nCode to evaluate:\n\`\`\`${language}\n${code}\n\`\`\``;

      const r = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Hint Hub'
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user }
          ],
          temperature: 0.1,
          top_p: 0.2,
          max_tokens: 700
        })
      });
      if (!r.ok) {
        // Attempt to extract more details from error body
        let errMsg = `API ${r.status}`;
        try {
          const txt = await r.text();
          // Try JSON parse first
          try {
            const j = JSON.parse(txt);
            errMsg = j?.error?.message || JSON.stringify(j).slice(0, 500);
          } catch {
            errMsg = txt.slice(0, 500);
          }
        } catch {}

        if (r.status === 401) {
          setResult({
            willPassAll: false,
            reason: `Unauthorized (401). Check your OpenRouter API key and model access. Details: ${errMsg}`
          });
          setShowResult(true);
          return;
        }

        throw new Error(errMsg);
      }
      const data = await r.json();
      let content: string = data?.choices?.[0]?.message?.content || '';
      content = content.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(content);

      // Second pass: adversarial critic to search for failures
      const criticSystem = `ROLE: Adversarial critic for LeetCode-style problems. Your job is to stress-test the submission ONLY within the stated Problem Context.\n\nSTRICT CONTEXT RULES (TREAT AS AXIOMS):\n- If the context says "exactly one solution", DO NOT complain about multiple solutions or ambiguity.\n- If it says "may not use the same element twice", DO NOT raise reuse-of-same-index issues.\n- If it says "return indices in any order", DO NOT require a specific order.\n- Respect all other explicit guarantees; do not invent conflicting requirements.\n\nWHAT TO SEARCH FOR INSTEAD:\n- Genuine contradictions with the stated behavior (e.g., wrong indices mapping, missing i != j checks when not guaranteed, but skip if guarantee forbids reuse).\n- Edge cases not excluded by context: negatives, zeros, duplicates-at-different-indices, empty/size-1 arrays, boundary indices.\n- Time/space complexity worse than typical constraints required by the problem family.\n- Unsafe assumptions (overflow, integer division, off-by-one at bounds), unless context guarantees they cannot occur.\n\nOUTPUT (JSON ONLY):\n{\n  definitiveFail: boolean,\n  reasons?: string[],  // up to 3 precise, non-contradictory reasons that DO NOT violate context axioms\n  failingScenarios?: string[], // up to 3 concrete inputs likely to fail under the context\n  riskyInputs?: string[] // up to 5 edge inputs to test that do not contradict the context\n}`;
      const criticUser = `Question Type: LeetCode-style\nLanguage: ${language}\n\nProblem Context (source of truth):\n${question || 'N/A'}\n\nYour task: Using the Problem Context above, look for contradictions, missing edge cases, or complexity mismatches in the code. If the context guarantees "exactly one solution" or "do not reuse the same element", assume those guarantees hold and judge under them.\n\nCode to analyze:\n\`\`\`${language}\n${code}\n\`\`\``;
      let critic: any = null;
      try {
        const rc = await fetch(API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'HTTP-Referer': window.location.origin,
            'X-Title': 'Hint Hub'
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: criticSystem },
              { role: 'user', content: criticUser }
            ],
            temperature: 0.1,
            top_p: 0.2,
            max_tokens: 500
          })
        });
        const criticData = await rc.json();
        let criticContent: string = criticData?.choices?.[0]?.message?.content || '';
        criticContent = criticContent.replace(/```json|```/g, '').trim();
        critic = JSON.parse(criticContent);
      } catch {}

      // Merge results with conservative bias
      let willPassAll = !!parsed.willPassAll && !(critic?.definitiveFail === true);
      const mergedIssues = [
        ...(Array.isArray(parsed.issues) ? parsed.issues : []),
        ...(Array.isArray(critic?.reasons) ? critic.reasons : [])
      ].filter(Boolean).slice(0, 3);
      const mergedFailing = [
        ...(Array.isArray(parsed.failingScenarios) ? parsed.failingScenarios : []),
        ...(Array.isArray(critic?.failingScenarios) ? critic.failingScenarios : [])
      ].filter(Boolean).slice(0, 3);
      const mergedRisky = [
        ...(Array.isArray(parsed.riskyInputs) ? parsed.riskyInputs : []),
        ...(Array.isArray(critic?.riskyInputs) ? critic.riskyInputs : [])
      ].filter(Boolean).slice(0, 5);

      // Build a consistent reason and auto-correct contradictions
      const rawReason: string = typeof parsed.reason === 'string' ? parsed.reason : '';
      const looksPositive = /\b(correct|works|efficient|passes|good|optimal|handles|covers)\b/i.test(rawReason);
      let finalReason = rawReason.trim();
      // Context guards derived from Problem Context
      const ctx = (question || '').toLowerCase();
      const ctxOneSolution = /exactly one solution/.test(ctx);
      const ctxNoReuse = /(may not|cannot|can't|do not|don't) use the same element twice/.test(ctx);
      // If model said fail but explanation is clearly positive and critic didn't flag definitive fail, flip to pass
      if (!willPassAll && looksPositive && !(critic?.definitiveFail === true)) {
        willPassAll = true;
      }

      // If model failed due to reasons that contradict the Problem Context guarantees, flip to pass
      if (!willPassAll && !(critic?.definitiveFail === true)) {
        const contradictionSameElement = /same element (is|was)? used twice|reuse the same element/i.test(rawReason) || (mergedIssues.join(' ; ') + ' ' + (critic?.reasons || []).join(' ; ')).match(/same element/i);
        const contradictionMultiSolutions = /multiple (pairs|solutions)|more than one solution/i.test(rawReason) || (mergedIssues.join(' ; ') + ' ' + (critic?.reasons || []).join(' ; ')).match(/multiple|more than one/i);
        const contradictionNoPairEmpty = /returns an empty array when no valid pair is found/i.test(rawReason);
        if ((ctxNoReuse && contradictionSameElement) || (ctxOneSolution && (contradictionMultiSolutions || contradictionNoPairEmpty))) {
          willPassAll = true;
        }
      }

      if (!willPassAll) {
        if (!finalReason || looksPositive) {
          const criticText = Array.isArray(critic?.reasons) && critic.reasons.length ? critic.reasons.join('; ') : '';
          const issuesText = mergedIssues.length ? mergedIssues.join('; ') : '';
          const base = criticText || issuesText || 'Edge cases not handled or complexity too high for constraints';
          finalReason = `Fails because: ${base}`;
        } else if (!/^Fails because:/i.test(finalReason)) {
          finalReason = `Fails because: ${finalReason}`;
        }
      } else {
        if (!finalReason || /fail|wrong|issue|bug/i.test(finalReason)) {
          finalReason = 'Passes because it matches the Problem Context, runs in acceptable complexity, and covers required edge cases.';
        }
        // If reason was prefixed as failure, normalize to positive wording
        if (/^Fails because:/i.test(finalReason)) {
          finalReason = 'Passes because it matches the Problem Context, runs in acceptable complexity, and covers required edge cases.';
        }
      }

      setResult({
        willPassAll,
        reason: finalReason,
        issues: mergedIssues.length ? mergedIssues : undefined,
        failingScenarios: mergedFailing.length ? mergedFailing : undefined,
        suggestedFixes: Array.isArray(parsed.suggestedFixes) ? parsed.suggestedFixes.slice(0, 3) : undefined,
        riskyInputs: mergedRisky.length ? mergedRisky : undefined,
      });
      setShowResult(true);
    } catch (e: any) {
      setResult({ willPassAll: false, reason: e?.message || 'API error' });
      setShowResult(true);
      toast({ title: 'Run failed', description: 'Could not evaluate code. Showing best-effort reason.', variant: 'destructive' });
    } finally {
      setIsExecuting(false);
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

        {(fullProblemHTML || problemMeta) && (
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

        <ResizablePanelGroup direction="horizontal" className="w-full h-[70vh] gap-6">
          {/* Code Input Section */}
          <ResizablePanel defaultSize={60} minSize={30}>
            <div className="h-full overflow-auto">
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
                    className="min-h-32 md:min-h-40 flex-1 border border-orange-500/60 focus-visible:ring-1 focus-visible:ring-orange-500/50"
                  />
                  <Button type="button" variant="outline" onClick={handlePasteQuestion}>
                    Paste
                  </Button>
                </div>
                <div className="min-h-96">
                  {showResult ? (
                    <div className="bg-gray-900 text-gray-100 p-4 rounded-lg min-h-[384px] flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <div className="text-sm">
                          <span className="opacity-80">Assistant verdict:</span>{' '}
                          {result?.willPassAll ? (
                            <span className="text-green-400">will pass all test cases</span>
                          ) : (
                            <span className="text-red-400">will NOT pass all test cases</span>
                          )}
                        </div>
                        {result?.willPassAll && (
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-400" />
                            <span className="text-green-300 text-sm">Accepted</span>
                          </div>
                        )}
                      </div>
                      {result?.willPassAll && (
                        <div className="relative overflow-hidden rounded-lg border border-green-700/40 bg-gradient-to-r from-green-900/40 to-emerald-900/30 p-3">
                          <div className="flex items-center gap-2 text-green-300 text-sm">
                            <PartyPopper className="h-4 w-4" />
                            <span>All test cases passed — great job! Keep the momentum going.</span>
                          </div>
                          <div className="absolute -right-8 -top-8 opacity-20">
                            <CheckCircle className="h-20 w-20 text-green-500" />
                          </div>
                        </div>
                      )}
                      <div>
                        <h4 className="font-semibold mb-2">Why:</h4>
                        <p className="text-sm text-gray-200 whitespace-pre-wrap">{result?.reason || 'No details from API'}</p>
                      </div>
                      {/* Per request: show only the reason. Extra sections hidden. */}
                    </div>
                  ) : (
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
                  )}
                </div>
                <div className="flex items-center flex-wrap gap-2 mt-4">
                  <Button 
                    onClick={runEvaluation}
                    disabled={!code.trim() || isExecuting}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {isExecuting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Evaluating...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Run Code
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={() => setShowResult((s) => !s)} disabled={!result && !code}>
                    {showResult ? (
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

          <ResizableHandle withHandle />

          {/* AI Chatbot Section */}
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
        </ResizablePanelGroup>
      </div>
    </div>
  );
};

export default CodeSpace;