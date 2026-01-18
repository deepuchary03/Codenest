const express = require("express");
const Groq = require("groq-sdk");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

// Initialize Groq AI
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Get Groq model helper
const getModel = () => {
  return "llama-3.3-70b-versatile"; // Fast, high-quality model
};

// ============================================
// 1️⃣ PREDEFINED ROADMAP GENERATOR
// ============================================
router.post("/roadmap", authMiddleware, async (req, res) => {
  try {
    // Support both old and new parameter names for backward compatibility
    const language = (
      req.body.language ||
      req.body.startLanguage ||
      ""
    ).toLowerCase();
    const goal = req.body.goal || "DSA Basics";
    const level = req.body.level || req.body.currentLevel || "Beginner";

    if (!language) {
      return res.status(400).json({ error: "Language is required" });
    }

    // Get predefined roadmap based on language and goal
    const roadmapData = getPredefinedRoadmap(language, goal, level);

    if (!roadmapData) {
      return res.status(400).json({
        error: "No roadmap available for this combination",
        availableLanguages: ["python", "java"],
        availableGoals: ["DSA Basics", "Web Development", "Data Science"],
      });
    }

    // Update user's learning goal
    req.user.learningGoal = goal;
    await req.user.save();

    res.json({
      success: true,
      data: roadmapData,
      predefined: true,
    });
  } catch (error) {
    console.error("Roadmap retrieval error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve roadmap",
    });
  }
});

// ============================================
// 2️⃣ ERROR EXPLAINER
// ============================================
router.post("/explain-error", authMiddleware, async (req, res) => {
  try {
    const { code, error, expectedOutput, topic, language } = req.body;

    if (!code || !error) {
      return res.status(400).json({ error: "Code and error are required" });
    }

    const model = getModel();

    const prompt = `You are an AI coding tutor helping a beginner understand their mistake.

CONTEXT:
- Topic: ${topic || "General Coding"}
- Language: ${language}
- Student's Code:
\`\`\`${language}
${code}
\`\`\`

- Error/Output: ${error}
- Expected Output: ${expectedOutput || "Not specified"}

YOUR TASK:
Explain why the code failed WITHOUT giving the solution.

RESPONSE FORMAT (JSON only):
{
  "mistake": "Clear explanation of what went wrong (2-3 sentences)",
  "concept": "Which concept from ${topic || "the topic"} needs revision",
  "hint": "A guiding hint to help them fix it (not the solution)",
  "example": "A simple related example to clarify the concept"
}

RULES:
- DO NOT provide the corrected code
- DO NOT give direct solutions
- Focus on understanding, not fixing
- Be encouraging and clear

Respond now:`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: model,
      temperature: 0.7,
      max_tokens: 1024,
    });

    const text = completion.choices[0]?.message?.content || "";
    const cleanText = text
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
    const explanation = JSON.parse(cleanText);

    // Award XP for using AI mentor
    req.user.addXP(5);
    req.user.skillMetrics.logic = Math.min(
      100,
      req.user.skillMetrics.logic + 1
    );
    await req.user.save();

    res.json({
      success: true,
      data: explanation,
    });
  } catch (error) {
    console.error("Groq error explanation error:", error);
    res.status(500).json({
      success: false,
      message: "Unable to generate error explanation",
      error: error.message,
    });
  }
});

// ============================================
// 3️⃣ MENTOR CHAT
// ============================================
router.post("/chat", authMiddleware, async (req, res) => {
  try {
    const { userMessage, topic, chatHistory, code, language } = req.body;

    if (!userMessage) {
      return res.status(400).json({ error: "Message is required" });
    }

    const model = getModel();

    // Build context from chat history
    let historyContext = "";
    if (chatHistory && chatHistory.length > 0) {
      historyContext = chatHistory
        .slice(-8)
        .map(
          (msg) =>
            `${msg.role === "user" ? "Student" : "Mentor"}: ${msg.content}`
        )
        .join("\n\n");
    }

    // Build code context if available
    let codeContext = "";
    if (code && code.trim()) {
      codeContext = `\n\nSTUDENT'S CURRENT CODE (${language}):\n\`\`\`${language}\n${code}\n\`\`\`\n`;
    }

    // Detect if this is a repeated question or frustration
    const isRepeated =
      chatHistory &&
      chatHistory.length >= 2 &&
      chatHistory
        .slice(-2)
        .some(
          (msg) =>
            msg.role === "user" &&
            msg.content
              .toLowerCase()
              .includes(userMessage.toLowerCase().substring(0, 20))
        );

    const prompt = `You are an AI mentor helping a beginner learn coding.

CURRENT TOPIC: ${topic || "General Programming"}
${codeContext}
RECENT CONVERSATION:
${historyContext || "This is the start of the conversation"}

STUDENT'S CURRENT MESSAGE: "${userMessage}"

${
  isRepeated
    ? "⚠️ NOTE: The student is asking a similar question again, which may indicate confusion or need for a different approach. Consider being more concrete and provide a small code snippet or clearer step-by-step guidance.\n"
    : ""
}

YOUR ROLE AS A MENTOR:
1. Help students learn by understanding, not just copying code
2. Provide explanations with examples when needed
3. Be adaptive - if a student is struggling, offer more concrete guidance
4. When they ask "how to write code for X", break it into steps with small examples
5. Check the conversation history - if they're asking again, they need a different approach

RESPONSE GUIDELINES:
✅ DO:
- Explain concepts with simple examples
- Show small code snippets (2-3 lines) to illustrate syntax
- Break problems into logical steps
- Provide structure/template when students are stuck
- If analyzing their code, point to specific lines and suggest fixes
- Vary your teaching approach based on their progress

❌ DON'T:
- Give complete working solutions
- Write their entire program for them
- Use the exact same response style repeatedly
- Ignore context from previous messages

EXAMPLE GOOD RESPONSES:
- For "how to find max of two numbers": Explain the logic (if a > b, then a is max), show the if-else structure, let them fill it in
- For "what's wrong with my code": Point to the specific line, explain the error, suggest what to change
- For repeated questions: Adjust your approach, maybe show a mini-example this time

Respond to the student now (conversational, helpful, adaptive):`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: getModel(),
      temperature: 0.8,
      max_tokens: 2048,
    });

    const text = completion.choices[0]?.message?.content || "";

    // Check if user is trying to get full solution
    const blockedPhrases = [
      "give.*code",
      "write.*solution",
      "full.*code",
      "complete.*code",
      "do.*for.*me",
    ];
    const isBlocked = blockedPhrases.some((phrase) =>
      new RegExp(phrase, "i").test(userMessage)
    );

    if (isBlocked && text.includes("```")) {
      return res.json({
        success: true,
        data: {
          response:
            "I understand you're looking for code, but my role is to help you learn by guiding you, not by giving you the full solution. Instead, let me help you understand the concept better. What specific part of the logic are you struggling with?",
        },
      });
    }

    res.json({
      success: true,
      data: {
        response: text,
      },
    });
  } catch (error) {
    console.error("Groq mentor chat error:", error);
    console.error("Error details:", error.stack);
    res.status(500).json({
      success: false,
      message: "Unable to generate response. Please try again.",
      error: error.message,
    });
  }
});

// ============================================
// 4️⃣ LESSON GENERATOR (PREDEFINED CONTENT)
// ============================================
router.post("/lesson", authMiddleware, async (req, res) => {
  try {
    const { topic, language } = req.body;

    if (!topic || !language) {
      return res.status(400).json({ error: "Topic and language are required" });
    }

    // Get predefined lesson content
    const lesson = getPredefinedLesson(topic, language);

    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: "Lesson not found for this topic",
        error: "No predefined content available",
      });
    }

    res.json({
      success: true,
      data: lesson,
    });
  } catch (error) {
    console.error("Lesson retrieval error:", error);
    res.status(500).json({
      success: false,
      message: "Unable to retrieve lesson",
      error: error.message,
    });
  }
});

// ============================================
// LEGACY ENDPOINTS (for backward compatibility)
// ============================================

// Analyze Code Complexity
router.post("/analyze-complexity", authMiddleware, async (req, res) => {
  try {
    const { code, language } = req.body;

    if (!code) {
      return res.status(400).json({ error: "Code is required" });
    }

    const model = getModel();

    const prompt = `Analyze the time and space complexity of this code. Provide ONLY a JSON response.

Language: ${language}
Code:
\`\`\`${language}
${code}
\`\`\`

Return JSON format:
{
  "timeComplexity": "O(n)",
  "spaceComplexity": "O(1)",
  "explanation": "Brief explanation of why",
  "optimizationTips": ["tip1", "tip2"],
  "rating": "Optimal|Sub-optimal|Inefficient"
}`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: model,
      temperature: 0.3,
      max_tokens: 1024,
    });

    let analysisText = completion.choices[0]?.message?.content || "{}";

    // Extract JSON from markdown code blocks if present
    const jsonMatch =
      analysisText.match(/```json\n([\s\S]*?)\n```/) ||
      analysisText.match(/```\n([\s\S]*?)\n```/);

    if (jsonMatch) {
      analysisText = jsonMatch[1];
    }

    const analysis = JSON.parse(analysisText);

    // Award XP and update skills
    req.user.addXP(10);
    req.user.skillMetrics.optimization = Math.min(
      100,
      req.user.skillMetrics.optimization + 2
    );
    await req.user.save();

    res.json(analysis);
  } catch (error) {
    console.error("Complexity analysis error:", error);
    res.status(500).json({
      error: "Failed to analyze complexity",
      details: error.message,
    });
  }
});

// Get Code Hint
router.post("/hint", authMiddleware, async (req, res) => {
  try {
    const { code, question, language } = req.body;

    const model = getModel();

    const prompt = `Give a brief hint (1-2 sentences) for this coding question. Do NOT solve it.

Language: ${language}
Code so far:
\`\`\`${language}
${code}
\`\`\`

Question: ${question}

Provide only a directional hint.`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: model,
      temperature: 0.7,
      max_tokens: 256,
    });

    const hint = completion.choices[0]?.message?.content || "";

    res.json({ hint });
  } catch (error) {
    console.error("Hint generation error:", error);
    res.status(500).json({ error: "Failed to generate hint" });
  }
});

// ============================================
// PREDEFINED ROADMAPS
// ============================================
function getPredefinedRoadmap(language, goal, level) {
  const roadmaps = {
    python: {
      "DSA Basics": {
        topics: [
          {
            title: "Variables & Data Types",
            description:
              "Learn how to store information in variables and understand different data types like integers, strings, floats, and booleans. Master type conversion and basic operations. Understand the difference between mutable and immutable types. Practice variable naming conventions and best practices.",
            order: 1,
          },
          {
            title: "Conditions & Loops",
            description:
              "Control program flow with if-else statements and create repetitive actions with for and while loops. Understand logical operators (and, or, not) and nested conditions. Learn about break, continue, and pass statements. Master list comprehensions for efficient looping.",
            order: 2,
          },
          {
            title: "Functions & Scope",
            description:
              "Write reusable code blocks with functions. Learn about parameters, return values, default arguments, and variable scope. Understand the difference between local and global variables. Practice breaking down problems into smaller functions and the DRY principle.",
            order: 3,
          },
          {
            title: "Lists & Tuples",
            description:
              "Work with collections of data using lists and tuples. Master indexing, slicing, and common list methods (append, insert, remove, pop, sort). Understand the difference between lists and tuples. Learn about list comprehensions and nested lists for 2D arrays.",
            order: 4,
          },
          {
            title: "Strings & Dictionaries",
            description:
              "Master string manipulation and formatting techniques. Learn dictionary operations for key-value pair storage. Understand string methods (split, join, replace, strip). Practice with dictionary methods and iteration. Learn about sets for unique collections.",
            order: 5,
          },
          {
            title: "Recursion Basics",
            description:
              "Understand how functions can call themselves. Learn to identify base cases and recursive cases. Practice with simple recursive problems like factorial, fibonacci, and sum of digits. Understand the call stack and how recursion works internally.",
            order: 6,
          },
          {
            title: "Searching Algorithms",
            description:
              "Implement linear search and binary search algorithms. Understand the importance of sorted arrays for binary search. Learn time complexity comparisons (O(n) vs O(log n)). Practice with different variations of search problems.",
            order: 7,
          },
          {
            title: "Sorting Algorithms",
            description:
              "Implement bubble sort, selection sort, and insertion sort algorithms. Understand time complexity basics and why sorting matters in programming. Learn how to analyze algorithm efficiency. Compare different sorting approaches and their use cases.",
            order: 8,
          },
        ],
      },
      "Web Development": {
        topics: [
          {
            title: "Python Basics",
            description:
              "Learn Python syntax, variables, data types, and basic operators. Understand how to write and run Python scripts. Master input/output operations and basic string formatting.",
            order: 1,
          },
          {
            title: "Functions & Modules",
            description:
              "Create reusable code with functions and organize code into modules. Learn about import statements and the Python standard library. Understand function parameters and return values.",
            order: 2,
          },
          {
            title: "Flask Basics",
            description:
              "Introduction to Flask web framework. Learn to create routes, handle requests, and return responses. Understand the basics of web servers and HTTP methods (GET, POST).",
            order: 3,
          },
          {
            title: "Templates & Forms",
            description:
              "Create dynamic web pages using Jinja2 templates. Learn to handle user input through forms. Understand template inheritance and form validation.",
            order: 4,
          },
          {
            title: "Database Integration",
            description:
              "Connect Flask to SQLite database. Learn basic SQL queries (SELECT, INSERT, UPDATE, DELETE). Understand database models and relationships.",
            order: 5,
          },
          {
            title: "REST APIs",
            description:
              "Build RESTful APIs with Flask. Learn about JSON responses, API endpoints, and HTTP status codes. Understand API design principles.",
            order: 6,
          },
        ],
      },
    },
    java: {
      "DSA Basics": {
        topics: [
          {
            title: "Variables & Data Types",
            description:
              "Learn primitive data types (int, double, boolean, char) and how to declare variables. Understand type casting between different types and basic arithmetic operations. Master the difference between primitive and reference types. Practice variable naming conventions.",
            order: 1,
          },
          {
            title: "Conditions & Loops",
            description:
              "Master if-else statements, switch cases, for loops, and while loops. Learn to control program flow and create repetitive logic. Understand nested loops and when to use each loop type. Practice with break and continue statements.",
            order: 2,
          },
          {
            title: "Methods & Overloading",
            description:
              "Create reusable code with methods. Understand parameters, return types, and method overloading. Learn the difference between static and instance methods. Master method signatures and when to use void vs return types.",
            order: 3,
          },
          {
            title: "Arrays & ArrayLists",
            description:
              "Work with fixed-size collections using arrays. Master array declaration, initialization, and traversal. Understand multi-dimensional arrays. Learn about ArrayList for dynamic arrays and common operations (add, remove, get, set).",
            order: 4,
          },
          {
            title: "Strings & StringBuilder",
            description:
              "Master string manipulation in Java. Understand string immutability and when to use StringBuilder for efficiency. Learn common string methods (substring, indexOf, replace, split). Practice string comparison and formatting.",
            order: 5,
          },
          {
            title: "Recursion & Stack",
            description:
              "Learn recursive problem-solving techniques. Understand base cases, recursive calls, and the call stack. Practice with factorial, fibonacci, and tower of hanoi. Learn to convert recursion to iteration when needed.",
            order: 6,
          },
          {
            title: "Searching Algorithms",
            description:
              "Implement linear search and binary search in Java. Understand the Arrays class and built-in search methods. Learn time complexity analysis. Practice with different array search variations.",
            order: 7,
          },
          {
            title: "Sorting Algorithms",
            description:
              "Implement bubble sort, selection sort, and insertion sort algorithms. Understand algorithmic thinking and time complexity basics (O notation). Learn the Collections.sort() and Arrays.sort() methods. Compare different sorting approaches.",
            order: 8,
          },
        ],
      },
      "Web Development": {
        topics: [
          {
            title: "Java Basics",
            description:
              "Learn Java syntax, variables, data types, and operators. Understand object-oriented programming basics. Master classes, objects, and the main method.",
            order: 1,
          },
          {
            title: "OOP Concepts",
            description:
              "Master classes, objects, inheritance, and polymorphism. Learn about encapsulation and access modifiers. Understand constructors and method overriding.",
            order: 2,
          },
          {
            title: "Servlet Basics",
            description:
              "Introduction to Java Servlets for web development. Learn to handle HTTP requests and responses. Understand the servlet lifecycle and deployment.",
            order: 3,
          },
          {
            title: "JSP & JSTL",
            description:
              "Create dynamic web pages using JavaServer Pages. Learn JSP syntax and JSTL for control flow. Understand the MVC pattern in web applications.",
            order: 4,
          },
          {
            title: "JDBC & Database",
            description:
              "Connect Java to databases using JDBC. Learn to execute SQL queries from Java. Understand prepared statements and connection pooling.",
            order: 5,
          },
          {
            title: "Spring Boot Basics",
            description:
              "Introduction to Spring Boot framework. Learn to create REST APIs with Spring. Understand dependency injection and annotations.",
            order: 6,
          },
        ],
      },
    },
  };

  const languageRoadmaps = roadmaps[language.toLowerCase()];
  if (!languageRoadmaps) return null;

  return languageRoadmaps[goal] || languageRoadmaps["DSA Basics"];
}

// ============================================
// PREDEFINED LESSONS
// ============================================
function getPredefinedLesson(topicTitle, language) {
  const lessons = {
    python: {
      "Variables & Data Types": {
        explanation:
          'Variables are containers that store data values in your program. Python has several built-in data types:\n\n• int: Whole numbers (e.g., 5, -10, 100)\n• float: Decimal numbers (e.g., 3.14, -0.5)\n• str: Text enclosed in quotes (e.g., "hello")\n• bool: True or False values\n\nPython automatically detects the type based on the value you assign. You can convert between types using int(), float(), str() functions.',
        example: {
          code: '# Variable declaration\nage = 25          # int\nheight = 5.9      # float\nname = "Alice"    # str\nis_student = True # bool\n\n# Type conversion\nage_str = str(age)        # "25"\nheight_int = int(height)  # 5\n\nprint(f"{name} is {age} years old")',
          description:
            "This example shows how to declare variables of different types and convert between them. The f-string allows easy string formatting.",
        },
        commonMistake: {
          mistake:
            'Trying to concatenate strings with numbers directly: print("Age: " + age)',
          why: "Python doesn't automatically convert types. You must use str(age) or f-strings for mixing text and numbers.",
        },
      },
      "Conditions & Loops": {
        explanation:
          "Control structures let you make decisions and repeat code:\n\n• if/elif/else: Execute code based on conditions\n• for loop: Iterate through sequences (lists, ranges)\n• while loop: Repeat while condition is True\n• break: Exit loop early\n• continue: Skip to next iteration\n\nIndentation (4 spaces) is crucial in Python - it defines code blocks!",
        example: {
          code: '# If-else statement\nage = 18\nif age >= 18:\n    print("Adult")\nelse:\n    print("Minor")\n\n# For loop\nfor i in range(5):\n    print(i)  # Prints 0,1,2,3,4\n\n# While loop\ncount = 0\nwhile count < 3:\n    print(count)\n    count += 1',
          description:
            "Shows basic conditional logic and both types of loops. Range(5) creates numbers 0-4.",
        },
        commonMistake: {
          mistake:
            "Forgetting the colon (:) after if/for/while statements or wrong indentation",
          why: "Python syntax requires colons to start a code block, and consistent indentation to define the block's extent.",
        },
      },
      "Functions & Scope": {
        explanation:
          "Functions are reusable blocks of code that perform specific tasks:\n\n• Define with 'def' keyword\n• Can take parameters (inputs)\n• Can return values (outputs)\n• Local variables exist only inside the function\n• Global variables are accessible everywhere\n\nFunctions help organize code and avoid repetition (DRY principle).",
        example: {
          code: '# Function with parameters and return\ndef add_numbers(a, b):\n    result = a + b  # local variable\n    return result\n\n# Function with default parameter\ndef greet(name="Guest"):\n    return f"Hello, {name}!"\n\n# Using functions\nsum_val = add_numbers(5, 3)  # 8\nprint(greet())          # "Hello, Guest!"\nprint(greet("Alice"))   # "Hello, Alice!"',
          description:
            "Functions take inputs, process them, and return results. Default parameters provide fallback values.",
        },
        commonMistake: {
          mistake:
            "Forgetting to return a value and trying to use the function result: result = print_sum(5, 3)",
          why: "print() displays output but doesn't return a value. Use 'return' to send data back from a function.",
        },
      },
      "Lists & Tuples": {
        explanation:
          "Lists are ordered, mutable collections that can hold multiple items:\n\n• Create with square brackets: [1, 2, 3]\n• Access items by index (0-based): list[0]\n• Slice: list[1:3] gets items 1 and 2\n• Methods: append(), insert(), remove(), pop(), sort()\n\nTuples are like lists but immutable (can't be changed after creation). Use parentheses: (1, 2, 3)",
        example: {
          code: "# List operations\nnumbers = [5, 2, 8, 1]\nnumbers.append(10)      # [5,2,8,1,10]\nnumbers.sort()          # [1,2,5,8,10]\nfirst = numbers[0]      # 1\nsub_list = numbers[1:3] # [2,5]\n\n# List comprehension\nsquares = [x**2 for x in range(5)]  # [0,1,4,9,16]\n\n# Tuple (immutable)\ncoords = (10, 20)\nx, y = coords  # unpacking",
          description:
            "Lists are flexible for storing and manipulating collections. List comprehensions provide concise syntax for creating lists.",
        },
        commonMistake: {
          mistake:
            "Using negative indices without understanding them: my_list[-1] causes confusion",
          why: "Negative indices count from the end: -1 is the last item, -2 is second-to-last. This is actually a feature, not an error!",
        },
      },
      "Strings & Dictionaries": {
        explanation:
          "Strings are sequences of characters with powerful methods:\n\n• Split: 'a,b,c'.split(',') → ['a','b','c']\n• Join: ','.join(['a','b']) → 'a,b'\n• Strip: ' hello '.strip() → 'hello'\n\nDictionaries store key-value pairs:\n• Create: {'name': 'Alice', 'age': 25}\n• Access: dict['name']\n• Methods: keys(), values(), items()",
        example: {
          code: "# String operations\ntext = \"Hello World\"\nwords = text.split()     # ['Hello', 'World']\nlower = text.lower()     # 'hello world'\nhas_hello = 'Hello' in text  # True\n\n# Dictionary\nstudent = {\n    'name': 'Alice',\n    'age': 20,\n    'grade': 'A'\n}\nprint(student['name'])   # Alice\nstudent['age'] = 21      # Update\nstudent['id'] = 101      # Add new key",
          description:
            "Strings are immutable but have many useful methods. Dictionaries provide fast key-based lookup.",
        },
        commonMistake: {
          mistake: "Trying to modify a string directly: text[0] = 'h'",
          why: "Strings are immutable in Python. Create a new string instead: text = 'h' + text[1:]",
        },
      },
      "Recursion Basics": {
        explanation:
          "Recursion is when a function calls itself to solve smaller subproblems:\n\n• Base case: Condition to stop recursion\n• Recursive case: Function calls itself with smaller input\n• Each call waits for the next to complete\n• Stack stores all pending calls\n\nUseful for problems that can be broken into similar smaller problems (factorial, Fibonacci, tree traversal).",
        example: {
          code: "# Factorial: 5! = 5 * 4 * 3 * 2 * 1\ndef factorial(n):\n    # Base case\n    if n == 0 or n == 1:\n        return 1\n    # Recursive case\n    return n * factorial(n - 1)\n\nprint(factorial(5))  # 120\n\n# How it works:\n# factorial(5) = 5 * factorial(4)\n# factorial(4) = 4 * factorial(3)\n# factorial(3) = 3 * factorial(2)\n# factorial(2) = 2 * factorial(1)\n# factorial(1) = 1 (base case)",
          description:
            "Factorial is calculated by multiplying n by factorial of (n-1), until reaching base case.",
        },
        commonMistake: {
          mistake:
            "Forgetting the base case, causing infinite recursion: RecursionError: maximum recursion depth exceeded",
          why: "Without a base case, the function calls itself forever. Always define when to stop!",
        },
      },
      "Searching Algorithms": {
        explanation:
          "Search algorithms find elements in collections:\n\n• Linear Search: Check each element one by one - O(n)\n  Works on unsorted lists, simple but slow for large data\n\n• Binary Search: Divide and conquer on sorted lists - O(log n)\n  Much faster but requires sorted data\n  Eliminates half the remaining elements each step",
        example: {
          code: "# Linear Search\ndef linear_search(arr, target):\n    for i in range(len(arr)):\n        if arr[i] == target:\n            return i  # Found at index i\n    return -1  # Not found\n\n# Binary Search (array must be sorted)\ndef binary_search(arr, target):\n    left, right = 0, len(arr) - 1\n    \n    while left <= right:\n        mid = (left + right) // 2\n        if arr[mid] == target:\n            return mid\n        elif arr[mid] < target:\n            left = mid + 1  # Search right half\n        else:\n            right = mid - 1  # Search left half\n    return -1",
          description:
            "Linear search checks every element. Binary search repeatedly halves the search space on sorted arrays.",
        },
        commonMistake: {
          mistake: "Using binary search on an unsorted array",
          why: "Binary search assumes the array is sorted. On unsorted data, it will give wrong results.",
        },
      },
      "Sorting Algorithms": {
        explanation:
          "Sorting arranges elements in a specific order:\n\n• Bubble Sort: Compare adjacent elements, swap if wrong order\n  Simple but slow - O(n²)\n\n• Selection Sort: Find minimum, place at beginning, repeat\n  Also O(n²) but fewer swaps than bubble sort\n\n• Insertion Sort: Build sorted portion one element at a time\n  Efficient for small or nearly-sorted data - O(n²) worst case",
        example: {
          code: "# Bubble Sort\ndef bubble_sort(arr):\n    n = len(arr)\n    for i in range(n):\n        for j in range(0, n-i-1):\n            if arr[j] > arr[j+1]:\n                arr[j], arr[j+1] = arr[j+1], arr[j]\n    return arr\n\n# Selection Sort\ndef selection_sort(arr):\n    n = len(arr)\n    for i in range(n):\n        min_idx = i\n        for j in range(i+1, n):\n            if arr[j] < arr[min_idx]:\n                min_idx = j\n        arr[i], arr[min_idx] = arr[min_idx], arr[i]\n    return arr\n\nnumbers = [64, 34, 25, 12, 22]\nprint(bubble_sort(numbers.copy()))",
          description:
            "Both algorithms sort in-place. Bubble sort 'bubbles' large values to the end. Selection sort selects the minimum each iteration.",
        },
        commonMistake: {
          mistake: "Not understanding that these modify the original list",
          why: "Sorting algorithms typically sort in-place. Use arr.copy() if you need to keep the original.",
        },
      },
    },
    java: {
      "Variables & Data Types": {
        explanation:
          "Java is strongly-typed - you must declare variable types:\n\n• int: Whole numbers (-2147483648 to 2147483647)\n• double: Decimal numbers\n• char: Single character in single quotes: 'A'\n• boolean: true or false\n• String: Text in double quotes: \"Hello\"\n\nType casting: Converting between types\n• Implicit: int to double (automatic)\n• Explicit: double to int (manual): (int)3.14",
        example: {
          code: 'public class Main {\n    public static void main(String[] args) {\n        // Variable declaration\n        int age = 25;\n        double height = 5.9;\n        char grade = \'A\';\n        boolean isStudent = true;\n        String name = "Alice";\n        \n        // Type casting\n        double ageDouble = age;        // implicit\n        int heightInt = (int) height;  // explicit (5)\n        \n        System.out.println(name + " is " + age + " years old");\n    }\n}',
          description:
            "Variables must be declared with their type. String concatenation uses the + operator.",
        },
        commonMistake: {
          mistake:
            "Integer division giving unexpected results: int result = 5 / 2; // result is 2, not 2.5",
          why: "When both operands are integers, Java performs integer division. Use 5.0 / 2 or cast to double for decimal results.",
        },
      },
      "Conditions & Loops": {
        explanation:
          "Control flow in Java:\n\n• if/else if/else: Conditional execution\n• switch: Multiple condition branches\n• for loop: Known iterations\n• while loop: Unknown iterations\n• do-while: Execute at least once\n• break: Exit loop\n• continue: Skip to next iteration",
        example: {
          code: 'public class ControlFlow {\n    public static void main(String[] args) {\n        // If-else\n        int age = 18;\n        if (age >= 18) {\n            System.out.println("Adult");\n        } else {\n            System.out.println("Minor");\n        }\n        \n        // For loop\n        for (int i = 0; i < 5; i++) {\n            System.out.println(i);\n        }\n        \n        // While loop\n        int count = 0;\n        while (count < 3) {\n            System.out.println(count);\n            count++;\n        }\n    }\n}',
          description:
            "For loops have three parts: initialization, condition, increment. While loops check condition before each iteration.",
        },
        commonMistake: {
          mistake:
            "Using = instead of == in conditions: if (x = 5) instead of if (x == 5)",
          why: "Single = is assignment, == is comparison. Java won't compile this for booleans but catches it.",
        },
      },
      "Methods & Overloading": {
        explanation:
          "Methods are blocks of code that perform tasks:\n\n• Must specify return type (or void for no return)\n• Can have parameters with types\n• Method overloading: Same name, different parameters\n• static: Belongs to class, not instance\n• Access modifiers: public, private, protected",
        example: {
          code: "public class Calculator {\n    // Method with return value\n    public static int add(int a, int b) {\n        return a + b;\n    }\n    \n    // Method overloading - same name, different parameters\n    public static double add(double a, double b) {\n        return a + b;\n    }\n    \n    public static int add(int a, int b, int c) {\n        return a + b + c;\n    }\n    \n    public static void main(String[] args) {\n        System.out.println(add(5, 3));           // 8\n        System.out.println(add(5.5, 3.2));       // 8.7\n        System.out.println(add(1, 2, 3));        // 6\n    }\n}",
          description:
            "Methods can be overloaded to work with different parameter types. Java chooses the correct version based on arguments.",
        },
        commonMistake: {
          mistake:
            "Forgetting to make helper methods static when calling from main",
          why: "main() is static, so it can only directly call other static methods. Non-static methods need an object instance.",
        },
      },
      "Arrays & ArrayLists": {
        explanation:
          "Arrays store fixed-size collections:\n\n• Declare: int[] arr = new int[5];\n• Initialize: int[] arr = {1, 2, 3};\n• Access: arr[0] (0-indexed)\n• Length: arr.length\n\nArrayList is dynamic (resizable):\n• Import: java.util.ArrayList\n• Create: ArrayList<Integer> list = new ArrayList<>();\n• Methods: add(), get(), remove(), size()",
        example: {
          code: "import java.util.ArrayList;\n\npublic class Collections {\n    public static void main(String[] args) {\n        // Array (fixed size)\n        int[] numbers = {5, 2, 8, 1};\n        System.out.println(numbers[0]);  // 5\n        System.out.println(numbers.length);  // 4\n        \n        // ArrayList (dynamic)\n        ArrayList<Integer> list = new ArrayList<>();\n        list.add(10);\n        list.add(20);\n        list.add(30);\n        System.out.println(list.get(0));  // 10\n        System.out.println(list.size());  // 3\n        list.remove(1);  // Removes 20\n    }\n}",
          description:
            "Arrays have fixed size. ArrayList grows dynamically. Note: ArrayList uses wrapper classes (Integer, not int).",
        },
        commonMistake: {
          mistake:
            "ArrayIndexOutOfBoundsException: Accessing arr[arr.length] or negative index",
          why: "Arrays are 0-indexed, so valid indices are 0 to length-1. arr[arr.length] is always out of bounds.",
        },
      },
      "Strings & StringBuilder": {
        explanation:
          "Strings in Java are immutable:\n\n• Every modification creates a new String object\n• Methods: length(), charAt(), substring(), indexOf(), split()\n• Comparison: use .equals(), not ==\n\nStringBuilder is mutable (efficient for many modifications):\n• Methods: append(), insert(), delete(), reverse()\n• Convert to String: toString()",
        example: {
          code: 'public class StringExample {\n    public static void main(String[] args) {\n        // String (immutable)\n        String text = "Hello World";\n        String lower = text.toLowerCase();  // "hello world"\n        String[] words = text.split(" ");   // ["Hello", "World"]\n        boolean has = text.contains("World");  // true\n        \n        // String comparison\n        String s1 = "hello";\n        String s2 = "hello";\n        System.out.println(s1.equals(s2));  // true (correct)\n        System.out.println(s1 == s2);       // may be false\n        \n        // StringBuilder (mutable)\n        StringBuilder sb = new StringBuilder("Hello");\n        sb.append(" World");\n        sb.insert(5, ",");\n        System.out.println(sb.toString());  // "Hello, World"\n    }\n}',
          description:
            "Use String for immutable text. Use StringBuilder when concatenating in loops for better performance.",
        },
        commonMistake: {
          mistake: "Using == to compare Strings instead of .equals()",
          why: "== compares object references (memory addresses), not content. Always use .equals() for String comparison.",
        },
      },
      "Recursion & Stack": {
        explanation:
          "Recursion: Method calls itself to solve smaller subproblems\n\n• Base case: Stopping condition\n• Recursive case: Calls itself with reduced input\n• Call stack: Each call is stored in memory\n• Stack overflow: Too many recursive calls\n\nEvery recursive solution has an iterative alternative.",
        example: {
          code: "public class Recursion {\n    // Factorial: n! = n * (n-1)!\n    public static int factorial(int n) {\n        // Base case\n        if (n == 0 || n == 1) {\n            return 1;\n        }\n        // Recursive case\n        return n * factorial(n - 1);\n    }\n    \n    // Fibonacci: fib(n) = fib(n-1) + fib(n-2)\n    public static int fibonacci(int n) {\n        if (n <= 1) {\n            return n;\n        }\n        return fibonacci(n - 1) + fibonacci(n - 2);\n    }\n    \n    public static void main(String[] args) {\n        System.out.println(factorial(5));   // 120\n        System.out.println(fibonacci(6));   // 8\n    }\n}",
          description:
            "Each recursive call waits for the next to complete. Base case prevents infinite recursion.",
        },
        commonMistake: {
          mistake: "StackOverflowError due to missing or incorrect base case",
          why: "Without a proper base case, recursion never stops and fills up the call stack. Always verify base case is reachable.",
        },
      },
      "Searching Algorithms": {
        explanation:
          "Searching finds elements in data structures:\n\n• Linear Search: Check each element sequentially - O(n)\n  Simple, works on any array\n\n• Binary Search: Divide and conquer on sorted arrays - O(log n)\n  Much faster but requires sorted data\n  Uses two pointers (left, right) and middle element",
        example: {
          code: "public class SearchAlgorithms {\n    // Linear Search\n    public static int linearSearch(int[] arr, int target) {\n        for (int i = 0; i < arr.length; i++) {\n            if (arr[i] == target) {\n                return i;\n            }\n        }\n        return -1;  // Not found\n    }\n    \n    // Binary Search (array must be sorted)\n    public static int binarySearch(int[] arr, int target) {\n        int left = 0;\n        int right = arr.length - 1;\n        \n        while (left <= right) {\n            int mid = left + (right - left) / 2;\n            \n            if (arr[mid] == target) {\n                return mid;\n            } else if (arr[mid] < target) {\n                left = mid + 1;\n            } else {\n                right = mid - 1;\n            }\n        }\n        return -1;\n    }\n}",
          description:
            "Linear search is O(n), checks every element. Binary search is O(log n), halves search space each iteration.",
        },
        commonMistake: {
          mistake:
            "Using (left + right) / 2 for mid, which can overflow for large values",
          why: "If left + right exceeds Integer.MAX_VALUE, it overflows. Use left + (right - left) / 2 instead.",
        },
      },
      "Sorting Algorithms": {
        explanation:
          "Sorting arranges elements in order:\n\n• Bubble Sort: Repeatedly swap adjacent elements if in wrong order\n  Time: O(n²), Simple but inefficient\n\n• Selection Sort: Find minimum, place at start, repeat\n  Time: O(n²), Fewer swaps than bubble sort\n\n• Insertion Sort: Build sorted array one element at a time\n  Time: O(n²), Good for small/nearly-sorted data",
        example: {
          code: "public class SortingAlgorithms {\n    // Bubble Sort\n    public static void bubbleSort(int[] arr) {\n        int n = arr.length;\n        for (int i = 0; i < n - 1; i++) {\n            for (int j = 0; j < n - i - 1; j++) {\n                if (arr[j] > arr[j + 1]) {\n                    // Swap\n                    int temp = arr[j];\n                    arr[j] = arr[j + 1];\n                    arr[j + 1] = temp;\n                }\n            }\n        }\n    }\n    \n    // Selection Sort\n    public static void selectionSort(int[] arr) {\n        int n = arr.length;\n        for (int i = 0; i < n - 1; i++) {\n            int minIdx = i;\n            for (int j = i + 1; j < n; j++) {\n                if (arr[j] < arr[minIdx]) {\n                    minIdx = j;\n                }\n            }\n            // Swap\n            int temp = arr[minIdx];\n            arr[minIdx] = arr[i];\n            arr[i] = temp;\n        }\n    }\n}",
          description:
            "Both sorts modify the array in-place. Bubble sort compares adjacent pairs. Selection sort finds the minimum each pass.",
        },
        commonMistake: {
          mistake:
            "Off-by-one errors in loop bounds, causing ArrayIndexOutOfBoundsException",
          why: "Bubble sort inner loop should be j < n - i - 1, not j < n, to avoid comparing arr[j+1] when j is at the end.",
        },
      },
    },
  };

  const languageLessons = lessons[language.toLowerCase()];
  if (!languageLessons) return null;

  return languageLessons[topicTitle] || null;
}

// ============================================
// PREDEFINED TEST CASES
// ============================================
router.get(
  "/testcases/:topicTitle/:language",
  authMiddleware,
  async (req, res) => {
    try {
      const { topicTitle, language } = req.params;

      const testCases = getPredefinedTestCases(topicTitle, language);

      if (!testCases) {
        return res.status(404).json({
          success: false,
          message: "No test cases found for this topic",
        });
      }

      res.json({
        success: true,
        data: testCases,
      });
    } catch (error) {
      console.error("Test cases retrieval error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to retrieve test cases",
      });
    }
  }
);

function getPredefinedTestCases(topicTitle, language) {
  const testCases = {
    python: {
      "Variables & Data Types": {
        problemStatement:
          "Write a function named 'calculate_age_in_days' that takes age in years (integer) and returns age in days (assume 365 days per year).",
        starterCode:
          "def calculate_age_in_days(years):\n    # Write your code here\n    pass\n\n# Test the function\nprint(calculate_age_in_days(1))",
        testCases: [
          {
            input: "1",
            expectedOutput: "365",
            description: "1 year = 365 days",
          },
          {
            input: "5",
            expectedOutput: "1825",
            description: "5 years = 1825 days",
          },
          {
            input: "10",
            expectedOutput: "3650",
            description: "10 years = 3650 days",
          },
        ],
      },
      "Conditions & Loops": {
        problemStatement:
          "Write a function named 'check_even_odd' that takes a number and returns 'Even' if the number is even, or 'Odd' if it's odd.",
        starterCode:
          "def check_even_odd(num):\n    # Write your code here\n    pass\n\n# Test the function\nprint(check_even_odd(4))",
        testCases: [
          { input: "4", expectedOutput: "Even", description: "4 is even" },
          { input: "7", expectedOutput: "Odd", description: "7 is odd" },
          { input: "100", expectedOutput: "Even", description: "100 is even" },
        ],
      },
      "Functions & Scope": {
        problemStatement:
          "Write a function named 'find_max' that takes two numbers and returns the larger one.",
        starterCode:
          "def find_max(a, b):\n    # Write your code here\n    pass\n\n# Test the function\nprint(find_max(5, 10))",
        testCases: [
          { input: "5, 10", expectedOutput: "10", description: "10 is larger" },
          { input: "15, 8", expectedOutput: "15", description: "15 is larger" },
          { input: "7, 7", expectedOutput: "7", description: "Both are equal" },
        ],
      },
      "Lists & Tuples": {
        problemStatement:
          "Write a function named 'sum_list' that takes a list of numbers and returns their sum.",
        starterCode:
          "def sum_list(numbers):\n    # Write your code here\n    pass\n\n# Test the function\nprint(sum_list([1, 2, 3]))",
        testCases: [
          { input: "[1, 2, 3]", expectedOutput: "6", description: "1+2+3 = 6" },
          {
            input: "[10, 20, 30]",
            expectedOutput: "60",
            description: "10+20+30 = 60",
          },
          { input: "[5]", expectedOutput: "5", description: "Single element" },
        ],
      },
      "Strings & Dictionaries": {
        problemStatement:
          "Write a function named 'reverse_string' that takes a string and returns it reversed.",
        starterCode:
          "def reverse_string(text):\n    # Write your code here\n    pass\n\n# Test the function\nprint(reverse_string('hello'))",
        testCases: [
          {
            input: "'hello'",
            expectedOutput: "olleh",
            description: "Reverse of hello",
          },
          {
            input: "'Python'",
            expectedOutput: "nohtyP",
            description: "Reverse of Python",
          },
          {
            input: "'12345'",
            expectedOutput: "54321",
            description: "Reverse of 12345",
          },
        ],
      },
      "Recursion Basics": {
        problemStatement:
          "Write a recursive function named 'factorial' that calculates n! (n factorial).",
        starterCode:
          "def factorial(n):\n    # Write your code here\n    pass\n\n# Test the function\nprint(factorial(5))",
        testCases: [
          { input: "5", expectedOutput: "120", description: "5! = 120" },
          { input: "3", expectedOutput: "6", description: "3! = 6" },
          { input: "1", expectedOutput: "1", description: "1! = 1" },
        ],
      },
      "Searching Algorithms": {
        problemStatement:
          "Write a function named 'linear_search' that takes a list and a target value, returns the index if found, or -1 if not found.",
        starterCode:
          "def linear_search(arr, target):\n    # Write your code here\n    pass\n\n# Test the function\nprint(linear_search([1, 2, 3, 4, 5], 3))",
        testCases: [
          {
            input: "[1, 2, 3, 4, 5], 3",
            expectedOutput: "2",
            description: "3 is at index 2",
          },
          {
            input: "[10, 20, 30], 20",
            expectedOutput: "1",
            description: "20 is at index 1",
          },
          {
            input: "[5, 10, 15], 100",
            expectedOutput: "-1",
            description: "100 not found",
          },
        ],
      },
      "Sorting Algorithms": {
        problemStatement:
          "Write a function named 'bubble_sort' that takes a list and returns it sorted in ascending order.",
        starterCode:
          "def bubble_sort(arr):\n    # Write your code here\n    pass\n\n# Test the function\nprint(bubble_sort([5, 2, 8, 1]))",
        testCases: [
          {
            input: "[5, 2, 8, 1]",
            expectedOutput: "[1, 2, 5, 8]",
            description: "Sort ascending",
          },
          {
            input: "[3, 3, 1]",
            expectedOutput: "[1, 3, 3]",
            description: "With duplicates",
          },
          {
            input: "[10]",
            expectedOutput: "[10]",
            description: "Single element",
          },
        ],
      },
    },
    java: {
      "Variables & Data Types": {
        problemStatement:
          "Write a method named 'calculateAgeInDays' that takes age in years (int) and returns age in days (assume 365 days per year).",
        starterCode:
          "public class Main {\n    public static int calculateAgeInDays(int years) {\n        // Write your code here\n        return 0;\n    }\n    \n    public static void main(String[] args) {\n        System.out.println(calculateAgeInDays(1));\n    }\n}",
        testCases: [
          {
            input: "1",
            expectedOutput: "365",
            description: "1 year = 365 days",
          },
          {
            input: "5",
            expectedOutput: "1825",
            description: "5 years = 1825 days",
          },
          {
            input: "10",
            expectedOutput: "3650",
            description: "10 years = 3650 days",
          },
        ],
      },
      "Conditions & Loops": {
        problemStatement:
          'Write a method named \'checkEvenOdd\' that takes a number and returns "Even" if even, or "Odd" if odd.',
        starterCode:
          'public class Main {\n    public static String checkEvenOdd(int num) {\n        // Write your code here\n        return "";\n    }\n    \n    public static void main(String[] args) {\n        System.out.println(checkEvenOdd(4));\n    }\n}',
        testCases: [
          { input: "4", expectedOutput: "Even", description: "4 is even" },
          { input: "7", expectedOutput: "Odd", description: "7 is odd" },
          { input: "100", expectedOutput: "Even", description: "100 is even" },
        ],
      },
      "Methods & Overloading": {
        problemStatement:
          "Write a method named 'findMax' that takes two integers and returns the larger one.",
        starterCode:
          "public class Main {\n    public static int findMax(int a, int b) {\n        // Write your code here\n        return 0;\n    }\n    \n    public static void main(String[] args) {\n        System.out.println(findMax(5, 10));\n    }\n}",
        testCases: [
          { input: "5, 10", expectedOutput: "10", description: "10 is larger" },
          { input: "15, 8", expectedOutput: "15", description: "15 is larger" },
          { input: "7, 7", expectedOutput: "7", description: "Both are equal" },
        ],
      },
      "Arrays & ArrayLists": {
        problemStatement:
          "Write a method named 'sumArray' that takes an int array and returns the sum of all elements.",
        starterCode:
          "public class Main {\n    public static int sumArray(int[] numbers) {\n        // Write your code here\n        return 0;\n    }\n    \n    public static void main(String[] args) {\n        System.out.println(sumArray(new int[]{1, 2, 3}));\n    }\n}",
        testCases: [
          {
            input: "new int[]{1, 2, 3}",
            expectedOutput: "6",
            description: "1+2+3 = 6",
          },
          {
            input: "new int[]{10, 20, 30}",
            expectedOutput: "60",
            description: "10+20+30 = 60",
          },
          {
            input: "new int[]{5}",
            expectedOutput: "5",
            description: "Single element",
          },
        ],
      },
      "Strings & StringBuilder": {
        problemStatement:
          "Write a method named 'reverseString' that takes a String and returns it reversed.",
        starterCode:
          'public class Main {\n    public static String reverseString(String text) {\n        // Write your code here\n        return "";\n    }\n    \n    public static void main(String[] args) {\n        System.out.println(reverseString("hello"));\n    }\n}',
        testCases: [
          {
            input: '"hello"',
            expectedOutput: "olleh",
            description: "Reverse of hello",
          },
          {
            input: '"Java"',
            expectedOutput: "avaJ",
            description: "Reverse of Java",
          },
          {
            input: '"12345"',
            expectedOutput: "54321",
            description: "Reverse of 12345",
          },
        ],
      },
      "Recursion & Stack": {
        problemStatement:
          "Write a recursive method named 'factorial' that calculates n! (n factorial).",
        starterCode:
          "public class Main {\n    public static int factorial(int n) {\n        // Write your code here\n        return 0;\n    }\n    \n    public static void main(String[] args) {\n        System.out.println(factorial(5));\n    }\n}",
        testCases: [
          { input: "5", expectedOutput: "120", description: "5! = 120" },
          { input: "3", expectedOutput: "6", description: "3! = 6" },
          { input: "1", expectedOutput: "1", description: "1! = 1" },
        ],
      },
      "Searching Algorithms": {
        problemStatement:
          "Write a method named 'linearSearch' that takes an int array and target, returns index if found or -1 if not found.",
        starterCode:
          "public class Main {\n    public static int linearSearch(int[] arr, int target) {\n        // Write your code here\n        return -1;\n    }\n    \n    public static void main(String[] args) {\n        System.out.println(linearSearch(new int[]{1, 2, 3, 4, 5}, 3));\n    }\n}",
        testCases: [
          {
            input: "new int[]{1, 2, 3, 4, 5}, 3",
            expectedOutput: "2",
            description: "3 is at index 2",
          },
          {
            input: "new int[]{10, 20, 30}, 20",
            expectedOutput: "1",
            description: "20 is at index 1",
          },
          {
            input: "new int[]{5, 10, 15}, 100",
            expectedOutput: "-1",
            description: "100 not found",
          },
        ],
      },
      "Sorting Algorithms": {
        problemStatement:
          "Write a method named 'bubbleSort' that takes an int array and returns it sorted in ascending order.",
        starterCode:
          "import java.util.Arrays;\n\npublic class Main {\n    public static int[] bubbleSort(int[] arr) {\n        // Write your code here\n        return arr;\n    }\n    \n    public static void main(String[] args) {\n        System.out.println(Arrays.toString(bubbleSort(new int[]{5, 2, 8, 1})));\n    }\n}",
        testCases: [
          {
            input: "new int[]{5, 2, 8, 1}",
            expectedOutput: "[1, 2, 5, 8]",
            description: "Sort ascending",
          },
          {
            input: "new int[]{3, 3, 1}",
            expectedOutput: "[1, 3, 3]",
            description: "With duplicates",
          },
          {
            input: "new int[]{10}",
            expectedOutput: "[10]",
            description: "Single element",
          },
        ],
      },
    },
  };

  const languageTests = testCases[language.toLowerCase()];
  if (!languageTests) return null;

  return languageTests[topicTitle] || null;
}

module.exports = router;
