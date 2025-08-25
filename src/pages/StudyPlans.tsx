import { useState, useEffect } from "react";
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
import { auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

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
  const navigate = useNavigate();
  const { toast } = useToast();

  // Load playlists with completion status from localStorage
  useEffect(() => {
    const loadPlaylistsWithProgress = () => {
      const updatedPlaylists = interviewPlaylists.map(playlist => {
        const savedProgress = localStorage.getItem(`playlist-${playlist.id}`);
        if (savedProgress) {
          const progress = JSON.parse(savedProgress);
          
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
      });
      
      setPlaylists(updatedPlaylists);
    };
    
    loadPlaylistsWithProgress();
  }, []);

  // Load study plans with completion status from localStorage
  useEffect(() => {
    const loadStudyPlansWithProgress = () => {
      const updatedStudyPlans = studyPlans.map(plan => {
        const savedProgress = localStorage.getItem(`study-plan-${plan.id}`);
        if (savedProgress) {
          const progress = JSON.parse(savedProgress);
          
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
      });
      
      setStudyPlansWithProgress(updatedStudyPlans);
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

  // Learning Section - Study Plans
  const studyPlans: StudyPlan[] = [
    {
      id: "javascript-fundamentals",
      title: "JavaScript Fundamentals",
      description: "Master the core concepts of JavaScript programming",
      difficulty: "Beginner",
      estimatedTime: "2 weeks",
      totalQuestions: 25,
      completedQuestions: 0,
      topics: [
        {
          id: "variables",
          name: "Variables & Data Types",
          completed: false,
          questions: [
            { id: "1", title: "Variable Declaration and Scope", difficulty: "Easy", topic: "Variables", leetcodeUrl: "https://leetcode.com/problems/two-sum", completed: false },
            { id: "2", title: "Data Types and Type Coercion", difficulty: "Easy", topic: "Variables", leetcodeUrl: "https://leetcode.com/problems/valid-parentheses", completed: false },
            { id: "3", title: "Hoisting and Temporal Dead Zone", difficulty: "Medium", topic: "Variables", leetcodeUrl: "https://leetcode.com/problems/longest-substring-without-repeating-characters", completed: false }
          ]
        },
        {
          id: "functions",
          name: "Functions & Scope",
          completed: false,
          questions: [
            { id: "4", title: "Function Types and Usage", difficulty: "Easy", topic: "Functions", leetcodeUrl: "https://leetcode.com/problems/reverse-linked-list", completed: false },
            { id: "5", title: "Closures and Lexical Scope", difficulty: "Medium", topic: "Functions", leetcodeUrl: "https://leetcode.com/problems/merge-two-sorted-lists", completed: false },
            { id: "6", title: "Arrow Functions vs Regular Functions", difficulty: "Medium", topic: "Functions", leetcodeUrl: "https://leetcode.com/problems/3sum", completed: false }
          ]
        }
      ]
    },
    {
      id: "data-structures",
      title: "Data Structures & Algorithms",
      description: "Essential DSA concepts for technical interviews",
      difficulty: "Advanced",
      estimatedTime: "6 weeks",
      totalQuestions: 50,
      completedQuestions: 0,
      topics: [
        {
          id: "arrays",
          name: "Arrays & Strings",
          completed: false,
          questions: [
            { id: "1", title: "Two Sum", difficulty: "Easy", topic: "Arrays", leetcodeUrl: "https://leetcode.com/problems/two-sum", completed: false },
            { id: "2", title: "Longest Substring Without Repeating Characters", difficulty: "Medium", topic: "Strings", leetcodeUrl: "https://leetcode.com/problems/longest-substring-without-repeating-characters", completed: false },
            { id: "3", title: "Trapping Rain Water", difficulty: "Hard", topic: "Arrays", leetcodeUrl: "https://leetcode.com/problems/trapping-rain-water", completed: false }
          ]
        },
        {
          id: "linked-lists",
          name: "Linked Lists",
          completed: false,
          questions: [
            { id: "4", title: "Reverse Linked List", difficulty: "Easy", topic: "Linked Lists", leetcodeUrl: "https://leetcode.com/problems/reverse-linked-list", completed: false },
            { id: "5", title: "Merge Two Sorted Lists", difficulty: "Easy", topic: "Linked Lists", leetcodeUrl: "https://leetcode.com/problems/merge-two-sorted-lists", completed: false },
            { id: "6", title: "Merge k Sorted Lists", difficulty: "Hard", topic: "Linked Lists", leetcodeUrl: "https://leetcode.com/problems/merge-k-sorted-lists", completed: false }
          ]
        }
      ]
    }
  ];

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

  const filteredPlans = studyPlans.filter(plan => {
    const matchesSearch = plan.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         plan.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || plan.id.includes(selectedCategory);
    const matchesDifficulty = selectedDifficulty === "all" || plan.difficulty.toLowerCase() === selectedDifficulty;
    
    return matchesSearch && matchesCategory && matchesDifficulty;
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

  const handleStudyPlanQuestionToggle = (questionId: string, isCompleted: boolean) => {
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
    
    // Save progress to localStorage
    const progress = {};
    updatedPlan.topics.forEach(topic => {
      topic.questions.forEach(q => {
        progress[q.id] = q.completed;
      });
    });
    localStorage.setItem(`study-plan-${selectedPlan.id}`, JSON.stringify(progress));
    
    // Show toast for feedback
    toast({
      title: isCompleted ? "Question completed!" : "Question unmarked",
      description: isCompleted ? "Great progress! Keep going." : "Question marked as incomplete.",
    });
  };

  const handleQuestionToggle = (questionId: string, isCompleted: boolean) => {
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
    
    // Save progress to localStorage
    const progress = {};
    Object.values(updatedTopics).forEach(difficultyGroups => {
      Object.values(difficultyGroups).forEach(questions => {
        questions.forEach(q => {
          progress[q.id] = q.completed;
        });
      });
    });
    localStorage.setItem(`playlist-${selectedPlaylist.id}`, JSON.stringify(progress));
    
    // Show toast for feedback
    toast({
      title: isCompleted ? "Question completed!" : "Question unmarked",
      description: isCompleted ? "Great progress! Keep going." : "Question marked as incomplete.",
    });
  };

  const handleOpenLeetCode = (url: string) => {
    window.open(url, '_blank');
  };

  const handleGetHelp = (question: Question) => {
    const questionText = `I need help with this LeetCode problem:

Problem: ${question.title}
Difficulty: ${question.difficulty}
Topic: ${question.topic}
LeetCode URL: ${question.leetcodeUrl}

Can you help me understand the problem and provide a solution approach?`;

    localStorage.setItem('prefilledQuestion', questionText);
    localStorage.setItem('questionSource', `playlist-${selectedPlaylist?.id}-${question.id}`);
    navigate('/code-space');
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
    { value: "javascript", label: "JavaScript" },
    { value: "data-structures", label: "Data Structures" },
  ];

  const difficulties = [
    { value: "all", label: "All Levels" },
    { value: "beginner", label: "Beginner" },
    { value: "intermediate", label: "Intermediate" },
    { value: "advanced", label: "Advanced" },
  ];

  // If a plan is selected, show its topics and questions
  if (selectedPlan) {
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

          <div className="space-y-6">
            {selectedPlan.topics.map((topic) => (
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
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStudyPlanQuestionToggle(question.id, !question.completed)}
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
                            onClick={() => handleGetHelp(question)}
                            className="flex items-center gap-1"
                          >
                            <HelpCircle className="h-3 w-3" />
                            Help
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenLeetCode(question.leetcodeUrl)}
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

          <div className="space-y-8">
            {Object.entries(selectedPlaylist.topics).map(([topicName, difficultyGroups]) => (
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
                                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                              >
                                <div className="flex items-center gap-3 flex-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleQuestionToggle(question.id, !question.completed)}
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
                                    onClick={() => handleGetHelp(question)}
                                    className="flex items-center gap-1"
                                  >
                                    <HelpCircle className="h-3 w-3" />
                                    Help
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleOpenLeetCode(question.leetcodeUrl)}
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(studyPlansWithProgress.length > 0 ? studyPlansWithProgress : filteredPlans).map((plan) => {
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(playlists.length > 0 ? playlists : interviewPlaylists).map((playlist) => {
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