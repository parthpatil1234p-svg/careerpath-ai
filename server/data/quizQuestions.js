/**
 * data/quizQuestions.js — Curated Adaptive Micro-Quiz Question Bank
 *
 * Team 404 Brain Not Found · Hack2Ignite 2026-27
 *
 * 45 Vetted Technical Questions across 3 Core Foundational Skills:
 * - JavaScript (5 Easy, 5 Medium, 5 Hard)
 * - Python (5 Easy, 5 Medium, 5 Hard)
 * - SQL (5 Easy, 5 Medium, 5 Hard)
 *
 * Each question has:
 * - id: unique string
 * - skill: 'javascript' | 'python' | 'sql'
 * - difficulty: 'easy' | 'medium' | 'hard'
 * - topic: specific topic tag for roadmap gap mapping (e.g. 'closures', 'event-loop', 'joins')
 * - question: prompt text
 * - options: 4 distinct choices
 * - correctIndex: 0-3 index
 * - explanation: punchy 1-line educational rationale
 */

const QUIZ_QUESTIONS = {
  javascript: {
    easy: [
      {
        id: 'js-e1',
        skill: 'javascript',
        difficulty: 'easy',
        topic: 'variables-scope',
        question: 'What is the main scoping difference between var and let in JavaScript?',
        options: [
          'var is block-scoped; let is function-scoped',
          'let is block-scoped; var is function-scoped',
          'let can be redeclared in the same scope; var cannot',
          'There is no scoping difference between them'
        ],
        correctIndex: 1,
        explanation: 'let honors block scope delimited by curly braces {}, whereas var hoists to the enclosing function scope.'
      },
      {
        id: 'js-e2',
        skill: 'javascript',
        difficulty: 'easy',
        topic: 'primitives-null',
        question: 'What does the expression typeof null evaluate to in JavaScript?',
        options: ['"null"', '"undefined"', '"object"', '"boolean"'],
        correctIndex: 2,
        explanation: 'typeof null returns "object" due to a legacy design quirk in the original JavaScript 1.0 engine.'
      },
      {
        id: 'js-e3',
        skill: 'javascript',
        difficulty: 'easy',
        topic: 'array-methods',
        question: 'Which Array method produces a brand-new array containing transformed items?',
        options: ['.forEach()', '.map()', '.filter()', '.push()'],
        correctIndex: 1,
        explanation: '.map() returns a new array with the transformed values, whereas .forEach() returns undefined.'
      },
      {
        id: 'js-e4',
        skill: 'javascript',
        difficulty: 'easy',
        topic: 'equality-coercion',
        question: 'What are the evaluation results of ("5" == 5) and ("5" === 5)?',
        options: ['true and true', 'false and false', 'true and false', 'false and true'],
        correctIndex: 2,
        explanation: 'The == operator performs type coercion, while === strictly checks both value and type.'
      },
      {
        id: 'js-e5',
        skill: 'javascript',
        difficulty: 'easy',
        topic: 'dom-manipulation',
        question: 'Which native DOM method retrieves an HTML element using its unique ID?',
        options: [
          'document.getElementsByClassName()',
          'document.querySelector(".id")',
          'document.getElementById()',
          'document.findId()'
        ],
        correctIndex: 2,
        explanation: 'document.getElementById() directly selects the singular DOM node matching the specified ID.'
      }
    ],
    medium: [
      {
        id: 'js-m1',
        skill: 'javascript',
        difficulty: 'medium',
        topic: 'closures',
        question: 'What fundamentally is a closure in JavaScript?',
        options: [
          'A function that terminates immediately after running',
          'A function bundled with references to its surrounding lexical environment',
          'A method to close browser popups securely',
          'A callback that only runs when a network promise rejects'
        ],
        correctIndex: 1,
        explanation: 'Closures allow inner functions to retain access to variables from an outer enclosing scope even after it finishes execution.'
      },
      {
        id: 'js-m2',
        skill: 'javascript',
        difficulty: 'medium',
        topic: 'async-promises',
        question: 'What are the three possible lifecycle states of a JavaScript Promise?',
        options: [
          'starting, running, finished',
          'pending, fulfilled, rejected',
          'waiting, success, error',
          'init, resolved, failed'
        ],
        correctIndex: 1,
        explanation: 'Promises begin as pending and transition definitively into either fulfilled or rejected.'
      },
      {
        id: 'js-m3',
        skill: 'javascript',
        difficulty: 'medium',
        topic: 'this-binding',
        question: 'How do ES6 arrow functions handle the this keyword compared to traditional functions?',
        options: [
          'Arrow functions bind this dynamically to the runtime caller',
          'Arrow functions lexically inherit this from the surrounding outer context',
          'Arrow functions cannot access this at all',
          'Arrow functions bind this strictly to the global window object'
        ],
        correctIndex: 1,
        explanation: 'Arrow functions do not bind their own this; they retain the this value of the enclosing lexical scope.'
      },
      {
        id: 'js-m4',
        skill: 'javascript',
        difficulty: 'medium',
        topic: 'event-propagation',
        question: 'What does event.stopPropagation() achieve when dispatched in an event listener?',
        options: [
          'Prevents default browser navigation or form refresh',
          'Stops the event from traveling further up or down the DOM tree',
          'Deletes the element that received the event',
          'Pauses asynchronous JavaScript execution'
        ],
        correctIndex: 1,
        explanation: 'stopPropagation() stops the event from bubbling up to parent ancestors or capturing down.'
      },
      {
        id: 'js-m5',
        skill: 'javascript',
        difficulty: 'medium',
        topic: 'rest-spread',
        question: 'Given const o = { a: 1, b: 2 }; const copy = { ...o, b: 9 }; what is copy.b?',
        options: ['1', '2', '9', 'undefined'],
        correctIndex: 2,
        explanation: 'Object spread properties evaluate left-to-right, so the later b: 9 overrides the earlier spread b: 2.'
      }
    ],
    hard: [
      {
        id: 'js-h1',
        skill: 'javascript',
        difficulty: 'hard',
        topic: 'event-loop',
        question: 'What is the log order of: console.log(1); setTimeout(() => console.log(2), 0); Promise.resolve().then(() => console.log(3)); console.log(4);?',
        options: ['1, 2, 3, 4', '1, 4, 2, 3', '1, 4, 3, 2', '1, 3, 4, 2'],
        correctIndex: 2,
        explanation: 'Synchronous operations (1, 4) run first, followed by microtasks (Promise 3), and lastly macrotasks (setTimeout 2).'
      },
      {
        id: 'js-h2',
        skill: 'javascript',
        difficulty: 'hard',
        topic: 'prototypes',
        question: 'What occurs when querying a property not found directly on an object instance?',
        options: [
          'Immediately throws a ReferenceError',
          'Traverses up the __proto__ prototype chain until found or reaches null',
          'Instantiates the property with value null on the object',
          'Clones the prototype properties into local memory'
        ],
        correctIndex: 1,
        explanation: 'JavaScript walks up the prototype chain link by link until it either finds the property or hits null (Object.prototype.__proto__).'
      },
      {
        id: 'js-h3',
        skill: 'javascript',
        difficulty: 'hard',
        topic: 'debounce-throttle',
        question: 'What is the operational distinction between debounce and throttle?',
        options: [
          'Throttle delays until user stops; debounce enforces a maximum execution frequency',
          'Debounce delays execution until N ms of silence; throttle limits execution to once per N ms',
          'Throttle is for click events; debounce is for scroll events only',
          'They are interchangeable terms for asynchronous queuing'
        ],
        correctIndex: 1,
        explanation: 'Debounce fires only after inactivity settles; throttle guarantees regular execution at most once per time window.'
      },
      {
        id: 'js-h4',
        skill: 'javascript',
        difficulty: 'hard',
        topic: 'memory-weakmap',
        question: 'Why are WeakMaps advantageous over regular Maps for object association caches?',
        options: [
          'WeakMaps allow garbage collection of keys when no other references exist',
          'WeakMaps accept primitive strings and numbers as keys',
          'WeakMaps maintain an ordered array of keys internally',
          'WeakMaps can be serialized with JSON.stringify()'
        ],
        correctIndex: 0,
        explanation: 'WeakMap references to key objects are weak, preventing memory leaks when target objects are discarded elsewhere.'
      },
      {
        id: 'js-h5',
        skill: 'javascript',
        difficulty: 'hard',
        topic: 'currying-hof',
        question: 'Currying transforms a multi-argument function fn(a, b, c) into which structure?',
        options: ['fn(a)(b)(c)', '[a, b, c].map(fn)', 'Promise.all([a, b, c])', 'fn([a, b, c])'],
        correctIndex: 0,
        explanation: 'Currying translates a function callable with N arguments into a nested chain of single-argument functions.'
      }
    ]
  },

  python: {
    easy: [
      {
        id: 'py-e1',
        skill: 'python',
        difficulty: 'easy',
        topic: 'mutability',
        question: 'Which of the following built-in Python data structures is immutable?',
        options: ['list', 'dict', 'set', 'tuple'],
        correctIndex: 3,
        explanation: 'Tuples cannot be altered or appended to after instantiation, making them immutable.'
      },
      {
        id: 'py-e2',
        skill: 'python',
        difficulty: 'easy',
        topic: 'slicing',
        question: 'What does the slice expression arr[::-1] do to a list arr = [1, 2, 3]?',
        options: ['Returns [1, 2, 3]', 'Returns [3, 2, 1]', 'Deletes the last element', 'Raises an IndexError'],
        correctIndex: 1,
        explanation: 'A step parameter of -1 reverses the sequence.'
      },
      {
        id: 'py-e3',
        skill: 'python',
        difficulty: 'easy',
        topic: 'dict-get',
        question: 'What is the recommended way to read a dictionary key without triggering a KeyError if absent?',
        options: ['d[key]', 'd.get(key, default)', 'd.fetch(key)', 'd.has(key)'],
        correctIndex: 1,
        explanation: 'dict.get() safely returns None or a custom fallback value if the key is not in the dictionary.'
      },
      {
        id: 'py-e4',
        skill: 'python',
        difficulty: 'easy',
        topic: 'args-kwargs',
        question: 'In a function header def f(*args, **kwargs), what type is args?',
        options: ['list', 'tuple', 'dict', 'generator'],
        correctIndex: 1,
        explanation: '*args packs arbitrary positional arguments into an immutable tuple.'
      },
      {
        id: 'py-e5',
        skill: 'python',
        difficulty: 'easy',
        topic: 'f-strings',
        question: 'Which syntax represents a Python 3.6+ formatted f-string?',
        options: ['f"Hello {name}"', '"Hello %s" % name', '"Hello {}".format(name)', '$"Hello {name}"'],
        correctIndex: 0,
        explanation: 'f-strings use an f prefix and evaluate expressions directly inside curly braces.'
      }
    ],
    medium: [
      {
        id: 'py-m1',
        skill: 'python',
        difficulty: 'medium',
        topic: 'comprehensions',
        question: 'What is the output of [x*2 for x in range(4) if x % 2 == 0]?',
        options: ['[0, 2, 4, 6]', '[0, 4]', '[0, 2]', '[4, 8]'],
        correctIndex: 1,
        explanation: 'Even numbers in range(4) are 0 and 2. Multiplying by 2 produces [0, 4].'
      },
      {
        id: 'py-m2',
        skill: 'python',
        difficulty: 'medium',
        topic: 'generators',
        question: 'What is the primary memory advantage of a generator with yield over a normal list return?',
        options: [
          'Generators run in parallel on all CPU cores',
          'Generators compute items lazily on demand, avoiding storing the full list in memory',
          'Generators compile into C extensions automatically',
          'Generators automatically compress data using gzip'
        ],
        correctIndex: 1,
        explanation: 'yield produces an iterator that evaluates one item at a time, keeping memory overhead constant O(1).'
      },
      {
        id: 'py-m3',
        skill: 'python',
        difficulty: 'medium',
        topic: 'context-managers',
        question: 'Which dunder methods must a class define to implement the with context manager protocol?',
        options: [
          '__open__ and __close__',
          '__enter__ and __exit__',
          '__start__ and __finish__',
          '__init__ and __del__'
        ],
        correctIndex: 1,
        explanation: '__enter__ handles acquisition and __exit__ guarantees cleanup, even if an exception occurs.'
      },
      {
        id: 'py-m4',
        skill: 'python',
        difficulty: 'medium',
        topic: 'shallow-copy',
        question: 'If b = copy.copy(a) on a nested list a = [[1, 2], [3]], what happens if you set a[0][0] = 99?',
        options: [
          'b is unaffected and stays [[1, 2], [3]]',
          'b[0][0] also becomes 99 because inner lists share references',
          'Raises an AttributeError',
          'Python creates an immutable copy automatically'
        ],
        correctIndex: 1,
        explanation: 'Shallow copies copy only the outer container; nested mutable objects remain shared between copies.'
      },
      {
        id: 'py-m5',
        skill: 'python',
        difficulty: 'medium',
        topic: 'decorators',
        question: 'What is a Python decorator at its core?',
        options: [
          'A graphical styling tool for Python scripts',
          'A higher-order function that takes a function and returns a modified function',
          'A class that enforces the Singleton pattern',
          'A type annotation that forces static compilation'
        ],
        correctIndex: 1,
        explanation: 'Decorators wrap a callable to add pre/post-execution behavior without altering its original definition.'
      }
    ],
    hard: [
      {
        id: 'py-h1',
        skill: 'python',
        difficulty: 'hard',
        topic: 'gil-concurrency',
        question: 'What constraint does CPython Global Interpreter Lock (GIL) place on threading?',
        options: [
          'Disallows opening multiple network sockets',
          'Restricts execution to one thread running Python bytecode at a time, limiting CPU-bound speedups',
          'Requires all functions to be declared async',
          'Prevents Python from executing on 64-bit systems'
        ],
        correctIndex: 1,
        explanation: 'The GIL prevents multi-threaded CPU parallelization in CPython; multiprocessing is required for CPU parallelism.'
      },
      {
        id: 'py-h2',
        skill: 'python',
        difficulty: 'hard',
        topic: 'metaclasses',
        question: 'In Python object model, what is the default metaclass that creates classes?',
        options: ['object', 'type', 'ClassFactory', 'MetaBase'],
        correctIndex: 1,
        explanation: 'In Python, type is the default metaclass responsible for constructing class objects.'
      },
      {
        id: 'py-h3',
        skill: 'python',
        difficulty: 'hard',
        topic: 'descriptors',
        question: 'Which triad of methods comprises the Python descriptor protocol?',
        options: [
          '__get__, __set__, __delete__',
          '__read__, __write__, __close__',
          '__getattr__, __setattr__, __delattr__',
          '__enter__, __exit__, __iter__'
        ],
        correctIndex: 0,
        explanation: 'Defining __get__, __set__, or __delete__ on an attribute creates a managed descriptor object.'
      },
      {
        id: 'py-h4',
        skill: 'python',
        difficulty: 'hard',
        topic: 'cyclic-gc',
        question: 'How does CPython reclaim memory from circular reference cycles (a.b = b; b.a = a)?',
        options: [
          'Reference counting alone handles all circular graphs',
          'A generational cyclic garbage collector identifies and sweeps isolated circular references',
          'The OS cleans it up only on script exit',
          'Circular references cause permanent uncollectable leaks'
        ],
        correctIndex: 1,
        explanation: 'CPython pairs reference counting with a generational cyclic GC that detects unreferenced self-contained loops.'
      },
      {
        id: 'py-h5',
        skill: 'python',
        difficulty: 'hard',
        topic: 'asyncio-blocking',
        question: 'What occurs if a coroutine executes time.sleep(3) instead of await asyncio.sleep(3)?',
        options: [
          'asyncio switches to a background worker thread seamlessly',
          'The entire single-threaded event loop freezes for 3 seconds, blocking all other scheduled tasks',
          'Raises an immediate BlockingIOError exception',
          'The sleep is skipped automatically'
        ],
        correctIndex: 1,
        explanation: 'time.sleep() blocks the OS thread running the event loop, freezing all concurrent coroutines.'
      }
    ]
  },

  sql: {
    easy: [
      {
        id: 'sql-e1',
        skill: 'sql',
        difficulty: 'easy',
        topic: 'where-filter',
        question: 'Which SQL clause filters records before any grouping or aggregations take place?',
        options: ['HAVING', 'WHERE', 'ORDER BY', 'GROUP BY'],
        correctIndex: 1,
        explanation: 'WHERE filters rows before aggregation, whereas HAVING filters aggregated buckets after GROUP BY.'
      },
      {
        id: 'sql-e2',
        skill: 'sql',
        difficulty: 'easy',
        topic: 'sorting',
        question: 'Which query clause sorts records from highest to lowest salary?',
        options: ['ORDER BY salary DESC', 'SORT BY salary DOWN', 'GROUP BY salary DESC', 'ORDER BY salary HIGHEST'],
        correctIndex: 0,
        explanation: 'ORDER BY column DESC orders records in descending (highest-to-lowest) order.'
      },
      {
        id: 'sql-e3',
        skill: 'sql',
        difficulty: 'easy',
        topic: 'distinct',
        question: 'Which keyword eliminates duplicate rows from a query result set?',
        options: ['UNIQUE', 'DISTINCT', 'DIFFERENT', 'SINGLE'],
        correctIndex: 1,
        explanation: 'SELECT DISTINCT returns unique values, removing duplicate rows from the output.'
      },
      {
        id: 'sql-e4',
        skill: 'sql',
        difficulty: 'easy',
        topic: 'null-handling',
        question: 'What is the correct SQL syntax to test whether a column val has no data?',
        options: ['val = NULL', 'val IS NULL', 'val == NULL', 'val.isNull()'],
        correctIndex: 1,
        explanation: 'NULL represents an unknown state; equality (= NULL) yields UNKNOWN, so IS NULL must be used.'
      },
      {
        id: 'sql-e5',
        skill: 'sql',
        difficulty: 'easy',
        topic: 'primary-keys',
        question: 'What two fundamental constraints are enforced on a relational PRIMARY KEY?',
        options: ['NOT NULL and UNIQUE', 'FOREIGN KEY and INDEX', 'DEFAULT 0 and CHECK', 'AUTO_INCREMENT only'],
        correctIndex: 0,
        explanation: 'A primary key must uniquely identify each row and therefore cannot contain duplicates or NULL values.'
      }
    ],
    medium: [
      {
        id: 'sql-m1',
        skill: 'sql',
        difficulty: 'medium',
        topic: 'joins',
        question: 'What does a LEFT JOIN return when a left-table record has no matching record in the right table?',
        options: [
          'The left row is dropped from the result set',
          'The left row is returned with NULL in all right-table columns',
          'Throws a foreign key integrity error',
          'Generates a Cartesian cross product'
        ],
        correctIndex: 1,
        explanation: 'LEFT JOIN preserves all rows from the left table, filling unmatched right-side attributes with NULL.'
      },
      {
        id: 'sql-m2',
        skill: 'sql',
        difficulty: 'medium',
        topic: 'having-aggregation',
        question: 'Which query correctly finds departments with an average salary greater than 60,000?',
        options: [
          'SELECT dept, AVG(sal) FROM emp WHERE AVG(sal) > 60000 GROUP BY dept;',
          'SELECT dept, AVG(sal) FROM emp GROUP BY dept HAVING AVG(sal) > 60000;',
          'SELECT dept, AVG(sal) FROM emp HAVING sal > 60000;',
          'SELECT dept FROM emp WHERE sal > 60000;'
        ],
        correctIndex: 1,
        explanation: 'Aggregates like AVG() cannot appear in a WHERE clause; they must be filtered via HAVING after GROUP BY.'
      },
      {
        id: 'sql-m3',
        skill: 'sql',
        difficulty: 'medium',
        topic: 'acid-isolation',
        question: 'What does the Isolation property in ACID database transactions guarantee?',
        options: [
          'Database backups are kept on physically isolated drives',
          'Concurrent transactions execute without viewing each other uncommitted intermediate changes',
          'Either all operations commit or all roll back',
          'Committed updates survive hardware power failure'
        ],
        correctIndex: 1,
        explanation: 'Isolation ensures concurrent transactions execute without cross-contaminating intermediate states.'
      },
      {
        id: 'sql-m4',
        skill: 'sql',
        difficulty: 'medium',
        topic: 'b-tree-indexes',
        question: 'What is the primary operational trade-off of maintaining secondary B-Tree indexes?',
        options: [
          'Accelerates SELECT queries but adds write overhead on INSERT, UPDATE, and DELETE',
          'Slows down SELECT queries but speeds up bulk inserts',
          'Eliminates the need for primary keys',
          'Disables relational table constraints'
        ],
        correctIndex: 0,
        explanation: 'Indexes provide fast seek times for reads, but every write must update the table and index trees.'
      },
      {
        id: 'sql-m5',
        skill: 'sql',
        difficulty: 'medium',
        topic: 'subqueries-exists',
        question: 'Why is WHERE EXISTS (SELECT 1 ...) frequently faster than WHERE id IN (SELECT id ...)?',
        options: [
          'EXISTS short-circuits as soon as the first matching record is found',
          'IN queries cannot use B-Tree indexes',
          'EXISTS runs client-side instead of server-side',
          'IN queries require table locks'
        ],
        correctIndex: 0,
        explanation: 'EXISTS returns a boolean immediately upon finding the first match without scanning further.'
      }
    ],
    hard: [
      {
        id: 'sql-h1',
        skill: 'sql',
        difficulty: 'hard',
        topic: 'window-functions',
        question: 'When two rows tie for 1st place, what values do RANK() and DENSE_RANK() assign to the 3rd row?',
        options: [
          'RANK() gives 3; DENSE_RANK() gives 2',
          'RANK() gives 2; DENSE_RANK() gives 3',
          'Both assign 2',
          'Both assign 3'
        ],
        correctIndex: 0,
        explanation: 'RANK() skips rank numbers after ties (1, 1, 3), whereas DENSE_RANK() leaves no gaps (1, 1, 2).'
      },
      {
        id: 'sql-h2',
        skill: 'sql',
        difficulty: 'hard',
        topic: 'isolation-levels',
        question: 'Which transaction isolation level eliminates dirty reads, non-repeatable reads, AND phantom reads?',
        options: ['READ UNCOMMITTED', 'READ COMMITTED', 'REPEATABLE READ', 'SERIALIZABLE'],
        correctIndex: 3,
        explanation: 'SERIALIZABLE is the strictest isolation level, preventing phantom rows through range locks or snapshot serializability.'
      },
      {
        id: 'sql-h3',
        skill: 'sql',
        difficulty: 'hard',
        topic: 'recursive-ctes',
        question: 'What two components are mandatory in a WITH RECURSIVE Common Table Expression?',
        options: [
          'An anchor member and a recursive member connected by UNION or UNION ALL',
          'A cursor and a while loop',
          'A trigger and an insert procedure',
          'A materialized view and an index'
        ],
        correctIndex: 0,
        explanation: 'A recursive CTE needs an initial base anchor query and a recursive step referencing the CTE itself.'
      },
      {
        id: 'sql-h4',
        skill: 'sql',
        difficulty: 'hard',
        topic: 'sargability',
        question: 'Why does WHERE YEAR(created_at) = 2026 fail to use an index on created_at?',
        options: [
          'Wrapping a column in a scalar function makes the predicate non-SARGable, forcing a full scan',
          'YEAR() is not an ANSI SQL function',
          'Indexes only support string columns',
          'Date columns cannot be indexed in relational databases'
        ],
        correctIndex: 0,
        explanation: 'Functions applied to columns prevent B-Tree index range seeks. The SARGable form is created_at >= "2026-01-01" AND created_at < "2027-01-01".'
      },
      {
        id: 'sql-h5',
        skill: 'sql',
        difficulty: 'hard',
        topic: 'explain-analyze',
        question: 'In an EXPLAIN execution plan, what does a Seq Scan (Sequential Scan) on a massive table signify?',
        options: [
          'The database used a hardware-accelerated index seek',
          'The database read every disk block sequentially because no index was usable or cost-effective',
          'The query completed directly from L1 CPU cache',
          'An in-memory hash table was generated'
        ],
        correctIndex: 1,
        explanation: 'A Sequential Scan reads all table blocks sequentially from disk, causing I/O bottlenecks on large tables.'
      }
    ]
  },
  react: {
    easy: [
      {
        id: 'react-e1',
        skill: 'react',
        difficulty: 'easy',
        topic: 'jsx-syntax',
        question: 'What is JSX in React?',
        options: [
          'A proprietary templating engine that replaces HTML in browser runtimes',
          'A syntax extension for JavaScript that compiles to React.createElement calls',
          'A database query language for fetching component data',
          'A CSS preprocessor designed exclusively for React'
        ],
        correctIndex: 1,
        explanation: 'JSX allows writing HTML-like structures in JavaScript, which Babel/transpilers compile into React.createElement calls.'
      },
      {
        id: 'react-e2',
        skill: 'react',
        difficulty: 'easy',
        topic: 'usestate-hook',
        question: 'Which Hook allows functional components to declare and manage internal state?',
        options: ['useEffect', 'useState', 'useRef', 'useContext'],
        correctIndex: 1,
        explanation: 'useState declares a state variable and provides an updater function to trigger re-renders.'
      },
      {
        id: 'react-e3',
        skill: 'react',
        difficulty: 'easy',
        topic: 'props-unidirectional',
        question: 'How is data passed from a parent component to a child component in React?',
        options: [
          'Through bidirectional DOM event bubbling',
          'Via immutable Props passed down the component hierarchy',
          'By mutating the global window.state object',
          'Using the localStorage API exclusively'
        ],
        correctIndex: 1,
        explanation: 'React enforces unidirectional data flow where parent components pass data downward via immutable props.'
      },
      {
        id: 'react-e4',
        skill: 'react',
        difficulty: 'easy',
        topic: 'keys-reconciliation',
        question: 'Why should list items in React always have a unique "key" prop?',
        options: [
          'To apply unique CSS styles to every list element',
          'To enable React reconciliation to identify which items changed, added, or removed',
          'To automatically sort the array alphabetically in memory',
          'To register browser click event listeners on list items'
        ],
        correctIndex: 1,
        explanation: 'Keys give list items stable identities so React avoids costly re-renders and accurately mutates DOM elements.'
      },
      {
        id: 'react-e5',
        skill: 'react',
        difficulty: 'easy',
        topic: 'useeffect-mount',
        question: 'When does a useEffect(() => {}, []) with an empty dependency array execute?',
        options: [
          'On every single render of the component',
          'Only once after the initial render (component mount)',
          'Before the initial DOM elements are generated',
          'Only when the component is unmounted from the DOM'
        ],
        correctIndex: 1,
        explanation: 'An empty dependency array indicates no variables trigger re-execution, running the effect only once on mount.'
      }
    ],
    medium: [
      {
        id: 'react-m1',
        skill: 'react',
        difficulty: 'medium',
        topic: 'usecallback-memoization',
        question: 'What is the primary purpose of the useCallback Hook?',
        options: [
          'To cache the return value of an expensive mathematical computation',
          'To return a memoized callback instance that prevents unnecessary child re-renders',
          'To asynchronously fetch data from remote REST endpoints',
          'To register global browser keyboard shortcuts'
        ],
        correctIndex: 1,
        explanation: 'useCallback memoizes a function definition across renders unless its declared dependencies change.'
      },
      {
        id: 'react-m2',
        skill: 'react',
        difficulty: 'medium',
        topic: 'batching-react18',
        question: 'What is "Automatic Batching" introduced in React 18?',
        options: [
          'Batching HTTP network requests across all open browser tabs',
          'Grouping multiple state updates into a single re-render even inside promises and timeouts',
          'Compiling multiple JSX files into a single bundle chunk at build time',
          'Automatically deferring CSS animations until the page finishes loading'
        ],
        correctIndex: 1,
        explanation: 'React 18 batches state updates inside promises, setTimeout, and native event handlers to minimize re-renders.'
      },
      {
        id: 'react-m3',
        skill: 'react',
        difficulty: 'medium',
        topic: 'functional-updates',
        question: 'When updating state that depends on the current state value, what is the best practice?',
        options: [
          'Directly assign the new value: state = state + 1',
          'Pass an updater function: setState(prev => prev + 1)',
          'Read the value synchronously from the DOM before updating',
          'Wrap the state assignment inside a while loop until updated'
        ],
        correctIndex: 1,
        explanation: 'Functional state updates guarantee access to the latest state snapshot regardless of asynchronous batching.'
      },
      {
        id: 'react-m4',
        skill: 'react',
        difficulty: 'medium',
        topic: 'controlled-inputs',
        question: 'What distinguishes a "Controlled Component" in React form handling?',
        options: [
          'The input form values are entirely managed and updated via React state',
          'The input value is read directly from the DOM using standard HTML event targets',
          'The component requires an external Redux store to function',
          'The browser automatically disables user typing when validation errors occur'
        ],
        correctIndex: 0,
        explanation: 'A controlled component derives its input value directly from React state and updates it via onChange handlers.'
      },
      {
        id: 'react-m5',
        skill: 'react',
        difficulty: 'medium',
        topic: 'usememo-optimization',
        question: 'How does useMemo differ from useCallback?',
        options: [
          'useMemo caches calculated values; useCallback caches function definitions',
          'useMemo runs synchronously before mount; useCallback runs asynchronously after render',
          'useMemo is only usable in class components; useCallback is for functional components',
          'There is no technical difference; they are aliases for the same hook'
        ],
        correctIndex: 0,
        explanation: 'useMemo caches the result of invoking a calculation, whereas useCallback returns the memoized function reference.'
      }
    ],
    hard: [
      {
        id: 'react-h1',
        skill: 'react',
        difficulty: 'hard',
        topic: 'fiber-architecture',
        question: 'What is the React Fiber architecture and what key capability did it introduce?',
        options: [
          'A WebAssembly compiler for converting JSX to native C++ code',
          'A complete rewrite of the reconciliation engine enabling interruptible, prioritized rendering',
          'A client-side database layer designed to replace Redux and Context API',
          'A multi-threaded worker pipeline executing in Node.js backend processes'
        ],
        correctIndex: 1,
        explanation: 'Fiber breaks reconciliation work into incremental units, allowing React to pause and prioritize high-urgency user inputs.'
      },
      {
        id: 'react-h2',
        skill: 'react',
        difficulty: 'hard',
        topic: 'uselayouteffect-timing',
        question: 'When does useLayoutEffect fire relative to browser DOM mutations and painting?',
        options: [
          'Asynchronously after the browser has completed painting screen pixels',
          'Synchronously after all DOM mutations but before the browser paints to screen',
          'Before the Virtual DOM is generated during the render phase',
          'Only after the user triggers a click or scroll interaction'
        ],
        correctIndex: 1,
        explanation: 'useLayoutEffect runs synchronously before browser paint, making it suitable for reading layout geometry and preventing visual flicker.'
      },
      {
        id: 'react-h3',
        skill: 'react',
        difficulty: 'hard',
        topic: 'usetransition-concurrency',
        question: 'What is the primary role of the useTransition Hook in React 18 Concurrent features?',
        options: [
          'To apply smooth CSS transitions between page navigation routes',
          'To mark state updates as non-urgent transitions, keeping urgent inputs responsive',
          'To automatically convert synchronous code into web worker threads',
          'To throttle network requests over slow mobile connections'
        ],
        correctIndex: 1,
        explanation: 'useTransition marks state updates as non-blocking transitions so critical interactions (like typing) remain immediately responsive.'
      },
      {
        id: 'react-h4',
        skill: 'react',
        difficulty: 'hard',
        topic: 'dependency-cycles',
        question: 'What causes an infinite re-render loop inside a useEffect hook?',
        options: [
          'Leaving the dependency array completely empty ([])',
          'Updating a state variable that is included in the effect\'s dependency array without a break condition',
          'Calling console.log inside the effect cleanup callback',
          'Using async/await in external helper functions'
        ],
        correctIndex: 1,
        explanation: 'Mutating state inside an effect that depends on that same state triggers continuous re-render and re-execution cycles.'
      },
      {
        id: 'react-h5',
        skill: 'react',
        difficulty: 'hard',
        topic: 'synthetic-events-delegation',
        question: 'In React 17 and 18, where does React attach its root event listeners for synthetic events?',
        options: [
          'Directly to the window global object',
          'Directly to the root DOM container where ReactDOM.render/createRoot was invoked',
          'Directly to document.documentElement',
          'Individually to every individual HTML element in the DOM tree'
        ],
        correctIndex: 1,
        explanation: 'React 17 shifted event delegation from document to the root DOM node container, isolating micro-frontends cleanly.'
      }
    ]
  },
  'node.js': {
    easy: [
      {
        id: 'node-e1',
        skill: 'node.js',
        difficulty: 'easy',
        topic: 'v8-runtime',
        question: 'What is the role of Google V8 in the Node.js runtime environment?',
        options: [
          'A package manager for downloading third-party modules',
          'The high-performance JavaScript engine that compiles and executes JS to machine code',
          'A multi-threaded database driver for PostgreSQL and MongoDB',
          'A reverse proxy server handling incoming HTTP socket traffic'
        ],
        correctIndex: 1,
        explanation: 'V8 is Google\'s open-source C++ engine that parses and executes JavaScript in Node.js and Chrome.'
      },
      {
        id: 'node-e2',
        skill: 'node.js',
        difficulty: 'easy',
        topic: 'fs-module',
        question: 'Which built-in core module in Node.js is used to interact with the file system?',
        options: ['path', 'fs', 'os', 'http'],
        correctIndex: 1,
        explanation: 'The "fs" (file system) core module provides synchronous and asynchronous file I/O methods.'
      },
      {
        id: 'node-e3',
        skill: 'node.js',
        difficulty: 'easy',
        topic: 'process-env',
        question: 'Which global object is used in Node.js to access environment variables?',
        options: ['window.env', 'global.environment', 'process.env', 'system.config'],
        correctIndex: 2,
        explanation: 'process.env is a global object injected by the operating system containing runtime environment keys.'
      },
      {
        id: 'node-e4',
        skill: 'node.js',
        difficulty: 'easy',
        topic: 'commonjs-exports',
        question: 'How do you export a function or object in standard CommonJS module syntax?',
        options: ['export default', 'module.exports = ...', 'public return', 'global.share()'],
        correctIndex: 1,
        explanation: 'CommonJS uses module.exports (or exports) to define exported public APIs from a file.'
      },
      {
        id: 'node-e5',
        skill: 'node.js',
        difficulty: 'easy',
        topic: 'npm-scripts',
        question: 'Which command initializes a new package.json file with default values?',
        options: ['npm create-empty', 'npm init -y', 'node --setup', 'npm install --all'],
        correctIndex: 1,
        explanation: 'npm init -y auto-populates package.json using default values without interactive terminal prompts.'
      }
    ],
    medium: [
      {
        id: 'node-m1',
        skill: 'node.js',
        difficulty: 'medium',
        topic: 'event-loop-architecture',
        question: 'How does Node.js handle high-concurrency non-blocking I/O on a single main thread?',
        options: [
          'By spawning a new operating system thread for each incoming HTTP request',
          'Via the libuv Event Loop which delegates I/O polling to the operating system kernel',
          'By pausing all background timers until network requests respond',
          'By compiling JavaScript code directly into multithreaded assembly at runtime'
        ],
        correctIndex: 1,
        explanation: 'Node.js uses an event loop built on libuv to execute non-blocking operations asynchronously on a single thread.'
      },
      {
        id: 'node-m2',
        skill: 'node.js',
        difficulty: 'medium',
        topic: 'streams-buffering',
        question: 'What is the performance advantage of using Node.js Streams when reading multi-gigabyte files?',
        options: [
          'Streams compress files automatically into zip format in memory',
          'Streams read data in small chunks without consuming large amounts of RAM buffer memory',
          'Streams bypass operating system disk security checks for speed',
          'Streams encrypt every byte using AES-256 automatically'
        ],
        correctIndex: 1,
        explanation: 'Streams process data piece by piece without loading the entire payload into heap memory, preventing Out-Of-Memory crashes.'
      },
      {
        id: 'node-m3',
        skill: 'node.js',
        difficulty: 'medium',
        topic: 'nexttick-vs-setimmediate',
        question: 'What is the difference between process.nextTick() and setImmediate()?',
        options: [
          'process.nextTick runs after current phase; setImmediate runs before timers',
          'process.nextTick runs immediately before next Event Loop phase; setImmediate runs in Check phase',
          'setImmediate runs synchronously; process.nextTick runs in an external worker thread',
          'There is no difference; they are interchangeable aliases'
        ],
        correctIndex: 1,
        explanation: 'process.nextTick queues microtasks executed before the event loop advances; setImmediate queues in the Check phase.'
      },
      {
        id: 'node-m4',
        skill: 'node.js',
        difficulty: 'medium',
        topic: 'libuv-threadpool',
        question: 'What is the default thread pool size in libuv (used for fs, crypto, dns lookups)?',
        options: ['1 thread', '4 threads', '16 threads', 'Unlimited dynamic threads'],
        correctIndex: 1,
        explanation: 'The default libuv thread pool size is 4, configurable via the UV_THREADPOOL_SIZE environment variable.'
      },
      {
        id: 'node-m5',
        skill: 'node.js',
        difficulty: 'medium',
        topic: 'worker-threads',
        question: 'What is the primary architectural difference between Worker Threads and Child Processes in Node.js?',
        options: [
          'Worker Threads share memory via SharedArrayBuffer; Child Processes have isolated memory spaces',
          'Child Processes cannot communicate over IPC sockets',
          'Worker Threads run only in the browser, not on the server',
          'Child Processes cannot execute asynchronous code'
        ],
        correctIndex: 0,
        explanation: 'worker_threads share the same process and can share memory, whereas child_process creates independent OS processes.'
      }
    ],
    hard: [
      {
        id: 'node-h1',
        skill: 'node.js',
        difficulty: 'hard',
        topic: 'stream-backpressure',
        question: 'What is "Backpressure" in Node.js streams and how is it resolved?',
        options: [
          'A network error when an upstream server closes socket connections prematurely',
          'When a readable stream emits data faster than the writable stream can consume it, handled via .pipe() or drain events',
          'A memory leak caused by unreferenced timer callbacks in the timer phase',
          'A CPU freeze when garbage collection pauses the main thread for over 100ms'
        ],
        correctIndex: 1,
        explanation: 'Backpressure occurs when writes buffer faster than consumption; stream.pipe() automatically pauses reads until "drain" fires.'
      },
      {
        id: 'node-h2',
        skill: 'node.js',
        difficulty: 'hard',
        topic: 'event-loop-phases',
        question: 'In what exact phase of the libuv Event Loop are incoming I/O connections and read callbacks processed?',
        options: ['Timers phase', 'Poll phase', 'Close callbacks phase', 'Check phase'],
        correctIndex: 1,
        explanation: 'The Poll phase calculates how long to block and poll for I/O events, then processes events in the poll queue.'
      },
      {
        id: 'node-h3',
        skill: 'node.js',
        difficulty: 'hard',
        topic: 'unhandled-rejections',
        question: 'In modern Node.js (v15+), what is the default behavior when an unhandled promise rejection occurs?',
        options: [
          'A silent warning is logged to stdout while the server keeps running uninterrupted',
          'The Node.js process terminates with a non-zero exit code (crash)',
          'The promise is automatically retried up to 3 times before failing',
          'The event loop resets its internal queues and drops all pending requests'
        ],
        correctIndex: 1,
        explanation: 'Modern Node.js crashes with an uncaughtException error when promise rejections are left unhandled.'
      },
      {
        id: 'node-h4',
        skill: 'node.js',
        difficulty: 'hard',
        topic: 'cluster-module',
        question: 'How does the Node.js "cluster" module enable horizontal scaling on multi-core servers?',
        options: [
          'It compiles the server into WebAssembly to execute in parallel on GPU cores',
          'It forks multiple worker processes that share the same master server listening port',
          'It creates an in-memory Redis cluster automatically inside the V8 engine',
          'It delegates socket handling to an external Nginx proxy automatically'
        ],
        correctIndex: 1,
        explanation: 'The cluster module uses child processes with shared server ports to distribute incoming traffic across CPU cores.'
      },
      {
        id: 'node-h5',
        skill: 'node.js',
        difficulty: 'hard',
        topic: 'eventemitter-memory-leaks',
        question: 'Why does Node.js EventEmitter print a warning when adding more than 10 listeners to an event?',
        options: [
          'Because the operating system kernel cannot dispatch more than 10 events per second',
          'To alert developers to potential memory leaks where listeners are added repeatedly without removal',
          'Because arrays in V8 cannot hold more than 10 elements without reallocating heap memory',
          'To prevent CPU throttling enforced by cloud hosting providers'
        ],
        correctIndex: 1,
        explanation: 'The defaultMaxListeners threshold (10) guards against memory leaks caused by repeatedly binding anonymous closures.'
      }
    ]
  },
  html: {
    easy: [
      {
        id: 'html-e1',
        skill: 'html',
        difficulty: 'easy',
        topic: 'heading-hierarchy',
        question: 'Which HTML tag represents the most important top-level heading on a web page?',
        options: ['<head>', '<h6>', '<h1>', '<header>'],
        correctIndex: 2,
        explanation: '<h1> denotes the primary heading of the document hierarchy and should typically appear once per page for SEO and accessibility.'
      },
      {
        id: 'html-e2',
        skill: 'html',
        difficulty: 'easy',
        topic: 'anchor-href',
        question: 'Which attribute on an anchor tag (<a>) specifies the hyperlink target destination URL?',
        options: ['src', 'link', 'href', 'target-url'],
        correctIndex: 2,
        explanation: 'The href (hypertext reference) attribute specifies the destination URL or fragment identifier.'
      },
      {
        id: 'html-e3',
        skill: 'html',
        difficulty: 'easy',
        topic: 'image-alt-text',
        question: 'What is the primary accessibility and fallback purpose of the "alt" attribute on an <img> tag?',
        options: [
          'To define the image file type extension',
          'To provide descriptive text for screen readers and when images fail to load',
          'To set the hover tooltip popup text in all desktop browsers',
          'To encrypt the image data before sending over HTTP'
        ],
        correctIndex: 1,
        explanation: 'The alt attribute conveys the image\'s meaning to visually impaired users and displays when the image source fails.'
      },
      {
        id: 'html-e4',
        skill: 'html',
        difficulty: 'easy',
        topic: 'lists-ordered',
        question: 'Which HTML tag creates a numbered (ordered) list?',
        options: ['<ul>', '<ol>', '<li>', '<list>'],
        correctIndex: 1,
        explanation: '<ol> defines an ordered list where browser agents automatically prefix items with sequential numbers.'
      },
      {
        id: 'html-e5',
        skill: 'html',
        difficulty: 'easy',
        topic: 'meta-tags',
        question: 'Where should document metadata tags (<meta>) be placed in an HTML document?',
        options: ['Inside the <head> section', 'At the end of the <body>', 'Directly before the <!DOCTYPE html>', 'Inside the <footer> element'],
        correctIndex: 0,
        explanation: 'Document metadata tags must reside within the <head> element to configure character encoding, viewport, and SEO tags.'
      }
    ],
    medium: [
      {
        id: 'html-m1',
        skill: 'html',
        difficulty: 'medium',
        topic: 'semantic-article-vs-section',
        question: 'What is the semantic distinction between <article> and <section> in HTML5?',
        options: [
          '<article> represents self-contained content that can be distributed independently; <section> groups thematic content',
          '<article> is exclusively for news blog posts; <section> is for e-commerce products only',
          '<section> has inherent accessibility roles; <article> has no accessibility support',
          'There is no semantic difference; they are styling synonyms'
        ],
        correctIndex: 0,
        explanation: '<article> denotes independently reusable or syndicable content (e.g., a blog post, comment, or card).'
      },
      {
        id: 'html-m2',
        skill: 'html',
        difficulty: 'medium',
        topic: 'script-defer-execution',
        question: 'How does the "defer" attribute alter how a <script> tag executes?',
        options: [
          'Downloads script in parallel and executes it immediately, pausing HTML parsing',
          'Downloads in parallel and executes only after the HTML document has been fully parsed',
          'Executes the script on a separate background thread in WebAssembly',
          'Postpones script downloading until the user scrolls past the fold'
        ],
        correctIndex: 1,
        explanation: 'defer downloads scripts asynchronously while parsing continues, then executes in document order before DOMContentLoaded.'
      },
      {
        id: 'html-m3',
        skill: 'html',
        difficulty: 'medium',
        topic: 'aria-labels',
        question: 'What is the primary utility of the "aria-label" attribute in HTML accessibility?',
        options: [
          'It renders a visible floating tooltip badge on hover',
          'It provides an invisible string label for assistive technologies when visible text is absent (e.g., icon buttons)',
          'It translates text into other languages automatically using browser AI',
          'It alters the tab order sequence during keyboard navigation'
        ],
        correctIndex: 1,
        explanation: 'aria-label assigns an accessible name to interactive elements that lack visible text, such as icon-only buttons.'
      },
      {
        id: 'html-m4',
        skill: 'html',
        difficulty: 'medium',
        topic: 'responsive-picture-element',
        question: 'What capability does the HTML5 <picture> element offer over a standard <img> tag?',
        options: [
          'It renders 3D WebGL scenes without JavaScript',
          'It serves different image assets based on media queries (art direction) and modern image formats (AVIF/WebP)',
          'It automatically resizes server-side images using AI compression',
          'It allows playing video files inside an image container'
        ],
        correctIndex: 1,
        explanation: '<picture> uses child <source> elements to support art direction and deliver optimized formats based on viewport and browser support.'
      },
      {
        id: 'html-m5',
        skill: 'html',
        difficulty: 'medium',
        topic: 'form-validation-attributes',
        question: 'Which HTML5 attribute pattern enforces client-side regex validation on input fields without JavaScript?',
        options: ['validate="regex"', 'pattern="[A-Za-z0-9]+"', 'rule="alphanumeric"', 'check="regex"'],
        correctIndex: 1,
        explanation: 'The pattern attribute specifies a JavaScript regular expression that the input\'s value must match before form submission.'
      }
    ],
    hard: [
      {
        id: 'html-h1',
        skill: 'html',
        difficulty: 'hard',
        topic: 'reverse-tabnabbing-rel',
        question: 'Why should links with target="_blank" always include rel="noopener noreferrer"?',
        options: [
          'To prevent the new tab from executing JavaScript code entirely',
          'To prevent the opened page from controlling the source window via window.opener (reverse tabnabbing) and leaking referrer headers',
          'To instruct search engine crawlers not to index the destination website',
          'To enforce SSL encryption on the external link target'
        ],
        correctIndex: 1,
        explanation: 'Without noopener, the opened page can access window.opener and navigate the original tab to a phishing clone.'
      },
      {
        id: 'html-h2',
        skill: 'html',
        difficulty: 'hard',
        topic: 'async-vs-defer-parsing',
        question: 'What is the key execution order difference between <script async> and <script defer>?',
        options: [
          'defer scripts preserve document order; async scripts execute as soon as downloaded regardless of order',
          'async scripts guarantee execution order; defer scripts run in arbitrary order',
          'defer scripts execute before the HTML body starts parsing; async scripts run on window.onload',
          'Both execute at identical times; the names are legacy aliases'
        ],
        correctIndex: 0,
        explanation: 'async scripts execute unpredictably as soon as downloaded; defer scripts preserve document ordering after DOM parsing.'
      },
      {
        id: 'html-h3',
        skill: 'html',
        difficulty: 'hard',
        topic: 'shadow-dom-encapsulation',
        question: 'In Web Components, how does the Shadow DOM maintain style and DOM encapsulation?',
        options: [
          'By compiling styles into an iframe sandbox with a separate origin',
          'By scoping internal DOM trees and CSS rules so global page styles do not bleed in or out',
          'By encrypting HTML element tags using browser public-key cryptography',
          'By disabling all DOM manipulation APIs for child elements'
        ],
        correctIndex: 1,
        explanation: 'Shadow DOM attaches a scoped sub-tree to an element, shielding internal markup and CSS from outer document interference.'
      },
      {
        id: 'html-h4',
        skill: 'html',
        difficulty: 'hard',
        topic: 'viewport-meta-scale',
        question: 'What happens on mobile devices if <meta name="viewport" content="width=device-width, initial-scale=1.0"> is omitted?',
        options: [
          'The mobile browser renders the page as a 980px desktop canvas and zooms out, making text tiny and unreadable',
          'The mobile browser refuses to render the page and returns an HTTP 400 error',
          'The page automatically converts into an Android native APK layout',
          'All responsive CSS media queries evaluate to true simultaneously'
        ],
        correctIndex: 0,
        explanation: 'Without the viewport meta tag, mobile browsers default to a desktop virtual viewport (~980px) and scale it down to fit screen width.'
      },
      {
        id: 'html-h5',
        skill: 'html',
        difficulty: 'hard',
        topic: 'contenteditable-xss',
        question: 'What critical security vulnerability must developers sanitize against when allowing user input in contenteditable elements?',
        options: [
          'Cross-Site Scripting (XSS) via injected <script> or event handler attributes inside raw HTML',
          'SQL Injection into browser localStorage tables',
          'DNS Spoofing on outgoing form actions',
          'Denial of Service due to infinite font-size recursion'
        ],
        correctIndex: 0,
        explanation: 'contenteditable generates HTML nodes, allowing malicious actors to inject unescaped markup and execute XSS payloads.'
      }
    ]
  },
  css: {
    easy: [
      {
        id: 'css-e1',
        skill: 'css',
        difficulty: 'easy',
        topic: 'box-model-layers',
        question: 'In the standard CSS box model, what is the layer located between padding and margin?',
        options: ['content', 'border', 'outline', 'shadow'],
        correctIndex: 1,
        explanation: 'The CSS box model consists of content, padding, border, and margin from inside out.'
      },
      {
        id: 'css-e2',
        skill: 'css',
        difficulty: 'easy',
        topic: 'color-property',
        question: 'Which CSS property defines the foreground text color of an element?',
        options: ['text-color', 'font-color', 'color', 'foreground'],
        correctIndex: 2,
        explanation: 'The "color" property sets the foreground text color of an element.'
      },
      {
        id: 'css-e3',
        skill: 'css',
        difficulty: 'easy',
        topic: 'id-selectors',
        question: 'Which CSS selector symbol targets an element with id="main-nav"?',
        options: ['.main-nav', '#main-nav', '*main-nav', '@main-nav'],
        correctIndex: 1,
        explanation: 'The hash (#) symbol denotes an ID selector in CSS; a dot (.) denotes a class selector.'
      },
      {
        id: 'css-e4',
        skill: 'css',
        difficulty: 'easy',
        topic: 'position-default',
        question: 'What is the default value of the "position" property in CSS for all HTML elements?',
        options: ['relative', 'absolute', 'static', 'fixed'],
        correctIndex: 2,
        explanation: 'The initial value of position is "static", positioning elements according to the normal page flow.'
      },
      {
        id: 'css-e5',
        skill: 'css',
        difficulty: 'easy',
        topic: 'flexbox-basics',
        question: 'Which display property creates a flex formatting context for laying out items in one dimension?',
        options: ['display: block', 'display: inline', 'display: flex', 'display: table'],
        correctIndex: 2,
        explanation: 'display: flex converts the container into a flex container, aligning children along the main or cross axis.'
      }
    ],
    medium: [
      {
        id: 'css-m1',
        skill: 'css',
        difficulty: 'medium',
        topic: 'box-sizing-borderbox',
        question: 'What is the primary effect of applying "box-sizing: border-box" to all elements?',
        options: [
          'Adds a default 2px solid black border around all page containers',
          'Includes padding and border within the element\'s declared width and height',
          'Prevents margins from ever collapsing with adjacent siblings',
          'Enforces 3D hardware acceleration on all CSS transforms'
        ],
        correctIndex: 1,
        explanation: 'border-box causes width/height to encompass content, padding, and border, making responsive sizing intuitive.'
      },
      {
        id: 'css-m2',
        skill: 'css',
        difficulty: 'medium',
        topic: 'flexbox-axes-alignment',
        question: 'In a flex container with flex-direction: row, which property aligns items along the main horizontal axis?',
        options: ['align-items', 'justify-content', 'align-content', 'place-self'],
        correctIndex: 1,
        explanation: 'justify-content distributes space along the main axis; align-items aligns items along the cross axis.'
      },
      {
        id: 'css-m3',
        skill: 'css',
        difficulty: 'medium',
        topic: 'grid-autofit-minmax',
        question: 'What does "grid-template-columns: repeat(auto-fit, minmax(280px, 1fr))" accomplish?',
        options: [
          'Forces exactly 4 equal columns on all screen widths',
          'Creates a responsive grid where columns automatically wrap when below 280px without media queries',
          'Centers a single column in the middle of the viewport',
          'Restricts grid items from exceeding 280px maximum height'
        ],
        correctIndex: 1,
        explanation: 'auto-fit with minmax produces responsive multi-column layouts that gracefully wrap as the viewport shrinks.'
      },
      {
        id: 'css-m4',
        skill: 'css',
        difficulty: 'medium',
        topic: 'specificity-hierarchy',
        question: 'Arrange the following CSS selectors in order of increasing specificity (lowest to highest):',
        options: [
          'Type Selector < Class Selector < ID Selector < Inline Style',
          'ID Selector < Class Selector < Type Selector < Inline Style',
          'Class Selector < Type Selector < Inline Style < ID Selector',
          'Inline Style < Type Selector < Class Selector < ID Selector'
        ],
        correctIndex: 0,
        explanation: 'Specificity cascades from elements (0,0,1) to classes (0,1,0) to IDs (1,0,0) to inline style attributes (1,0,0,0).'
      },
      {
        id: 'css-m5',
        skill: 'css',
        difficulty: 'medium',
        topic: 'rem-vs-em-units',
        question: 'What is the base reference point for 1rem in CSS?',
        options: [
          'The font-size of the immediate parent container',
          'The font-size of the root <html> document element',
          '1% of the total viewport height',
          'The device screen DPI resolution'
        ],
        correctIndex: 1,
        explanation: 'rem (root em) computes relative to the font-size of the root (<html>) element, typically 16px by default.'
      }
    ],
    hard: [
      {
        id: 'css-h1',
        skill: 'css',
        difficulty: 'hard',
        topic: 'stacking-context',
        question: 'Which of the following CSS declarations creates a brand-new Stacking Context for z-index layering?',
        options: [
          'opacity: 0.99 or transform: translateZ(0)',
          'font-weight: bold',
          'text-align: center',
          'background-color: transparent'
        ],
        correctIndex: 0,
        explanation: 'Elements with opacity < 1, transform, filter, isolation: isolate, or position: relative with z-index spawn a new stacking context.'
      },
      {
        id: 'css-h2',
        skill: 'css',
        difficulty: 'hard',
        topic: 'gpu-compositor-animations',
        question: 'Why is animating transform and opacity significantly more performant than animating top, left, or width?',
        options: [
          'They do not trigger browser Reflow (Layout) or Repaint, running entirely on the GPU Compositor thread',
          'They bypass browser frame-rate limits and render at 240Hz',
          'They automatically disable garbage collection during animation loops',
          'They compile CSS into native WebGL shaders during page load'
        ],
        correctIndex: 0,
        explanation: 'transform and opacity avoid expensive layout reflow and paint cycles by delegating rendering directly to GPU compositing.'
      },
      {
        id: 'css-h3',
        skill: 'css',
        difficulty: 'hard',
        topic: 'has-relational-selector',
        question: 'What unique problem does the CSS :has() pseudo-class solve?',
        options: [
          'It acts as a parent and previous-sibling selector by styling an element based on its descendant contents',
          'It checks if the user has an active internet connection',
          'It verifies whether the browser has JavaScript enabled',
          'It enforces that all form inputs have non-empty values before styling'
        ],
        correctIndex: 0,
        explanation: ':has() is the long-awaited "parent selector" allowing styles to apply to ancestors depending on child state.'
      },
      {
        id: 'css-h4',
        skill: 'css',
        difficulty: 'hard',
        topic: 'block-formatting-context',
        question: 'What is a Block Formatting Context (BFC) and what common layout issue does it resolve?',
        options: [
          'An isolated layout region that prevents internal margins from collapsing with external siblings and contains internal floats',
          'A responsive typography calculator for fluid font scaling',
          'A CSS print media stylesheet preventing page breaks across cards',
          'A web worker layout pipeline introduced in HTTP/3'
        ],
        correctIndex: 0,
        explanation: 'A BFC (created by overflow: hidden, display: flow-root, etc.) contains floats and prevents margin collapse with outside elements.'
      },
      {
        id: 'css-h5',
        skill: 'css',
        difficulty: 'hard',
        topic: 'clamp-fluid-typography',
        question: 'What does the CSS clamp() function do in modern fluid responsive design (e.g. font-size: clamp(1rem, 2.5vw, 2.5rem))?',
        options: [
          'Enforces a value that scales dynamically with viewport width but is bounded between a minimum and maximum threshold',
          'Truncates long paragraphs of text with an ellipsis (...) after 3 lines',
          'Compresses image files dynamically based on screen pixel density',
          'Restricts flex items from shrinking below their declared flex-basis'
        ],
        correctIndex: 0,
        explanation: 'clamp(MIN, VAL, MAX) clamps an ideal responsive value (like 2.5vw) between an accessible minimum and maximum limit.'
      }
    ]
  },

};

function normalizeSkillKey(skill) {
  const s = (skill || '').toLowerCase().trim();
  if (s === 'nodejs' || s === 'node') return 'node.js';
  if (s === 'reactjs') return 'react';
  if (s === 'html5') return 'html';
  if (s === 'css3') return 'css';
  if (s === 'js') return 'javascript';
  if (s === 'py') return 'python';
  return s;
}

/**
 * Helper to fetch a question by skill, difficulty, and optional exclusions
 */
function getQuestion(skill, difficulty, excludedIds = []) {
  const normalizedSkill = normalizeSkillKey(skill);
  const pool = QUIZ_QUESTIONS[normalizedSkill]?.[difficulty] || [];
  const candidates = pool.filter((q) => !excludedIds.includes(q.id));

  if (candidates.length === 0) {
    return pool[Math.floor(Math.random() * pool.length)] || null;
  }
  return candidates[Math.floor(Math.random() * candidates.length)];
}

function getQuestionById(skill, questionId) {
  const normalizedSkill = normalizeSkillKey(skill);
  const skillBank = QUIZ_QUESTIONS[normalizedSkill];
  if (!skillBank) return null;

  for (const diff of ['easy', 'medium', 'hard']) {
    const found = skillBank[diff].find((q) => q.id === questionId);
    if (found) return found;
  }
  return null;
}

const AVAILABLE_QUIZ_SKILLS = Object.keys(QUIZ_QUESTIONS);

module.exports = {
  QUIZ_QUESTIONS,
  AVAILABLE_QUIZ_SKILLS,
  normalizeSkillKey,
  getQuestion,
  getQuestionById,
};
