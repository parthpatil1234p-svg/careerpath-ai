/**
 * data/weeklyTestQuestions.js — Curated Topic-Tagged Question Bank for Roadmap Weekly Tests
 *
 * CareerPath AI · Enterprise Backend Service
 *
 * Provides vetted, deterministic technical and conceptual questions for weekly milestone tests
 * across 4 core domains: Engineering/Tech, Business/Finance, Marketing, and Creative/Design.
 *
 * Every question has:
 *  - id: Unique identifier
 *  - topic: Specific topic/skill tag
 *  - prompt: Clear question text
 *  - options: Exactly 4 distinct choices
 *  - correctIndex: 0-3 index of the correct answer
 *  - explanation: Pedagogical explanation
 *  - difficulty: 'beginner' | 'intermediate' | 'advanced'
 */

const WEEKLY_TEST_QUESTIONS = [
  // ── HTML & CSS ──────────────────────────────────────────────
  {
    id: 'wt_html_01',
    topic: 'html',
    prompt: 'Which HTML5 semantic element should encapsulate the primary dominant content of a document, excluding headers, sidebars, and footers?',
    options: ['<article>', '<main>', '<section>', '<content>'],
    correctIndex: 1,
    explanation: 'The <main> tag represents the dominant content of the <body>. There can only be one non-hidden <main> per document.',
    difficulty: 'beginner',
  },
  {
    id: 'wt_html_02',
    topic: 'html',
    prompt: 'What attribute is mandatory on an <img> tag to ensure proper accessibility for screen readers?',
    options: ['title', 'alt', 'aria-label', 'caption'],
    correctIndex: 1,
    explanation: 'The alt attribute provides alternative text for screen readers and displays if the image fails to load.',
    difficulty: 'beginner',
  },
  {
    id: 'wt_html_03',
    topic: 'html',
    prompt: 'Which attribute should be placed on a <form> input to indicate it must be completed before submission without writing custom JS?',
    options: ['validate', 'mandatory', 'required', 'aria-required="true"'],
    correctIndex: 2,
    explanation: 'The boolean required attribute natively halts form submission in HTML5 if the field is blank.',
    difficulty: 'beginner',
  },
  {
    id: 'wt_css_01',
    topic: 'css',
    prompt: 'In CSS Flexbox, which property distributes flex items along the main axis?',
    options: ['align-items', 'justify-content', 'align-content', 'flex-direction'],
    correctIndex: 1,
    explanation: 'justify-content aligns items along the main axis; align-items aligns along the cross axis.',
    difficulty: 'beginner',
  },
  {
    id: 'wt_css_02',
    topic: 'css',
    prompt: 'What CSS Grid property allows columns to automatically fit available space and wrap without media queries?',
    options: [
      'grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));',
      'grid-template-columns: auto-fill;',
      'grid-auto-flow: wrap;',
      'display: flex-grid;'
    ],
    correctIndex: 0,
    explanation: 'repeat(auto-fit, minmax(min, 1fr)) creates fluid auto-wrapping grids with zero media queries.',
    difficulty: 'intermediate',
  },
  {
    id: 'wt_css_03',
    topic: 'css',
    prompt: 'Which CSS Box Model property determines the total rendered width calculation when set to border-box?',
    options: ['box-sizing', 'display', 'overflow', 'box-shadow'],
    correctIndex: 0,
    explanation: 'box-sizing: border-box includes padding and border in the element\'s total width and height calculation.',
    difficulty: 'beginner',
  },
  {
    id: 'wt_css_04',
    topic: 'css',
    prompt: 'How do you target viewports narrower than 768px in modern responsive CSS?',
    options: [
      '@media (max-width: 767.98px) { ... }',
      '@device (width < 768) { ... }',
      '@screen mobile { ... }',
      '@query (width: 768px) { ... }'
    ],
    correctIndex: 0,
    explanation: '@media (max-width: ...) evaluates screen constraints to apply mobile-specific overrides.',
    difficulty: 'beginner',
  },

  // ── JAVASCRIPT & TYPESCRIPT ──────────────────────────────────
  {
    id: 'wt_js_01',
    topic: 'javascript',
    prompt: 'What is the key functional difference between const and let variables in JavaScript?',
    options: [
      'const is function-scoped; let is block-scoped',
      'const identifiers cannot be reassigned; let can be reassigned',
      'const makes objects deeply immutable',
      'let variables are hoisted to the top of the window object'
    ],
    correctIndex: 1,
    explanation: 'const creates a block-scoped binding that cannot be reassigned (though internal object properties remain mutable).',
    difficulty: 'beginner',
  },
  {
    id: 'wt_js_02',
    topic: 'javascript',
    prompt: 'What will Promise.all() do if one of the promises in the array rejects?',
    options: [
      'It waits for all others to finish, then returns the errors',
      'It immediately rejects with the reason of the first rejected promise',
      'It resolves with undefined for the rejected promise',
      'It retries the failed promise up to 3 times'
    ],
    correctIndex: 1,
    explanation: 'Promise.all has fail-fast semantics; it rejects immediately upon the first encountered rejection.',
    difficulty: 'intermediate',
  },
  {
    id: 'wt_js_03',
    topic: 'javascript',
    prompt: 'Which array method returns a single accumulated value from iterating through an array?',
    options: ['map()', 'filter()', 'reduce()', 'forEach()'],
    correctIndex: 2,
    explanation: 'reduce() executes a reducer function on each element, yielding a single accumulated result.',
    difficulty: 'beginner',
  },
  {
    id: 'wt_js_04',
    topic: 'javascript',
    prompt: 'What mechanism preserves access to outer variables even after the outer function has finished executing?',
    options: ['Prototypal Inheritance', 'Closure', 'Hoisting', 'Event Delegation'],
    correctIndex: 1,
    explanation: 'A closure is the combination of a function bundled together with references to its surrounding lexical environment.',
    difficulty: 'intermediate',
  },
  {
    id: 'wt_js_05',
    topic: 'javascript',
    prompt: 'What does the JavaScript Event Loop prioritize first when the call stack clears?',
    options: ['Microtasks (Promises/queueMicrotask)', 'Macrotasks (setTimeout/setInterval)', 'I/O operations', 'DOM rendering'],
    correctIndex: 0,
    explanation: 'The event loop processes all pending microtasks before picking the next macrotask from the task queue.',
    difficulty: 'advanced',
  },

  // ── REACT & MODERN FRONTEND ──────────────────────────────────
  {
    id: 'wt_react_01',
    topic: 'react',
    prompt: 'Why should you never mutate state directly in React (e.g. state.push(item))?',
    options: [
      'It causes immediate syntax errors in JSX',
      'React detects state changes via reference equality (Object.is) and will skip re-rendering',
      'React only allows primitive strings in state',
      'Direct mutations crash the Node.js process'
    ],
    correctIndex: 1,
    explanation: 'React compares state references using Object.is. Mutating in place keeps the same reference, skipping re-renders.',
    difficulty: 'intermediate',
  },
  {
    id: 'wt_react_02',
    topic: 'react',
    prompt: 'What Hook should be used to run side effects like subscriptions or API calls after layout render?',
    options: ['useMemo', 'useCallback', 'useEffect', 'useLayoutEffect'],
    correctIndex: 2,
    explanation: 'useEffect schedules asynchronous side effects that run after the browser completes repainting.',
    difficulty: 'beginner',
  },
  {
    id: 'wt_react_03',
    topic: 'react',
    prompt: 'What is the purpose of passing a dependency array to useEffect?',
    options: [
      'To define which child components can receive props',
      'To tell React when to re-execute the effect based on changed values',
      'To catch uncaught promise errors',
      'To bind this inside functional components'
    ],
    correctIndex: 1,
    explanation: 'React re-runs the effect only if one of the dependencies has changed between renders.',
    difficulty: 'beginner',
  },
  {
    id: 'wt_react_04',
    topic: 'react',
    prompt: 'When should you use the useCallback hook in React?',
    options: [
      'For every function defined inside a component',
      'To cache expensive mathematical calculations',
      'To memoize callback function instances passed to optimized child components that rely on reference equality',
      'To replace try/catch statements'
    ],
    correctIndex: 2,
    explanation: 'useCallback memoizes callback definitions to avoid unnecessary renders of React.memo child components.',
    difficulty: 'intermediate',
  },

  // ── BACKEND: NODE.JS, EXPRESS & REST ──────────────────────────
  {
    id: 'wt_node_01',
    topic: 'node.js',
    prompt: 'How does Node.js handle high volumes of concurrent I/O operations despite being single-threaded?',
    options: [
      'It creates a new OS thread for every HTTP request',
      'Through a non-blocking asynchronous event loop backed by libuv and a thread pool',
      'It splits requests across multiple CPU sockets automatically',
      'By compiling all JavaScript directly into WebAssembly at runtime'
    ],
    correctIndex: 1,
    explanation: 'Node.js uses libuv\'s non-blocking I/O and worker pool to process concurrent requests without blocking the main event thread.',
    difficulty: 'intermediate',
  },
  {
    id: 'wt_node_02',
    topic: 'express',
    prompt: 'In Express middleware, what happens if you neither send a response nor call next()?',
    options: [
      'Express automatically sends a 200 OK after 5 seconds',
      'The client request hangs indefinitely until a server timeout occurs',
      'An unhandledRejection error is thrown',
      'The next middleware is executed automatically'
    ],
    correctIndex: 1,
    explanation: 'Express middleware chains require calling next() or completing the response with res.send/json; otherwise the request hangs.',
    difficulty: 'beginner',
  },
  {
    id: 'wt_node_03',
    topic: 'express',
    prompt: 'What HTTP status code is the industry standard for a newly created resource in REST APIs?',
    options: ['200 OK', '201 Created', '202 Accepted', '204 No Content'],
    correctIndex: 1,
    explanation: '201 Created indicates the request succeeded and resulted in a new resource being created.',
    difficulty: 'beginner',
  },
  {
    id: 'wt_node_04',
    topic: 'node.js',
    prompt: 'Why should password hashes never be stored in plain text or hashed with plain SHA-256?',
    options: [
      'SHA-256 hashes are too long for database strings',
      'Plain SHA-256 is designed for speed, making it vulnerable to brute force and rainbow table attacks without salting/work factor (use bcrypt/argon2)',
      'Node.js cannot compare SHA-256 strings safely',
      'SHA-256 is deprecated by W3C'
    ],
    correctIndex: 1,
    explanation: 'Fast cryptographic hashes like SHA-256 allow billions of guesses per second; adaptive key-stretching (bcrypt, Argon2) protects against GPU cracking.',
    difficulty: 'intermediate',
  },

  // ── DATABASES: MONGODB & SQL ──────────────────────────────────
  {
    id: 'wt_db_01',
    topic: 'mongodb',
    prompt: 'In MongoDB, which indexing strategy speeds up queries filtering on multiple fields simultaneously?',
    options: ['Single Field Index', 'Compound Index', 'Text Index', 'TTL Index'],
    correctIndex: 1,
    explanation: 'A compound index contains references to multiple fields in a document in a specified sort order.',
    difficulty: 'intermediate',
  },
  {
    id: 'wt_db_02',
    topic: 'mongodb',
    prompt: 'What MongoDB aggregation pipeline stage is used to filter documents similar to a SQL WHERE clause?',
    options: ['$project', '$filter', '$match', '$group'],
    correctIndex: 2,
    explanation: 'The $match stage filters documents to allow only those matching specified conditions to pass to the next stage.',
    difficulty: 'beginner',
  },
  {
    id: 'wt_db_03',
    topic: 'sql',
    prompt: 'Which SQL JOIN returns all rows from the left table, and the matched rows from the right table (with NULLs for unmatched rows)?',
    options: ['INNER JOIN', 'LEFT JOIN (or LEFT OUTER JOIN)', 'RIGHT JOIN', 'CROSS JOIN'],
    correctIndex: 1,
    explanation: 'LEFT JOIN returns all records from the left table and matched records from the right table.',
    difficulty: 'beginner',
  },
  {
    id: 'wt_db_04',
    topic: 'sql',
    prompt: 'What does the "A" in ACID database transactions stand for?',
    options: ['Availability', 'Atomicity (all-or-nothing execution)', 'Asynchronous', 'Authorization'],
    correctIndex: 1,
    explanation: 'Atomicity ensures that all statements in a transaction either complete successfully or are entirely rolled back.',
    difficulty: 'intermediate',
  },

  // ── GIT & DEVOPS ──────────────────────────────────────────────
  {
    id: 'wt_git_01',
    topic: 'git',
    prompt: 'Which Git command creates a new branch and immediately switches your working tree to it?',
    options: ['git branch -n <name>', 'git checkout -b <name>', 'git switch --all <name>', 'git merge --new <name>'],
    correctIndex: 1,
    explanation: 'git checkout -b <name> (or git switch -c <name>) creates and switches to a new branch.',
    difficulty: 'beginner',
  },
  {
    id: 'wt_git_02',
    topic: 'git',
    prompt: 'What is the purpose of git rebase compared to git merge?',
    options: [
      'It creates a merge commit preserving parallel branch history',
      'It moves or reapplies commits on top of another base commit, creating a linear history',
      'It deletes untracked files in the working directory',
      'It uploads local changes directly to GitHub'
    ],
    correctIndex: 1,
    explanation: 'Rebase rewrites commit history onto a new base commit to maintain a clean linear progression.',
    difficulty: 'intermediate',
  },

  // ── DATA SCIENCE & PYTHON ────────────────────────────────────
  {
    id: 'wt_py_01',
    topic: 'python',
    prompt: 'In Python, what is the key difference between a List and a Tuple?',
    options: [
      'Lists are immutable; Tuples are mutable',
      'Lists are mutable; Tuples are immutable',
      'Tuples can only store numbers',
      'Lists cannot contain nested structures'
    ],
    correctIndex: 1,
    explanation: 'Lists are mutable sequences ([1, 2]); tuples are immutable sequences ((1, 2)) whose elements cannot be modified.',
    difficulty: 'beginner',
  },
  {
    id: 'wt_py_02',
    topic: 'data-science',
    prompt: 'In pandas, which method drops rows containing missing or NaN values?',
    options: ['df.clean()', 'df.dropna()', 'df.remove_nulls()', 'df.fillna()'],
    correctIndex: 1,
    explanation: 'dropna() removes missing values along a specified axis.',
    difficulty: 'beginner',
  },
  {
    id: 'wt_py_03',
    topic: 'data-science',
    prompt: 'What is overfitting in machine learning models?',
    options: [
      'When a model performs poorly on training data',
      'When a model memorizes training noise and fails to generalize to unseen test data',
      'When the dataset contains too few features',
      'When the learning rate is set too low'
    ],
    correctIndex: 1,
    explanation: 'Overfitting occurs when a model fits the training set too closely, degrading generalization on new data.',
    difficulty: 'intermediate',
  },

  // ── UI/UX DESIGN & CREATIVE ──────────────────────────────────
  {
    id: 'wt_ui_01',
    topic: 'ui-design',
    prompt: 'What is the minimum WCAG 2.1 AA contrast ratio required for standard body text against its background?',
    options: ['2.5:1', '3.0:1', '4.5:1', '7.0:1'],
    correctIndex: 2,
    explanation: 'WCAG AA requires at least 4.5:1 for regular text and 3:1 for large text (18pt+ or 14pt bold).',
    difficulty: 'intermediate',
  },
  {
    id: 'wt_ui_02',
    topic: 'ui-design',
    prompt: 'In typography and layout, what is visual hierarchy?',
    options: [
      'Using only uppercase serif fonts',
      'Arranging elements to guide the viewer\'s eye in order of visual importance',
      'Centering all elements on the canvas',
      'Limiting colors to black and white'
    ],
    correctIndex: 1,
    explanation: 'Visual hierarchy uses scale, contrast, weight, and spacing to communicate the relative importance of content.',
    difficulty: 'beginner',
  },

  // ── BUSINESS & DIGITAL MARKETING ─────────────────────────────
  {
    id: 'wt_mkt_01',
    topic: 'digital-marketing',
    prompt: 'What metric measures the percentage of users who take a desired action (e.g. sign up, purchase) on a landing page?',
    options: ['Bounce Rate', 'Conversion Rate', 'Click-Through Rate (CTR)', 'Impression Share'],
    correctIndex: 1,
    explanation: 'Conversion Rate is calculated as (conversions / total visitors) * 100%.',
    difficulty: 'beginner',
  },
  {
    id: 'wt_mkt_02',
    topic: 'seo',
    prompt: 'Which tag communicates the canonical original URL of a duplicate or syndicated page to search engines?',
    options: [
      '<meta name="robots" content="index" />',
      '<link rel="canonical" href="..." />',
      '<link rel="alternate" href="..." />',
      '<meta name="source" content="..." />'
    ],
    correctIndex: 1,
    explanation: 'rel="canonical" prevents duplicate content penalties by indicating the authoritative URL to crawlers.',
    difficulty: 'intermediate',
  },
  {
    id: 'wt_fin_01',
    topic: 'financial-analysis',
    prompt: 'In corporate finance, what does EBITDA stand for?',
    options: [
      'Earnings Before Interest, Taxes, Depreciation, and Amortization',
      'Equity Borrowed Through International Debt Agreements',
      'Estimated Budget Total Deficit Allocation',
      'Expected Base Income Tax Deductible Amount'
    ],
    correctIndex: 0,
    explanation: 'EBITDA gauges operating performance by stripping out capital structure, tax environments, and non-cash accounting charges.',
    difficulty: 'intermediate',
  },
  {
    id: 'wt_fin_02',
    topic: 'financial-analysis',
    prompt: 'Which financial statement summarizes revenues, expenses, and net profit over a specific reporting period?',
    options: ['Balance Sheet', 'Income Statement (P&L)', 'Cash Flow Statement', 'Statement of Retained Earnings'],
    correctIndex: 1,
    explanation: 'The Income Statement reflects operating revenues and expenses over a given timeframe (quarter, year).',
    difficulty: 'beginner',
  },
];

/**
 * Returns a randomized subset of test questions matching the specified topic tags or career week.
 *
 * @param {Object} options
 * @param {string[]} [options.topics] - Preferred topics (e.g. ['html', 'css', 'javascript'])
 * @param {number} [options.count=10] - Number of questions to return
 * @param {string[]} [options.excludeIds=[]] - Question IDs to exclude for fresh retakes
 * @returns {Array<Object>} Selected test questions with correctIndex intact for grading
 */
function getWeeklyTestQuestions({ topics = [], count = 10, excludeIds = [] } = {}) {
  const normalizedTopics = (topics || []).map((t) => (t || '').trim().toLowerCase()).filter(Boolean);
  const excludeSet = new Set(excludeIds || []);

  // 1. Separate questions matching requested topics from general fallback questions
  let matched = [];
  let general = [];

  WEEKLY_TEST_QUESTIONS.forEach((q) => {
    if (excludeSet.has(q.id)) return;

    const qTopic = (q.topic || '').toLowerCase();
    if (normalizedTopics.length > 0 && normalizedTopics.some((t) => qTopic.includes(t) || t.includes(qTopic))) {
      matched.push(q);
    } else {
      general.push(q);
    }
  });

  // Fisher-Yates shuffle
  const shuffle = (arr) => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  matched = shuffle(matched);
  general = shuffle(general);

  // If we don't have enough matched questions after excluding IDs, pull from general
  let pool = [...matched];
  if (pool.length < count) {
    pool = pool.concat(general.slice(0, count - pool.length));
  }

  // If pool is still under count (e.g. excessive retakes exhausted exclusions), fall back to all without exclusions
  if (pool.length < count) {
    const recycled = shuffle(WEEKLY_TEST_QUESTIONS.filter((q) => !pool.some((p) => p.id === q.id)));
    pool = pool.concat(recycled.slice(0, count - pool.length));
  }

  return pool.slice(0, count);
}

module.exports = {
  WEEKLY_TEST_QUESTIONS,
  getWeeklyTestQuestions,
};
