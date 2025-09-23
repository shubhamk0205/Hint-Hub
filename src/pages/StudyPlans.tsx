import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Search, 
  BookOpen, 
  Clock,
  CheckCircle,
  Circle,
  TrendingUp,
  Target,
  Filter,
  Building2,
  Users,
  Play,
  ExternalLink,
  HelpCircle,
  GraduationCap,
  Zap,
  Star,
  BarChart3
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { fetchLeetCodeQuestion, deriveSlugFromUrl, stripHtml, mapTitleToSlug } from '@/lib/leetcode';
import { auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { loadPlaylistProgress, saveQuestionProgress, loadStudyPlanProgress, saveStudyPlanProgress } from "@/lib/playlistProgress";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import rawLeetcodeQuestions from "../../leetocdeQuestions?raw";

interface Question {
  id: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  topic: string;
  leetcodeUrl: string;
  completed: boolean;
}

interface Topic {
  id: string;
  name: string;
  questions: Question[];
  completed: boolean;
}

interface StudyPlan {
  id: string;
  title: string;
  description: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  estimatedTime: string;
  topics: Topic[];
  totalQuestions: number;
  completedQuestions: number;
}

interface Playlist {
  id: string;
  title: string;
  description: string;
  totalQuestions: number;
  completedQuestions: number;
  topics: {
    [key: string]: {
      Easy: Question[];
      Medium: Question[];
      Hard: Question[];
    };
  };
}

const StudyPlans = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [activeTab, setActiveTab] = useState("learning");
  const [selectedPlan, setSelectedPlan] = useState<StudyPlan | null>(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [studyPlansWithProgress, setStudyPlansWithProgress] = useState<StudyPlan[]>([]);
  
  // Add sorting functionality
  const [sortBy, setSortBy] = useState("default");
  const [playlistSearchQuery, setPlaylistSearchQuery] = useState("");
  const [playlistSortBy, setPlaylistSortBy] = useState("default");
  
  // Question search states
  const [questionSearchQuery, setQuestionSearchQuery] = useState("");
  const [questionDifficultyFilter, setQuestionDifficultyFilter] = useState("all");
  const [playlistQuestionSearchQuery, setPlaylistQuestionSearchQuery] = useState("");
  const [playlistQuestionDifficultyFilter, setPlaylistQuestionDifficultyFilter] = useState("all");
  
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Build topic -> questions from raw leetcode questions file ("Topic | Title | Difficulty | URL")
  const parsedTopicToQuestions = useMemo(() => {
    const topicToQuestions: Record<string, Question[]> = {};
    if (!rawLeetcodeQuestions || typeof rawLeetcodeQuestions !== "string") return topicToQuestions;

    const lines = rawLeetcodeQuestions.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    for (const line of lines) {
      const parts = line.split("|").map(p => p.trim());
      if (parts.length < 4) continue;
      const [topicName, title, difficultyRaw, url] = parts;
      const difficulty = (difficultyRaw as unknown) as Question["difficulty"]; // Easy | Medium | Hard
      const id = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const q: Question = { id, title, difficulty, topic: topicName, leetcodeUrl: url, completed: false };
      if (!topicToQuestions[topicName]) topicToQuestions[topicName] = [];
      topicToQuestions[topicName].push(q);
    }
    return topicToQuestions;
  }, []);

  // Load playlists with completion status from Supabase
  useEffect(() => {
    const loadPlaylistsWithProgress = async () => {
      try {
        const updatedPlaylists = await Promise.all(
          interviewPlaylists.map(async (playlist) => {
            const progress = await loadPlaylistProgress(playlist.id);
            
            if (Object.keys(progress).length > 0) {
              // Update questions with saved completion status
              const updatedTopics = { ...playlist.topics };
              Object.keys(updatedTopics).forEach(topicKey => {
                Object.keys(updatedTopics[topicKey]).forEach(difficultyKey => {
                  updatedTopics[topicKey][difficultyKey as keyof typeof updatedTopics[typeof topicKey]] = 
                    updatedTopics[topicKey][difficultyKey as keyof typeof updatedTopics[typeof topicKey]].map(q => ({
                      ...q,
                      completed: progress[q.id] || false
                    }));
                });
              });
              
              // Calculate completed questions count
              let completedCount = 0;
              Object.values(updatedTopics).forEach(difficultyGroups => {
                Object.values(difficultyGroups).forEach(questions => {
                  questions.forEach(q => {
                    if (q.completed) completedCount++;
                  });
                });
              });
              
              return {
                ...playlist,
                topics: updatedTopics,
                completedQuestions: completedCount
              };
            }
            return playlist;
          })
        );
        
        setPlaylists(updatedPlaylists);
      } catch (error) {
        // Reduce noisy logs when network is down; surface a single warning
        const message = String((error as any)?.message || error)
        const isNetwork = message.includes('Failed to fetch') || message.includes('ERR_NAME_NOT_RESOLVED')
        if (isNetwork) {
          // eslint-disable-next-line no-console
          console.warn('Network error while loading playlist progress. Showing local data.')
        } else {
          // eslint-disable-next-line no-console
          console.error('Error loading playlist progress:', error)
        }
        // Fallback to original playlists if there's an error
        setPlaylists(interviewPlaylists);
      }
    };
    
    loadPlaylistsWithProgress();
  }, []);

  // Load study plans with completion status from Supabase
  useEffect(() => {
    const loadStudyPlansWithProgress = async () => {
      try {
        const updatedStudyPlans = await Promise.all(
          studyPlans.map(async (plan) => {
            const progress = await loadStudyPlanProgress(plan.id);
            
            if (Object.keys(progress).length > 0) {
              // Update questions with saved completion status
              const updatedTopics = plan.topics.map(topic => ({
                ...topic,
                questions: topic.questions.map(q => ({
                  ...q,
                  completed: progress[q.id] || false
                }))
              }));
              
              // Calculate completed questions count
              const completedCount = updatedTopics.reduce((total, topic) => 
                total + topic.questions.filter(q => q.completed).length, 0
              );
              
              return {
                ...plan,
                topics: updatedTopics,
                completedQuestions: completedCount
              };
            }
            return plan;
          })
        );
        
        setStudyPlansWithProgress(updatedStudyPlans);
      } catch (error) {
        const message = String((error as any)?.message || error)
        const isNetwork = message.includes('Failed to fetch') || message.includes('ERR_NAME_NOT_RESOLVED')
        if (isNetwork) {
          // eslint-disable-next-line no-console
          console.warn('Network error while loading study plan progress. Showing local data.')
        } else {
          // eslint-disable-next-line no-console
          console.error('Error loading study plan progress:', error)
        }
        setStudyPlansWithProgress(studyPlans); // Fallback
      }
    };
    
    loadStudyPlansWithProgress();
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        navigate("/", { replace: true });
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  // Learning Section - Study Plans (Sorted from Beginner to Advanced)
  const studyPlans: StudyPlan[] = useMemo(() => {
    const get = (topicName: string): Question[] => parsedTopicToQuestions[topicName] ? [...parsedTopicToQuestions[topicName]] : [];

    const arraysQuestions = get("Arrays");
    const stringsQuestions = get("String");
    const stacksQuestions = get("Stack");
    const twoPointerQuestions = get("Two Pointer");
    const binarySearchQuestions = get("Binary Search");
    const linkedListQuestions = get("Linked List");
    const binaryTreeQuestions = get("Binary Tree");
    const bstQuestions = get("BST");
    const dpQuestions = get("DP");
    const graphQuestions = get("Graph");
    const greedyQuestions = get("Greedy");
    const recursionQuestions = get("Recursion");
    const treesCombined = [...binaryTreeQuestions, ...bstQuestions];
    const greedyBacktrackingCombined = [...greedyQuestions, ...recursionQuestions];

    const buildPlan = (
      id: string,
      title: string,
      description: string,
      difficulty: "Beginner" | "Intermediate" | "Advanced",
      estimatedTime: string,
      topicId: string,
      topicName: string,
      questions: Question[]
    ): StudyPlan => ({
      id,
      title,
      description,
      difficulty,
      estimatedTime,
      topics: [{ id: topicId, name: topicName, completed: false, questions }],
      totalQuestions: questions.length,
      completedQuestions: 0,
    });

    return [
      buildPlan("arrays-mastery", "Arrays Mastery", "Master array manipulation, searching, and optimization techniques", "Beginner", "3 weeks", "arrays-basic", "Array Fundamentals", arraysQuestions),
      buildPlan("strings-mastery", "Strings Mastery", "Master string manipulation, pattern matching, and text processing", "Beginner", "3 weeks", "strings-basic", "String Fundamentals", stringsQuestions),
      buildPlan("stacks-queues-mastery", "Stacks & Queues Mastery", "Master stack and queue operations, monotonic stacks, and queue-based algorithms", "Intermediate", "2 weeks", "stacks-queues-basic", "Stacks & Queues Fundamentals", stacksQuestions),
      buildPlan("sorting-searching-mastery", "Sorting & Searching Mastery", "Master sorting algorithms, binary search, and search optimization techniques", "Intermediate", "3 weeks", "sorting-searching-basic", "Sorting & Searching Fundamentals", binarySearchQuestions),
      buildPlan("two-pointers-sliding-window-mastery", "Two Pointers & Sliding Window Mastery", "Master two pointers technique, sliding window, and prefix/suffix sums", "Intermediate", "3 weeks", "two-pointers-sliding-window-basic", "Two Pointers & Sliding Window Fundamentals", twoPointerQuestions),
      buildPlan("linked-lists-mastery", "Linked Lists Mastery", "Master linked list operations, traversal, and advanced techniques", "Intermediate", "2 weeks", "linked-lists-basic", "Linked List Fundamentals", linkedListQuestions),
      buildPlan("trees-mastery", "Trees Mastery", "Master tree traversal, binary search trees, and advanced tree algorithms", "Intermediate", "3 weeks", "trees-basic", "Tree Fundamentals", treesCombined),
      buildPlan("dynamic-programming-mastery", "Dynamic Programming Mastery", "Master DP patterns, memoization, and optimization techniques", "Advanced", "4 weeks", "dp-basic", "Dynamic Programming Fundamentals", dpQuestions),
      buildPlan("graphs-mastery", "Graphs Mastery", "Master graph traversal, shortest paths, and advanced graph algorithms", "Advanced", "3 weeks", "graphs-basic", "Graph Fundamentals", graphQuestions),
      buildPlan("greedy-backtracking-mastery", "Greedy & Backtracking Mastery", "Master greedy algorithms, backtracking, and recursive problem solving", "Advanced", "3 weeks", "greedy-backtracking-basic", "Greedy & Backtracking Fundamentals", greedyBacktrackingCombined),
    ];
  }, [parsedTopicToQuestions]);

  // Practice Section - Interview Playlists
  const interviewPlaylists: Playlist[] = [
    {
      id: "interview-101",
      title: "Interview 101",
      description: "101 most frequently asked coding interview questions from top companies",
      totalQuestions: 101,
      completedQuestions: 0,
      topics: {
        "Arrays": {
          Easy: [
            { id: "1", title: "Two Sum", difficulty: "Easy", topic: "Arrays", leetcodeUrl: "https://leetcode.com/problems/two-sum", completed: false },
            { id: "121", title: "Best Time to Buy and Sell Stock", difficulty: "Easy", topic: "Arrays", leetcodeUrl: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock", completed: false },
            { id: "20", title: "Valid Parentheses", difficulty: "Easy", topic: "Arrays", leetcodeUrl: "https://leetcode.com/problems/valid-parentheses", completed: false },
            { id: "14", title: "Longest Common Prefix", difficulty: "Easy", topic: "Arrays", leetcodeUrl: "https://leetcode.com/problems/longest-common-prefix", completed: false },
            { id: "136", title: "Single Number", difficulty: "Easy", topic: "Arrays", leetcodeUrl: "https://leetcode.com/problems/single-number", completed: false },
            { id: "268", title: "Missing Number", difficulty: "Easy", topic: "Arrays", leetcodeUrl: "https://leetcode.com/problems/missing-number", completed: false },
            { id: "217", title: "Contains Duplicate", difficulty: "Easy", topic: "Arrays", leetcodeUrl: "https://leetcode.com/problems/contains-duplicate", completed: false },
            { id: "219", title: "Contains Duplicate II", difficulty: "Easy", topic: "Arrays", leetcodeUrl: "https://leetcode.com/problems/contains-duplicate-ii", completed: false },
            { id: "242", title: "Valid Anagram", difficulty: "Easy", topic: "Arrays", leetcodeUrl: "https://leetcode.com/problems/valid-anagram", completed: false },
            { id: "205", title: "Isomorphic Strings", difficulty: "Easy", topic: "Arrays", leetcodeUrl: "https://leetcode.com/problems/isomorphic-strings", completed: false }
          ],
          Medium: [
            { id: "3", title: "Longest Substring Without Repeating Characters", difficulty: "Medium", topic: "Arrays", leetcodeUrl: "https://leetcode.com/problems/longest-substring-without-repeating-characters", completed: false },
            { id: "15", title: "3Sum", difficulty: "Medium", topic: "Arrays", leetcodeUrl: "https://leetcode.com/problems/3sum", completed: false },
            { id: "11", title: "Container With Most Water", difficulty: "Medium", topic: "Arrays", leetcodeUrl: "https://leetcode.com/problems/container-with-most-water", completed: false },
            { id: "42", title: "Trapping Rain Water", difficulty: "Medium", topic: "Arrays", leetcodeUrl: "https://leetcode.com/problems/trapping-rain-water", completed: false },
            { id: "49", title: "Group Anagrams", difficulty: "Medium", topic: "Arrays", leetcodeUrl: "https://leetcode.com/problems/group-anagrams", completed: false },
            { id: "56", title: "Merge Intervals", difficulty: "Medium", topic: "Arrays", leetcodeUrl: "https://leetcode.com/problems/merge-intervals", completed: false },
            { id: "33", title: "Search in Rotated Sorted Array", difficulty: "Medium", topic: "Arrays", leetcodeUrl: "https://leetcode.com/problems/search-in-rotated-sorted-array", completed: false },
            { id: "73", title: "Set Matrix Zeroes", difficulty: "Medium", topic: "Arrays", leetcodeUrl: "https://leetcode.com/problems/set-matrix-zeroes", completed: false },
            { id: "53", title: "Maximum Subarray", difficulty: "Medium", topic: "Arrays", leetcodeUrl: "https://leetcode.com/problems/maximum-subarray", completed: false },
            { id: "152", title: "Maximum Product Subarray", difficulty: "Medium", topic: "Arrays", leetcodeUrl: "https://leetcode.com/problems/maximum-product-subarray", completed: false }
          ],
          Hard: [
            { id: "4", title: "Median of Two Sorted Arrays", difficulty: "Hard", topic: "Arrays", leetcodeUrl: "https://leetcode.com/problems/median-of-two-sorted-arrays", completed: false },
            { id: "41", title: "First Missing Positive", difficulty: "Hard", topic: "Arrays", leetcodeUrl: "https://leetcode.com/problems/first-missing-positive", completed: false },
            { id: "128", title: "Longest Consecutive Sequence", difficulty: "Hard", topic: "Arrays", leetcodeUrl: "https://leetcode.com/problems/longest-consecutive-sequence", completed: false },
            { id: "287", title: "Find the Duplicate Number", difficulty: "Hard", topic: "Arrays", leetcodeUrl: "https://leetcode.com/problems/find-the-duplicate-number", completed: false },
            { id: "295", title: "Find Median from Data Stream", difficulty: "Hard", topic: "Arrays", leetcodeUrl: "https://leetcode.com/problems/find-median-from-data-stream", completed: false }
          ]
        },
        "Strings": {
          Easy: [
            { id: "125", title: "Valid Palindrome", difficulty: "Easy", topic: "Strings", leetcodeUrl: "https://leetcode.com/problems/valid-palindrome", completed: false },
            { id: "67", title: "Add Binary", difficulty: "Easy", topic: "Strings", leetcodeUrl: "https://leetcode.com/problems/add-binary", completed: false },
            { id: "28", title: "Find the Index of the First Occurrence in a String", difficulty: "Easy", topic: "Strings", leetcodeUrl: "https://leetcode.com/problems/find-the-index-of-the-first-occurrence-in-a-string", completed: false },
            { id: "58", title: "Length of Last Word", difficulty: "Easy", topic: "Strings", leetcodeUrl: "https://leetcode.com/problems/length-of-last-word", completed: false },
            { id: "266", title: "Palindrome Permutation", difficulty: "Easy", topic: "Strings", leetcodeUrl: "https://leetcode.com/problems/palindrome-permutation", completed: false }
          ],
          Medium: [
            { id: "5", title: "Longest Palindromic Substring", difficulty: "Medium", topic: "Strings", leetcodeUrl: "https://leetcode.com/problems/longest-palindromic-substring", completed: false },
            { id: "8", title: "String to Integer (atoi)", difficulty: "Medium", topic: "Strings", leetcodeUrl: "https://leetcode.com/problems/string-to-integer-atoi", completed: false },
            { id: "17", title: "Letter Combinations of a Phone Number", difficulty: "Medium", topic: "Strings", leetcodeUrl: "https://leetcode.com/problems/letter-combinations-of-a-phone-number", completed: false },
            { id: "22", title: "Generate Parentheses", difficulty: "Medium", topic: "Strings", leetcodeUrl: "https://leetcode.com/problems/generate-parentheses", completed: false },
            { id: "76", title: "Minimum Window Substring", difficulty: "Medium", topic: "Strings", leetcodeUrl: "https://leetcode.com/problems/minimum-window-substring", completed: false },
            { id: "93", title: "Restore IP Addresses", difficulty: "Medium", topic: "Strings", leetcodeUrl: "https://leetcode.com/problems/restore-ip-addresses", completed: false },
            { id: "91", title: "Decode Ways", difficulty: "Medium", topic: "Strings", leetcodeUrl: "https://leetcode.com/problems/decode-ways", completed: false },
            { id: "72", title: "Edit Distance", difficulty: "Medium", topic: "Strings", leetcodeUrl: "https://leetcode.com/problems/edit-distance", completed: false }
          ],
          Hard: [
            { id: "10", title: "Regular Expression Matching", difficulty: "Hard", topic: "Strings", leetcodeUrl: "https://leetcode.com/problems/regular-expression-matching", completed: false },
            { id: "44", title: "Wildcard Matching", difficulty: "Hard", topic: "Strings", leetcodeUrl: "https://leetcode.com/problems/wildcard-matching", completed: false },
            { id: "214", title: "Shortest Palindrome", difficulty: "Hard", topic: "Strings", leetcodeUrl: "https://leetcode.com/problems/shortest-palindrome", completed: false },
            { id: "87", title: "Scramble String", difficulty: "Hard", topic: "Strings", leetcodeUrl: "https://leetcode.com/problems/scramble-string", completed: false }
          ]
        },
        "Linked Lists": {
          Easy: [
            { id: "206", title: "Reverse Linked List", difficulty: "Easy", topic: "Linked Lists", leetcodeUrl: "https://leetcode.com/problems/reverse-linked-list", completed: false },
            { id: "21", title: "Merge Two Sorted Lists", difficulty: "Easy", topic: "Linked Lists", leetcodeUrl: "https://leetcode.com/problems/merge-two-sorted-lists", completed: false },
            { id: "83", title: "Remove Duplicates from Sorted List", difficulty: "Easy", topic: "Linked Lists", leetcodeUrl: "https://leetcode.com/problems/remove-duplicates-from-sorted-list", completed: false },
            { id: "141", title: "Linked List Cycle", difficulty: "Easy", topic: "Linked Lists", leetcodeUrl: "https://leetcode.com/problems/linked-list-cycle", completed: false },
            { id: "160", title: "Intersection of Two Linked Lists", difficulty: "Easy", topic: "Linked Lists", leetcodeUrl: "https://leetcode.com/problems/intersection-of-two-linked-lists", completed: false }
          ],
          Medium: [
            { id: "2", title: "Add Two Numbers", difficulty: "Medium", topic: "Linked Lists", leetcodeUrl: "https://leetcode.com/problems/add-two-numbers", completed: false },
            { id: "19", title: "Remove Nth Node From End of List", difficulty: "Medium", topic: "Linked Lists", leetcodeUrl: "https://leetcode.com/problems/remove-nth-node-from-end-of-list", completed: false },
            { id: "24", title: "Swap Nodes in Pairs", difficulty: "Medium", topic: "Linked Lists", leetcodeUrl: "https://leetcode.com/problems/swap-nodes-in-pairs", completed: false },
            { id: "138", title: "Copy List with Random Pointer", difficulty: "Medium", topic: "Linked Lists", leetcodeUrl: "https://leetcode.com/problems/copy-list-with-random-pointer", completed: false },
            { id: "92", title: "Reverse Linked List II", difficulty: "Medium", topic: "Linked Lists", leetcodeUrl: "https://leetcode.com/problems/reverse-linked-list-ii", completed: false },
            { id: "82", title: "Remove Duplicates from Sorted List II", difficulty: "Medium", topic: "Linked Lists", leetcodeUrl: "https://leetcode.com/problems/remove-duplicates-from-sorted-list-ii", completed: false },
            { id: "147", title: "Insertion Sort List", difficulty: "Medium", topic: "Linked Lists", leetcodeUrl: "https://leetcode.com/problems/insertion-sort-list", completed: false },
            { id: "86", title: "Partition List", difficulty: "Medium", topic: "Linked Lists", leetcodeUrl: "https://leetcode.com/problems/partition-list", completed: false }
          ],
          Hard: [
            { id: "23", title: "Merge k Sorted Lists", difficulty: "Hard", topic: "Linked Lists", leetcodeUrl: "https://leetcode.com/problems/merge-k-sorted-lists", completed: false },
            { id: "25", title: "Reverse Nodes in k-Group", difficulty: "Hard", topic: "Linked Lists", leetcodeUrl: "https://leetcode.com/problems/reverse-nodes-in-k-group", completed: false },
            { id: "146", title: "LRU Cache", difficulty: "Hard", topic: "Linked Lists", leetcodeUrl: "https://leetcode.com/problems/lru-cache", completed: false }
          ]
        },
        "Trees": {
          Easy: [
            { id: "100", title: "Same Tree", difficulty: "Easy", topic: "Trees", leetcodeUrl: "https://leetcode.com/problems/same-tree", completed: false },
            { id: "101", title: "Symmetric Tree", difficulty: "Easy", topic: "Trees", leetcodeUrl: "https://leetcode.com/problems/symmetric-tree", completed: false },
            { id: "104", title: "Maximum Depth of Binary Tree", difficulty: "Easy", topic: "Trees", leetcodeUrl: "https://leetcode.com/problems/maximum-depth-of-binary-tree", completed: false },
            { id: "108", title: "Convert Sorted Array to Binary Search Tree", difficulty: "Easy", topic: "Trees", leetcodeUrl: "https://leetcode.com/problems/convert-sorted-array-to-binary-search-tree", completed: false }
          ],
          Medium: [
            { id: "102", title: "Binary Tree Level Order Traversal", difficulty: "Medium", topic: "Trees", leetcodeUrl: "https://leetcode.com/problems/binary-tree-level-order-traversal", completed: false },
            { id: "103", title: "Binary Tree Zigzag Level Order Traversal", difficulty: "Medium", topic: "Trees", leetcodeUrl: "https://leetcode.com/problems/binary-tree-zigzag-level-order-traversal", completed: false },
            { id: "105", title: "Construct Binary Tree from Preorder and Inorder Traversal", difficulty: "Medium", topic: "Trees", leetcodeUrl: "https://leetcode.com/problems/construct-binary-tree-from-preorder-and-inorder-traversal", completed: false },
            { id: "98", title: "Validate Binary Search Tree", difficulty: "Medium", topic: "Trees", leetcodeUrl: "https://leetcode.com/problems/validate-binary-search-tree", completed: false },
            { id: "230", title: "Kth Smallest Element in a BST", difficulty: "Medium", topic: "Trees", leetcodeUrl: "https://leetcode.com/problems/kth-smallest-element-in-a-bst", completed: false },
            { id: "235", title: "Lowest Common Ancestor of a Binary Search Tree", difficulty: "Medium", topic: "Trees", leetcodeUrl: "https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-search-tree", completed: false },
            { id: "114", title: "Flatten Binary Tree to Linked List", difficulty: "Medium", topic: "Trees", leetcodeUrl: "https://leetcode.com/problems/flatten-binary-tree-to-linked-list", completed: false },
            { id: "199", title: "Binary Tree Right Side View", difficulty: "Medium", topic: "Trees", leetcodeUrl: "https://leetcode.com/problems/binary-tree-right-side-view", completed: false }
          ],
          Hard: [
            { id: "124", title: "Binary Tree Maximum Path Sum", difficulty: "Hard", topic: "Trees", leetcodeUrl: "https://leetcode.com/problems/binary-tree-maximum-path-sum", completed: false },
            { id: "297", title: "Serialize and Deserialize Binary Tree", difficulty: "Hard", topic: "Trees", leetcodeUrl: "https://leetcode.com/problems/serialize-and-deserialize-binary-tree", completed: false },
            { id: "99", title: "Recover Binary Search Tree", difficulty: "Hard", topic: "Trees", leetcodeUrl: "https://leetcode.com/problems/recover-binary-search-tree", completed: false }
          ]
        },
        "Dynamic Programming": {
          Easy: [
            { id: "70", title: "Climbing Stairs", difficulty: "Easy", topic: "Dynamic Programming", leetcodeUrl: "https://leetcode.com/problems/climbing-stairs", completed: false },
            { id: "198", title: "House Robber", difficulty: "Easy", topic: "Dynamic Programming", leetcodeUrl: "https://leetcode.com/problems/house-robber", completed: false },
            { id: "303", title: "Range Sum Query - Immutable", difficulty: "Easy", topic: "Dynamic Programming", leetcodeUrl: "https://leetcode.com/problems/range-sum-query-immutable", completed: false }
          ],
          Medium: [
            { id: "64", title: "Minimum Path Sum", difficulty: "Medium", topic: "Dynamic Programming", leetcodeUrl: "https://leetcode.com/problems/minimum-path-sum", completed: false },
            { id: "62", title: "Unique Paths", difficulty: "Medium", topic: "Dynamic Programming", leetcodeUrl: "https://leetcode.com/problems/unique-paths", completed: false },
            { id: "63", title: "Unique Paths II", difficulty: "Medium", topic: "Dynamic Programming", leetcodeUrl: "https://leetcode.com/problems/unique-paths-ii", completed: false },
            { id: "139", title: "Word Break", difficulty: "Medium", topic: "Dynamic Programming", leetcodeUrl: "https://leetcode.com/problems/word-break", completed: false },
            { id: "322", title: "Coin Change", difficulty: "Medium", topic: "Dynamic Programming", leetcodeUrl: "https://leetcode.com/problems/coin-change", completed: false },
            { id: "300", title: "Longest Increasing Subsequence", difficulty: "Medium", topic: "Dynamic Programming", leetcodeUrl: "https://leetcode.com/problems/longest-increasing-subsequence", completed: false },
            { id: "279", title: "Perfect Squares", difficulty: "Medium", topic: "Dynamic Programming", leetcodeUrl: "https://leetcode.com/problems/perfect-squares", completed: false },
            { id: "221", title: "Maximal Square", difficulty: "Medium", topic: "Dynamic Programming", leetcodeUrl: "https://leetcode.com/problems/maximal-square", completed: false }
          ],
          Hard: [
            { id: "32", title: "Longest Valid Parentheses", difficulty: "Hard", topic: "Dynamic Programming", leetcodeUrl: "https://leetcode.com/problems/longest-valid-parentheses", completed: false },
            { id: "312", title: "Burst Balloons", difficulty: "Hard", topic: "Dynamic Programming", leetcodeUrl: "https://leetcode.com/problems/burst-balloons", completed: false },
            { id: "174", title: "Dungeon Game", difficulty: "Hard", topic: "Dynamic Programming", leetcodeUrl: "https://leetcode.com/problems/dungeon-game", completed: false }
          ]
        },
        "Graphs": {
          Easy: [
            { id: "200", title: "Number of Islands", difficulty: "Easy", topic: "Graphs", leetcodeUrl: "https://leetcode.com/problems/number-of-islands", completed: false },
            { id: "133", title: "Clone Graph", difficulty: "Easy", topic: "Graphs", leetcodeUrl: "https://leetcode.com/problems/clone-graph", completed: false },
            { id: "207", title: "Course Schedule", difficulty: "Easy", topic: "Graphs", leetcodeUrl: "https://leetcode.com/problems/course-schedule", completed: false }
          ],
          Medium: [
            { id: "210", title: "Course Schedule II", difficulty: "Medium", topic: "Graphs", leetcodeUrl: "https://leetcode.com/problems/course-schedule-ii", completed: false },
            { id: "261", title: "Graph Valid Tree", difficulty: "Medium", topic: "Graphs", leetcodeUrl: "https://leetcode.com/problems/graph-valid-tree", completed: false },
            { id: "323", title: "Number of Connected Components in an Undirected Graph", difficulty: "Medium", topic: "Graphs", leetcodeUrl: "https://leetcode.com/problems/number-of-connected-components-in-an-undirected-graph", completed: false },
            { id: "269", title: "Alien Dictionary", difficulty: "Medium", topic: "Graphs", leetcodeUrl: "https://leetcode.com/problems/alien-dictionary", completed: false },
            { id: "286", title: "Walls and Gates", difficulty: "Medium", topic: "Graphs", leetcodeUrl: "https://leetcode.com/problems/walls-and-gates", completed: false }
          ],
          Hard: [
            { id: "212", title: "Word Search II", difficulty: "Hard", topic: "Graphs", leetcodeUrl: "https://leetcode.com/problems/word-search-ii", completed: false },
            { id: "305", title: "Number of Islands II", difficulty: "Hard", topic: "Graphs", leetcodeUrl: "https://leetcode.com/problems/number-of-islands-ii", completed: false },
            { id: "329", title: "Longest Increasing Path in a Matrix", difficulty: "Hard", topic: "Graphs", leetcodeUrl: "https://leetcode.com/problems/longest-increasing-path-in-a-matrix", completed: false }
          ]
        }
      }
    },
    {
      id: "interview-69",
      title: "Interview 69",
      description: "69 important interview questions for focused practice",
      totalQuestions: 69,
      completedQuestions: 0,
      topics: {
        "Arrays": {
          Easy: [
            { id: "1", title: "Two Sum", difficulty: "Easy", topic: "Arrays", leetcodeUrl: "https://leetcode.com/problems/two-sum", completed: false },
            { id: "121", title: "Best Time to Buy and Sell Stock", difficulty: "Easy", topic: "Arrays", leetcodeUrl: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock", completed: false },
            { id: "20", title: "Valid Parentheses", difficulty: "Easy", topic: "Arrays", leetcodeUrl: "https://leetcode.com/problems/valid-parentheses", completed: false },
            { id: "136", title: "Single Number", difficulty: "Easy", topic: "Arrays", leetcodeUrl: "https://leetcode.com/problems/single-number", completed: false },
            { id: "268", title: "Missing Number", difficulty: "Easy", topic: "Arrays", leetcodeUrl: "https://leetcode.com/problems/missing-number", completed: false }
          ],
          Medium: [
            { id: "3", title: "Longest Substring Without Repeating Characters", difficulty: "Medium", topic: "Arrays", leetcodeUrl: "https://leetcode.com/problems/longest-substring-without-repeating-characters", completed: false },
            { id: "15", title: "3Sum", difficulty: "Medium", topic: "Arrays", leetcodeUrl: "https://leetcode.com/problems/3sum", completed: false },
            { id: "11", title: "Container With Most Water", difficulty: "Medium", topic: "Arrays", leetcodeUrl: "https://leetcode.com/problems/container-with-most-water", completed: false },
            { id: "42", title: "Trapping Rain Water", difficulty: "Medium", topic: "Arrays", leetcodeUrl: "https://leetcode.com/problems/trapping-rain-water", completed: false },
            { id: "49", title: "Group Anagrams", difficulty: "Medium", topic: "Arrays", leetcodeUrl: "https://leetcode.com/problems/group-anagrams", completed: false },
            { id: "56", title: "Merge Intervals", difficulty: "Medium", topic: "Arrays", leetcodeUrl: "https://leetcode.com/problems/merge-intervals", completed: false },
            { id: "33", title: "Search in Rotated Sorted Array", difficulty: "Medium", topic: "Arrays", leetcodeUrl: "https://leetcode.com/problems/search-in-rotated-sorted-array", completed: false },
            { id: "53", title: "Maximum Subarray", difficulty: "Medium", topic: "Arrays", leetcodeUrl: "https://leetcode.com/problems/maximum-subarray", completed: false }
          ],
          Hard: [
            { id: "4", title: "Median of Two Sorted Arrays", difficulty: "Hard", topic: "Arrays", leetcodeUrl: "https://leetcode.com/problems/median-of-two-sorted-arrays", completed: false },
            { id: "41", title: "First Missing Positive", difficulty: "Hard", topic: "Arrays", leetcodeUrl: "https://leetcode.com/problems/first-missing-positive", completed: false },
            { id: "128", title: "Longest Consecutive Sequence", difficulty: "Hard", topic: "Arrays", leetcodeUrl: "https://leetcode.com/problems/longest-consecutive-sequence", completed: false }
          ]
        },
        "Strings": {
          Easy: [
            { id: "125", title: "Valid Palindrome", difficulty: "Easy", topic: "Strings", leetcodeUrl: "https://leetcode.com/problems/valid-palindrome", completed: false },
            { id: "67", title: "Add Binary", difficulty: "Easy", topic: "Strings", leetcodeUrl: "https://leetcode.com/problems/add-binary", completed: false }
          ],
          Medium: [
            { id: "5", title: "Longest Palindromic Substring", difficulty: "Medium", topic: "Strings", leetcodeUrl: "https://leetcode.com/problems/longest-palindromic-substring", completed: false },
            { id: "8", title: "String to Integer (atoi)", difficulty: "Medium", topic: "Strings", leetcodeUrl: "https://leetcode.com/problems/string-to-integer-atoi", completed: false },
            { id: "17", title: "Letter Combinations of a Phone Number", difficulty: "Medium", topic: "Strings", leetcodeUrl: "https://leetcode.com/problems/letter-combinations-of-a-phone-number", completed: false },
            { id: "22", title: "Generate Parentheses", difficulty: "Medium", topic: "Strings", leetcodeUrl: "https://leetcode.com/problems/generate-parentheses", completed: false },
            { id: "76", title: "Minimum Window Substring", difficulty: "Medium", topic: "Strings", leetcodeUrl: "https://leetcode.com/problems/minimum-window-substring", completed: false },
            { id: "91", title: "Decode Ways", difficulty: "Medium", topic: "Strings", leetcodeUrl: "https://leetcode.com/problems/decode-ways", completed: false }
          ],
          Hard: [
            { id: "10", title: "Regular Expression Matching", difficulty: "Hard", topic: "Strings", leetcodeUrl: "https://leetcode.com/problems/regular-expression-matching", completed: false },
            { id: "44", title: "Wildcard Matching", difficulty: "Hard", topic: "Strings", leetcodeUrl: "https://leetcode.com/problems/wildcard-matching", completed: false }
          ]
        },
        "Linked Lists": {
          Easy: [
            { id: "206", title: "Reverse Linked List", difficulty: "Easy", topic: "Linked Lists", leetcodeUrl: "https://leetcode.com/problems/reverse-linked-list", completed: false },
            { id: "21", title: "Merge Two Sorted Lists", difficulty: "Easy", topic: "Linked Lists", leetcodeUrl: "https://leetcode.com/problems/merge-two-sorted-lists", completed: false },
            { id: "141", title: "Linked List Cycle", difficulty: "Easy", topic: "Linked Lists", leetcodeUrl: "https://leetcode.com/problems/linked-list-cycle", completed: false }
          ],
          Medium: [
            { id: "2", title: "Add Two Numbers", difficulty: "Medium", topic: "Linked Lists", leetcodeUrl: "https://leetcode.com/problems/add-two-numbers", completed: false },
            { id: "19", title: "Remove Nth Node From End of List", difficulty: "Medium", topic: "Linked Lists", leetcodeUrl: "https://leetcode.com/problems/remove-nth-node-from-end-of-list", completed: false },
            { id: "24", title: "Swap Nodes in Pairs", difficulty: "Medium", topic: "Linked Lists", leetcodeUrl: "https://leetcode.com/problems/swap-nodes-in-pairs", completed: false },
            { id: "138", title: "Copy List with Random Pointer", difficulty: "Medium", topic: "Linked Lists", leetcodeUrl: "https://leetcode.com/problems/copy-list-with-random-pointer", completed: false },
            { id: "92", title: "Reverse Linked List II", difficulty: "Medium", topic: "Linked Lists", leetcodeUrl: "https://leetcode.com/problems/reverse-linked-list-ii", completed: false }
          ],
          Hard: [
            { id: "23", title: "Merge k Sorted Lists", difficulty: "Hard", topic: "Linked Lists", leetcodeUrl: "https://leetcode.com/problems/merge-k-sorted-lists", completed: false },
            { id: "25", title: "Reverse Nodes in k-Group", difficulty: "Hard", topic: "Linked Lists", leetcodeUrl: "https://leetcode.com/problems/reverse-nodes-in-k-group", completed: false }
          ]
        },
        "Trees": {
          Easy: [
            { id: "100", title: "Same Tree", difficulty: "Easy", topic: "Trees", leetcodeUrl: "https://leetcode.com/problems/same-tree", completed: false },
            { id: "101", title: "Symmetric Tree", difficulty: "Easy", topic: "Trees", leetcodeUrl: "https://leetcode.com/problems/symmetric-tree", completed: false },
            { id: "104", title: "Maximum Depth of Binary Tree", difficulty: "Easy", topic: "Trees", leetcodeUrl: "https://leetcode.com/problems/maximum-depth-of-binary-tree", completed: false },
            { id: "108", title: "Convert Sorted Array to Binary Search Tree", difficulty: "Easy", topic: "Trees", leetcodeUrl: "https://leetcode.com/problems/convert-sorted-array-to-binary-search-tree", completed: false }
          ],
          Medium: [
            { id: "102", title: "Binary Tree Level Order Traversal", difficulty: "Medium", topic: "Trees", leetcodeUrl: "https://leetcode.com/problems/binary-tree-level-order-traversal", completed: false },
            { id: "105", title: "Construct Binary Tree from Preorder and Inorder Traversal", difficulty: "Medium", topic: "Trees", leetcodeUrl: "https://leetcode.com/problems/construct-binary-tree-from-preorder-and-inorder-traversal", completed: false },
            { id: "98", title: "Validate Binary Search Tree", difficulty: "Medium", topic: "Trees", leetcodeUrl: "https://leetcode.com/problems/validate-binary-search-tree", completed: false },
            { id: "230", title: "Kth Smallest Element in a BST", difficulty: "Medium", topic: "Trees", leetcodeUrl: "https://leetcode.com/problems/kth-smallest-element-in-a-bst", completed: false },
            { id: "235", title: "Lowest Common Ancestor of a Binary Search Tree", difficulty: "Medium", topic: "Trees", leetcodeUrl: "https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-search-tree", completed: false },
            { id: "114", title: "Flatten Binary Tree to Linked List", difficulty: "Medium", topic: "Trees", leetcodeUrl: "https://leetcode.com/problems/flatten-binary-tree-to-linked-list", completed: false }
          ],
          Hard: [
            { id: "124", title: "Binary Tree Maximum Path Sum", difficulty: "Hard", topic: "Trees", leetcodeUrl: "https://leetcode.com/problems/binary-tree-maximum-path-sum", completed: false },
            { id: "297", title: "Serialize and Deserialize Binary Tree", difficulty: "Hard", topic: "Trees", leetcodeUrl: "https://leetcode.com/problems/serialize-and-deserialize-binary-tree", completed: false }
          ]
        },
        "Dynamic Programming": {
          Easy: [
            { id: "70", title: "Climbing Stairs", difficulty: "Easy", topic: "Dynamic Programming", leetcodeUrl: "https://leetcode.com/problems/climbing-stairs", completed: false },
            { id: "198", title: "House Robber", difficulty: "Easy", topic: "Dynamic Programming", leetcodeUrl: "https://leetcode.com/problems/house-robber", completed: false }
          ],
          Medium: [
            { id: "64", title: "Minimum Path Sum", difficulty: "Medium", topic: "Dynamic Programming", leetcodeUrl: "https://leetcode.com/problems/minimum-path-sum", completed: false },
            { id: "62", title: "Unique Paths", difficulty: "Medium", topic: "Dynamic Programming", leetcodeUrl: "https://leetcode.com/problems/unique-paths", completed: false },
            { id: "139", title: "Word Break", difficulty: "Medium", topic: "Dynamic Programming", leetcodeUrl: "https://leetcode.com/problems/word-break", completed: false },
            { id: "322", title: "Coin Change", difficulty: "Medium", topic: "Dynamic Programming", leetcodeUrl: "https://leetcode.com/problems/coin-change", completed: false },
            { id: "300", title: "Longest Increasing Subsequence", difficulty: "Medium", topic: "Dynamic Programming", leetcodeUrl: "https://leetcode.com/problems/longest-increasing-subsequence", completed: false },
            { id: "279", title: "Perfect Squares", difficulty: "Medium", topic: "Dynamic Programming", leetcodeUrl: "https://leetcode.com/problems/perfect-squares", completed: false }
          ],
          Hard: [
            { id: "32", title: "Longest Valid Parentheses", difficulty: "Hard", topic: "Dynamic Programming", leetcodeUrl: "https://leetcode.com/problems/longest-valid-parentheses", completed: false },
            { id: "312", title: "Burst Balloons", difficulty: "Hard", topic: "Dynamic Programming", leetcodeUrl: "https://leetcode.com/problems/burst-balloons", completed: false }
          ]
        },
        "Graphs": {
          Easy: [
            { id: "200", title: "Number of Islands", difficulty: "Easy", topic: "Graphs", leetcodeUrl: "https://leetcode.com/problems/number-of-islands", completed: false },
            { id: "133", title: "Clone Graph", difficulty: "Easy", topic: "Graphs", leetcodeUrl: "https://leetcode.com/problems/clone-graph", completed: false }
          ],
          Medium: [
            { id: "210", title: "Course Schedule II", difficulty: "Medium", topic: "Graphs", leetcodeUrl: "https://leetcode.com/problems/course-schedule-ii", completed: false },
            { id: "261", title: "Graph Valid Tree", difficulty: "Medium", topic: "Graphs", leetcodeUrl: "https://leetcode.com/problems/graph-valid-tree", completed: false },
            { id: "323", title: "Number of Connected Components in an Undirected Graph", difficulty: "Medium", topic: "Graphs", leetcodeUrl: "https://leetcode.com/problems/number-of-connected-components-in-an-undirected-graph", completed: false },
            { id: "269", title: "Alien Dictionary", difficulty: "Medium", topic: "Graphs", leetcodeUrl: "https://leetcode.com/problems/alien-dictionary", completed: false }
          ],
          Hard: [
            { id: "212", title: "Word Search II", difficulty: "Hard", topic: "Graphs", leetcodeUrl: "https://leetcode.com/problems/word-search-ii", completed: false },
            { id: "305", title: "Number of Islands II", difficulty: "Hard", topic: "Graphs", leetcodeUrl: "https://leetcode.com/problems/number-of-islands-ii", completed: false }
          ]
        }
      }
    }
  ];

  const filteredPlans = (studyPlansWithProgress.length > 0 ? studyPlansWithProgress : studyPlans).filter(plan => {
    const matchesSearch = plan.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         plan.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Fix category matching logic
    let matchesCategory = true;
    if (selectedCategory !== "all") {
      switch (selectedCategory) {
        case "arrays":
          matchesCategory = plan.id === "arrays-mastery";
          break;
        case "strings":
          matchesCategory = plan.id === "strings-mastery";
          break;
        case "stacks-queues":
          matchesCategory = plan.id === "stacks-queues-mastery";
          break;
        case "sorting-searching":
          matchesCategory = plan.id === "sorting-searching-mastery";
          break;
        case "two-pointers-sliding-window":
          matchesCategory = plan.id === "two-pointers-sliding-window-mastery";
          break;
        case "linked-lists":
          matchesCategory = plan.id === "linked-lists-mastery";
          break;
        case "trees":
          matchesCategory = plan.id === "trees-mastery";
          break;
        case "dynamic-programming":
          matchesCategory = plan.id === "dynamic-programming-mastery";
          break;
        case "graphs":
          matchesCategory = plan.id === "graphs-mastery";
          break;
        case "greedy-backtracking":
          matchesCategory = plan.id === "greedy-backtracking-mastery";
          break;
        default:
          matchesCategory = true;
      }
    }
    
    const matchesDifficulty = selectedDifficulty === "all" || plan.difficulty.toLowerCase() === selectedDifficulty;
    
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  const sortedPlans = [...filteredPlans].sort((a, b) => {
    switch (sortBy) {
      case "name":
        return a.title.localeCompare(b.title);
      case "difficulty":
        const difficultyOrder = { "Beginner": 1, "Intermediate": 2, "Advanced": 3 };
        return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
      case "progress":
        const progressA = (a.completedQuestions / a.totalQuestions) * 100;
        const progressB = (b.completedQuestions / b.totalQuestions) * 100;
        return progressB - progressA; // Sort by highest progress first
      case "questions":
        return a.totalQuestions - b.totalQuestions;
      default:
        return 0; // Default order (as defined in the array)
    }
  });

  // Filter and sort playlists
  const filteredPlaylists = (playlists.length > 0 ? playlists : interviewPlaylists).filter(playlist => {
    return playlist.title.toLowerCase().includes(playlistSearchQuery.toLowerCase()) ||
           playlist.description.toLowerCase().includes(playlistSearchQuery.toLowerCase());
  });

  const sortedPlaylists = [...filteredPlaylists].sort((a, b) => {
    switch (playlistSortBy) {
      case "name":
        return a.title.localeCompare(b.title);
      case "progress":
        const progressA = calculatePlaylistProgress(a);
        const progressB = calculatePlaylistProgress(b);
        return progressB - progressA; // Sort by highest progress first
      case "questions":
        return a.totalQuestions - b.totalQuestions;
      default:
        return 0; // Default order (as defined in the array)
    }
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy":
      case "Beginner": return "bg-green-100 text-green-800 border-green-200";
      case "Medium":
      case "Intermediate": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Hard":
      case "Advanced": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const handleStartPlan = (plan: StudyPlan) => {
    // Find the plan with updated progress data
    const updatedPlan = studyPlansWithProgress.find(p => p.id === plan.id) || plan;
    setSelectedPlan(updatedPlan);
  };

  const handleStartPlaylist = (playlist: Playlist) => {
    // Find the playlist with updated progress data
    const updatedPlaylist = playlists.find(p => p.id === playlist.id) || playlist;
    setSelectedPlaylist(updatedPlaylist);
  };

  const handleStudyPlanQuestionToggle = async (questionId: string, isCompleted: boolean) => {
    if (!selectedPlan) return;

    // Update the plan state
    const updatedPlan = { ...selectedPlan };
    updatedPlan.topics = updatedPlan.topics.map(topic => ({
      ...topic,
      questions: topic.questions.map(q => 
        q.id === questionId ? { ...q, completed: isCompleted } : q
      )
    }));
    
    // Recalculate completed questions count
    const completedCount = updatedPlan.topics.reduce((total, topic) => 
      total + topic.questions.filter(q => q.completed).length, 0
    );
    updatedPlan.completedQuestions = completedCount;
    
    setSelectedPlan(updatedPlan);
    
    // Update the study plans state
    setStudyPlansWithProgress(prevPlans => 
      prevPlans.map(p => 
        p.id === selectedPlan.id ? updatedPlan : p
      )
    );
    
    // Save progress to Supabase
    const saveSuccess = await saveStudyPlanProgress(selectedPlan.id, questionId, isCompleted);
    
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
      title: isCompleted ? "Question completed!" : "Question unmarked",
      description: isCompleted ? "Great progress! Keep going." : "Question marked as incomplete.",
    });
  };

  const handleQuestionToggle = async (questionId: string, isCompleted: boolean) => {
    if (!selectedPlaylist) return;

    // Update the playlist state
    const updatedPlaylist = { ...selectedPlaylist };
    const updatedTopics = { ...updatedPlaylist.topics };
    
    // Find and update the specific question
    Object.keys(updatedTopics).forEach(topicKey => {
      Object.keys(updatedTopics[topicKey]).forEach(difficultyKey => {
        const questions = updatedTopics[topicKey][difficultyKey as keyof typeof updatedTopics[typeof topicKey]];
        const questionIndex = questions.findIndex(q => q.id === questionId);
        if (questionIndex !== -1) {
          questions[questionIndex] = { ...questions[questionIndex], completed: isCompleted };
        }
      });
    });
    
    updatedPlaylist.topics = updatedTopics;
    
    // Recalculate completed questions count
    let completedCount = 0;
    Object.values(updatedTopics).forEach(difficultyGroups => {
      Object.values(difficultyGroups).forEach(questions => {
        questions.forEach(q => {
          if (q.completed) completedCount++;
        });
      });
    });
    updatedPlaylist.completedQuestions = completedCount;
    
    setSelectedPlaylist(updatedPlaylist);
    
    // Update the playlists state
    setPlaylists(prevPlaylists => 
      prevPlaylists.map(p => 
        p.id === selectedPlaylist.id ? updatedPlaylist : p
      )
    );
    
    // Save progress to Supabase
    const saveSuccess = await saveQuestionProgress(selectedPlaylist.id, questionId, isCompleted);
    
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
      title: isCompleted ? "Question completed!" : "Question unmarked",
      description: isCompleted ? "Great progress! Keep going." : "Question marked as incomplete.",
    });
  };

  const handleOpenLeetCode = (url: string) => {
    window.open(url, '_blank');
  };

  const handleGetHelp = async (question: Question) => {
    try {
      let slug = deriveSlugFromUrl(question.leetcodeUrl) || mapTitleToSlug(question.title);

      let html = '';
      let meta: any = {
        title: question.title,
        difficulty: question.difficulty,
        leetcodeUrl: question.leetcodeUrl,
        examples: '',
        tags: []
      };

      if (slug) {
        const full = await fetchLeetCodeQuestion(slug);
        html = full.content || '';
        meta = {
          title: full.title || question.title,
          difficulty: full.difficulty || question.difficulty,
          leetcodeUrl: question.leetcodeUrl,
          examples: full.exampleTestcases || '',
          tags: full.topicTags || []
        };
      }

      localStorage.setItem('prefilledQuestionHTML', html);
      localStorage.setItem('prefilledQuestionText', html ? stripHtml(html) : `Problem: ${question.title}\nURL: ${question.leetcodeUrl}`);
      localStorage.setItem('prefilledQuestionMeta', JSON.stringify(meta));

      // Optional: keep existing short text for compatibility
      localStorage.setItem(
        'prefilledQuestion',
        html ? stripHtml(html) : `I need help with this LeetCode problem:
Problem: ${question.title}
Difficulty: ${question.difficulty}
Topic: ${question.topic}
LeetCode URL: ${question.leetcodeUrl}`
      );
      localStorage.setItem('questionSource', `playlist-${selectedPlaylist?.id}-${question.id}`);

      navigate('/code-space');
    } catch (err) {
      // Fallback to current behavior on failure
      localStorage.setItem(
        'prefilledQuestion',
        `I need help with this LeetCode problem:
Problem: ${question.title}
Difficulty: ${question.difficulty}
Topic: ${question.topic}
LeetCode URL: ${question.leetcodeUrl}`
      );
      localStorage.setItem('questionSource', `playlist-${selectedPlaylist?.id}-${question.id}`);
      navigate('/code-space');
    }
  };

  const calculateTopicProgress = (questions: Question[]) => {
    const completed = questions.filter(q => q.completed).length;
    return questions.length > 0 ? (completed / questions.length) * 100 : 0;
  };

  const calculatePlaylistProgress = (playlist: Playlist) => {
    // Use the completedQuestions count if available, otherwise calculate
    if (playlist.completedQuestions !== undefined) {
      return playlist.totalQuestions > 0 ? (playlist.completedQuestions / playlist.totalQuestions) * 100 : 0;
    }
    
    let totalCompleted = 0;
    let totalQuestions = 0;
    
    Object.values(playlist.topics).forEach(difficultyGroups => {
      Object.values(difficultyGroups).forEach(questions => {
        questions.forEach(q => {
          totalQuestions++;
          if (q.completed) totalCompleted++;
        });
      });
    });
    
    return totalQuestions > 0 ? (totalCompleted / totalQuestions) * 100 : 0;
  };

  const categories = [
    { value: "all", label: "All Categories" },
    // Beginner Level
    { value: "arrays", label: "Arrays (Beginner)" },
    { value: "strings", label: "Strings (Beginner)" },
    // Intermediate Level
    { value: "stacks-queues", label: "Stacks & Queues (Intermediate)" },
    { value: "sorting-searching", label: "Sorting & Searching (Intermediate)" },
    { value: "two-pointers-sliding-window", label: "Two Pointers & Sliding Window (Intermediate)" },
    { value: "linked-lists", label: "Linked Lists (Intermediate)" },
    { value: "trees", label: "Trees (Intermediate)" },
    // Advanced Level
    { value: "dynamic-programming", label: "Dynamic Programming (Advanced)" },
    { value: "graphs", label: "Graphs (Advanced)" },
    { value: "greedy-backtracking", label: "Greedy & Backtracking (Advanced)" },
  ];

  const difficulties = [
    { value: "all", label: "All Levels" },
    { value: "beginner", label: "Beginner" },
    { value: "intermediate", label: "Intermediate" },
    { value: "advanced", label: "Advanced" },
  ];

  // If a plan is selected, show its topics and questions
  if (selectedPlan) {
    
    // Filter questions based on search and difficulty
    const filteredTopics = selectedPlan.topics.map(topic => ({
      ...topic,
      questions: topic.questions.filter(question => {
        const matchesSearch = question.title.toLowerCase().includes(questionSearchQuery.toLowerCase()) ||
                             question.topic.toLowerCase().includes(questionSearchQuery.toLowerCase());
        const matchesDifficulty = questionDifficultyFilter === "all" || 
                                 question.difficulty.toLowerCase() === questionDifficultyFilter;
        return matchesSearch && matchesDifficulty;
      })
    })).filter(topic => topic.questions.length > 0);

    return (
      <div className="min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <Button 
              variant="outline" 
              onClick={() => setSelectedPlan(null)}
              className="mb-4"
            >
              ← Back to Study Plans
            </Button>
            <h1 className="text-3xl font-bold mb-2">{selectedPlan.title}</h1>
            <p className="text-muted-foreground mb-4">{selectedPlan.description}</p>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <Badge className={getDifficultyColor(selectedPlan.difficulty)}>
                {selectedPlan.difficulty}
              </Badge>
              <span>•</span>
              <span>{selectedPlan.totalQuestions} questions</span>
              <span>•</span>
              <span>{selectedPlan.estimatedTime}</span>
            </div>
          </div>

          {/* Search and filter controls */}
          <div className="mb-6 space-y-4 sm:space-y-0 sm:flex sm:items-center sm:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search questions..."
                value={questionSearchQuery}
                onChange={(e) => setQuestionSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={questionDifficultyFilter} onValueChange={setQuestionDifficultyFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Difficulties</SelectItem>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-6">
            {filteredTopics.map((topic) => (
              <Card key={topic.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      {topic.name}
                    </div>
                    <Badge variant={topic.completed ? "default" : "outline"}>
                      {topic.completed ? "Completed" : "In Progress"}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {topic.questions.map((question) => (
                      <div 
                        key={question.id} 
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => handleOpenLeetCode(question.leetcodeUrl)}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStudyPlanQuestionToggle(question.id, !question.completed);
                            }}
                          >
                            {question.completed ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <Circle className="h-4 w-4 text-gray-400" />
                            )}
                          </Button>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`font-medium ${question.completed ? 'line-through text-muted-foreground' : ''}`}>
                                {question.title}
                              </span>
                              <Badge variant="outline" className={getDifficultyColor(question.difficulty)}>
                                {question.difficulty}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleGetHelp(question);
                            }}
                            className="flex items-center gap-1"
                          >
                            <HelpCircle className="h-3 w-3" />
                            Help
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenLeetCode(question.leetcodeUrl);
                            }}
                            className="flex items-center gap-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Open
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // If a playlist is selected, show its questions organized by topic and difficulty
  if (selectedPlaylist) {
    
    // Filter questions based on search and difficulty
    const filteredPlaylistTopics = Object.entries(selectedPlaylist.topics).map(([topicName, difficultyGroups]) => {
      const filteredDifficultyGroups = {
        Easy: difficultyGroups.Easy.filter(question => {
          const matchesSearch = question.title.toLowerCase().includes(playlistQuestionSearchQuery.toLowerCase()) ||
                               question.topic.toLowerCase().includes(playlistQuestionSearchQuery.toLowerCase());
          const matchesDifficulty = playlistQuestionDifficultyFilter === "all" || 
                                   playlistQuestionDifficultyFilter === "easy";
          return matchesSearch && matchesDifficulty;
        }),
        Medium: difficultyGroups.Medium.filter(question => {
          const matchesSearch = question.title.toLowerCase().includes(playlistQuestionSearchQuery.toLowerCase()) ||
                               question.topic.toLowerCase().includes(playlistQuestionSearchQuery.toLowerCase());
          const matchesDifficulty = playlistQuestionDifficultyFilter === "all" || 
                                   playlistQuestionDifficultyFilter === "medium";
          return matchesSearch && matchesDifficulty;
        }),
        Hard: difficultyGroups.Hard.filter(question => {
          const matchesSearch = question.title.toLowerCase().includes(playlistQuestionSearchQuery.toLowerCase()) ||
                               question.topic.toLowerCase().includes(playlistQuestionSearchQuery.toLowerCase());
          const matchesDifficulty = playlistQuestionDifficultyFilter === "all" || 
                                   playlistQuestionDifficultyFilter === "hard";
          return matchesSearch && matchesDifficulty;
        })
      };
      
      return [topicName, filteredDifficultyGroups] as [string, { Easy: Question[]; Medium: Question[]; Hard: Question[] }];
    }).filter(([topicName, difficultyGroups]) => 
      difficultyGroups.Easy.length > 0 || difficultyGroups.Medium.length > 0 || difficultyGroups.Hard.length > 0
    );

    return (
      <div className="min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <Button 
              variant="outline" 
              onClick={() => setSelectedPlaylist(null)}
              className="mb-4"
            >
              ← Back to Practice Section
            </Button>
            <h1 className="text-3xl font-bold mb-2">{selectedPlaylist.title}</h1>
            <p className="text-muted-foreground mb-4">{selectedPlaylist.description}</p>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
              <span>{selectedPlaylist.totalQuestions} questions</span>
              <span>•</span>
              <span>Overall Progress</span>
              <Progress value={calculatePlaylistProgress(selectedPlaylist)} className="w-32 h-2" />
              <span>{Math.round(calculatePlaylistProgress(selectedPlaylist))}%</span>
            </div>
          </div>

          {/* Search and filter controls */}
          <div className="mb-6 space-y-4 sm:space-y-0 sm:flex sm:items-center sm:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search questions..."
                value={playlistQuestionSearchQuery}
                onChange={(e) => setPlaylistQuestionSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={playlistQuestionDifficultyFilter} onValueChange={setPlaylistQuestionDifficultyFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Difficulties</SelectItem>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-8">
            {filteredPlaylistTopics.map(([topicName, difficultyGroups]) => (
              <Card key={topicName}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      {topicName}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Topic Progress</span>
                      <Progress 
                        value={calculateTopicProgress([
                          ...difficultyGroups.Easy,
                          ...difficultyGroups.Medium,
                          ...difficultyGroups.Hard
                        ])} 
                        className="w-24 h-2" 
                      />
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {(['Easy', 'Medium', 'Hard'] as const).map((difficulty) => {
                      const questions = difficultyGroups[difficulty];
                      if (questions.length === 0) return null;
                      
                      return (
                        <div key={difficulty}>
                          <div className="flex items-center gap-2 mb-3">
                            <Badge className={getDifficultyColor(difficulty)}>
                              {difficulty}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {questions.length} questions
                            </span>
                          </div>
                          <div className="space-y-2">
                            {questions.map((question) => (
                              <div 
                                key={question.id} 
                                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                                onClick={() => handleOpenLeetCode(question.leetcodeUrl)}
                              >
                                <div className="flex items-center gap-3 flex-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleQuestionToggle(question.id, !question.completed);
                                    }}
                                  >
                                    {question.completed ? (
                                      <CheckCircle className="h-4 w-4 text-green-600" />
                                    ) : (
                                      <Circle className="h-4 w-4 text-gray-400" />
                                    )}
                                  </Button>
                                  <div className="flex-1">
                                    <span className={`font-medium ${question.completed ? 'line-through text-muted-foreground' : ''}`}>
                                      {question.title}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleGetHelp(question);
                                    }}
                                    className="flex items-center gap-1"
                                  >
                                    <HelpCircle className="h-3 w-3" />
                                    Help
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenLeetCode(question.leetcodeUrl);
                                    }}
                                    className="flex items-center gap-1"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                    Open
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Main view with tabs
  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Study Plans</h1>
          <p className="text-muted-foreground">
            Choose between structured learning paths or curated interview practice.
          </p>
        </div>



        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="learning" className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              Learning Section
            </TabsTrigger>
            <TabsTrigger value="practice" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Practice Section
            </TabsTrigger>
          </TabsList>

          {/* Learning Section */}
          <TabsContent value="learning" className="space-y-6">
            <div className="space-y-4 sm:space-y-0 sm:flex sm:items-center sm:gap-4">
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
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default Order</SelectItem>
                  <SelectItem value="name">Sort by Name</SelectItem>
                  <SelectItem value="difficulty">Sort by Difficulty</SelectItem>
                  <SelectItem value="progress">Sort by Progress</SelectItem>
                  <SelectItem value="questions">Sort by Question Count</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedPlans.map((plan) => {
                const progressPercentage = (plan.completedQuestions / plan.totalQuestions) * 100;
                
                return (
                  <Card key={plan.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between mb-2">
                        <Badge variant="outline" className={getDifficultyColor(plan.difficulty)}>
                          {plan.difficulty}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg leading-tight">{plan.title}</CardTitle>
                      <CardDescription className="text-sm">
                        {plan.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-medium">
                              {plan.completedQuestions}/{plan.totalQuestions} questions
                            </span>
                          </div>
                          <Progress value={progressPercentage} className="h-2" />
                        </div>
                        
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

                        <Button 
                          className="w-full" 
                          onClick={() => handleStartPlan(plan)}
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
          </TabsContent>

          {/* Practice Section */}
          <TabsContent value="practice" className="space-y-6">
            <div className="space-y-4 sm:space-y-0 sm:flex sm:items-center sm:gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search practice playlists..."
                  value={playlistSearchQuery}
                  onChange={(e) => setPlaylistSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={playlistSortBy} onValueChange={setPlaylistSortBy}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default Order</SelectItem>
                  <SelectItem value="name">Sort by Name</SelectItem>
                  <SelectItem value="progress">Sort by Progress</SelectItem>
                  <SelectItem value="questions">Sort by Question Count</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {sortedPlaylists.map((playlist) => {
                const progressPercentage = calculatePlaylistProgress(playlist);
                
                return (
                  <Card key={playlist.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between mb-2">
                        <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                          Practice
                        </Badge>
                      </div>
                      <CardTitle className="text-lg leading-tight">{playlist.title}</CardTitle>
                      <CardDescription className="text-sm">
                        {playlist.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-medium">
                              {playlist.completedQuestions}/{playlist.totalQuestions} questions
                            </span>
                          </div>
                          <Progress value={progressPercentage} className="h-2" />
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3" />
                            {playlist.totalQuestions} questions
                          </div>
                          <div className="flex items-center gap-1">
                            <BarChart3 className="h-3 w-3" />
                            Topic-wise
                          </div>
                        </div>

                        <Button 
                          className="w-full" 
                          onClick={() => handleStartPlaylist(playlist)}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Start Practice
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default StudyPlans;