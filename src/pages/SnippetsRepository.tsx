import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  Copy, 
  FileCode, 
  Tag, 
  Download,
  Heart,
  Eye,
  Check
} from "lucide-react";

const SnippetsRepository = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [copiedSnippet, setCopiedSnippet] = useState<number | null>(null);
  const { toast } = useToast();

  const snippets = [
    {
      id: 1,
      title: "Debounce Function",
      description: "Utility function to limit the rate of function execution",
      language: "javascript",
      category: "utilities",
      tags: ["performance", "debounce", "utility"],
      code: `function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Usage
const debouncedSearch = debounce((query) => {
  console.log('Searching for:', query);
}, 300);`,
      views: 1250,
      likes: 89,
      dateAdded: "2024-01-15"
    },
    {
      id: 2,
      title: "API Error Handler",
      description: "Robust error handling for API requests with retry logic",
      language: "javascript",
      category: "api",
      tags: ["error-handling", "api", "fetch"],
      code: `async function apiRequest(url, options = {}, maxRetries = 3) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
      }

      return await response.json();
    } catch (error) {
      if (attempt === maxRetries) {
        throw new Error(\`Failed after \${maxRetries + 1} attempts: \${error.message}\`);
      }
      
      // Exponential backoff
      await new Promise(resolve => 
        setTimeout(resolve, Math.pow(2, attempt) * 1000)
      );
    }
  }
}`,
      views: 890,
      likes: 67,
      dateAdded: "2024-01-20"
    },
    {
      id: 3,
      title: "Python List Comprehensions",
      description: "Common patterns for list comprehensions and filtering",
      language: "python",
      category: "data-structures",
      tags: ["list-comprehension", "filtering", "python"],
      code: `# Basic list comprehension
squares = [x**2 for x in range(10)]

# With condition
even_squares = [x**2 for x in range(10) if x % 2 == 0]

# Nested list comprehension
matrix = [[j for j in range(3)] for i in range(3)]

# Dictionary comprehension
word_lengths = {word: len(word) for word in ['python', 'list', 'comprehension']}

# Set comprehension
unique_lengths = {len(word) for word in ['hello', 'world', 'hi']}

# Filtering with multiple conditions
filtered_data = [
    item for item in data 
    if item.get('active') and item.get('score', 0) > 50
]`,
      views: 756,
      likes: 43,
      dateAdded: "2024-01-18"
    },
    {
      id: 4,
      title: "React Custom Hook - useLocalStorage",
      description: "Custom hook for managing localStorage with state synchronization",
      language: "react",
      category: "hooks",
      tags: ["react", "hooks", "localStorage"],
      code: `import { useState, useEffect } from 'react';

function useLocalStorage(key, initialValue) {
  // Get value from localStorage or use initial value
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(\`Error reading localStorage key "\${key}":\`, error);
      return initialValue;
    }
  });

  // Update localStorage when state changes
  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(\`Error setting localStorage key "\${key}":\`, error);
    }
  };

  return [storedValue, setValue];
}

// Usage
function MyComponent() {
  const [name, setName] = useLocalStorage('name', '');
  const [settings, setSettings] = useLocalStorage('settings', {});
  
  return (
    <input 
      value={name} 
      onChange={(e) => setName(e.target.value)} 
    />
  );
}`,
      views: 1100,
      likes: 78,
      dateAdded: "2024-01-22"
    },
    {
      id: 5,
      title: "SQL Query Builder",
      description: "Dynamic SQL query builder with parameter binding",
      language: "sql",
      category: "database",
      tags: ["sql", "query-builder", "database"],
      code: `-- Dynamic WHERE clause builder
WITH filtered_data AS (
  SELECT *
  FROM users u
  WHERE 1=1
    AND (@name IS NULL OR u.name ILIKE '%' || @name || '%')
    AND (@email IS NULL OR u.email = @email)
    AND (@age_min IS NULL OR u.age >= @age_min)
    AND (@age_max IS NULL OR u.age <= @age_max)
    AND (@active IS NULL OR u.active = @active)
)
SELECT 
  COUNT(*) OVER() as total_count,
  *
FROM filtered_data
ORDER BY 
  CASE WHEN @sort_by = 'name' THEN name END,
  CASE WHEN @sort_by = 'email' THEN email END,
  CASE WHEN @sort_by = 'created_at' THEN created_at END DESC
LIMIT @limit OFFSET @offset;

-- Usage with parameters:
-- @name = 'john', @email = null, @age_min = 18, @age_max = 65
-- @active = true, @sort_by = 'name', @limit = 20, @offset = 0`,
      views: 445,
      likes: 32,
      dateAdded: "2024-01-25"
    }
  ];

  const languages = [
    { value: "all", label: "All Languages" },
    { value: "javascript", label: "JavaScript" },
    { value: "python", label: "Python" },
    { value: "react", label: "React" },
    { value: "sql", label: "SQL" },
  ];

  const categories = [
    { value: "all", label: "All Categories" },
    { value: "utilities", label: "Utilities" },
    { value: "api", label: "API" },
    { value: "data-structures", label: "Data Structures" },
    { value: "hooks", label: "React Hooks" },
    { value: "database", label: "Database" },
  ];

  const filteredSnippets = snippets.filter(snippet => {
    const matchesSearch = snippet.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         snippet.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         snippet.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesLanguage = selectedLanguage === "all" || snippet.language === selectedLanguage;
    const matchesCategory = selectedCategory === "all" || snippet.category === selectedCategory;
    
    return matchesSearch && matchesLanguage && matchesCategory;
  });

  const copyToClipboard = async (code: string, id: number) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedSnippet(id);
      toast({
        title: "Copied to clipboard",
        description: "Code snippet has been copied to your clipboard.",
      });
      
      // Reset the copied state after 2 seconds
      setTimeout(() => setCopiedSnippet(null), 2000);
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy code to clipboard.",
        variant: "destructive",
      });
    }
  };

  const getLanguageColor = (language: string) => {
    const colors = {
      javascript: "bg-warning/10 text-warning border-warning/20",
      python: "bg-info/10 text-info border-info/20",
      react: "bg-primary/10 text-primary border-primary/20",
      sql: "bg-success/10 text-success border-success/20",
    };
    return colors[language as keyof typeof colors] || "bg-muted";
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Code Snippets Repository</h1>
          <p className="text-muted-foreground">
            Browse and copy verified code snippets for common programming problems.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 space-y-4 sm:space-y-0 sm:flex sm:items-center sm:gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search snippets, descriptions, or tags..."
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
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-sm text-muted-foreground">
            Showing {filteredSnippets.length} of {snippets.length} snippets
          </p>
        </div>

        {/* Snippets List */}
        <div className="space-y-6">
          {filteredSnippets.map((snippet) => (
            <Card key={snippet.id} className="overflow-hidden">
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge className={getLanguageColor(snippet.language)}>
                      {snippet.language}
                    </Badge>
                    <Badge variant="outline">{snippet.category}</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {snippet.views}
                    </div>
                    <div className="flex items-center gap-1">
                      <Heart className="h-3 w-3" />
                      {snippet.likes}
                    </div>
                  </div>
                </div>
                <CardTitle className="text-xl">{snippet.title}</CardTitle>
                <CardDescription>{snippet.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-1">
                    {snippet.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        <Tag className="h-2 w-2 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="relative">
                    <pre className="bg-code-bg p-4 rounded-lg text-sm overflow-x-auto border">
                      <code>{snippet.code}</code>
                    </pre>
                    <Button
                      size="sm"
                      variant="outline"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(snippet.code, snippet.id)}
                    >
                      {copiedSnippet === snippet.id ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredSnippets.length === 0 && (
          <div className="text-center py-12">
            <FileCode className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No snippets found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search terms or filters to find what you're looking for.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SnippetsRepository;