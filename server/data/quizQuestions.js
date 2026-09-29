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
  }
};

/**
 * Helper to fetch a question by skill, difficulty, and optional exclusions
 */
function getQuestion(skill, difficulty, excludedIds = []) {
  const normalizedSkill = (skill || '').toLowerCase().trim();
  const pool = QUIZ_QUESTIONS[normalizedSkill]?.[difficulty] || [];
  const candidates = pool.filter((q) => !excludedIds.includes(q.id));

  if (candidates.length === 0) {
    // If all exhausted, fallback to any in pool
    return pool[Math.floor(Math.random() * pool.length)] || null;
  }

  // Random pick among candidates
  return candidates[Math.floor(Math.random() * candidates.length)];
}

function getQuestionById(skill, questionId) {
  const normalizedSkill = (skill || '').toLowerCase().trim();
  const skillBank = QUIZ_QUESTIONS[normalizedSkill];
  if (!skillBank) return null;

  for (const diff of ['easy', 'medium', 'hard']) {
    const found = skillBank[diff].find((q) => q.id === questionId);
    if (found) return found;
  }
  return null;
}

module.exports = {
  QUIZ_QUESTIONS,
  getQuestion,
  getQuestionById,
};
